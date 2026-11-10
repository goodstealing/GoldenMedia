import { XMLParser } from "fast-xml-parser";
import { decodeBytes, detectEncoding } from "./textDecoding";
import { extractFb2Text } from "./fb2Parser";
import type { BookFormat, ParsedTextResult } from "../types";

const binaryCache = new Map<string, Uint8Array>();
const decodedTextCache = new Map<string, string>();
const pageCache = new Map<string, Map<number, string[]>>();

function paginateText(content: string, fontSize: number): string[] {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (!normalized) return ["Файл пуст."];

  const symbolsPerPage = Math.max(1200, Math.floor(3200 - fontSize * 55));
  const chunks: string[] = [];
  for (let i = 0; i < normalized.length; i += symbolsPerPage) {
    chunks.push(normalized.slice(i, i + symbolsPerPage));
  }
  return chunks.length > 0 ? chunks : ["Файл пуст."];
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const cached = binaryCache.get(url);
  if (cached) return cached;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Не удалось загрузить файл книги");
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  binaryCache.set(url, bytes);
  return bytes;
}

export async function loadPdfData(url: string): Promise<Uint8Array> {
  return fetchBytes(url);
}

export async function loadTextContent(
  url: string,
  format: Extract<BookFormat, "txt" | "fb2">
): Promise<string> {
  const cached = decodedTextCache.get(`${format}:${url}`);
  if (cached) return cached;

  const bytes = await fetchBytes(url);
  const hint = format === "fb2" ? detectEncoding(bytes, "utf-8") : undefined;
  const decoded = decodeBytes(bytes, hint);

  let result = decoded;
  if (format === "fb2") {
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseTagValue: true,
      trimValues: false
    });
    const parsed = parser.parse(decoded);
    result = extractFb2Text(parsed);
  }

  decodedTextCache.set(`${format}:${url}`, result);
  return result;
}

export async function loadTextPages(
  url: string,
  format: Extract<BookFormat, "txt" | "fb2">,
  fontSize: number
): Promise<ParsedTextResult> {
  const cacheKey = `${format}:${url}`;
  const byFont = pageCache.get(cacheKey) ?? new Map<number, string[]>();
  pageCache.set(cacheKey, byFont);

  const cachedPages = byFont.get(fontSize);
  if (cachedPages) {
    return { pages: cachedPages, totalPages: cachedPages.length };
  }

  const text = await loadTextContent(url, format);
  const pages = paginateText(text, fontSize);
  byFont.set(fontSize, pages);
  return { pages, totalPages: pages.length };
}
