-- ============================================================================
-- Migration 0010：Data Trust 数据可信体系（Phase 11.5A）
--
-- 新增：
--   * data_sources        数据来源注册表（Tier A/B/C/D + trust_level）
--   * data_verifications  实体验证记录（entity_type: model/pricing/benchmark/capability）
-- 升级（补列，兼容旧数据）：
--   * benchmark_results：source_id / official_score / confidence
--   * pricing_history ：source_id / verified_at / confidence
--   * models          ：verified_status / confidence_score
--   * model_capabilities：source_id / confidence / verified_at
--
-- 可信等级（trust_level）：A=100 官方 / B=90 公开权威基准 / C=70 社区 / D=40 人工录入
-- 兼容性：全部 ALTER ADD COLUMN（默认 NULL），不破坏旧数据与 API。
-- ============================================================================

-- 1. data_sources 来源注册表
CREATE TABLE IF NOT EXISTS data_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,                -- official / benchmark / community / manual
  url TEXT,
  description TEXT,
  trust_level INTEGER NOT NULL DEFAULT 40,  -- 100/90/70/40
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. data_verifications 实体验证记录
CREATE TABLE IF NOT EXISTS data_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,         -- model / pricing / benchmark / capability
  entity_id TEXT NOT NULL,           -- 模型 slug / 价格记录 id / benchmark 记录 id / 能力记录 id
  source_id INTEGER REFERENCES data_sources(id),
  verified_at TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified', -- verified / unverified / experimental
  confidence_score INTEGER,          -- 0-100
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_verifications_entity ON data_verifications(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_verifications_source ON data_verifications(source_id);

-- 3. benchmark_results 升级
ALTER TABLE benchmark_results ADD COLUMN source_id INTEGER REFERENCES data_sources(id);
ALTER TABLE benchmark_results ADD COLUMN official_score REAL;
ALTER TABLE benchmark_results ADD COLUMN confidence INTEGER; -- 0-100

-- 4. pricing_history 升级
ALTER TABLE pricing_history ADD COLUMN source_id INTEGER REFERENCES data_sources(id);
ALTER TABLE pricing_history ADD COLUMN verified_at TEXT;
ALTER TABLE pricing_history ADD COLUMN confidence INTEGER; -- 0-100

-- 5. models 升级
ALTER TABLE models ADD COLUMN verified_status TEXT NOT NULL DEFAULT 'unverified'; -- verified / unverified / experimental
ALTER TABLE models ADD COLUMN confidence_score INTEGER; -- 0-100

-- 6. model_capabilities 升级
ALTER TABLE model_capabilities ADD COLUMN source_id INTEGER REFERENCES data_sources(id);
ALTER TABLE model_capabilities ADD COLUMN confidence INTEGER; -- 0-100
ALTER TABLE model_capabilities ADD COLUMN verified_at TEXT;
