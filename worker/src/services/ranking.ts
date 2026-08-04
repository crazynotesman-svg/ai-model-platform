/**
 * AI Model Ranking Engine（v1）—— 透明、可解释的综合评分。
 * 公式权威定义见 docs/ranking-design.md：
 *   Overall = Benchmark×50% + Capability×20% + PriceEfficiency×20% + Context×10%
 *
 * 注意：frontend/scripts/export-models.mjs 内置相同公式用于 SSG 导出
 * （与本文 calculateFromData 保持一致，改动时两处同步）。
 */
import type { D1Database } from '@cloudflare/workers-types';

/** 各分量百分制分解（0-100） */
export interface ScoreBreakdown {
  benchmark: number;
  capability: number;
  priceEfficiency: number;
  context: number;
  overall: number;
}

/** 排名条目 */
export interface RankedModel {
  modelId: number;
  slug: string;
  name: string;
  provider: string;
  score: number;
  breakdown: ScoreBreakdown;
}

/** 上下文满分阈值（tokens） */
const CONTEXT_FULL_SCORE = 200_000;
/** 能力种类数（当前 model_capabilities 全量：vision/reasoning/coding/audio/function_calling/multimodal/long_context） */
const TOTAL_CAPABILITIES = 7;

const round1 = (n: number): number => Math.round(n * 10) / 10;

const avg = (nums: number[]): number => nums.reduce((a, b) => a + b, 0) / nums.length;

/** 纯函数：由原始数据计算分解分数（无 DB 依赖，可单测） */
export function calculateFromData(input: {
  benchmarkScores: number[]; // 各分类 score（0-100 口径），空数组 = 无数据
  supportedCapabilities: number; // supported=1 的能力数
  inputPrice: number | null; // USD / per_1M_tokens
  maxInputPrice: number; // 全库最大输入价（参照）
  contextWindow: number | null; // tokens
}): ScoreBreakdown {
  const benchmark = input.benchmarkScores.length > 0 ? avg(input.benchmarkScores) : 0;
  const capability = (input.supportedCapabilities / TOTAL_CAPABILITIES) * 100;
  const priceEfficiency =
    input.inputPrice != null && input.inputPrice > 0
      ? Math.min((input.maxInputPrice / input.inputPrice) * 100, 100)
      : 0;
  const context = input.contextWindow != null ? Math.min(input.contextWindow / CONTEXT_FULL_SCORE, 1) * 100 : 0;
  const overall = benchmark * 0.5 + capability * 0.2 + priceEfficiency * 0.2 + context * 0.1;
  return {
    benchmark: round1(benchmark),
    capability: round1(capability),
    priceEfficiency: round1(priceEfficiency),
    context: round1(context),
    overall: round1(overall),
  };
}

/** 单模型评分（查询 D1 后调用纯函数） */
export async function calculateModelScore(
  db: D1Database,
  modelId: number,
  maxInputPrice: number,
): Promise<ScoreBreakdown> {
  const [model, caps, bench] = await Promise.all([
    db.prepare('SELECT context_window FROM models WHERE id = ?').bind(modelId).first<{ context_window: number | null }>(),
    db.prepare('SELECT COUNT(*) AS n FROM model_capabilities WHERE model_id = ? AND supported = 1').bind(modelId).first<{ n: number }>(),
    db.prepare('SELECT score FROM benchmark_results WHERE model_id = ?').bind(modelId).all<{ score: number }>(),
  ]);
  const price = await db
    .prepare("SELECT input_price FROM pricing WHERE model_id = ? AND currency = 'USD' AND unit = 'per_1M_tokens' LIMIT 1")
    .bind(modelId)
    .first<{ input_price: number }>();
  return calculateFromData({
    benchmarkScores: (bench.results ?? []).map((r) => r.score),
    supportedCapabilities: caps?.n ?? 0,
    inputPrice: price?.input_price ?? null,
    maxInputPrice,
    contextWindow: model?.context_window ?? null,
  });
}

export interface RankOptions {
  lang?: string;
  /** 排名模式：undefined=overall；'best-value'=按价格效率；其他=按该 benchmark 分类 */
  category?: string | null;
}

/**
 * 全库模型排名（批量查询避免 N+1）。
 * 排序键：category 模式 → 该分类 benchmark score；best-value → 价格效率；默认 → overall。
 */
export async function rankModels(db: D1Database, opts: RankOptions = {}): Promise<RankedModel[]> {
  const lang = opts.lang ?? 'en';
  const category = opts.category ?? null;

  const [models, prices, caps, bench, maxPriceRow] = await Promise.all([
    db
      .prepare(
        `SELECT m.id, m.slug, m.context_window, p.name AS provider,
                COALESCE(mt.name, m.slug) AS name
         FROM models m
         JOIN providers p ON p.id = m.provider
         LEFT JOIN model_translations mt ON mt.model_id = m.id AND mt.language = ?
         ORDER BY m.slug`,
      )
      .bind(lang)
      .all<{ id: number; slug: string; context_window: number | null; provider: string; name: string }>(),
    db
      .prepare("SELECT model_id, input_price FROM pricing WHERE currency = 'USD' AND unit = 'per_1M_tokens'")
      .all<{ model_id: number; input_price: number }>(),
    db
      .prepare('SELECT model_id, COUNT(*) AS n FROM model_capabilities WHERE supported = 1 GROUP BY model_id')
      .all<{ model_id: number; n: number }>(),
    db
      .prepare(
        `SELECT br.model_id, br.score, bc.slug AS category
         FROM benchmark_results br
         JOIN benchmark_categories bc ON br.category_id = bc.id`,
      )
      .all<{ model_id: number; score: number; category: string }>(),
    db.prepare("SELECT MAX(input_price) AS m FROM pricing WHERE currency = 'USD' AND unit = 'per_1M_tokens'").first<{ m: number | null }>(),
  ]);

  const priceById = new Map((prices.results ?? []).map((p) => [p.model_id, p.input_price]));
  const capsById = new Map((caps.results ?? []).map((c) => [c.model_id, c.n]));
  const benchById = new Map<number, { score: number; category: string }[]>();
  for (const b of bench.results ?? []) {
    const list = benchById.get(b.model_id);
    if (list) list.push({ score: b.score, category: b.category });
    else benchById.set(b.model_id, [{ score: b.score, category: b.category }]);
  }
  const maxInputPrice = maxPriceRow?.m ?? 0;

  const ranked: RankedModel[] = (models.results ?? []).map((m) => {
    const scores = benchById.get(m.id) ?? [];
    const breakdown = calculateFromData({
      benchmarkScores: scores.map((s) => s.score),
      supportedCapabilities: capsById.get(m.id) ?? 0,
      inputPrice: priceById.get(m.id) ?? null,
      maxInputPrice,
      contextWindow: m.context_window,
    });
    return {
      modelId: m.id,
      slug: m.slug,
      name: m.name,
      provider: m.provider,
      score: breakdown.overall,
      breakdown,
    };
  });

  // 排序键
  const sortKey = (r: RankedModel): number => {
    if (category === 'best-value') return r.breakdown.priceEfficiency;
    if (category) {
      const s = benchById.get(r.modelId)?.find((b) => b.category === category)?.score ?? 0;
      return s;
    }
    return r.breakdown.overall;
  };
  ranked.sort((a, b) => sortKey(b) - sortKey(a) || a.slug.localeCompare(b.slug));
  return ranked;
}
