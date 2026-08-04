/**
 * Ranking Snapshot Service（Phase 9.6）
 *
 * 功能：计算全库各模式排名并写入 ranking_snapshots 表（每日快照）。
 * 幂等：UNIQUE(model_id, ranking_mode, snapshot_date) + INSERT OR IGNORE，
 *       同一天重复执行不会重复写入。
 * 模式：overall / coding / reasoning / best-value（与 /api/ranking 一致）。
 */
import type { D1Database } from '@cloudflare/workers-types';
import { rankModels } from './ranking';

/** 快照模式列表 */
export const SNAPSHOT_MODES = ['overall', 'coding', 'reasoning', 'best-value'] as const;

export interface SnapshotResult {
  date: string;
  inserted: number;
  skipped: number;
}

/** 本地日期 → YYYY-MM-DD（UTC） */
const fmtDate = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * 生成某天（默认今天 UTC）的排名快照。幂等：当天已存在则跳过。
 */
export async function createDailySnapshot(
  db: D1Database,
  date: Date = new Date(),
): Promise<SnapshotResult> {
  const snapshotDate = fmtDate(date);
  let inserted = 0;
  let skipped = 0;

  for (const mode of SNAPSHOT_MODES) {
    // category 参数即模式（best-value / coding / reasoning 语义一致；overall 传 null）
    const rankings = await rankModels(db, {
      lang: 'en',
      category: mode === 'overall' ? null : mode,
    });
    const stmt = db.prepare(
      `INSERT OR IGNORE INTO ranking_snapshots
         (model_id, ranking_mode, score, rank, snapshot_date)
       VALUES (?, ?, ?, ?, ?)`,
    );
    const batch = rankings.map((r, i) =>
      stmt.bind(r.modelId, mode, r.score, i + 1, snapshotDate),
    );
    const result = await db.batch(batch);
    for (const res of result) {
      const meta = res.meta as { changes?: number };
      if ((meta.changes ?? 0) > 0) inserted += 1;
      else skipped += 1;
    }
  }

  return { date: snapshotDate, inserted, skipped };
}
