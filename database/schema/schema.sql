-- ============================================================================
-- AI Model Intelligence Platform — Cloudflare D1 (SQLite) 最新全量 Schema
-- 状态：Phase 3 落地。本文件为"当前最新 schema"（幂等，可重复执行）。
-- 历史变更请通过 database/migrations/ 迁移文件演进。
--
-- 设计说明：
--   * 主键：INTEGER AUTOINCREMENT（v1 简单可靠，便于 seed 与演示；后续如需
--     分布式安全 ID 可迁移至 ULID，见 docs/database-design.md）
--   * 时间戳：ISO 8601 UTC（默认 strftime('%Y-%m-%dT%H:%M:%fZ','now')）
--   * 外键：启用 PRAGMA foreign_keys；models.provider → providers.id
--   * 灵活字段（use_cases）以 JSON 数组字符串存储，便于扩展
-- ============================================================================

-- 启用外键约束（wrangler d1 execute / migrations apply 均生效）
PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- providers：AI 模型供应商
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS providers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,               -- 供应商名（如 OpenAI）
  website    TEXT,                               -- 官网地址
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ---------------------------------------------------------------------------
-- models：模型目录
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS models (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  slug           TEXT NOT NULL UNIQUE,           -- 全局唯一标识，如 openai/gpt-4o
  provider       INTEGER NOT NULL REFERENCES providers(id), -- 所属供应商
  model_type     TEXT NOT NULL,                  -- chat / reasoning / embedding ...
  context_window INTEGER,                        -- 上下文窗口（tokens）
  release_date   TEXT,                           -- 发布日期（YYYY-MM-DD）
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ---------------------------------------------------------------------------
-- model_translations：模型多语言本地化（name/description/use_cases 随语言变化）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS model_translations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id    INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  language    TEXT NOT NULL,                     -- en / zh-CN / ja / ko / es / de / fr
  name        TEXT NOT NULL,                     -- 展示名（本地化）
  description TEXT,                              -- 本地化描述
  use_cases   TEXT,                              -- JSON 数组字符串，如 ["翻译","客服"]
  UNIQUE (model_id, language)                    -- 每个模型每语言仅一条
);

-- ---------------------------------------------------------------------------
-- pricing：模型定价（每 unit 的输入/输出价格）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id     INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  input_price  REAL NOT NULL,                    -- 输入单价（每 unit）
  output_price REAL NOT NULL,                    -- 输出单价（每 unit）
  currency     TEXT NOT NULL DEFAULT 'USD',      -- 货币
  unit         TEXT NOT NULL DEFAULT 'per_1M_tokens', -- 计费单位
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (model_id, currency, unit)              -- 同模型同币种同单位仅一条
);

-- ---------------------------------------------------------------------------
-- news：AI 行业资讯（聚合 5 大来源：OpenAI/Anthropic/Google AI/Meta AI/HuggingFace）
-- 原则：不复制全文，仅保存标题/摘要/来源链接/发布时间/分类
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS news (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL,
  content      TEXT,                             -- 摘要（collector 截断，非全文）
  language     TEXT NOT NULL DEFAULT 'en',       -- 资讯语言
  source       TEXT,                             -- 来源（媒体/机构名）
  link         TEXT,                             -- 原文链接
  category     TEXT NOT NULL DEFAULT 'general',  -- 分类：model-release/product/research/open-source/business/general
  published_at TEXT,                             -- 发布时间（YYYY-MM-DD 或 ISO）
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ---------------------------------------------------------------------------
-- model_capabilities：模型能力（vision/reasoning/coding/audio/function_calling/multimodal/long_context ...）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS model_capabilities (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id    INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  capability  TEXT NOT NULL,                     -- vision / reasoning / coding / audio / function_calling / multimodal / long_context ...
  supported   INTEGER NOT NULL DEFAULT 1,        -- 1=支持 0=不支持
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (model_id, capability)
);

-- ---------------------------------------------------------------------------
-- pricing_history：模型价格历史（每次价格变更追加一条，不修改历史）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_history (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id       INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  input_price    REAL NOT NULL,
  output_price   REAL NOT NULL,
  currency       TEXT NOT NULL DEFAULT 'USD',
  unit           TEXT NOT NULL DEFAULT 'per_1M_tokens',
  effective_date TEXT NOT NULL,                  -- 生效日期（YYYY-MM-DD）
  source         TEXT NOT NULL DEFAULT 'manual', -- initial_import / manual / api ...
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (model_id, effective_date, currency, unit)
);

-- ---------------------------------------------------------------------------
-- 索引（查询热路径）
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_models_provider ON models(provider);
CREATE INDEX IF NOT EXISTS idx_model_translations_model ON model_translations(model_id);
CREATE INDEX IF NOT EXISTS idx_pricing_model ON pricing(model_id);
CREATE INDEX IF NOT EXISTS idx_news_language_published ON news(language, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_capabilities_model ON model_capabilities(model_id);
CREATE INDEX IF NOT EXISTS idx_model_capabilities_capability ON model_capabilities(capability);
CREATE INDEX IF NOT EXISTS idx_pricing_history_model ON pricing_history(model_id);
CREATE INDEX IF NOT EXISTS idx_pricing_history_effective ON pricing_history(effective_date);
