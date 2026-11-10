import { useEffect, useState } from "react";
import type { Category, ContentItem, PaginatedContentResponse, SortBy, Status } from "../domain";
import { getApiBase } from "../utils/api";
import {
  usesPersonStudioFilter,
  usesSeasonFilter,
} from "../utils/categoryLabels";

const API_BASE = getApiBase();

export interface UseContentApiParams {
  category: Category;
  selectedStatuses: Status[];
  titleQuery: string;
  genresQuery: string;
  seasonFilter: "Все" | "Зима" | "Весна" | "Лето" | "Осень";
  yearFilter: string;
  directorQuery: string;
  sortBy: SortBy;
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
}

export interface UseContentApiResult {
  items: ContentItem[];
  total: number;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useContentApi(params: UseContentApiParams): UseContentApiResult {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const searchParams = new URLSearchParams();
        if (params.selectedStatuses.length > 0) {
          searchParams.set("status", params.selectedStatuses.join(","));
        }
        if (params.titleQuery.trim()) {
          searchParams.set("title", params.titleQuery.trim());
        }
        if (params.genresQuery.trim()) {
          searchParams.set("genres", params.genresQuery.trim());
        }
        if (usesSeasonFilter(params.category) && params.seasonFilter !== "Все") {
          searchParams.set("season", params.seasonFilter);
        }
        if (params.yearFilter.trim()) {
          searchParams.set("year", params.yearFilter.trim());
        }
        if (
          usesPersonStudioFilter(params.category) &&
          params.directorQuery.trim()
        ) {
          searchParams.set("studio", params.directorQuery.trim());
        }
        if (params.sortBy) {
          searchParams.set("sortBy", params.sortBy);
          searchParams.set("sortDir", params.sortDir);
        }
        searchParams.set("page", String(params.page));
        searchParams.set("pageSize", String(params.pageSize));

        const url = `${API_BASE}/api/content/${params.category}?${searchParams.toString()}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Ошибка загрузки: ${res.status}`);
        }
        const data: PaginatedContentResponse = await res.json();
        setItems(data.items);
        setTotal(data.total);
      } catch (e: unknown) {
        if ((e as any).name === "AbortError") return;
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => controller.abort();
  }, [
    params.category,
    params.selectedStatuses,
    params.titleQuery,
    params.genresQuery,
    params.seasonFilter,
    params.yearFilter,
    params.directorQuery,
    params.sortBy,
    params.sortDir,
    params.page,
    params.pageSize,
    reloadToken
  ]);

  const reload = () => setReloadToken((token) => token + 1);

  return { items, total, loading, error, reload };
}

