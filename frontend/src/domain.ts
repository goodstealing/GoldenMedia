export type Category = "anime" | "movies" | "series" | "manga" | "books";

export type Status =
  | "Запланировано"
  | "Смотрю"
  | "Просмотрено"
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
};

export type PaginatedContentResponse = {
  items: ContentItem[];
  total: number;
  page: number;
  pageSize: number;
};

export const STATUSES: Status[] = [
  "Запланировано",
  "Смотрю",
  "Просмотрено",
  "Отложено",
  "Брошено",
  "Любимое",
];

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
      return "status-watching";
    case "Просмотрено":
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

