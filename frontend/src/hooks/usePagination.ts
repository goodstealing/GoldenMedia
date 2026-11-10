import { useState } from "react";

const PAGE_SIZE_STORAGE_KEY = "goldenmedia_pageSize";

export interface UsePaginationResult {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  handlePageChange: (nextPage: number) => void;
  handlePageSizeChange: (nextPageSize: number) => void;
}

export function usePagination(): UsePaginationResult {
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
      const n = stored ? Number(stored) : NaN;
      if (n === 20 || n === 50 || n === 100) {
        return n;
      }
    }
    return 50;
  });

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        PAGE_SIZE_STORAGE_KEY,
        String(nextPageSize)
      );
    }
  };

  return {
    page,
    pageSize,
    setPage,
    handlePageChange,
    handlePageSizeChange
  };
}

