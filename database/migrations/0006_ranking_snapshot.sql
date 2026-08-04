-- ============================================================================
-- Migration 0006：排名快照表（ranking_snapshots）
--
-- 用途：保存每日排名（Cron 02:00 UTC 生成），支持排名历史趋势分析。
--
-- 设计说明：
--   * ranking_mode：overall / coding / reasoning / best-value（与 /api/ranking 模式一致）；
--   * UNIQUE (model_id, ranking_mode, snapshot_date)：同一模型同一模式同一天仅一条，
--     配合 INSERT OR IGNORE 实现幂等（重复触发不重复写入）；
--   * 外键 ON DELETE CASCADE：删除模型时自动清理其快照。
-- ============================================================================

CREATE TABLE ranking_snapshots (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id      INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  ranking_mode  TEXT NOT NULL,                   -- overall / coding / reasoning / best-value
  score         REAL NOT NULL,                   -- 该模式分数（0-100）
  rank          INTEGER NOT NULL,                -- 该模式当日排名（1 起）
  snapshot_date TEXT NOT NULL,                   -- YYYY-MM-DD
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (model_id, ranking_mode, snapshot_date)
);

-- 查询热路径：按模型取趋势 / 按日期取当日排名 / 按模式取历史
CREATE INDEX idx_ranking_snapshots_model ON ranking_snapshots(model_id);
CREATE INDEX idx_ranking_snapshots_date ON ranking_snapshots(snapshot_date);
CREATE INDEX idx_ranking_snapshots_mode ON ranking_snapshots(ranking_mode);
