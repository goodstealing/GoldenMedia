import type { Category, ContentItem, Status } from "../domain";
import { getApiBase } from "./api";

const API_BASE = getApiBase();

export async function fetchContentItem(
  category: Category,
  id: number,
  signal?: AbortSignal,
): Promise<ContentItem> {
  const res = await fetch(`${API_BASE}/api/content/${category}/${id}`, { signal });
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Запись не найдена");
    }
    throw new Error(`Ошибка загрузки: ${res.status}`);
  }
  return res.json();
}

export async function updateContentItem(
  category: Category,
  id: number,
  payload: Record<string, unknown>,
  coverFile?: File | null,
): Promise<ContentItem> {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  });
  if (coverFile) {
    formData.append("cover", coverFile);
  }

  const res = await fetch(`${API_BASE}/api/content/${category}/${id}`, {
    method: "PUT",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Не удалось обновить запись");
  }
  return res.json();
}

export async function updateContentStatus(
  category: Category,
  item: ContentItem,
  status: Status,
): Promise<ContentItem> {
  return updateContentItem(category, item.id, {
    title: item.title,
    original_title: item.original_title,
    status,
    rating: item.rating,
    episodes_total: item.episodes_total,
    episodes_watched: item.episodes_watched,
    season: item.season,
    genres: item.genres,
    studio: item.studio,
    release_date: item.release_date,
    duration_text: item.duration_text,
    description: item.description,
    view_start_date: item.view_start_date,
    view_end_date: item.view_end_date,
    cover_path: item.cover_path,
  });
}

export async function deleteContentItem(
  category: Category,
  id: number,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/content/${category}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    throw new Error("Не удалось удалить запись");
  }
}
