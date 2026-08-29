export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  date: string | null;
  type: "law" | "decree" | "circular" | "regulation" | "iso" | "other";
}

export interface ScrapedLegalDocument {
  title: string;
  titleAr?: string;
  referenceNumber: string;
  referenceType: string;
  fullText: string;
  url: string;
  source: string;
  publicationDate: string | null;
  keywords: string[];
}

const SOURCES = {
  SGG: {
    name: "Journal Officiel (JORADP)",
    baseUrl: "https://www.joradp.dz",
    searchUrl: "https://www.joradp.dz/assym_pl/fiche_ar.jsp?elession=",
    listUrl: "https://www.joradp.dz/jo_fiche/listejoar.html",
    type: "gazette" as const,
  },
  LEGAL_PORTAL: {
    name: "البوابة القانونية - وزارة العدل",
    baseUrl: "https://www.mjustice.dz",
    searchUrl: "https://www.mjustice.dz/Arabic/index.aspx",
    type: "portal" as const,
  },
  LEGISLATION_DZ: {
    name: "Legislation.dz",
    baseUrl: "https://www.legislation.dz",
    searchUrl: "https://www.legislation.dz/resultat.php",
    type: "database" as const,
  },
  ARCHIVES_NAT: {
    name: "الأرشيف الوطني",
    baseUrl: "https://www.archives.gov.dz",
    type: "archives" as const,
  },
} as const;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const REQUEST_TIMEOUT = 15000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ar,fr,en;q=0.9",
        ...(options.headers || {}),
      },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function extractLawNumber(text: string): string | null {
  const patterns = [
    /(?:القانون رقم|loi\s+n[°o]|قانون رقم)\s*(\d{2,3}[-–]\d{2})/i,
    /(?:القانون\s+)?(\d{2,3}[-–]\d{2})\s*(?:المؤرخ|du)\s+\d{4}/i,
    /n[°o]\s*(\d{2,3}[-–]\d{2})/i,
    /قانون\s+رقم\s+(\d+[-–]\d+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].replace("–", "-");
  }
  return null;
}

function extractDate(text: string): string | null {
  const patterns = [
    /(\d{1,2})\s+(?:جانفي|فيفري|مارس|أفريل|ماي|جوان|جويلية|أوت|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\s+(\d{4})/,
    /(\d{1,2})\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/,
    /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/,
  ];
  const arabicMonths: Record<string, string> = {
    جانفي: "01", فيفري: "02", مارس: "03", أفريل: "04",
    ماي: "05", جوان: "06", جويلية: "07", أوت: "08",
    سبتمبر: "09", أكتوبر: "10", نوفمبر: "11", ديسمبر: "12",
  };
  const frenchMonths: Record<string, string> = {
    janvier: "01", février: "02", mars: "03", avril: "04",
    mai: "05", juin: "06", juillet: "07", août: "08",
    septembre: "09", octobre: "10", novembre: "11", décembre: "12",
  };

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (pattern.source.includes("جانفي")) {
        const month = arabicMonths[match[2]] || "01";
        return `${match[3]}-${month}-${match[1].padStart(2, "0")}`;
      }
      if (pattern.source.includes("janvier")) {
        const month = frenchMonths[match[2]] || "01";
        return `${match[3]}-${month}-${match[1].padStart(2, "0")}`;
      }
      if (match[1].length === 4) {
        return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
      }
    }
  }
  return null;
}

function classifyDocument(title: string, text: string): ScrapedLegalDocument["referenceType"] {
  const combined = (title + " " + text).toLowerCase();
  if (combined.includes("قانون") || combined.includes("loi")) return "law";
  if (combined.includes("مرسوم") || combined.includes("décret")) return "decree";
  if (combined.includes("لائحة") || combined.includes("règlement")) return "regulation";
  if (combined.includes("تعميم") || combined.includes("circular")) return "circular";
  return "other";
}

export async function searchJoradp(query: string): Promise<WebSearchResult[]> {
  const results: WebSearchResult[] = [];
  try {
    const searchUrl = `${SOURCES.SGG.baseUrl}/jo_fiche/listejoar.html`;
    const res = await fetchWithTimeout(searchUrl);
    const html = await res.text();
    const text = stripHtml(html);
    const queryLower = query.toLowerCase();
    const lines = text.split(/[.\n]/).filter((l) => l.trim().length > 10);
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      if (
        lineLower.includes(queryLower) ||
        queryLower.split(" ").some((w) => w.length > 2 && lineLower.includes(w))
      ) {
        const lawNum = extractLawNumber(line);
        const date = extractDate(line);
        results.push({
          title: line.trim().slice(0, 200),
          url: searchUrl,
          snippet: line.trim().slice(0, 300),
          source: SOURCES.SGG.name,
          date,
          type: lawNum ? "law" : "other",
        });
      }
    }
    if (results.length === 0 && text.length > 100) {
      const chunks = text.match(/.{100,300}(?:\.|،)/g) || [];
      for (const chunk of chunks.slice(0, 5)) {
        results.push({
          title: chunk.trim().slice(0, 100),
          url: searchUrl,
          snippet: chunk.trim(),
          source: SOURCES.SGG.name,
          date: extractDate(chunk),
          type: classifyDocument(query, chunk) as WebSearchResult["type"],
        });
      }
    }
  } catch (err) {
    console.error("Joradp search error:", err);
  }
  return results;
}

