const API_BASE = "http://localhost:4000";

export function getApiBase(): string {
  return API_BASE;
}

export function buildCoverUrl(path: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith("/")) {
    return `${API_BASE}${path}`;
  }
  return `${API_BASE}/${path}`;
}

