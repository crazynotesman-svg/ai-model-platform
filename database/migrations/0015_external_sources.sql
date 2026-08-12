-- ============================================================================
-- Migration 0015：External Sources 扩展（Phase 11.9 Data Authority）
--
-- data_sources 增加：category（official_docs/pricing/benchmark/leaderboard/research_paper/community）、
-- update_frequency（daily/weekly/monthly）、api_available（0/1）、license_type（open/restricted/unknown）。
-- SQLite ALTER TABLE ADD COLUMN（迁移由 wrangler 记录，只执行一次）。
-- ============================================================================

ALTER TABLE data_sources ADD COLUMN category TEXT DEFAULT 'community';
ALTER TABLE data_sources ADD COLUMN update_frequency TEXT DEFAULT 'monthly';
ALTER TABLE data_sources ADD COLUMN api_available INTEGER DEFAULT 0;
ALTER TABLE data_sources ADD COLUMN license_type TEXT DEFAULT 'unknown';
