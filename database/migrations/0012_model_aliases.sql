-- ============================================================================
-- Migration 0012：Model Aliases（Phase 11.7 Model Identity Resolution）
--
-- 同一模型的多种名称映射（API 名 / 展示名 / benchmark 名 / 第三方名）：
--   GPT-4o / gpt-4o / gpt-4o-2024-05-13 / OpenAI GPT-4o API → 同一 model_id
-- UNIQUE(model_id, alias)；别名带 provider/source/confidence（可追踪）。
-- 幂等：CREATE TABLE IF NOT EXISTS。
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_aliases (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id    INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  alias       TEXT NOT NULL,               -- 别名（规范化：小写、去空格）
  provider    TEXT,                        -- 别名所属厂商（如 'OpenAI'）
  source      TEXT,                        -- 别名来源（如 'openai-api' / 'benchmark-lmsys' / 'community'）
  confidence  INTEGER NOT NULL DEFAULT 50, -- 0-100
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (model_id, alias)
);
CREATE INDEX IF NOT EXISTS idx_model_aliases_alias ON model_aliases(alias);
CREATE INDEX IF NOT EXISTS idx_model_aliases_model ON model_aliases(model_id);
