import fs from "fs";
import path from "path";
import type { ContentCategory } from "../db/connection";

const backendRoot = path.resolve(__dirname, "..", "..");
const dataRoot = path.join(backendRoot, "src", "data");

const coverRoot = path.join(dataRoot, "covers");
const bookRoot = path.join(dataRoot, "books");
const dbRoot = path.join(dataRoot, "databases");

export function ensureDir(dirPath: string): string {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

export function getDataRootPath(): string {
  return ensureDir(dataRoot);
}

export function getDatabaseRootPath(): string {
  return ensureDir(dbRoot);
}

export function getCoversRootPath(): string {
  return ensureDir(coverRoot);
}

export function getBooksRootPath(): string {
  return ensureDir(bookRoot);
}

export function getCategoryCoverDir(category: ContentCategory): string {
  return ensureDir(path.join(getCoversRootPath(), category));
}

export function getCoverPublicPath(category: ContentCategory, filename: string): string {
  return `/covers/${category}/${filename}`;
}

export function getBookPublicPath(filename: string): string {
  return `/book-files/${filename}`;
}
