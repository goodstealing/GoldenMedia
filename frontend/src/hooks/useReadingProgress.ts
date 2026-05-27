import { useCallback, useEffect, useState } from "react";
import type { Category } from "../domain";

function storageKey(category: Category, id: number): string {
  return `goldenmedia_reading_${category}_${id}`;
}

export function useReadingProgress(category: Category, id: number) {
  const [page, setPageState] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(storageKey(category, id));
    if (!raw) {
      setPageState(1);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { page?: number; totalPages?: number };
      if (typeof parsed.page === "number" && parsed.page > 0) {
        setPageState(parsed.page);
      }
      if (typeof parsed.totalPages === "number" && parsed.totalPages > 0) {
        setTotalPages(parsed.totalPages);
      }
    } catch {
      setPageState(1);
    }
  }, [category, id]);

  const persist = useCallback(
    (nextPage: number, nextTotal?: number) => {
      const total = nextTotal ?? totalPages;
      setPageState(nextPage);
      if (nextTotal != null) {
        setTotalPages(nextTotal);
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          storageKey(category, id),
          JSON.stringify({ page: nextPage, totalPages: total }),
        );
      }
    },
    [category, id, totalPages],
  );

  const goToPage = useCallback(
    (nextPage: number) => {
      const clamped = Math.min(Math.max(1, nextPage), totalPages);
      persist(clamped);
    },
    [persist, totalPages],
  );

  const setTotal = useCallback(
    (total: number) => {
      const safeTotal = Math.max(1, total);
      persist(Math.min(page, safeTotal), safeTotal);
    },
    [page, persist],
  );

  return { page, totalPages, goToPage, setTotal, setTotalPages: setTotal };
}
