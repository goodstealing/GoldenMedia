import { getApiBase } from "./api";
import type { Category, ContentItem, ReadingBookmark, ReadingProgress } from "../domain";

const API_BASE = getApiBase();

export type ReaderPayload = {
  book: ContentItem;
  progress: ReadingProgress | null;
  bookmarks: ReadingBookmark[];
};

export async function fetchBookReaderData(category: Category, id: number): Promise<ReaderPayload> {
  const res = await fetch(`${API_BASE}/api/content/${category}/${id}/reader`);
  if (!res.ok) {
    throw new Error("Не удалось загрузить данные ридера");
  }
  return res.json();
}

export async function uploadBookFile(category: Category, id: number, file: File): Promise<ContentItem> {
  const form = new FormData();
  form.append("bookFile", file);
  const res = await fetch(`${API_BASE}/api/content/${category}/${id}/file`, {
    method: "POST",
    body: form
  });
  if (!res.ok) {
    throw new Error("Не удалось загрузить файл книги");
  }
  return res.json();
}

export type SaveProgressPayload = {
  current_page: number;
  total_pages: number;
  location: string | null;
  progress_percent: number;
  font_size: number;
  theme: "light" | "dark";
};

export async function saveBookProgress(
  category: Category,
  id: number,
  payload: SaveProgressPayload
): Promise<ReadingProgress> {
  const res = await fetch(`${API_BASE}/api/content/${category}/${id}/progress`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error("Не удалось сохранить прогресс");
  }
  return res.json();
}

export async function createBookmark(
  category: Category,
  id: number,
  payload: { page: number; location: string | null; label?: string }
): Promise<ReadingBookmark> {
  const res = await fetch(`${API_BASE}/api/content/${category}/${id}/bookmarks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error("Не удалось создать закладку");
  }
  return res.json();
}

export async function deleteBookmark(category: Category, id: number, bookmarkId: number): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/content/${category}/${id}/bookmarks/${bookmarkId}`,
    { method: "DELETE" }
  );
  if (!res.ok && res.status !== 204) {
    throw new Error("Не удалось удалить закладку");
  }
}
