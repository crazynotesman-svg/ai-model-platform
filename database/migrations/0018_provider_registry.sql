-- ============================================================================
-- Migration 0018：Provider Registry（Phase 12.1 Part B）
--
-- providers 扩展：slug / country / official_url / documentation_url / model_page_url /
-- trust_level / updated_at（与 data_sources 解耦：provider ≠ data source）。
-- SQLite ALTER TABLE ADD COLUMN（迁移由 wrangler 记录，只执行一次）。
-- ============================================================================

ALTER TABLE providers ADD COLUMN slug TEXT;
ALTER TABLE providers ADD COLUMN country TEXT;
ALTER TABLE providers ADD COLUMN official_url TEXT;
ALTER TABLE providers ADD COLUMN documentation_url TEXT;
ALTER TABLE providers ADD COLUMN model_page_url TEXT;
ALTER TABLE providers ADD COLUMN trust_level INTEGER DEFAULT 100;
ALTER TABLE providers ADD COLUMN updated_at TEXT;
