-- ============================================================================
-- Migration 0014：Model Relationships（Phase 11.8 Knowledge Graph）
--
-- 模型间关系：similar_to / competitor_of / successor_of / alternative_to / cheaper_than / better_for
-- 每个关系必须含：source（来源可追踪）+ confidence + reason（可解释）+ verified_at。
-- UNIQUE(source_model_id, target_model_id, relationship_type)；FK models.id ON DELETE CASCADE。
-- 幂等：CREATE TABLE IF NOT EXISTS。
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_relationships (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  source_model_id   INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  target_model_id   INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,              -- similar_to / competitor_of / successor_of / alternative_to / cheaper_than / better_for
  confidence        INTEGER NOT NULL DEFAULT 50, -- 0-100（关系可信度，<50 禁止展示）
  reason            TEXT,                        -- 可解释理由（数据驱动）
  source_id         INTEGER REFERENCES data_sources(id),
  verified_at       TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (source_model_id, target_model_id, relationship_type)
);
CREATE INDEX IF NOT EXISTS idx_relationships_source ON model_relationships(source_model_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON model_relationships(target_model_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON model_relationships(relationship_type);
