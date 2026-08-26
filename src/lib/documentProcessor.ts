import type { DocType } from '@/types';

export async function extractMetadata(
  file: File
): Promise<{ title: string; type: string; pageCount: number }> {
  const title = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

  let type = 'other';
  if (ext === 'pdf') type = 'pdf';
  else if (['doc', 'docx'].includes(ext)) type = 'word';
  else if (['xls', 'xlsx'].includes(ext)) type = 'excel';
  else if (['ppt', 'pptx'].includes(ext)) type = 'powerpoint';
  else if (['png', 'jpg', 'jpeg', 'webp', 'tiff', 'tif'].includes(ext)) type = 'image';
  else if (ext === 'txt') type = 'text';
  else if (ext === 'csv') type = 'csv';

  let pageCount = 1;
  if (type === 'pdf') {
    try {
      const buffer = await file.arrayBuffer();
      const text = new TextDecoder('latin1').decode(buffer);
      const matches = text.match(/\/Type\s*\/Page[^s]/g);
      if (matches) pageCount = matches.length;
    } catch {
      pageCount = 1;
    }
  }

  return { title, type, pageCount };
}

const TYPE_KEYWORDS: Record<DocType, string[]> = {
  contract: ['contract', 'agreement', 'terms', 'party', 'parties', 'clause', 'obligation'],
  invoice: ['invoice', 'bill', 'amount', 'payment', 'total', 'due', 'tax', 'subtotal'],
  report: ['report', 'analysis', 'summary', 'findings', 'quarterly', 'annual', 'review'],
  certificate: ['certificate', 'certification', 'certified', 'accreditation', 'license'],
  letter: ['letter', 'dear', 'sincerely', 'regards', 'correspondence', 'notice'],
  id: ['passport', 'identity', 'identification', 'national id', 'driver license'],
  policy: ['policy', 'guidelines', 'procedure', 'regulation', 'compliance'],
  legal: ['legal', 'court', 'judge', 'statute', 'law', 'litigation', 'plaintiff', 'defendant'],
  hr: ['employee', 'human resource', 'hiring', 'termination', 'performance', 'leave'],
  financial: ['financial', 'balance sheet', 'profit', 'loss', 'revenue', 'budget'],
  technical: ['technical', 'specification', 'architecture', 'api', 'documentation'],
  other: [],
};

export function classifyDocument(title: string, tags: string[]): DocType {
  const combined = `${title} ${tags.join(' ')}`.toLowerCase();

  let bestMatch: DocType = 'other';
  let bestScore = 0;

  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS) as [DocType, string[]][]) {
    let score = 0;
    for (const keyword of keywords) {
      if (combined.includes(keyword)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = type;
    }
  }

  return bestMatch;
}

export function generateDocumentHash(content: ArrayBuffer): string {
  let hash = 0;
  const bytes = new Uint8Array(content);
  for (let i = 0; i < bytes.length; i++) {
    const char = bytes[i];
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

const LANG_PATTERNS: { lang: 'en' | 'fr' | 'ar'; pattern: RegExp; weight: number }[] = [
  { lang: 'ar', pattern: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g, weight: 3 },
  { lang: 'fr', pattern: /\b(est|sont|avec|pour|dans|les|des|une|pas|mais|cette|tout|nous|vous|leur|eux|aussi|être|avoir|faire|dire|aller|voir|pouvoir|vouloir|devoir|croire|partir)\b/gi, weight: 2 },
  { lang: 'en', pattern: /\b(the|is|are|with|for|in|and|not|but|this|that|was|were|have|has|had|will|would|can|could|should|may|might|shall|must|need|do|does|did)\b/gi, weight: 1 },
];

export function detectLanguage(text: string): 'en' | 'fr' | 'ar' | 'unknown' {
  if (!text.trim()) return 'unknown';

  let bestLang: 'en' | 'fr' | 'ar' | 'unknown' = 'unknown';
  let bestScore = 0;
  const threshold = 3;

  for (const { lang, pattern, weight } of LANG_PATTERNS) {
    const matches = text.match(pattern);
    const score = (matches?.length ?? 0) * weight;
    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestLang = lang;
    }
  }

  return bestLang;
}

const TAG_PATTERNS: Record<string, RegExp[]> = {
  financial: [/\$[\d,]+/g, /€[\d,]+/g, /£[\d,]+/g, /\d{4}\s*fiscal\s*year/gi],
  legal: [/court|judge|ruling|statute|plaintiff|defendant/gi],
  hr: [/employee|hiring|termination|performance\s*review/gi],
  technical: [/api|sdk|version|release|deployment/gi],
  urgent: [/urgent|asap|immediately|critical|deadline/gi],
  confidential: [/confidential|classified|restricted|sensitive/gi],
};

export function parseDocumentTags(title: string, type: string): string[] {
  const tags: string[] = [];
  const combined = title;

  tags.push(type);

  for (const [tag, patterns] of Object.entries(TAG_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(combined)) {
        if (!tags.includes(tag)) tags.push(tag);
        break;
      }
    }
  }

  const yearMatch = combined.match(/\b(20\d{2})\b/);
  if (yearMatch) tags.push(yearMatch[1]);

  return tags;
}
