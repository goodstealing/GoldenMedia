import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { getDatabaseRootPath } from "../files/dataPaths";

export type ContentCategory = "anime" | "movies" | "series" | "manga" | "books";

export async function getDatabase(category: ContentCategory): Promise<Database> {
  // База должна лежать в GoldenMedia/backend/src/data/databases
  const dbDir = getDatabaseRootPath();

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, `${category}.db`);

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await ensureSchema(db);

  return db;
}

async function ensureSchema(db: Database): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      cover_path TEXT,
      status TEXT,
      rating INTEGER,
      episodes_total INTEGER,
      episodes_watched INTEGER,
      season TEXT,
      genres TEXT,
      studio TEXT,
      release_date TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_content_title_unique
      ON content(title);
  `);

  const columns = await db.all<{ name: string }[]>(
    "PRAGMA table_info(content)"
  );
  const hasOriginalTitle = columns.some((col) => col.name === "original_title");
  if (!hasOriginalTitle) {
    await db.exec("ALTER TABLE content ADD COLUMN original_title TEXT;");
  }
  const hasDurationText = columns.some((col) => col.name === "duration_text");
  if (!hasDurationText) {
    await db.exec("ALTER TABLE content ADD COLUMN duration_text TEXT;");
  }
  const hasViewStart = columns.some((col) => col.name === "view_start_date");
  if (!hasViewStart) {
    await db.exec("ALTER TABLE content ADD COLUMN view_start_date TEXT;");
  }
  const hasViewEnd = columns.some((col) => col.name === "view_end_date");
  if (!hasViewEnd) {
    await db.exec("ALTER TABLE content ADD COLUMN view_end_date TEXT;");
  }
  const hasDescription = columns.some((col) => col.name === "description");
  if (!hasDescription) {
    await db.exec("ALTER TABLE content ADD COLUMN description TEXT;");
  }

  const hasBookFilePath = columns.some((col) => col.name === "book_file_path");
  if (!hasBookFilePath) {
    await db.exec("ALTER TABLE content ADD COLUMN book_file_path TEXT;");
  }
  const hasBookFileFormat = columns.some((col) => col.name === "book_file_format");
  if (!hasBookFileFormat) {
    await db.exec("ALTER TABLE content ADD COLUMN book_file_format TEXT;");
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS reading_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER NOT NULL,
      current_page INTEGER NOT NULL DEFAULT 1,
      total_pages INTEGER NOT NULL DEFAULT 1,
      location TEXT,
      progress_percent REAL NOT NULL DEFAULT 0,
      font_size INTEGER NOT NULL DEFAULT 18,
      theme TEXT NOT NULL DEFAULT 'dark',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(content_id),
      FOREIGN KEY(content_id) REFERENCES content(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reading_bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER NOT NULL,
      page INTEGER NOT NULL,
      location TEXT,
      label TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(content_id) REFERENCES content(id) ON DELETE CASCADE
    );
  `);
}

