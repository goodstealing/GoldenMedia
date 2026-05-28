import type { ParsedQs } from "qs";
import type { ContentCategory } from "../db/connection";

export type SortDirection = "asc" | "desc";

export interface ListQueryDto {
  statuses: string[];
  title?: string;
  genres: string[];
  season?: string;
  year?: string;
  studio?: string;
  sortBy?: string;
  sortDir: SortDirection;
  page: number;
  pageSize: number;
}

export function parseListQuery(
  raw: ParsedQs | Record<string, unknown>
): ListQueryDto {
  const {
    status,
    title,
    genres,
    season,
    year,
    studio,
    sortBy,
    sortDir,
    page,
    pageSize
  } = raw as Record<string, unknown>;

  const statuses: string[] = status
    ? String(status)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const genresList: string[] = genres
    ? String(genres)
        .split(",")
        .map((g) => g.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const seasonValue =
    season && String(season) !== "Все" ? String(season) : undefined;

  const yearValue = year ? String(year) : undefined;
  const studioValue = studio ? String(studio) : undefined;

  const sortByValue = sortBy ? String(sortBy) : undefined;
  const sortDirRaw = sortDir ? String(sortDir).toLowerCase() : "asc";
  const sortDirValue: SortDirection =
    sortDirRaw === "desc" ? "desc" : "asc";

  const pageNumber =
    typeof page === "string" && Number(page) > 0 ? Number(page) : 1;
  const pageSizeRaw =
    typeof pageSize === "string" && Number(pageSize) > 0
      ? Number(pageSize)
      : undefined;
  const pageSizeValue = pageSizeRaw ?? 50;
  const safePageSize = Math.min(Math.max(pageSizeValue, 1), 500);

  return {
    statuses,
    title: title ? String(title) : undefined,
    genres: genresList,
    season: seasonValue,
    year: yearValue,
    studio: studioValue,
    sortBy: sortByValue,
    sortDir: sortDirValue,
    page: pageNumber,
    pageSize: safePageSize
  };
}

export interface CreateContentDto {
  category: ContentCategory;
  title: string;
  original_title: string | null;
  status: string;
  rating: number | null;
  episodes_total: number | null;
  episodes_watched: number | null;
  season: string | null;
  genres: string | null;
  studio: string | null;
  release_date: string | null;
  duration_text: string | null;
  cover_path: string | null;
  view_start_date: string | null;
  view_end_date: string | null;
  coverFile?: Express.Multer.File;
}

export interface UpdateContentDto {
  category: ContentCategory;
  id: number;
  // Поля опциональные: если undefined — не менять, если null — сбросить
  title?: string | null;
  original_title?: string | null;
  status?: string | null;
  rating?: number | null;
  episodes_total?: number | null;
  episodes_watched?: number | null;
  season?: string | null;
  genres?: string | null;
  studio?: string | null;
  release_date?: string | null;
  duration_text?: string | null;
  cover_path?: string | null;
  view_start_date?: string | null;
  view_end_date?: string | null;
  coverFile?: Express.Multer.File;
}

export function parseCreateBody(
  category: ContentCategory,
  body: Record<string, unknown>,
  file?: Express.Multer.File | null
): CreateContentDto {
  const {
    title,
    original_title,
    status,
    rating,
    episodes_total,
    episodes_watched,
    season,
    genres,
    studio,
    release_date,
    duration_text,
    cover_path,
    view_start_date,
    view_end_date
  } = body;

  if (typeof title !== "string" || !title.trim()) {
    throw new Error("Title is required");
  }

  const normalizedTitle = title.trim();

  const finalStatus =
    typeof status === "string" && status.trim()
      ? status.trim()
      : "Запланировано";

  let finalRating: number | null = null;
  if (typeof rating === "number") {
    finalRating = rating;
  } else if (typeof rating === "string" && rating.trim() !== "") {
    const n = Number(rating);
    finalRating = Number.isFinite(n) ? n : null;
  }

  const toNumberOrNull = (value: unknown): number | null => {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "") {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const episodesTotal = toNumberOrNull(episodes_total);
  const episodesWatched = toNumberOrNull(episodes_watched);

  const coverFromBody =
    typeof cover_path === "string" && cover_path.trim()
      ? cover_path.trim()
      : null;

  const viewStart =
    typeof view_start_date === "string" && view_start_date.trim()
      ? view_start_date.trim()
      : null;
  const viewEnd =
    typeof view_end_date === "string" && view_end_date.trim()
      ? view_end_date.trim()
      : null;

  return {
    category,
    title: normalizedTitle,
    original_title:
      typeof original_title === "string" && original_title.trim()
        ? original_title.trim()
        : null,
    status: finalStatus,
    rating: finalRating,
    episodes_total: episodesTotal,
    episodes_watched: episodesWatched,
    season:
      typeof season === "string" && season.trim() ? season.trim() : null,
    genres:
      typeof genres === "string" && genres.trim() ? genres.trim() : null,
    studio:
      typeof studio === "string" && studio.trim() ? studio.trim() : null,
    release_date:
      typeof release_date === "string" && release_date.trim()
        ? release_date.trim()
        : null,
    duration_text:
      typeof duration_text === "string" && duration_text.trim()
        ? duration_text.trim()
        : null,
    cover_path: coverFromBody,
    view_start_date: viewStart,
    view_end_date: viewEnd,
    coverFile: file ?? undefined
  };
}

export function parseUpdateBody(
  category: ContentCategory,
  id: number,
  body: Record<string, unknown>,
  file?: Express.Multer.File | null
): UpdateContentDto {
  const dto: UpdateContentDto = {
    category,
    id
  };

  const assignOptionalString = (
    field:
      | "original_title"
      | "status"
      | "season"
      | "genres"
      | "studio"
      | "release_date"
      | "duration_text"
      | "view_start_date"
      | "view_end_date",
    value: unknown
  ) => {
    if (typeof value === "string") {
      dto[field] = value.trim() === "" ? null : value.trim();
    }
  };

  if (typeof body.title === "string") {
    dto.title = body.title.trim() || null;
  }

  assignOptionalString("original_title", body.original_title);
  assignOptionalString("status", body.status);
  assignOptionalString("season", body.season);
  assignOptionalString("genres", body.genres);
  assignOptionalString("studio", body.studio);
  assignOptionalString("release_date", body.release_date);
  assignOptionalString("duration_text", body.duration_text);
  assignOptionalString("view_start_date", body.view_start_date);
  assignOptionalString("view_end_date", body.view_end_date);

  const toNumberOrNull = (value: unknown): number | null => {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "") {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  if (body.rating !== undefined) {
    dto.rating = toNumberOrNull(body.rating);
  }
  if (body.episodes_total !== undefined) {
    dto.episodes_total = toNumberOrNull(body.episodes_total);
  }
  if (body.episodes_watched !== undefined) {
    dto.episodes_watched = toNumberOrNull(body.episodes_watched);
  }

  if (typeof body.cover_path === "string") {
    dto.cover_path = body.cover_path.trim() || null;
  }

  if (file) {
    dto.coverFile = file;
  }

  return dto;
}

