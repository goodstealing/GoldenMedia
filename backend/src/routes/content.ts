import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { getDatabase, ContentCategory } from "../db/connection";

const router = Router();

// Корень для обложек: GoldenMedia/backend/src/data/covers/:category
const backendSrcRoot = __dirname;
const coversRoot = path.join(backendSrcRoot, "data", "covers");

function ensureCategoryCoverDir(category: ContentCategory): string {
  const dir = path.join(coversRoot, category);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04FF]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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
      original_title && original_title.trim()
        ? original_title.trim()
        : title && title.trim()
        ? title.trim()
        : file.originalname;
    const safeBase = sanitizeFilename(baseSource || "cover");
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${safeBase}${ext}`);
  }
});

const upload = multer({ storage });

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
      sortBy,
      sortDir
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
      conditions.push(
        "(LOWER(title) LIKE ? OR LOWER(IFNULL(original_title, '')) LIKE ?)"
      );
      const t = `%${String(title).toLowerCase()}%`;
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
        // Сортировка по году + времени года, если строка формата "Лето 2014"
        orderBy = `ORDER BY 
          CAST(substr(season, instr(season, ' ') + 1) AS INTEGER) ${dir},
          season ${dir}`;
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

    const rows = await db.all(
      `SELECT * FROM content ${whereClause} ${orderBy}`,
      params
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load content" });
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
      duration_text
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
        ? status
        : "Запланировано";

    const finalRating =
      typeof rating === "number"
        ? rating
        : rating
        ? Number(rating)
        : null;

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
    const coverPath = file
      ? `/covers/${category}/${file.filename}`
      : null;

    const result = await db.run(
      `INSERT INTO content 
      (title, original_title, cover_path, status, rating, episodes_total, episodes_watched, season, genres, studio, release_date, duration_text)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        duration_text ?? null
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

    const existing = await db.get(
      "SELECT * FROM content WHERE id = ?",
      id
    );

    if (!existing) {
      return res.status(404).json({ error: "Not found" });
    }

    const file = req.file as Express.Multer.File | undefined;

    const updated = {
      ...existing,
      ...req.body,
      cover_path: file
        ? `/covers/${category}/${file.filename}`
        : existing.cover_path
    };

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
        duration_text = ?
      WHERE id = ?`,
      [
        updated.title,
        updated.original_title,
        updated.cover_path,
        updated.status,
        updated.rating,
        updated.episodes_total,
        updated.episodes_watched,
        updated.season,
        updated.genres,
        updated.studio,
        updated.release_date,
        updated.duration_text,
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

