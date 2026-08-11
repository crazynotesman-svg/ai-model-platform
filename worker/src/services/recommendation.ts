/**
 * Recommendation Engine（Phase 9.6 + 11.8 v2）
 *
 * 推荐类型：
 *   best-overall   —— 综合评分最高（Overall Score）
 *   best-value     —— 性价比最高（Price Efficiency 最高 = score/price 最优）
 *   best-coding    —— 编程基准最高
 *   best-reasoning —— 推理基准最高
 *   best-alternative（v2）—— 给定模型的替代选择（Knowledge Graph：similar + price/能力权衡）
 *
 * 全部来自 D1 实时计算（rankModels / modelGraph），无 hardcode。
 */
import type { D1Database } from '@cloudflare/workers-types';
import { rankModels, type RankedModel } from './ranking';
import { buildRelationships, type ModelProfile } from './modelGraph';
import { loadModelProfiles } from './relationshipGenerator';

export interface Recommendation {
  type: 'best-overall' | 'best-value' | 'best-coding' | 'best-reasoning';
  model: { slug: string; name: string; provider: string; score: number } | null;
  reason: string;
}

export interface AlternativeRecommendation {
  type: 'best-alternative';
  model: { slug: string; name: string; provider: string; score: number };
  alternative: { slug: string; name: string; confidence: number; reason: string } | null;
}

/** v2：给定模型 → 替代推荐（Knowledge Graph 关系；原因数据驱动） */
export async function getAlternativeRecommendation(db: D1Database, slug: string): Promise<AlternativeRecommendation> {
  const profiles = await loadModelProfiles(db);
  const me = profiles.find((p) => p.slug === slug);
  const ranked = await rankModels(db, { lang: 'en' });
  const modelEntry = ranked.find((r) => r.slug === slug);
  if (!me || !modelEntry) {
    return { type: 'best-alternative', model: { slug, name: slug.split('/').pop() ?? slug, provider: '', score: 0 }, alternative: null };
  }
  const rels = buildRelationships(me, profiles).filter((r) => r.type === 'similar_to' || r.type === 'alternative_to' || r.type === 'cheaper_than');
  // 优先：相似且更便宜 → 否则相似度高
  const cheaper = rels.find((r) => r.type === 'cheaper_than');
  const pick = cheaper ?? rels[0] ?? null;
  return {
    type: 'best-alternative',
    model: { slug: modelEntry.slug, name: modelEntry.name, provider: modelEntry.provider, score: modelEntry.score },
    alternative: pick ? { slug: pick.targetSlug, name: pick.targetName, confidence: pick.confidence, reason: pick.reason } : null,
  };
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
