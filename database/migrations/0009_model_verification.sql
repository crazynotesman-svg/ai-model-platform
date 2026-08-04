-- ============================================================================
-- Migration 0009：模型数据验证状态（Phase 9.7）
--
-- models 增加：
--   * last_verified_at  最近一次人工核验时间（YYYY-MM-DD；未核验为 NULL）
--   * data_status       数据状态：active / deprecated / retired（默认 active）
--
-- 兼容性：仅加列，已有行默认 NULL / 'active'。
-- ============================================================================

ALTER TABLE models ADD COLUMN last_verified_at TEXT;
ALTER TABLE models ADD COLUMN data_status TEXT NOT NULL DEFAULT 'active';