export async function searchLegalPortal(query: string): Promise<WebSearchResult[]> {
  const results: WebSearchResult[] = [];
  try {
    const url = `${SOURCES.LEGAL_PORTAL.baseUrl}/Arabic/index.aspx`;
    const res = await fetchWithTimeout(url);
    const html = await res.text();
    const text = stripHtml(html);
    const queryLower = query.toLowerCase();
    const lines = text.split(/[.\n]/).filter((l) => l.trim().length > 10);
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      if (
        lineLower.includes(queryLower) ||
        queryLower.split(" ").some((w) => w.length > 2 && lineLower.includes(w))
      ) {
        const lawNum = extractLawNumber(line);
        results.push({
          title: line.trim().slice(0, 200),
          url,
          snippet: line.trim().slice(0, 300),
          source: SOURCES.LEGAL_PORTAL.name,
          date: extractDate(line),
          type: lawNum ? "law" : "other",
        });
      }
    }
  } catch (err) {
    console.error("Legal portal search error:", err);
  }
  return results;
}

export async function searchLegislationDz(query: string): Promise<WebSearchResult[]> {
  const results: WebSearchResult[] = [];
  try {
    const params = new URLSearchParams({ query, lang: "ar" });
    const url = `${SOURCES.LEGISLATION_DZ.searchUrl}?${params.toString()}`;
    const res = await fetchWithTimeout(url);
    const html = await res.text();
    const text = stripHtml(html);
    const queryLower = query.toLowerCase();
    const lines = text.split(/[.\n]/).filter((l) => l.trim().length > 10);
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      if (
        lineLower.includes(queryLower) ||
        queryLower.split(" ").some((w) => w.length > 2 && lineLower.includes(w))
      ) {
        const lawNum = extractLawNumber(line);
        results.push({
          title: line.trim().slice(0, 200),
          url,
          snippet: line.trim().slice(0, 300),
          source: SOURCES.LEGISLATION_DZ.name,
          date: extractDate(line),
          type: lawNum ? "law" : "other",
        });
      }
    }
  } catch (err) {
    console.error("Legislation.dz search error:", err);
  }
  return results;
}

export async function searchInternetLegal(
  query: string,
  options: {
    sources?: string[];
    maxResults?: number;
  } = {}
): Promise<{
  results: WebSearchResult[];
  searchedSources: string[];
  errors: string[];
}> {
  const maxResults = options.maxResults || 30;
  const sourcesToSearch = options.sources || ["SGG", "LEGAL_PORTAL", "LEGISLATION_DZ"];
  const allResults: WebSearchResult[] = [];
  const errors: string[] = [];
  const searchedSources: string[] = [];

  const searchFns: Record<string, (q: string) => Promise<WebSearchResult[]>> = {
    SGG: searchJoradp,
    LEGAL_PORTAL: searchLegalPortal,
    LEGISLATION_DZ: searchLegislationDz,
  };

  const promises = sourcesToSearch.map(async (sourceKey) => {
    const fn = searchFns[sourceKey];
    if (!fn) return;
    searchedSources.push(sourceKey);
    try {
      const results = await fn(query);
      return results;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${sourceKey}: ${msg}`);
      return [];
    }
  });

  const settled = await Promise.allSettled(promises);
  for (const result of settled) {
    if (result.status === "fulfilled" && result.value) {
      allResults.push(...result.value);
    }
  }

  const seen = new Set<string>();
  const uniqueResults = allResults.filter((r) => {
    const key = `${r.title.slice(0, 50)}-${r.source}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  uniqueResults.sort((a, b) => {
    const aExact = a.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
    const bExact = b.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
    return bExact - aExact;
  });

  return {
    results: uniqueResults.slice(0, maxResults),
    searchedSources,
    errors,
  };
}

export async function scrapeLegalDocument(
  url: string
): Promise<ScrapedLegalDocument | null> {
  try {
    const res = await fetchWithTimeout(url);
    const html = await res.text();
    const text = stripHtml(html);
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? stripHtml(titleMatch[1]) : text.slice(0, 100);
    const lawNum = extractLawNumber(text);
    const date = extractDate(text);
    const type = classifyDocument(title, text);
    const keywords: string[] = [];
    const kwPatterns = [
      /(?:المادة|-article)\s+(\d+)/gi,
      /(?:الفصل|chapitre)\s+(\d+)/gi,
    ];
    for (const p of kwPatterns) {
      let m;
      while ((m = p.exec(text)) !== null) {
        keywords.push(m[0]);
      }
    }

    return {
      title: title.slice(0, 500),
      referenceNumber: lawNum || "UNKNOWN",
      referenceType: type,
      fullText: text.slice(0, 50000),
      url,
      source: url,
      publicationDate: date,
      keywords: keywords.slice(0, 20),
    };
  } catch (err) {
    console.error("Scrape error:", err);
    return null;
  }
}

export function getAvailableSources() {
  return Object.entries(SOURCES).map(([key, source]) => ({
    key,
    name: source.name,
    baseUrl: source.baseUrl,
    type: source.type,
  }));
}
