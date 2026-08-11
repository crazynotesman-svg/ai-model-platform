/**
 * modelGraph.ts —— Model Knowledge Graph Relationship Engine（Phase 11.8）
 *
 * 模型间关系计算（纯函数，可单测）：
 *   Similarity = 0.35×Capability Jaccard + 0.25×Benchmark 距离 + 0.15×Context + 0.15×Price + 0.10×Use Case
 * 关系：similar_to / cheaper_than / better_for / alternative_to / competitor_of
 * 每个关系：confidence + reason（数据驱动模板）+ source（可追踪）
 * Trust：Relationship Trust = Source Authority × Evidence Strength × Freshness；<50 禁止展示
 *
 * 注意：frontend/scripts/export-models.mjs 内置相同公式用于 SSG 导出（同步维护）。
 */

export interface ModelProfile {
  slug: string;
  name: string;
  provider: string;
  modelType: string;
  capabilities: string[]; // supported=1 的能力
  benchmarks: { category: string; score: number; confidence: number | null }[];
  contextWindow: number | null;
  inputPrice: number | null; // USD / 1M
  useCases: string[]; // 翻译中的 use_cases
}

export interface ModelRelationship {
  type: 'similar_to' | 'competitor_of' | 'successor_of' | 'alternative_to' | 'cheaper_than' | 'better_for';
  targetSlug: string;
  targetName: string;
  confidence: number; // 0-100
  reason: string;
  source: string; // 来源（可追踪）
}

const CAP_WEIGHT = 0.45;
const BENCH_WEIGHT = 0.2;
const CONTEXT_WEIGHT = 0.1;
const PRICE_WEIGHT = 0.15;
const USE_CASE_WEIGHT = 0.1;

