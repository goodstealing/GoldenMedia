import { useCallback, useEffect, useState } from "react";
import type { Category, ContentItem } from "../domain";
import { fetchContentItem } from "../utils/contentApi";

export function useContentItem(category: Category, id: number) {
  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchContentItem(category, id, controller.signal);
        setItem(data);
      } catch (e: unknown) {
        if ((e as Error).name === "AbortError") return;
        setError((e as Error).message);
        setItem(null);
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [category, id, reloadToken]);

  return { item, setItem, loading, error, reload };
}
