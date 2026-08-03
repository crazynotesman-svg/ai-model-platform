-- ============================================================================
-- Migration 0001：初始表结构（providers / models / model_translations / pricing / news）
-- 应用方式：wrangler d1 migrations apply ai-model-platform-db [--local|--remote]
-- 注意：迁移文件使用标准 DDL（不带 IF NOT EXISTS），由 wrangler 迁移记录保证只执行一次。
-- ============================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE providers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,
  website    TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE models (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  slug           TEXT NOT NULL UNIQUE,
  provider       INTEGER NOT NULL REFERENCES providers(id),
  model_type     TEXT NOT NULL,
  context_window INTEGER,
  release_date   TEXT,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE model_translations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id    INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  language    TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  use_cases   TEXT,
  UNIQUE (model_id, language)
);

CREATE TABLE pricing (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id     INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  input_price  REAL NOT NULL,
  output_price REAL NOT NULL,
  currency     TEXT NOT NULL DEFAULT 'USD',
  unit         TEXT NOT NULL DEFAULT 'per_1M_tokens',
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (model_id, currency, unit)
);

CREATE TABLE news (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL,
  content      TEXT,
  language     TEXT NOT NULL DEFAULT 'en',
  source       TEXT,
  published_at TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_models_provider ON models(provider);
CREATE INDEX idx_model_translations_model ON model_translations(model_id);
CREATE INDEX idx_pricing_model ON pricing(model_id);
CREATE INDEX idx_news_language_published ON news(language, published_at DESC);