const jaccard = (a: string[], b: string[]): number => {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const inter = b.filter((x) => setA.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
};

const round1 = (n: number): number => Math.round(n * 10) / 10;

/** 基准距离：同类别分数平均绝对差 → 0-100 相似（差 0 = 100，差 20+ = 0） */
function benchmarkSimilarity(a: ModelProfile, b: ModelProfile): number {
  const mapB = new Map(b.benchmarks.map((x) => [x.category, x.score]));
  const diffs: number[] = [];
  for (const x of a.benchmarks) {
    const y = mapB.get(x.category);
    if (y != null) diffs.push(Math.abs(x.score - y));
  }
  if (diffs.length === 0) return 0;
  const avgDiff = diffs.reduce((s, d) => s + d, 0) / diffs.length;
  return Math.max(0, 100 - avgDiff * 5);
}

function priceSimilarity(a: ModelProfile, b: ModelProfile): number {
  if (a.inputPrice == null || b.inputPrice == null) return 0;
  const max = Math.max(a.inputPrice, b.inputPrice, 0.01);
  const diff = Math.abs(a.inputPrice - b.inputPrice) / max;
  return Math.max(0, 100 - diff * 200);
}

function contextSimilarity(a: ModelProfile, b: ModelProfile): number {
  if (a.contextWindow == null || b.contextWindow == null) return 0;
  const max = Math.max(a.contextWindow, b.contextWindow, 1);
  return Math.min(100, (Math.min(a.contextWindow, b.contextWindow) / max) * 100);
}

function useCaseSimilarity(a: ModelProfile, b: ModelProfile): number {
  return jaccard(a.useCases, b.useCases) * 100;
}

/** 综合相似度 0-100 */
export function similarity(a: ModelProfile, b: ModelProfile): number {
  const s =
    CAP_WEIGHT * jaccard(a.capabilities, b.capabilities) * 100 +
    BENCH_WEIGHT * benchmarkSimilarity(a, b) +
    CONTEXT_WEIGHT * contextSimilarity(a, b) +
    PRICE_WEIGHT * priceSimilarity(a, b) +
    USE_CASE_WEIGHT * useCaseSimilarity(a, b);
  return round1(s);
}

/** 数据驱动 reason 生成（禁止 hardcode） */
export function buildReason(type: ModelRelationship['type'], a: ModelProfile, b: ModelProfile, sim: number): string {
  const sharedCaps = a.capabilities.filter((c) => b.capabilities.includes(c));
  switch (type) {
    case 'similar_to':
      return `Similar ${sharedCaps.slice(0, 3).join(', ') || 'capability profile'} with comparable pricing (sim ${sim}%)`;
    case 'cheaper_than':
      return `Lower input price ($${a.inputPrice ?? '?'}/1M vs $${b.inputPrice ?? '?'}/1M) with ${sharedCaps.slice(0, 2).join(', ') || 'overlapping'} capabilities`;
    case 'better_for':
      return `Better fit for ${a.useCases.slice(0, 2).join(', ') || 'general'} use cases`;
    case 'alternative_to':
      return `Alternative choice with similar benchmark performance and ${sharedCaps.slice(0, 2).join(', ') || 'shared'} capabilities`;
    default:
      return `Related model in the same capability category`;
  }
}

/** 关系可信度（Step 7）：加权 = 0.5×Source Authority + 0.3×Evidence Strength + 0.2×Freshness；<50 禁止展示 */
export function relationshipTrust(input: {
  sourceTrust: number; // 0-100（Tier A=100 / 引擎计算=40）
  evidenceStrength: number; // 相似度/重叠度 0-100
  freshness: number; // 0-100
}): number {
  const t = 0.5 * input.sourceTrust + 0.3 * input.evidenceStrength + 0.2 * input.freshness;
  return Math.round(t);
}

/** 为单个模型构建关系（引擎计算；successor_of 仅官方，本引擎不生成） */
export function buildRelationships(me: ModelProfile, others: ModelProfile[], freshness = 90): ModelRelationship[] {
  const out: ModelRelationship[] = [];
  for (const o of others) {
    if (o.slug === me.slug) continue;
    const sim = similarity(me, o);
    const sharedCaps = me.capabilities.filter((c) => o.capabilities.includes(c));
    const benchOverlap = me.benchmarks.some((x) => o.benchmarks.some((y) => y.category === x.category));
    // similar_to：sim ≥ 55 且（benchmark 重叠 或 共享能力 ≥4）——无 benchmark 数据时能力主导
    if (sim >= 45 && (benchOverlap || sharedCaps.length >= 4)) {
      const trust = relationshipTrust({ sourceTrust: 40, evidenceStrength: sim, freshness });
      if (trust >= 50) {
        out.push({ type: 'similar_to', targetSlug: o.slug, targetName: o.name, confidence: trust, reason: buildReason('similar_to', me, o, sim), source: 'engine-computed' });
      }
    }
    // cheaper_than：同能力类（≥2 共享能力）且明显更低价格
    if (sharedCaps.length >= 2 && me.inputPrice != null && o.inputPrice != null && o.inputPrice > me.inputPrice * 1.2) {
      const trust = relationshipTrust({ sourceTrust: 40, evidenceStrength: 80, freshness });
      if (trust >= 50) {
        out.push({ type: 'cheaper_than', targetSlug: o.slug, targetName: o.name, confidence: trust, reason: buildReason('cheaper_than', me, o, sim), source: 'engine-computed' });
      }
    }
    // alternative_to：sim ≥ 50（弱相似，作为替代选项）
    if (sim >= 40 && sim < 45) {
      const trust = relationshipTrust({ sourceTrust: 40, evidenceStrength: sim, freshness });
      if (trust >= 50) {
        out.push({ type: 'alternative_to', targetSlug: o.slug, targetName: o.name, confidence: trust, reason: buildReason('alternative_to', me, o, sim), source: 'engine-computed' });
      }
    }
  }
  return out.sort((a, b) => b.confidence - a.confidence);
}
