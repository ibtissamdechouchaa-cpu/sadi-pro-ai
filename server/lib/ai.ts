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

// --- Startup check ---
export function checkAIProviders(): { gemini: boolean; openai: boolean } {
  const hasGemini = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  if (!hasGemini && !hasOpenAI) {
    console.warn("[AI] ⚠️  No AI provider configured! Set GEMINI_API_KEY or OPENAI_API_KEY in Render Environment.");
    console.warn("[AI]    → Gemini free: https://aistudio.google.com/apikey");
    console.warn("[AI]    → AI features will use heuristic fallback (no real AI analysis).");
  } else {
    console.log(`[AI] Providers: Gemini=${hasGemini ? '✓' : '✗'} | OpenAI=${hasOpenAI ? '✓' : '✗'}`);
  }
  return { gemini: hasGemini, openai: hasOpenAI };
}

export function getAIStatus(): { configured: boolean; providers: string[]; message: string } {
  const hasGemini = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const providers = [];
  if (hasGemini) providers.push("Gemini");
  if (hasOpenAI) providers.push("OpenAI");
  const configured = hasGemini || hasOpenAI;
  const message = configured
    ? `AI مُعد: ${providers.join(" + ")}`
    : "⚠️ لا يوجد مزود AI مُعد. أضف GEMINI_API_KEY أو OPENAI_API_KEY في Render Environment. Gemini مجاني: https://aistudio.google.com/apikey";
  return { configured, providers, message };
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

  // Detect language
  const arCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const frCount = (text.match(/\b(de|le|la|les|des|un|une|et|est|pour|dans|avec|sur|pas|que|qui|ce|ne|se|au|en)\b/g) || []).length;
  const enCount = (text.match(/\b(the|is|are|and|for|that|this|with|from|have|has|was|were|been|will|would|can|could|not|but|all|any|each|every)\b/gi) || []).length;
  const lang = arCount > frCount && arCount > enCount ? "ar" : frCount > enCount ? "fr" : "en";

  // Extract keywords
  const wordsArr = text.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
  const freq: Record<string, number> = {};
  wordsArr.forEach((w: string) => { freq[w] = (freq[w] || 0) + 1; });
  const keywords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w);

  // Detect entities
  const persons = [...text.matchAll(/\b([A-Z][a-z]+ (?:[A-Z][a-z]+ ){0,2}[A-Z][a-z]+)\b/g)].map((m) => m[1]).slice(0, 5);

  // Detect document type from content
  let docType = "other";
  if (/contrat|contract|اتفاقية/i.test(text)) docType = "contract";
  else if (/facture|invoice|فاتورة/i.test(text)) docType = "invoice";
  else if (/rapport|report|تقرير/i.test(text)) docType = "report";
  else if (/certificat|certificate|شهادة/i.test(text)) docType = "certificate";
  else if (/cv|resume|سيرة ذاتية|البريد/i.test(text) || /skills|education|experience/i.test(text)) docType = "other";

  return {
    summary: `Document "${title}" — ~${words} words. ${lang === "ar" ? 'Arabic' : lang === 'fr' ? 'French' : 'English'} content with ${dates.length} date references and ${keywords.length} detected keywords.`,
    keyEntities: persons.length > 0 ? persons : keywords.slice(0, 3),
    importantDates: dates,
    risks: [],
    missingInfo: words < 50 ? ["Document content appears very short"] : [],
    suggestedTags: keywords.slice(0, 5),
    sentiment: "neutral",
    confidence: 0.4,
    documentType: docType,
    documentNumber: docNum,
    contractNumber: contract,
    issuingAuthority: undefined,
    institution: persons[0] || undefined,
    persons,
    legalValue: "medium",
    historicalValue: "low",
    retentionYearsSuggested: 5,
    confidentialitySuggested: "internal",
    languageDetected: lang,
    keywords,
    reasoning: [
      { step: 1, title: "Content scan", thought: `Counted ~${words} words; detected ${lang.toUpperCase()} language; found ${dates.length} dates, ${keywords.length} keywords, ${persons.length} person names.` },
      { step: 2, title: "Type detection", thought: `Document type detected as "${docType}" from content patterns.` },
      { step: 3, title: "Metadata extraction", thought: `Extracted ${keywords.slice(0, 5).join(", ")} as key terms.` },
      { step: 4, title: "Assessment", thought: words < 50 ? "Very short content — may be placeholder or minimal document." : "Sufficient content for heuristic analysis." },
    ],
    reasoningSummary: `Heuristic analysis — detected ${lang.toUpperCase()} ${docType} with ${words} words. Add GEMINI_API_KEY for full AI analysis.`,
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

  // Smart fallback: extract answer from content without AI API
  const ctx = documentSnippets.join("\n").slice(0, 8000);
  const queryWords = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
  const sentences = ctx.split(/[.!?\n]+/).filter((s: string) => s.trim().length > 10);

  // Score sentences by keyword overlap
  const scored = sentences.map((s: string) => {
    const lower = s.toLowerCase();
    const score = queryWords.reduce((acc: number, w: string) => acc + (lower.includes(w) ? 1 : 0), 0);
    return { text: s.trim(), score };
  }).filter((s: { text: string; score: number }) => s.score > 0)
    .sort((a: { text: string; score: number }, b: { text: string; score: number }) => b.score - a.score);

  const bestAnswer = scored.length > 0
    ? scored.slice(0, 3).map((s: { text: string; score: number }) => s.text).join(". ")
    : ctx.slice(0, 500);

  return {
    answer: bestAnswer || "لم يتم العثور على معلومات كافية في الوثيقة.",
    reasoning: [{
      step: 1,
      title: "Content search",
      thought: `Searched ${sentences.length} sentences for keywords: ${queryWords.join(", ")}. Found ${scored.length} matches.`
    }],
    reasoningSummary: scored.length > 0
      ? `Found ${scored.length} relevant passages by keyword matching.`
      : "No provider available — used keyword-based fallback.",
  };
}
