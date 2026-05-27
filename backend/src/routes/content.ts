import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { getDatabase, ContentCategory } from "../db/connection";

const router = Router();

type ShikimoriStatus =
  | "completed"
  | "watching"
  | "planned"
  | "dropped"
  | "on_hold"
  | string;

type ShikimoriAnimeEntry = {
  target_title: string;
  target_title_ru: string;
  target_type: string;
  score: number;
  status: ShikimoriStatus;
  episodes: number;
};

function mapShikimoriStatus(status: ShikimoriStatus): string {
  switch (status) {
    case "completed":
      return "Просмотрено";
    case "watching":
      return "Смотрю";
    case "planned":
      return "Запланировано";
    case "dropped":
      return "Брошено";
    case "on_hold":
      return "Отложено";
    default:
      return "Запланировано";
  }
}

// Корень для обложек: GoldenMedia/backend/src/data/covers/:category
const coversRoot = path.join(__dirname, "..", "data", "covers");

function ensureCategoryCoverDir(category: ContentCategory): string {
  const dir = path.join(coversRoot, category);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function sanitizeTitleForFilename(raw: string): string {
  // Windows invalid: < > : " / \ | ? *  + control chars + trailing dots/spaces
  // Keep original casing, spaces, кириллицу/латиницу/цифры and a few safe separators.
  const cleaned = raw
    .replace(/[\u0000-\u001F<>:"/\\|?*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "")
    .slice(0, 120)
    .trim();

  return cleaned || "cover";
}

function inferExtension(file: Express.Multer.File): string {
  const ext = path.extname(file.originalname || "").trim();
  if (ext) return ext.toLowerCase();
  // Fallback: very small mapping for common image types
  switch (file.mimetype) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/jpeg":
      return ".jpg";
    default:
      return ".jpg";
  }
}

function ensureUniqueFilename(dir: string, base: string, ext: string): string {
  const safeExt = ext.startsWith(".") ? ext : `.${ext}`;
  const baseClean = sanitizeTitleForFilename(base);
  let candidate = `${baseClean}${safeExt}`;
  if (!fs.existsSync(path.join(dir, candidate))) return candidate;

  for (let i = 2; i < 10_000; i += 1) {
    candidate = `${baseClean} (${i})${safeExt}`;
    if (!fs.existsSync(path.join(dir, candidate))) return candidate;
  }
  // Extremely unlikely, but still provide something deterministic
  return `${baseClean} (${Date.now()})${safeExt}`;
}

function getLocalCoverFsPath(
  category: ContentCategory,
  coverPath: unknown
): string | null {
  if (typeof coverPath !== "string") return null;
  const prefix = `/covers/${category}/`;
  if (!coverPath.startsWith(prefix)) return null;
  const filename = coverPath.slice(prefix.length);
  if (!filename) return null;
  return path.join(coversRoot, category, filename);
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const category = req.params
      .category as ContentCategory | undefined;
    const safeCategory: ContentCategory =
      category && ["anime", "movies", "series", "manga", "books"].includes(category)
        ? (category as ContentCategory)
        : "anime";
    const dir = ensureCategoryCoverDir(safeCategory);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const { title, original_title } = req.body as {
      title?: string;
      original_title?: string;
    };
    const baseSource =
      title && title.trim()
        ? title.trim()
        : original_title && original_title.trim()
        ? original_title.trim()
        : file.originalname;
    const safeCategory = (req.params.category as ContentCategory) ?? "anime";
    const dir = ensureCategoryCoverDir(
      ["anime", "movies", "series", "manga", "books"].includes(safeCategory)
        ? safeCategory
        : "anime"
    );
    const ext = inferExtension(file);
    const filename = ensureUniqueFilename(dir, baseSource || "cover", ext);
    cb(null, filename);
  }
});

const upload = multer({ storage });

