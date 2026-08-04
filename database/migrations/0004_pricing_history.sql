-- ============================================================================
-- Migration 0004：价格历史表（pricing_history）
--
-- 用途：记录模型价格随时间的变化（涨价/降价），供价格历史图表与透明度展示。
--
-- 设计说明：
--   * 每次价格变更追加一条记录（不修改历史），effective_date 为生效日期；
--   * source 记录数据来源：initial_import（首次从 pricing 导入）/ manual / api ...
--   * UNIQUE (model_id, effective_date, currency, unit)：同模型同币种同单位
--     同一天仅一条，配合 INSERT OR IGNORE 实现幂等导入；
--   * 外键 ON DELETE CASCADE：删除模型时自动清理其价格历史。
-- ============================================================================

CREATE TABLE pricing_history (
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

-- 查询热路径：按模型取价格历史 / 按生效日期筛选
CREATE INDEX idx_pricing_history_model ON pricing_history(model_id);
CREATE INDEX idx_pricing_history_effective ON pricing_history(effective_date);
