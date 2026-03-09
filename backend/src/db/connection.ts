import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

export type ContentCategory = "anime" | "movies" | "series" | "manga" | "books";

export async function getDatabase(category: ContentCategory): Promise<Database> {
  // База должна лежать в GoldenMedia/backend/src/data/databases
  const backendSrcRoot = __dirname;
  const dbDir = path.join(backendSrcRoot, "..", "data", "databases");

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

  const columns = await db.all<{ name: string }>(
    "PRAGMA table_info(content)"
  );
  const hasOriginalTitle = columns.some(
    (col) => col.name === "original_title"
  );
  if (!hasOriginalTitle) {
    await db.exec("ALTER TABLE content ADD COLUMN original_title TEXT;");
  }
  const hasDurationText = columns.some(
    (col) => col.name === "duration_text"
  );
  if (!hasDurationText) {
    await db.exec("ALTER TABLE content ADD COLUMN duration_text TEXT;");
  }
}

