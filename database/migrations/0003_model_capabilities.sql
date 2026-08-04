-- ============================================================================
-- Migration 0003：模型能力表（model_capabilities）
--
-- 设计说明：
--   * 每行 = 某模型是否支持某能力（vision / reasoning / coding / audio /
--     function_calling / multimodal / long_context ...），capability 为自由文本，
--     未来可扩展新能力而不改表结构；
--   * supported：SQLite 布尔以 INTEGER 0/1 表示（1 = 支持）；
--   * 外键 ON DELETE CASCADE：删除模型时自动清理其能力记录；
--   * UNIQUE (model_id, capability)：每模型每能力仅一条，配合 INSERT OR IGNORE
--     实现幂等 seed。
-- ============================================================================

CREATE TABLE model_capabilities (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id    INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  capability  TEXT NOT NULL,                     -- vision / reasoning / coding / audio / function_calling / multimodal / long_context ...
  supported   INTEGER NOT NULL DEFAULT 1,        -- 1=支持 0=不支持
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (model_id, capability)
);

-- 查询热路径：按模型取能力 / 按能力筛选模型
CREATE INDEX idx_model_capabilities_model ON model_capabilities(model_id);
CREATE INDEX idx_model_capabilities_capability ON model_capabilities(capability);
