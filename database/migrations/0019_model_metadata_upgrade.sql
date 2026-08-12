-- ============================================================================
-- Migration 0019：Model Metadata Upgrade（Phase 12.1 Part D）
--
-- models 增加：official_url / documentation_url / model_family / version / status /
-- is_latest / replacement_model_id。
-- （release_date 在 0001；last_verified_at 在 0009。）
-- 支持：旧模型 → replacement（GPT-4 → GPT-5.x）。
-- SQLite ALTER TABLE ADD COLUMN（迁移由 wrangler 记录，只执行一次）。
-- ============================================================================

ALTER TABLE models ADD COLUMN official_url TEXT;
ALTER TABLE models ADD COLUMN documentation_url TEXT;
ALTER TABLE models ADD COLUMN model_family TEXT;
ALTER TABLE models ADD COLUMN version TEXT;
ALTER TABLE models ADD COLUMN status TEXT DEFAULT 'active';       -- active / deprecated / preview
ALTER TABLE models ADD COLUMN is_latest INTEGER DEFAULT 0;
ALTER TABLE models ADD COLUMN replacement_model_id INTEGER REFERENCES models(id);
CREATE INDEX IF NOT EXISTS idx_models_family ON models(model_family);
CREATE INDEX IF NOT EXISTS idx_models_status ON models(status);
CREATE INDEX IF NOT EXISTS idx_models_latest ON models(is_latest);
