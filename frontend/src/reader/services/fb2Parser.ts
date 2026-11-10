function normalizeLine(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

function pushLine(buffer: string[], value: string): void {
  const clean = normalizeLine(value);
  if (!clean) return;
  buffer.push(clean);
}

function walkNode(node: unknown, lines: string[]): void {
  if (node == null) return;

  if (typeof node === "string") {
    pushLine(lines, node);
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item) => walkNode(item, lines));
    return;
  }

  if (typeof node !== "object") return;
  const record = node as Record<string, unknown>;

  if (record["#text"]) {
    walkNode(record["#text"], lines);
  }

  if (record.title) {
    const titleLines: string[] = [];
    walkNode(record.title, titleLines);
    if (titleLines.length > 0) {
      lines.push("");
      lines.push(titleLines.join(" ").toUpperCase());
      lines.push("");
    }
  }

  if (record.p) {
    const paragraphLines: string[] = [];
    walkNode(record.p, paragraphLines);
    paragraphLines.forEach((line) => lines.push(line));
    if (paragraphLines.length > 0) lines.push("");
  }

  if (record.section) {
    walkNode(record.section, lines);
    return;
  }

  Object.entries(record).forEach(([key, value]) => {
    if (key === "#text" || key === "title" || key === "p" || key === "section") return;
    walkNode(value, lines);
  });
}

export function extractFb2Text(parsed: unknown): string {
  const root = parsed as Record<string, unknown> | null;
  if (!root) return "";

  const fictionBook = (root.FictionBook ?? root.fictionbook) as
    | Record<string, unknown>
    | undefined;
  if (!fictionBook) return "";

  const bodyNode = fictionBook.body;
  const lines: string[] = [];
  walkNode(bodyNode, lines);

  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
