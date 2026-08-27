import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Lazy clients ---

let openai: OpenAI | null = null;
let gemini: GoogleGenerativeAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

function getGemini(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) return null;
  if (!gemini) gemini = new GoogleGenerativeAI(key);
  return gemini;
}

export interface ReasoningStep {
  step: number;
  title: string;
  thought: string;
}

export interface DocumentInsight {
  summary: string;
  keyEntities: string[];
  importantDates: string[];
  risks: string[];
  missingInfo: string[];
  suggestedTags: string[];
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  reasoning?: ReasoningStep[];
  reasoningSummary?: string;
  // Extended per spec §2 — extracted metadata with confidence
  documentType?: string;
  documentNumber?: string;
  contractNumber?: string;
  issuingAuthority?: string;
  institution?: string;
  persons?: string[];
  legalValue?: string; // high | medium | low | permanent
  historicalValue?: string;
  retentionYearsSuggested?: number;
  confidentialitySuggested?: string;
  languageDetected?: string;
  keywords?: string[];
  importantDatesDetailed?: { label: string; date: string; confidence: number }[];
}

export interface ImageInput {
  base64: string;
  mime: string;
}

// --- Helpers ---

function parseInsightJson(raw: string): DocumentInsight | null {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as DocumentInsight;
  } catch {
    return null;
  }
}

function fallbackInsight(title: string, text: string): DocumentInsight {
  const words = text.split(/\s+/).filter(Boolean).length;
  const dates = [...new Set([...(text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g) || []), ...(text.match(/\b20\d{2}\b/g) || [])])].slice(0, 5);
  const contract = text.match(/contrat\s*n°?\s*([\w\/\-]+)/i)?.[1] || undefined;
  const docNum = text.match(/document\s*n°?\s*([\w\/\-]+)/i)?.[1] || undefined;
  return {
    summary: `Document "${title}" — ~${words} words.`,
    keyEntities: [],
    importantDates: dates,
    risks: [],
    missingInfo: [],
    suggestedTags: [],
    sentiment: "neutral",
    confidence: 0.3,
    documentType: "other",
    documentNumber: docNum,
    contractNumber: contract,
    issuingAuthority: undefined,
    institution: undefined,
    persons: [],
    legalValue: "medium",
    historicalValue: "low",
    retentionYearsSuggested: 5,
    confidentialitySuggested: "internal",
    languageDetected: "unknown",
    keywords: [],
    reasoning: [
      { step: 1, title: "Document scan", thought: `Counted ~${words} words; detected ${dates.length} date references.` },
      { step: 2, title: "Content assessment", thought: "No AI provider available — used heuristic fallback with regex for contract/doc numbers." },
    ],
    reasoningSummary: "Fallback analysis — add GEMINI_API_KEY or OPENAI_API_KEY for full reasoning.",
  };
}

const INSIGHT_PROMPT = `You are a document analysis AI for Algerian archive system. Think step-by-step, then return ONLY valid JSON (no markdown) with keys:
summary (2-3 sentences), keyEntities (string[]), importantDates (string[]), risks (string[]), missingInfo (string[]), suggestedTags (3-5 tags), sentiment ("positive"|"negative"|"neutral"), confidence (0-1),
documentType (one of contract/invoice/report/certificate/letter/id/policy/legal/hr/financial/technical/other), documentNumber (string or null), contractNumber (string or null), issuingAuthority (string or null), institution (string or null), persons (string[]), legalValue ("permanent"|"high"|"medium"|"low"), historicalValue ("high"|"medium"|"low"), retentionYearsSuggested (number 1-50), confidentialitySuggested ("public"|"internal"|"confidential"|"highly_confidential"|"restricted"), languageDetected ("ar"|"fr"|"en"|"unknown"), keywords (string[] 3-5), importantDatesDetailed ([{label,date,confidence}]),
reasoning (array of {step:number, title:string, thought:string} — 4-5 steps tracing extraction), reasoningSummary (one sentence).
Extract: عنوان الوثيقة, نوع الوثيقة, تاريخ الوثيقة, الجهة المصدرة, اسم المؤسسة, أسماء الأشخاص, أرقام الوثائق, أرقام العقود, التواريخ المهمة, مدة الحفظ المحتملة, مستوى السرية, الكلمات المفتاحية, القيمة القانونية, القيمة التاريخية, اللغة, ملخص.`;

export interface ReasoningChatResult {
  answer: string;
  reasoning: ReasoningStep[];
  reasoningSummary: string;
}

// --- Gemini helpers (with Vision for images) ---

async function geminiAnalyze(title: string, text: string, image?: ImageInput): Promise<DocumentInsight | null> {
  const g = getGemini();
  if (!g) return null;
  try {
    const model = g.getGenerativeModel({ model: "gemini-flash-latest" });
    let res;
    if (image) {
      res = await model.generateContent([
        INSIGHT_PROMPT,
        { inlineData: { data: image.base64, mimeType: image.mime } },
        { text: `Title: ${title}\nAnalyze the image above.` },
      ]);
    } else {
      res = await model.generateContent(`${INSIGHT_PROMPT}\n\nTitle: ${title}\nContent: ${text.slice(0, 12000)}`);
    }
    return parseInsightJson(res.response.text());
  } catch (err) {
    console.warn("Gemini analyze failed:", err);
    return null;
  }
}

