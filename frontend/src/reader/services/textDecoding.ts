import jschardet from "jschardet";

function hasUtf8Bom(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
}

function getXmlEncodingHint(bytes: Uint8Array): string | null {
  const head = new TextDecoder("ascii", { fatal: false }).decode(bytes.slice(0, 512));
  const match = head.match(/encoding=["']([^"']+)["']/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function normalizeEncoding(label: string | null): string {
  if (!label) return "utf-8";
  const normalized = label.toLowerCase();
  if (normalized === "cp1251") return "windows-1251";
  return normalized;
}

export function detectEncoding(bytes: Uint8Array, fallback = "utf-8"): string {
  if (hasUtf8Bom(bytes)) return "utf-8";
  const xmlHint = getXmlEncodingHint(bytes);
  if (xmlHint) return normalizeEncoding(xmlHint);

  const sampleLength = Math.min(bytes.length, 32_768);
  const sample = Array.from(bytes.slice(0, sampleLength), (byte) =>
    String.fromCharCode(byte)
  ).join("");
  const detected = jschardet.detect(sample);
  if (detected?.encoding) {
    return normalizeEncoding(detected.encoding);
  }
  return fallback;
}

export function decodeBytes(bytes: Uint8Array, preferred?: string): string {
  const encoding = normalizeEncoding(preferred ?? detectEncoding(bytes));
  try {
    return new TextDecoder(encoding, { fatal: false }).decode(bytes);
  } catch {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }
}