// Получить один элемент по id
router.get("/:category/:id", async (req, res) => {
  try {
    const category = req.params.category as ContentCategory;
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const db = await getDatabase(category);
    const row = await db.get("SELECT * FROM content WHERE id = ?", id);

    if (!row) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(row);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load content item" });
  }
});

// Получить список контента с поддержкой фильтров и сортировки
router.get("/:category", async (req, res) => {
  try {
    const category = req.params.category as ContentCategory;
    const db = await getDatabase(category);

    const {
      status, // один или несколько статусов через запятую
      title, // поиск по названию
      genres, // жанры через запятую
      season, // Зима/Весна/Лето/Осень или "Все"
      year, // год выхода
      studio, // поиск по студии / режиссёру
      sortBy,
      sortDir,
      page,
      pageSize
    } = req.query;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (status) {
      const statuses = String(status)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (statuses.length > 0) {
        conditions.push(
          `status IN (${statuses.map(() => "?").join(",")})`
        );
        params.push(...statuses);
      }
    }

    if (title) {
      conditions.push("(title LIKE ? OR IFNULL(original_title, '') LIKE ?)");
      const t = `%${String(title)}%`;
      params.push(t, t);
    }

    if (genres) {
      const requiredGenres = String(genres)
        .split(",")
        .map((g) => g.trim().toLowerCase())
        .filter(Boolean);
      for (const g of requiredGenres) {
        conditions.push("LOWER(genres) LIKE ?");
        params.push(`%${g}%`);
      }
    }

    if (season && String(season) !== "Все") {
      conditions.push("season LIKE ?");
      params.push(`${String(season)}%`);
    }

    if (year) {
      conditions.push("substr(release_date, 1, 4) = ?");
      params.push(String(year));
    }

    if (studio) {
      conditions.push("studio LIKE ?");
      params.push(`%${String(studio)}%`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    let orderBy = "";
    const dir = String(sortDir || "asc").toUpperCase() === "DESC" ? "DESC" : "ASC";

    switch (sortBy) {
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
          // Сортировка по году + времени года, если строка формата "Лето 2014"
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

    // Пагинация: по умолчанию возвращаем все записи, но если переданы page/pageSize —
    // отдаем объект с total и текущей страницей.
    const pageNumber =
      typeof page === "string" && Number(page) > 0 ? Number(page) : 1;
    const pageSizeNumberRaw =
      typeof pageSize === "string" && Number(pageSize) > 0
        ? Number(pageSize)
        : undefined;
    const pageSizeNumber = pageSizeNumberRaw ?? 50;
    const safePageSize = Math.min(Math.max(pageSizeNumber, 1), 500);

    // Считаем общее количество для пагинации
    const totalRow = await db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM content ${whereClause}`,
      params
    );
    const total = totalRow?.count ?? 0;

    const offset = (pageNumber - 1) * safePageSize;

    const rows = await db.all(
      `SELECT * FROM content ${whereClause} ${orderBy} LIMIT ? OFFSET ?`,
      [...params, safePageSize, offset]
    );

    res.json({
      items: rows,
      total,
      page: pageNumber,
      pageSize: safePageSize
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load content" });
  }
});

// Импорт аниме из JSON-экспорта Shikimori
router.post("/import/shikimori/anime", async (req, res) => {
  try {
    const payload = req.body;

    if (!Array.isArray(payload)) {
      return res.status(400).json({ error: "Body must be an array" });
    }

    const entries = payload as ShikimoriAnimeEntry[];
    const db = await getDatabase("anime");

    let imported = 0;
    let skipped = 0;

    for (const entry of entries) {
      if (!entry || entry.target_type !== "Anime") {
        skipped += 1;
        continue;
      }

      const ruTitle = (entry.target_title_ru || entry.target_title).trim();
      const originalTitle = (entry.target_title || ruTitle).trim();

      if (!ruTitle) {
        skipped += 1;
        continue;
      }

      const normalizedStatus = mapShikimoriStatus(entry.status);
      const rating =
        typeof entry.score === "number" && entry.score > 0
          ? entry.score
          : null;

      const episodesField =
        typeof entry.episodes === "number" && entry.episodes > 0
          ? entry.episodes
          : null;

      const episodesWatched = episodesField;
      const episodesTotal = episodesField;

      const existing = await db.get(
        "SELECT id FROM content WHERE title = ?",
        ruTitle
      );
      if (existing) {
        skipped += 1;
        continue;
      }

      await db.run(
        `INSERT INTO content 
        (title, original_title, cover_path, status, rating, episodes_total, episodes_watched, season, genres, studio, release_date, duration_text)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ruTitle,
          originalTitle,
          null,
          normalizedStatus,
          rating,
          episodesTotal,
          episodesWatched,
          null,
          null,
          null,
          null,
          null
        ]
      );

      imported += 1;
    }

    res.status(201).json({ imported, skipped, total: entries.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to import from Shikimori" });
  }
});

// Добавить новый элемент (поддерживает JSON и multipart/form-data с файлом cover)
router.post("/:category", upload.single("cover"), async (req, res) => {
  try {
    const category = req.params.category as ContentCategory;
    const db = await getDatabase(category);

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
      view_end_date,
      description
    } = req.body as {
      title?: string;
      original_title?: string;
      status?: string;
      rating?: string | number;
      episodes_total?: string | number;
      episodes_watched?: string | number;
      season?: string;
      genres?: string;
      studio?: string;
      release_date?: string;
      duration_text?: string;
      cover_path?: string;
      view_start_date?: string;
      view_end_date?: string;
      description?: string;
    };

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const normalizedTitle = title.trim();

    const existing = await db.get(
      "SELECT id FROM content WHERE title = ?",
      normalizedTitle
    );
    if (existing) {
      return res
        .status(400)
        .json({ error: "Запись с таким названием уже существует" });
    }

    const finalStatus =
      typeof status === "string" && status.trim()
        ? status.trim()
        : "Запланировано";

    let finalRating: number | null;
    if (typeof rating === "number") {
      finalRating = rating;
    } else if (typeof rating === "string" && rating.trim() !== "") {
      finalRating = Number(rating);
    } else {
      finalRating = null;
    }

    const finalEpisodesTotal =
      typeof episodes_total === "number"
        ? episodes_total
        : episodes_total
        ? Number(episodes_total)
        : 12;

    const finalEpisodesWatched =
      typeof episodes_watched === "number"
        ? episodes_watched
        : episodes_watched
        ? Number(episodes_watched)
        : 0;

    const file = req.file as Express.Multer.File | undefined;
    const coverPath =
      file != null
        ? `/covers/${category}/${file.filename}`
        : cover_path && typeof cover_path === "string" && cover_path.trim()
        ? cover_path.trim()
        : null;

    const nowIso = new Date().toISOString().slice(0, 10);

    let finalViewStart: string | null =
      typeof view_start_date === "string" && view_start_date.trim()
        ? view_start_date.trim()
        : null;
    let finalViewEnd: string | null =
      typeof view_end_date === "string" && view_end_date.trim()
        ? view_end_date.trim()
        : null;

    if (finalStatus === "Смотрю" && !finalViewStart) {
      finalViewStart = nowIso;
    }
    if (finalStatus === "Просмотрено") {
      if (!finalViewStart) {
        finalViewStart = nowIso;
      }
      if (!finalViewEnd) {
        finalViewEnd = nowIso;
      }
    }

    const finalDescription =
      typeof description === "string" && description.trim()
        ? description.trim()
        : null;

    const result = await db.run(
      `INSERT INTO content 
      (title, original_title, cover_path, status, rating, episodes_total, episodes_watched, season, genres, studio, release_date, duration_text, view_start_date, view_end_date, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        normalizedTitle,
        original_title ?? null,
        coverPath,
        finalStatus,
        finalRating,
        finalEpisodesTotal,
        finalEpisodesWatched,
        season ?? null,
        genres ?? null,
        studio ?? null,
        release_date ?? null,
        duration_text ?? null,
        finalViewStart,
        finalViewEnd,
        finalDescription
      ]
    );

    const created = await db.get(
      "SELECT * FROM content WHERE id = ?",
      result.lastID
    );

    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create content" });
  }
});

// Обновить элемент (поддерживает JSON и multipart/form-data с файлом cover)
router.put(
  "/:category/:id",
  upload.single("cover"),
  async (req, res) => {
  try {
    const category = req.params.category as ContentCategory;
    const id = Number(req.params.id);
    const db = await getDatabase(category);

    const existing = await db.get("SELECT * FROM content WHERE id = ?", id);

    if (!existing) {
      return res.status(404).json({ error: "Not found" });
    }

    const file = req.file as Express.Multer.File | undefined;
    const body = req.body as {
      cover_path?: string;
      status?: string;
      view_start_date?: string;
      view_end_date?: string;
    } & Record<string, unknown>;

    const nextCoverPath =
      file != null
        ? `/covers/${category}/${file.filename}`
        : typeof body.cover_path === "string" && body.cover_path.trim()
        ? body.cover_path.trim()
        : existing.cover_path;

    // If user uploaded a new local cover, remove previous local cover file to prevent junk.
    if (file != null) {
      const prevFsPath = getLocalCoverFsPath(category, existing.cover_path);
      const nextFsPath = getLocalCoverFsPath(category, nextCoverPath);
      if (prevFsPath && nextFsPath && prevFsPath !== nextFsPath) {
        try {
          if (fs.existsSync(prevFsPath)) fs.unlinkSync(prevFsPath);
        } catch (e) {
          // Non-fatal: keep request successful even if old file couldn't be deleted
          console.warn("Failed to delete previous cover file", e);
        }
      }
    }

    const updated = {
      ...existing,
      ...body,
      cover_path: nextCoverPath
    };

    const prevStatus: string | null =
      typeof existing.status === "string" ? existing.status : null;
    const nextStatusRaw =
      typeof body.status === "string" && body.status.trim()
        ? body.status.trim()
        : prevStatus;

    const nextStatus = nextStatusRaw ?? null;

    const nowIso = new Date().toISOString().slice(0, 10);

    let nextViewStart: string | null =
      typeof body.view_start_date === "string" && body.view_start_date.trim()
        ? body.view_start_date.trim()
        : (existing.view_start_date as string | null) ?? null;
    let nextViewEnd: string | null =
      typeof body.view_end_date === "string" && body.view_end_date.trim()
        ? body.view_end_date.trim()
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

    const nextDescription =
      typeof body.description === "string"
        ? body.description.trim() || null
        : (existing.description as string | null) ?? null;

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
        view_end_date = ?,
        description = ?
      WHERE id = ?`,
      [
        updated.title,
        updated.original_title,
        updated.cover_path,
        nextStatus,
        updated.rating,
        updated.episodes_total,
        updated.episodes_watched,
        updated.season,
        updated.genres,
        updated.studio,
        updated.release_date,
        updated.duration_text,
        nextViewStart,
        nextViewEnd,
        nextDescription,
        id
      ]
    );

    const fresh = await db.get(
      "SELECT * FROM content WHERE id = ?",
      id
    );

    res.json(fresh);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update content" });
  }
});

// Удалить элемент
router.delete("/:category/:id", async (req, res) => {
  try {
    const category = req.params.category as ContentCategory;
    const id = Number(req.params.id);
    const db = await getDatabase(category);

    const existing = await db.get(
      "SELECT * FROM content WHERE id = ?",
      id
    );

    if (!existing) {
      return res.status(404).json({ error: "Not found" });
    }

    await db.run("DELETE FROM content WHERE id = ?", id);

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete content" });
  }
});

export default router;

