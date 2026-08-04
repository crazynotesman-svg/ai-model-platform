-- ============================================================================
-- Migration 0007：Benchmark 数据源透明增强（Phase 9.7）
--
-- 为 benchmark_results 增加数据来源/可信度字段：
--   * source_url           数据来源链接（官方榜单页/论文等；internal-demo 为 NULL）
--   * source_type          数据来源类型：official / community / internal
--   * verified_at          人工核验时间（YYYY-MM-DD）
--   * verification_status  可信度状态：verified / unverified / deprecated（默认 unverified）
--
-- 兼容性：ALTER TABLE 仅加列，已有行默认 NULL / 'unverified'，不破坏旧数据与 API。
-- ============================================================================

ALTER TABLE benchmark_results ADD COLUMN source_url TEXT;
ALTER TABLE benchmark_results ADD COLUMN source_type TEXT;
ALTER TABLE benchmark_results ADD COLUMN verified_at TEXT;
ALTER TABLE benchmark_results ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'unverified';
