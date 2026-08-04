/**
 * Recommendation Engine（Phase 9.6）
 *
 * 推荐类型：
 *   best-overall   —— 综合评分最高（Overall Score）
 *   best-value     —— 性价比最高（Price Efficiency 最高 = score/price 最优）
 *   best-coding    —— 编程基准最高
 *   best-reasoning —— 推理基准最高
 *
 * 全部来自 D1 实时计算（rankModels），无 hardcode。
 */
import type { D1Database } from '@cloudflare/workers-types';
import { rankModels, type RankedModel } from './ranking';

export interface Recommendation {
  type: 'best-overall' | 'best-value' | 'best-coding' | 'best-reasoning';
  model: { slug: string; name: string; provider: string; score: number } | null;
  reason: string;
}

const topModel = (list: RankedModel[]): Recommendation['model'] =>
  list.length > 0
    ? { slug: list[0].slug, name: list[0].name, provider: list[0].provider, score: list[0].score }
    : null;

/**
 * 计算四类推荐。返回按 type 排序的数组（无推荐项的模型为 null 时过滤）。
 */
export async function getRecommendations(
  db: D1Database,
  lang = 'en',
): Promise<Recommendation[]> {
  const [overall, value, coding, reasoning] = await Promise.all([
    rankModels(db, { lang }),
    rankModels(db, { lang, category: 'best-value' }),
    rankModels(db, { lang, category: 'coding' }),
    rankModels(db, { lang, category: 'reasoning' }),
  ]);

  const recommendations: Recommendation[] = [
    {
      type: 'best-overall',
      model: topModel(overall),
      reason: 'Highest overall score across benchmarks, capabilities, price and context.',
    },
    {
      type: 'best-value',
      model: topModel(value),
      reason: 'High ranking score with lowest token cost.',
    },
    {
      type: 'best-coding',
      model: topModel(coding),
      reason: 'Top score on the coding benchmark.',
    },
    {
      type: 'best-reasoning',
      model: topModel(reasoning),
      reason: 'Top score on the reasoning benchmark.',
    },
  ];
  return recommendations.filter((r) => r.model !== null);
}