async function geminiAnswer(query: string, snippets: string[]): Promise<ReasoningChatResult | null> {
  const g = getGemini();
  if (!g) return null;
  try {
    const model = g.getGenerativeModel({ model: "gemini-flash-latest" });
    const ctx = snippets.join("\n---\n").slice(0, 6000);
    const prompt = `Answer concisely based only on the context. Also explain your reasoning.\nReturn ONLY valid JSON with keys: answer (string), reasoning (array of {step:number, title:string, thought:string} — 2-3 steps), reasoningSummary (string).\n\nQuestion: ${query}\n\nContext:\n${ctx}`;
    const res = await model.generateContent(prompt);
    const raw = res.response.text();
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      const parsed = JSON.parse(m[0]);
      if (parsed.answer) return parsed as ReasoningChatResult;
    }
    return { answer: raw, reasoning: [], reasoningSummary: "" };
  } catch (err) {
    console.warn("Gemini answer failed:", err);
    return null;
  }
}

// Gemini Vision direct chat — user sends an image + question
export async function geminiVisionChat(
  prompt: string,
  image: ImageInput
): Promise<ReasoningChatResult | null> {
  const g = getGemini();
  if (!g) return null;
  try {
    const model = g.getGenerativeModel({ model: "gemini-flash-latest" });
    const res = await model.generateContent([
      { inlineData: { data: image.base64, mimeType: image.mime } },
      { text: `${prompt}\n\nAlso return your reasoning. Respond ONLY as JSON with keys: answer (string), reasoning (array of {step:number,title:string,thought:string} 2-3 steps), reasoningSummary (string).` },
    ]);
    const raw = res.response.text();
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      const parsed = JSON.parse(m[0]);
      if (parsed.answer) return parsed as ReasoningChatResult;
    }
    return { answer: raw, reasoning: [], reasoningSummary: "" };
  } catch (err) {
    console.warn("Gemini vision chat failed:", err);
    return null;
  }
}

// --- OpenAI helpers ---

async function openaiAnalyze(title: string, text: string): Promise<DocumentInsight | null> {
  const c = getOpenAI();
  if (!c) return null;
  try {
    const res = await c.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: INSIGHT_PROMPT },
        { role: "user", content: `Title: ${title}\nContent: ${text.slice(0, 12000)}` },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });
    return parseInsightJson(res.choices[0]?.message?.content || "");
  } catch (err) {
    console.warn("OpenAI analyze failed:", err);
    return null;
  }
}

async function openaiAnswer(query: string, snippets: string[]): Promise<ReasoningChatResult | null> {
  const c = getOpenAI();
  if (!c) return null;
  try {
    const ctx = snippets.join("\n---\n").slice(0, 6000);
    const res = await c.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Answer concisely based only on the provided context. Also explain your reasoning. Return ONLY valid JSON with keys: answer (string), reasoning (array of {step:number,title:string,thought:string} 2-3 steps), reasoningSummary (string)." },
        { role: "user", content: `Question: ${query}\n\nSearch Results:\n${ctx}` },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });
    const raw = res.choices[0]?.message?.content || "";
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      const parsed = JSON.parse(m[0]);
      if (parsed.answer) return parsed as ReasoningChatResult;
    }
    return { answer: raw, reasoning: [], reasoningSummary: "" };
  } catch (err) {
    console.warn("OpenAI answer failed:", err);
    return null;
  }
}

// --- Public API: tries Gemini (Vision if image) first, then OpenAI, then fallback ---

export async function analyzeDocument(
  title: string,
  textContent: string,
  image?: ImageInput
): Promise<DocumentInsight> {
  if (image) {
    const gem = await geminiAnalyze(title, textContent, image);
    if (gem) return gem;
  } else {
    const gem = await geminiAnalyze(title, textContent);
    if (gem) return gem;
  }

  const oai = await openaiAnalyze(title, textContent);
  if (oai) return oai;

  return fallbackInsight(title, textContent);
}

export async function generateSearchAnswer(query: string, documentSnippets: string[]): Promise<ReasoningChatResult> {
  const gem = await geminiAnswer(query, documentSnippets);
  if (gem) return gem;

  const oai = await openaiAnswer(query, documentSnippets);
  if (oai) return oai;

  return {
    answer: documentSnippets[0]
      ? `Based on the search results: ${documentSnippets[0].slice(0, 200)}...`
      : "No relevant documents found.",
    reasoning: [{ step: 1, title: "Fallback", thought: "No AI provider available — returned raw snippet." }],
    reasoningSummary: "Fallback response.",
  };
}
