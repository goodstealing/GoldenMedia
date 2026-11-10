import fs from "fs/promises";
import path from "path";
import type { ContentCategory } from "../db/connection";
import { getBooksRootPath, getCategoryCoverDir } from "./dataPaths";

export async function safeDeleteFile(filePath: string | null): Promise<void> {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      console.warn("Failed to delete file:", filePath, error);
    }
  }
}

export function getLocalCoverFsPath(
  category: ContentCategory,
  coverPath: unknown
): string | null {
  if (typeof coverPath !== "string" || !coverPath.startsWith(`/covers/${category}/`)) {
    return null;
  }
  const fileName = coverPath.replace(`/covers/${category}/`, "");
  return fileName ? path.join(getCategoryCoverDir(category), fileName) : null;
}

export function getLocalBookFsPath(bookPath: unknown): string | null {
  if (typeof bookPath !== "string" || !bookPath.startsWith("/book-files/")) {
    return null;
  }
  const fileName = bookPath.replace("/book-files/", "");
  return fileName ? path.join(getBooksRootPath(), fileName) : null;
}
