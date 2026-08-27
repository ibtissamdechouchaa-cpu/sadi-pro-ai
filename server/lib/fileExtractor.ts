import mammoth from "mammoth";
import { downloadFromR2 } from "./r2.js";

const IMAGE_TYPES = new Set(["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff", "tif"]);

async function extractDocxText(buffer: Buffer): Promise<string | null> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value?.trim();
    if (text && text.length > 10) return text.slice(0, 15000);
  } catch {}
  return null;
}

async function extractXlsxText(buffer: Buffer): Promise<string | null> {
  try {
    const { default: XLSX } = await import("xlsx" as string);
    const wb = XLSX.read(buffer, { type: "buffer" });
    const parts: string[] = [];
    for (const name of wb.SheetNames) {
      const sheet = wb.Sheets[name];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      if (csv.trim()) parts.push(`--- Sheet: ${name} ---\n${csv}`);
    }
    const text = parts.join("\n\n").trim();
    if (text.length > 10) return text.slice(0, 15000);
  } catch {}
  // fallback: try jszip XML sniff via @doc-preview/core
  try {
    const { extractComparableText } = await import("@doc-preview/core");
    const doc = { file: new Blob([buffer as unknown as BlobPart]), fileName: "doc.xlsx", fileType: "xlsx" };
    const text = await extractComparableText(doc as any);
    if (text && text.trim().length > 10) return text.slice(0, 15000);
  } catch {}
  return null;
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export async function extractFileText(
  filePath: string | null,
  fileType: string | null,
  title: string,
  metadata?: Record<string, unknown> | null
): Promise<{ text: string; isImage: boolean; imageData?: { base64: string; mime: string } }> {
  if (!filePath) {
    const meta = (metadata || {}) as Record<string, unknown>;
    const html = (meta.editorHtml as string) || (meta.previewText as string) || '';
    if (html && typeof html === 'string' && html.includes('<')) {
      const t = htmlToText(html);
      if (t.length > 20) return { text: `${title}\n\n${t}`.slice(0, 15000), isImage: false };
    }
    if (typeof html === 'string' && html.trim().length > 20) {
      return { text: `${title}\n\n${html.trim()}`.slice(0, 15000), isImage: false };
    }
    const desc = (meta.description as string) || '';
    if (desc && desc.trim().length > 10) {
      return { text: `${title}\n\n${desc}`.slice(0, 15000), isImage: false };
    }
    return { text: title, isImage: false };
  }

  const ext = (fileType || "").toLowerCase();

  // Images → return base64 for Gemini Vision
  if (IMAGE_TYPES.has(ext)) {
    try {
      const buf = await downloadFromR2(filePath);
      const mime = ext === "jpg" ? "image/jpeg" : ext === "tif" || ext === "tiff" ? "image/tiff" : `image/${ext}`;
      return { text: title, isImage: true, imageData: { base64: buf.toString("base64"), mime } };
    } catch {
      return { text: title, isImage: false };
    }
  }

  // Read raw buffer once
  let buffer: Buffer;
  try {
    buffer = await downloadFromR2(filePath);
  } catch {
    return { text: title, isImage: false };
  }

  // DOCX / DOC
  if (ext === "docx" || ext === "doc") {
    const t = await extractDocxText(buffer);
    if (t) return { text: t, isImage: false };
  }

  // XLSX / XLS
  if (ext === "xlsx" || ext === "xls") {
    const t = await extractXlsxText(buffer);
    if (t) return { text: t, isImage: false };
  }

  // PDF / PPTX / other Office via @doc-preview/core
  try {
    const { extractComparableText } = await import("@doc-preview/core");
    const doc = { file: new Blob([buffer as unknown as BlobPart]), fileName: `${title}.${ext}`, fileType: ext };
    const text = await extractComparableText(doc as any);
    if (text && text.trim().length > 10) {
      return { text: text.slice(0, 15000), isImage: false };
    }
  } catch {}

  // Fallback: raw utf-8 read (works for txt, csv, json, xml, html)
  try {
    const text = buffer.toString("utf-8");
    const printable = (text.match(/[\x20-\x7E\x0A\x0D]/g) || []).length;
    if (printable / text.length < 0.7) return { text: title, isImage: false };
    return { text: text.slice(0, 15000), isImage: false };
  } catch {
    return { text: title, isImage: false };
  }
}

export async function extractFileTextSimple(
  filePath: string | null,
  fileType: string | null,
  title: string,
  metadata?: Record<string, unknown> | null
): Promise<string> {
  const r = await extractFileText(filePath, fileType, title, metadata);
  return r.text;
}
