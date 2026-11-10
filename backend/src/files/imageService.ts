import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import type { ContentCategory } from "../db/connection";
import { getCategoryCoverDir, getCoverPublicPath } from "./dataPaths";
import { slugifyTitle } from "./fileNaming";

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

export async function saveCoverAsWebp(params: {
  category: ContentCategory;
  originalTitle: string;
  imageBuffer: Buffer;
}): Promise<{ filename: string; publicPath: string; fsPath: string }> {
  const coverDir = getCategoryCoverDir(params.category);
  const baseSlug = slugifyTitle(params.originalTitle);
  const filename = await getUniqueFileName(coverDir, baseSlug, ".webp");
  const fsPath = path.join(coverDir, filename);

  await sharp(params.imageBuffer)
    .rotate()
    .webp({ quality: 82, effort: 4 })
    .toFile(fsPath);

  return {
    filename,
    publicPath: getCoverPublicPath(params.category, filename),
    fsPath
  };
}
