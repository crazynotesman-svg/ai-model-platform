/**
 * Ranking 相关路由（Phase 9.6）：趋势 / 推荐。
 */
import type { D1Database } from '@cloudflare/workers-types';

export interface TrendPoint {
  date: string;
  rank: number;
  score: number;
}

export interface TrendResponse {
  model: string;
  mode: string;
  history: TrendPoint[];
  change: { rank: number | null; score: number | null } | null;
}

/**
 * 模型排名趋势：快照历史（时间升序）+ 首尾变化。
 * change.rank：正 = 排名上升（rank 数值减小）；change.score：正 = 分数上升。
 * 模型不存在返回 null（路由层 404）。
 */
export async function getRankingTrend(
  db: D1Database,
  slug: string,
  mode = 'overall',
): Promise<TrendResponse | null> {
  const model = await db.prepare('SELECT id FROM models WHERE slug = ? LIMIT 1').bind(slug).first<{ id: number }>();
  if (!model) return null;

  const { results } = await db
    .prepare(
      `SELECT snapshot_date, rank, score
       FROM ranking_snapshots
       WHERE model_id = ? AND ranking_mode = ?
       ORDER BY snapshot_date ASC`,
    )
    .bind(model.id, mode)
    .all<{ snapshot_date: string; rank: number; score: number }>();

  const history: TrendPoint[] = (results ?? []).map((r) => ({
    date: r.snapshot_date,
    rank: r.rank,
    score: r.score,
  }));

  let change: TrendResponse['change'] = null;
  if (history.length >= 2) {
    const first = history[0];
    const last = history[history.length - 1];
    change = {
      rank: first.rank - last.rank, // 正 = 上升
      score: Math.round((last.score - first.score) * 10) / 10,
    };
  }
  return { model: slug, mode, history, change };
}
