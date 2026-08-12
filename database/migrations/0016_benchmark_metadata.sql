-- ============================================================================
-- Migration 0016：Benchmark Metadata（Phase 11.9 Benchmark Trust v4）
--
-- benchmark_results 增加：dataset_version / evaluation_method / paper_url / trust_score。
-- （dataset/version/source/tested_at 在 0005；source_url/verified_at/verification_status 在 0007；
--   source_id/official_score/confidence 在 0010。）
-- 规则：缺少 dataset/version/source 的数据禁止进入 production（connector 层强制）。
-- SQLite ALTER TABLE ADD COLUMN（迁移由 wrangler 记录，只执行一次）。
-- ============================================================================

ALTER TABLE benchmark_results ADD COLUMN dataset_version TEXT;
ALTER TABLE benchmark_results ADD COLUMN evaluation_method TEXT;
ALTER TABLE benchmark_results ADD COLUMN paper_url TEXT;
ALTER TABLE benchmark_results ADD COLUMN trust_score INTEGER DEFAULT 0;
