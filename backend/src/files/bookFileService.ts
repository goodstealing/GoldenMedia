import fs from "fs/promises";
import path from "path";
import { getBookPublicPath, getBooksRootPath } from "./dataPaths";
import { normalizeBookExtension, slugifyTitle } from "./fileNaming";

async function getUniqueFileName(dir: string, baseSlug: string, ext: string): Promise<string> {
  let candidate = `${baseSlug}${ext}`;
  let index = 2;
  for (;;) {
    try {
      await fs.access(path.join(dir, candidate));
      candidate = `${baseSlug}-${index}${ext}`;
      index += 1;
    } catch {
      return candidate;
    }
  }
}

export async function saveBookFile(params: {
  originalTitle: string;
  originalName: string;
  mimetype: string;
  buffer: Buffer;
}): Promise<{ filename: string; extension: string; publicPath: string; fsPath: string }> {
  const ext = normalizeBookExtension(params.originalName, params.mimetype);
  if (!ext) {
    throw new Error("Unsupported book format");
  }

  const booksDir = getBooksRootPath();
  const baseSlug = slugifyTitle(params.originalTitle);
  const filename = await getUniqueFileName(booksDir, baseSlug, ext);
  const fsPath = path.join(booksDir, filename);
  await fs.writeFile(fsPath, params.buffer);

  return {
    filename,
    extension: ext.replace(".", ""),
    publicPath: getBookPublicPath(filename),
    fsPath
  };
}
