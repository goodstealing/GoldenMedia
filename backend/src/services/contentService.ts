import { getDatabase, type ContentCategory } from "../db/connection";
import type {
  CreateContentDto,
  ListQueryDto,
  UpdateContentDto
} from "../dto/contentListDto";

export interface PaginatedContentResult {
  items: unknown[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listContent(
  category: ContentCategory,
  query: ListQueryDto
): Promise<PaginatedContentResult> {
  const db = await getDatabase(category);

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.statuses.length > 0) {
    conditions.push(
      `status IN (${query.statuses.map(() => "?").join(",")})`
    );
    params.push(...query.statuses);
  }

  if (query.title && query.title.trim()) {
    conditions.push(
      "(title LIKE ? OR IFNULL(original_title, '') LIKE ?)"
    );
    const t = `%${query.title.trim()}%`;
    params.push(t, t);
  }

  for (const g of query.genres) {
    conditions.push("LOWER(genres) LIKE ?");
    params.push(`%${g}%`);
  }

  if (query.season) {
    conditions.push("season LIKE ?");
    params.push(`${query.season}%`);
  }

  if (query.year) {
    conditions.push("substr(release_date, 1, 4) = ?");
    params.push(query.year);
  }

  if (query.studio) {
    conditions.push("studio LIKE ?");
    params.push(`%${query.studio}%`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  let orderBy = "";
  const dir = query.sortDir.toUpperCase();

  switch (query.sortBy) {
    case "title":
      orderBy = `ORDER BY title COLLATE NOCASE ${dir}`;
      break;
    case "rating":
      orderBy = `ORDER BY rating ${dir}`;
      break;
    case "episodes":
      orderBy = `ORDER BY episodes_total ${dir}`;
      break;
    case "season":
      if (category === "anime") {
        orderBy = `ORDER BY 
          CAST(substr(season, instr(season, ' ') + 1) AS INTEGER) ${dir},
          season ${dir}`;
      } else {
        orderBy = `ORDER BY release_date ${dir}`;
      }
      break;
    case "studio":
      orderBy = `ORDER BY studio COLLATE NOCASE ${dir}`;
      break;
    case "progress":
      orderBy = `ORDER BY 
          CASE 
            WHEN episodes_total IS NULL OR episodes_total = 0 THEN 0 
            ELSE CAST(episodes_watched AS REAL) / episodes_total 
          END ${dir}`;
      break;
    default:
      orderBy = "";
  }

  const totalRow = await db.get<{ count: number }>(
    `SELECT COUNT(*) as count FROM content ${whereClause}`,
    params
  );
  const total = totalRow?.count ?? 0;

  const offset = (query.page - 1) * query.pageSize;

  const rows = await db.all(
    `SELECT * FROM content ${whereClause} ${orderBy} LIMIT ? OFFSET ?`,
    [...params, query.pageSize, offset]
  );

  return {
    items: rows,
    total,
    page: query.page,
    pageSize: query.pageSize
  };
}

export async function createContent(
  dto: CreateContentDto
): Promise<unknown> {
  const db = await getDatabase(dto.category);

  const existing = await db.get(
    "SELECT id FROM content WHERE title = ?",
    dto.title
  );
  if (existing) {
    throw new Error("Запись с таким названием уже существует");
  }

  const nowIso = new Date().toISOString().slice(0, 10);

  let finalViewStart = dto.view_start_date;
  let finalViewEnd = dto.view_end_date;

  if (dto.status === "Смотрю" && !finalViewStart) {
    finalViewStart = nowIso;
  }

  if (dto.status === "Просмотрено") {
    if (!finalViewStart) {
      finalViewStart = nowIso;
    }
    if (!finalViewEnd) {
      finalViewEnd = nowIso;
    }
  }

  const coverPath =
    dto.coverFile != null
      ? `/covers/${dto.category}/${dto.coverFile.filename}`
      : dto.cover_path;

  const result = await db.run(
    `INSERT INTO content 
      (title, original_title, cover_path, status, rating, episodes_total, episodes_watched, season, genres, studio, release_date, duration_text, view_start_date, view_end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      dto.title,
      dto.original_title,
      coverPath,
      dto.status,
      dto.rating,
      dto.episodes_total ?? 12,
      dto.episodes_watched ?? 0,
      dto.season,
      dto.genres,
      dto.studio,
      dto.release_date,
      dto.duration_text,
      finalViewStart,
      finalViewEnd
    ]
  );

  const created = await db.get(
    "SELECT * FROM content WHERE id = ?",
    result.lastID
  );

  return created;
}

export async function updateContent(
  dto: UpdateContentDto
): Promise<unknown> {
  const db = await getDatabase(dto.category);

  const existing = await db.get("SELECT * FROM content WHERE id = ?", dto.id);
  if (!existing) {
    return null;
  }

  const merged = {
    ...existing,
    ...dto
  };

  const prevStatus: string | null =
    typeof existing.status === "string" ? existing.status : null;

  const nextStatus =
    typeof dto.status === "string" && dto.status.trim()
      ? dto.status.trim()
      : prevStatus;

  const nowIso = new Date().toISOString().slice(0, 10);

  let nextViewStart: string | null =
    dto.view_start_date !== undefined
      ? dto.view_start_date
      : (existing.view_start_date as string | null) ?? null;
  let nextViewEnd: string | null =
    dto.view_end_date !== undefined
      ? dto.view_end_date
      : (existing.view_end_date as string | null) ?? null;

  if (prevStatus !== "Смотрю" && nextStatus === "Смотрю" && !nextViewStart) {
    nextViewStart = nowIso;
  }

  if (prevStatus !== "Просмотрено" && nextStatus === "Просмотрено") {
    if (!nextViewStart) {
      nextViewStart = nowIso;
    }
    if (!nextViewEnd) {
      nextViewEnd = nowIso;
    }
  }

  const coverPath =
    dto.coverFile != null
      ? `/covers/${dto.category}/${dto.coverFile.filename}`
      : dto.cover_path ?? existing.cover_path;

  await db.run(
    `UPDATE content SET 
        title = ?, 
        original_title = ?,
        cover_path = ?, 
        status = ?, 
        rating = ?, 
        episodes_total = ?, 
        episodes_watched = ?, 
        season = ?, 
        genres = ?, 
        studio = ?, 
        release_date = ?,
        duration_text = ?,
        view_start_date = ?,
        view_end_date = ?
      WHERE id = ?`,
    [
      merged.title,
      merged.original_title,
      coverPath,
      nextStatus,
      merged.rating,
      merged.episodes_total,
      merged.episodes_watched,
      merged.season,
      merged.genres,
      merged.studio,
      merged.release_date,
      merged.duration_text,
      nextViewStart,
      nextViewEnd,
      dto.id
    ]
  );

  const fresh = await db.get(
    "SELECT * FROM content WHERE id = ?",
    dto.id
  );

  return fresh;
}

export async function deleteContent(
  category: ContentCategory,
  id: number
): Promise<boolean> {
  const db = await getDatabase(category);

  const existing = await db.get(
    "SELECT id FROM content WHERE id = ?",
    id
  );
  if (!existing) {
    return false;
  }

  await db.run("DELETE FROM content WHERE id = ?", id);
  return true;
}

