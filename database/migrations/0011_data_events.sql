-- ============================================================================
-- Migration 0011：Data Events（Phase 11.6 AI Data Intelligence Pipeline）
--
-- data_events：数据变更事件队列（connector 发现 → pending → 审核 approve → 应用）
-- 事件类型：MODEL_CREATED / MODEL_UPDATED / PRICE_CHANGED / BENCHMARK_UPDATED / MODEL_DEPRECATED
-- 状态：pending / processed / failed
--
-- 安全设计：connector 只生成 pending 事件，未经 approve 不写业务表（禁止自动发布未验证数据）。
-- 幂等：CREATE TABLE IF NOT EXISTS。
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type   TEXT NOT NULL,                -- MODEL_CREATED / MODEL_UPDATED / PRICE_CHANGED / BENCHMARK_UPDATED / MODEL_DEPRECATED
  entity_type  TEXT NOT NULL,                -- model / pricing / benchmark
  entity_id    TEXT NOT NULL,                -- 模型 slug / 价格记录标识 / benchmark 记录标识
  payload      TEXT NOT NULL DEFAULT '{}',   -- JSON：变更内容（价格/上下文/分数等）
  source_id    INTEGER REFERENCES data_sources(id),
  confidence   INTEGER NOT NULL DEFAULT 50,  -- 0-100（来源可信度）
  status       TEXT NOT NULL DEFAULT 'pending', -- pending / processed / failed
  error        TEXT,                         -- 处理失败信息（failed 时）
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_data_events_type ON data_events(event_type);
CREATE INDEX IF NOT EXISTS idx_data_events_status ON data_events(status);
CREATE INDEX IF NOT EXISTS idx_data_events_created ON data_events(created_at);
