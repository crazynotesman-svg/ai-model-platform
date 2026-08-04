-- ============================================================================
-- Migration 0005：Benchmark 数据系统
--
-- 表 1 benchmark_categories：基准类别（coding / reasoning / math / vision / instruction_following ...）
--   * slug 唯一且为稳定标识（API/路由引用），name 为展示名，可自由扩展。
--
-- 表 2 benchmark_results：模型在某个基准上的结果
--   * model_id → models(id)，category_id → benchmark_categories(id)，均 ON DELETE CASCADE；
--   * score 为分数（示例数据为 0-100 口径，见 seed 注释）；
--   * dataset/version/source 记录数据来源与口径（如 internal-demo / v1 / manual）；
--   * UNIQUE (model_id, category_id, dataset, version)：同一模型同一基准同一数据源
--     不重复，配合 INSERT OR IGNORE 实现幂等 seed。
-- ============================================================================

CREATE TABLE benchmark_categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,            -- coding / reasoning / math / vision / instruction_following ...
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE benchmark_results (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id    INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES benchmark_categories(id) ON DELETE CASCADE,
  score       REAL NOT NULL,                   -- 基准分数（示例数据 0-100 口径）
  rank        INTEGER,                         -- 排名（可选，internal-demo 无公开排名时为空）
  dataset     TEXT NOT NULL,                   -- 数据口径，如 internal-demo
  version     TEXT NOT NULL,                   -- 数据版本，如 v1
  source      TEXT NOT NULL DEFAULT 'manual',  -- manual / api / collector ...
  tested_at   TEXT,                            -- 测试日期（YYYY-MM-DD）
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (model_id, category_id, dataset, version)
);

-- 查询热路径：按模型取结果 / 按类别筛选 / 按分数排序
CREATE INDEX idx_benchmark_results_model ON benchmark_results(model_id);
CREATE INDEX idx_benchmark_results_category ON benchmark_results(category_id);
CREATE INDEX idx_benchmark_results_score ON benchmark_results(score);
