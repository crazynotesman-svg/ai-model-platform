-- ============================================================================
-- Migration 0008：Pricing 数据源透明增强（Phase 9.7）
--
-- 为 pricing_history 增加数据来源/可信度字段：
--   * source_url           价格来源链接（官方定价页等；initial_import 为 NULL）
--   * verification_status  可信度状态：verified / unverified / deprecated（默认 unverified）
--
-- 兼容性：仅加列，已有行默认 NULL / 'unverified'。
-- ============================================================================

ALTER TABLE pricing_history ADD COLUMN source_url TEXT;
ALTER TABLE pricing_history ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'unverified';
