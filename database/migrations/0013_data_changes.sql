-- ============================================================================
-- Migration 0013：Data Changes（Phase 11.7 Data Changelog）
--
-- 每次生产数据变更的记录（before/after JSON + source + confidence + timestamp），
-- 支撑公开 Changelog 页面与审计：
--   "GPT-4o price changed: Before $5 → After $2.5, Source: OpenAI official, Date: ..."
-- 幂等：CREATE TABLE IF NOT EXISTS。
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_changes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,              -- model / pricing / benchmark / capability
  entity_id   TEXT NOT NULL,              -- 模型 slug / 记录标识
  change_type TEXT NOT NULL,              -- price_changed / benchmark_updated / model_updated / capability_updated
  before_json TEXT,                       -- 变更前状态（JSON）
  after_json  TEXT NOT NULL,              -- 变更后状态（JSON）
  source_id   INTEGER REFERENCES data_sources(id),
  confidence  INTEGER NOT NULL DEFAULT 50,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_data_changes_entity ON data_changes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_data_changes_created ON data_changes(created_at);
