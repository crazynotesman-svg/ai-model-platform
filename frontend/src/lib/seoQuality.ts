/**
 * seoQuality.ts —— 页面质量评分（Phase 11.4）
 *
 * 仅用于构建期（build-time），禁止 runtime API。
 * 评分 0-100：Content（模型数/benchmark 证据/定价/FAQ）+ SEO（canonical/schema/内链）+ Freshness（最近核验）。
 * 分数仅供内部质量分析，不向用户展示（页面展示用 QualityBadge 的友好文案）。
 */

export interface QualityInput {
  /** 页面引用模型数（≥3 为合格） */
  modelCount: number;
  /** 含 benchmark 数据的模型数（证据） */
  benchmarkCount: number;
  /** 有定价数据（≥1 模型有价格） */
  hasPricing: boolean;
  /** FAQ 数量 */
  faqCount: number;
  /** canonical 是否指向生产域名 */
  hasCanonical: boolean;
  /** 是否有结构化数据（JSON-LD） */
  hasSchema: boolean;
  /** 站内链接数（导航 + 内容内链） */
  internalLinks: number;
  /** 数据最近核验日期（ISO 或 null） */
  lastVerifiedAt: string | null;
  /** 最近 90 天内数据更新事件数（benchmark/pricing 更新），用于 freshness 加分 */
  recentDataUpdates?: number;
}

export interface QualityScore {
  score: number; // 0-100
  content: number;
  seo: number;
  freshness: number;
}

const clamp = (n: number, min = 0, max = 100): number => Math.max(min, Math.min(max, n));

/** 内容分（0-100）：模型数/证据/定价/FAQ */
function contentScore(i: QualityInput): number {
  let s = 0;
  s += clamp(i.modelCount * 10, 0, 30); // 0-30（3 模型=30）
  s += i.benchmarkCount > 0 ? clamp(i.benchmarkCount * 6, 0, 30) : 0; // 0-30
  s += i.hasPricing ? 20 : 0; // 0-20
  s += clamp(i.faqCount * 7, 0, 20); // 0-20
  return clamp(Math.round(s));
}

/** SEO 分（0-100）：canonical/schema/内链 */
function seoScore(i: QualityInput): number {
  let s = 0;
  s += i.hasCanonical ? 40 : 0;
  s += i.hasSchema ? 30 : 0;
  s += clamp(i.internalLinks * 5, 0, 30); // 6+ 链接=30
  return clamp(Math.round(s));
}

/**
 * 新鲜度分（0-100）：
 * - lastVerifiedAt 距今天数（基础分）；
 * - 最近 90 天内的数据更新事件（benchmark/pricing update）额外加分（每件 +10，上限 +30），
 *   反映数据仍在流动。
 */
function freshnessScore(lastVerifiedAt: string | null, recentDataUpdates = 0): number {
  let base: number;
  if (!lastVerifiedAt) {
    base = 40;
  } else {
    const days = Math.max(0, (Date.now() - new Date(lastVerifiedAt).getTime()) / 86_400_000);
    if (days <= 7) base = 100;
    else if (days <= 30) base = 80;
    else if (days <= 90) base = 60;
    else if (days <= 180) base = 40;
    else base = 20;
  }
  // 数据更新信号加分（仅最近 90 天内的更新计数）
  return clamp(base + clamp(recentDataUpdates, 0, 3) * 10);
}

/** 页面质量评分：content 50% + seo 30% + freshness 20% */
export function pageQualityScore(input: QualityInput): QualityScore {
  const content = contentScore(input);
  const seo = seoScore(input);
  const freshness = freshnessScore(input.lastVerifiedAt, input.recentDataUpdates);
  const score = clamp(Math.round(content * 0.5 + seo * 0.3 + freshness * 0.2));
  return { score, content, seo, freshness };
}

export interface QualityBadge {
  modelCount: number;
  updatedYear: number | null;
  /** 最近 30 天内核验过（仅真实数据） */
  verifiedRecently: boolean;
}

/** QualityBadge 友好数据（页面展示，不暴露内部 score；仅真实数据） */
export function qualityBadge(input: Pick<QualityInput, 'modelCount' | 'lastVerifiedAt'>): QualityBadge {
  const year = input.lastVerifiedAt ? new Date(input.lastVerifiedAt).getFullYear() : null;
  const verifiedRecently =
    input.lastVerifiedAt != null && Date.now() - new Date(input.lastVerifiedAt).getTime() <= 30 * 86_400_000;
  return { modelCount: input.modelCount, updatedYear: year, verifiedRecently };
}
