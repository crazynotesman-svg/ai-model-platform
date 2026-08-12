-- ============================================================================
-- Migration 0017：Model Release Events（Phase 11.9 Release Tracking）
--
-- 模型发布/更新/弃用事件（官方 source 可追踪）：
--   "GPT-5.4 released — source: OpenAI official — verified: true"
-- 幂等：CREATE TABLE IF NOT EXISTS。
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_release_events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id     INTEGER REFERENCES models(id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL,                -- release / update / deprecated
  source_id    INTEGER REFERENCES data_sources(id),
  source_url   TEXT,
  published_at TEXT,                         -- 官方发布日期（YYYY-MM-DD）
  verified     INTEGER NOT NULL DEFAULT 0,   -- 0/1（官方核验）
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_release_events_model ON model_release_events(model_id);
CREATE INDEX IF NOT EXISTS idx_release_events_type ON model_release_events(event_type);
