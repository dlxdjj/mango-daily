import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

let db: Database.Database;

export function initDb(dbPath: string) {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id              TEXT PRIMARY KEY,
      nickname        TEXT NOT NULL,
      profile_url     TEXT UNIQUE NOT NULL,
      account_type    TEXT DEFAULT 'middle',
      tags            TEXT DEFAULT '[]',
      follower_count  INTEGER DEFAULT 0,
      following_count INTEGER DEFAULT 0,
      total_likes_collects INTEGER DEFAULT 0,
      bio             TEXT,
      enabled         INTEGER DEFAULT 1,
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id              TEXT PRIMARY KEY,
      account_id      TEXT REFERENCES accounts(id) ON DELETE SET NULL,
      note_url        TEXT UNIQUE NOT NULL,
      title           TEXT,
      author_name     TEXT,
      author_url      TEXT,
      cover_text      TEXT,
      body_summary    TEXT,
      note_type       TEXT DEFAULT 'unknown',
      publish_time    TEXT,
      like_count      INTEGER DEFAULT 0,
      collect_count   INTEGER DEFAULT 0,
      comment_count   INTEGER DEFAULT 0,
      image_style_tags TEXT DEFAULT '[]',
      topic_tags      TEXT DEFAULT '[]',
      source          TEXT DEFAULT 'extension',
      extension_version TEXT,
      captured_at     TEXT DEFAULT (datetime('now')),
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS note_snapshots (
      id            TEXT PRIMARY KEY,
      note_id       TEXT REFERENCES notes(id) ON DELETE CASCADE,
      like_count    INTEGER DEFAULT 0,
      collect_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      captured_at   TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS note_comments (
      id          TEXT PRIMARY KEY,
      note_id     TEXT REFERENCES notes(id) ON DELETE CASCADE,
      content     TEXT NOT NULL,
      like_count  INTEGER DEFAULT 0,
      captured_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mango_references (
      id          TEXT PRIMARY KEY,
      file_path   TEXT NOT NULL,
      is_primary  INTEGER DEFAULT 0,
      description TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id                   TEXT PRIMARY KEY,
      date                 TEXT DEFAULT (date('now')),
      recommended_column   TEXT,
      topic                TEXT,
      content_goal         TEXT,
      titles               TEXT DEFAULT '[]',
      cover_texts          TEXT DEFAULT '[]',
      body                 TEXT,
      comment_guide        TEXT,
      hashtags             TEXT DEFAULT '[]',
      image_scene          TEXT,
      image_prompt         TEXT,
      generated_image_url  TEXT,
      reference_id         TEXT REFERENCES mango_references(id) ON DELETE SET NULL,
      posting_time         TEXT,
      why_this_works       TEXT,
      source_analysis      TEXT,
      llm_provider         TEXT,
      image_provider       TEXT,
      image_error          TEXT,
      created_at           TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS publish_results (
      id                  TEXT PRIMARY KEY,
      recommendation_id   TEXT REFERENCES recommendations(id) ON DELETE SET NULL,
      published           INTEGER DEFAULT 0,
      published_url       TEXT,
      actual_like_count   INTEGER DEFAULT 0,
      actual_collect_count INTEGER DEFAULT 0,
      actual_comment_count INTEGER DEFAULT 0,
      marked_as_success   INTEGER DEFAULT 0,
      notes               TEXT,
      created_at          TEXT DEFAULT (datetime('now')),
      updated_at          TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_notes_captured_at ON notes(captured_at);
    CREATE INDEX IF NOT EXISTS idx_notes_account ON notes(account_id);
    CREATE INDEX IF NOT EXISTS idx_references_primary ON mango_references(is_primary);
    CREATE INDEX IF NOT EXISTS idx_recommendations_date ON recommendations(date);
  `);

  addColumnIfMissing('recommendations', 'image_scene', 'TEXT');
  addColumnIfMissing('recommendations', 'image_prompt', 'TEXT');
  addColumnIfMissing('recommendations', 'generated_image_url', 'TEXT');
  addColumnIfMissing('recommendations', 'reference_id', 'TEXT');
  addColumnIfMissing('recommendations', 'image_provider', 'TEXT');
  addColumnIfMissing('recommendations', 'image_error', 'TEXT');

  console.log('[db] SQLite initialized at', path.resolve(dbPath));
  return db;
}

function addColumnIfMissing(table: string, column: string, type: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some(c => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb first.');
  return db;
}

export function uuid() {
  return randomUUID();
}
