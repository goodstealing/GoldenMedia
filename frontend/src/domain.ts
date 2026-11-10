export type Category = "anime" | "movies" | "series" | "manga" | "books";

export type Status =
  | "Запланировано"
  | "Смотрю"
  | "Читаю"
  | "Просмотрено"
  | "Прочитано"
  | "Отложено"
  | "Брошено"
  | "Любимое";

export type SortBy =
  | "title"
  | "rating"
  | "episodes"
  | "season"
  | "studio"
  | "progress"
  | "";

export type ContentItem = {
  id: number;
  title: string;
  original_title: string | null;
  cover_path: string | null;
  status: Status | null;
  rating: number | null;
  episodes_total: number | null;
  episodes_watched: number | null;
  season: string | null;
  genres: string | null;
  studio: string | null;
  release_date: string | null;
  duration_text: string | null;
  view_start_date: string | null;
  view_end_date: string | null;
  description: string | null;
  book_file_path?: string | null;
  book_file_format?: string | null;
};

export type ReadingProgress = {
  id: number;
  content_id: number;
  current_page: number;
  total_pages: number;
  location: string | null;
  progress_percent: number;
  font_size: number;
  theme: "light" | "dark";
  updated_at: string;
};

export type ReadingBookmark = {
  id: number;
  content_id: number;
  page: number;
  location: string | null;
  label: string | null;
  created_at: string;
};

export const CATEGORY_IDS: Category[] = [
  "series",
  "movies",
  "anime",
  "manga",
  "books",
];

export function isCategory(value: string): value is Category {
  return (CATEGORY_IDS as string[]).includes(value);
}

export function getConsumeActionLabel(category: Category): string {
  return category === "books" || category === "manga" ? "Читать" : "Смотреть";
}

export function isReadableCategory(category: Category): boolean {
  return category === "books" || category === "manga";
}

export type PaginatedContentResponse = {
  items: ContentItem[];
  total: number;
  page: number;
  pageSize: number;
};

export const DEFAULT_STATUSES: Status[] = [
  "Запланировано",
  "Смотрю",
  "Просмотрено",
  "Отложено",
  "Брошено",
  "Любимое",
];

export const READABLE_STATUSES: Status[] = [
  "Запланировано",
  "Читаю",
  "Прочитано",
  "Отложено",
  "Брошено",
  "Любимое",
];

export function getStatusesForCategory(category: Category): Status[] {
  return isReadableCategory(category) ? READABLE_STATUSES : DEFAULT_STATUSES;
}

export function normalizeStatusForCategory(
  category: Category,
  status: Status | null
): Status | null {
  if (!status) return status;
  if (!isReadableCategory(category)) return status;
  if (status === "Смотрю") return "Читаю";
  if (status === "Просмотрено") return "Прочитано";
  return status;
}

export function getFilterStatusValues(category: Category, status: Status): Status[] {
  if (!isReadableCategory(category)) return [status];
  if (status === "Читаю") return ["Читаю", "Смотрю"];
  if (status === "Прочитано") return ["Прочитано", "Просмотрено"];
  return [status];
}

export function getInProgressStatus(category: Category): Status {
  return isReadableCategory(category) ? "Читаю" : "Смотрю";
}

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "series", label: "Сериалы" },
  { id: "movies", label: "Фильмы" },
  { id: "anime", label: "Аниме" },
  { id: "manga", label: "Манга" },
  { id: "books", label: "Книги" },
];

export function getStatusClassName(status: Status): string {
  switch (status) {
    case "Запланировано":
      return "status-planned";
    case "Смотрю":
    case "Читаю":
      return "status-watching";
    case "Просмотрено":
    case "Прочитано":
      return "status-completed";
    case "Отложено":
      return "status-on-hold";
    case "Брошено":
      return "status-dropped";
    case "Любимое":
      return "status-favorite";
    default:
      return "";
  }
}

