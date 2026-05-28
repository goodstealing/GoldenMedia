import path from "path";

const INVALID_CHARS_RE = /[^a-z0-9\s-]/g;
const DASH_RE = /-+/g;
const SPACE_RE = /\s+/g;

function maybeDecodeLatin1(value: string): string {
  if (!value) return value;
  const looksMojibake = /[ÐÑÃ]/.test(value);
  if (!looksMojibake) return value;
  try {
    const decoded = Buffer.from(value, "latin1").toString("utf8");
    return decoded || value;
  } catch {
    return value;
  }
}

export function removeExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/u, "");
}

export function normalizeFilename(value: string): string {
  return maybeDecodeLatin1(value).normalize("NFKC").trim();
}

export function slugifyTitle(value: string): string {
  const normalized = normalizeFilename(value)
    .toLowerCase()
    .replace(INVALID_CHARS_RE, " ")
    .replace(SPACE_RE, "-")
    .replace(DASH_RE, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "untitled";
}

export function normalizeBookExtension(rawName: string, mimetype: string): string | null {
  const decodedName = normalizeFilename(rawName);
  const ext = path.extname(decodedName).toLowerCase();
  if (ext === ".epub" || ext === ".fb2" || ext === ".pdf" || ext === ".txt") {
    return ext;
  }

  switch (mimetype) {
    case "application/epub+zip":
      return ".epub";
    case "application/pdf":
      return ".pdf";
    case "text/plain":
      return ".txt";
    case "application/xml":
    case "text/xml":
      return ".fb2";
    default:
      return null;
  }
}
