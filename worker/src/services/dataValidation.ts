/**
 * dataValidation.ts —— Cross Validation Engine（Phase 11.7 Step 6）
 *
 * 多源交叉验证：
 *   Pricing  ：官方源 vs 现有库 → price changed / missing field / stale data
 *   Benchmark：同模型不同 score / dataset 不一致 / version 不一致
 *
 * 输出 validation_status：verified / warning / conflict / expired
 * 纯函数（便于单测）；DB 查询由调用方提供。
 */

export type ValidationStatus = 'verified' | 'warning' | 'conflict' | 'expired';

export interface PriceValidationInput {
  officialInput: number | null;
  officialOutput: number | null;
  dbInput: number | null;
  dbOutput: number | null;
  officialVerifiedAt: string | null; // ISO date
  dbVerifiedAt: string | null;
}

export interface PriceValidationResult {
  status: ValidationStatus;
  issues: string[];
  pctInputDiff: number | null;
}

const daysSince = (d: string | null): number | null =>
  d ? Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000) : null;

/** Pricing 交叉验证 */
export function validatePricing(input: PriceValidationInput): PriceValidationResult {
  const issues: string[] = [];
  const pct = (o: number | null, n: number | null): number | null =>
    o != null && n != null && o !== 0 ? Math.round(((n - o) / o) * 1000) / 10 : null;
  const pctInputDiff = pct(input.dbInput, input.officialInput);

  if (input.officialInput == null || input.officialOutput == null) {
    issues.push('official source missing price fields');
  }
  if (input.dbInput == null || input.dbOutput == null) {
    issues.push('database missing price fields');
  }
  if (input.officialInput != null && input.dbInput != null && Math.abs(input.officialInput - input.dbInput) > 1e-9) {
    issues.push(`price changed: db ${input.dbInput} vs official ${input.officialInput}`);
  }
  const officialAge = daysSince(input.officialVerifiedAt);
  if (officialAge != null && officialAge > 90) issues.push(`official source stale (>90d)`);
  const dbAge = daysSince(input.dbVerifiedAt);
  if (dbAge != null && dbAge > 180) issues.push(`database stale (>180d)`);

  const status: ValidationStatus = issues.length === 0 ? 'verified' : issues.some((i) => i.startsWith('price changed')) ? 'conflict' : issues.some((i) => i.includes('stale')) ? 'expired' : 'warning';
  return { status, issues, pctInputDiff };
}

export interface BenchmarkValidationInput {
  scores: { dataset: string; version: string; score: number; source: string }[];
}

export interface BenchmarkValidationResult {
  status: ValidationStatus;
  issues: string[];
}

/** Benchmark 交叉验证：同模型多源分数一致性 */
export function validateBenchmark(input: BenchmarkValidationInput): BenchmarkValidationResult {
  const issues: string[] = [];
  const byDataset = new Map<string, { version: string; score: number; source: string }[]>();
  for (const s of input.scores) {
    const arr = byDataset.get(s.dataset) ?? [];
    arr.push(s);
    byDataset.set(s.dataset, arr);
  }
  for (const [dataset, entries] of byDataset) {
    if (entries.length > 1) {
      const versions = new Set(entries.map((e) => e.version));
      const scores = new Set(entries.map((e) => e.score));
      if (versions.size > 1) issues.push(`dataset ${dataset}: version 不一致 (${[...versions].join(', ')})`);
      if (scores.size > 1) issues.push(`dataset ${dataset}: 分数冲突 (${[...scores].join(', ')})`);
    }
  }
  if (input.scores.length === 0) issues.push('no benchmark data');
  const status: ValidationStatus = issues.length === 0 ? 'verified' : issues.some((i) => i.includes('冲突')) ? 'conflict' : 'warning';
  return { status, issues };
}

/** Trust Score v3（Phase 11.7 Step 7）：Source × Freshness × Completeness × Validation × Version（0-100） */
export function trustScoreV3(input: {
  sourceTrust: number;      // 0-100（Tier A=100 / B=90 / C=70 / D=40）
  verifiedAt: string | null;
  completeness: number;     // 0-100（字段完整度）
  validation: ValidationStatus;
  versionReliability: number; // 0-100（版本明确度；默认 90）
}): number {
  const freshness = (() => {
    const days = daysSince(input.verifiedAt);
    if (days == null) return 50;
    if (days <= 7) return 100;
    if (days <= 30) return 90;
    if (days <= 90) return 75;
    if (days <= 180) return 55;
    return 30;
  })();
  const validation = input.validation === 'verified' ? 100 : input.validation === 'warning' ? 70 : input.validation === 'expired' ? 40 : 30;
  // 乘积加权（任一维度低则整体低）
  const raw = (input.sourceTrust / 100) * (freshness / 100) * (input.completeness / 100) * (validation / 100) * (input.versionReliability / 100) * 100;
  return Math.round(raw);
}
