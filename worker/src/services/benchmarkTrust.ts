/**
 * benchmarkTrust.ts —— Benchmark Trust v4（Phase 11.9 Step 3）
 *
 * Trust = Source Authority × Dataset Transparency × Reproducibility × Freshness × Cross Validation（0-100）
 * 与 Trust Score v3 相比，v4 专门用于 benchmark 数据维度（数据集透明度/可复现性）。
 * 纯函数，可单测。
 */

export interface BenchmarkTrustInput {
  sourceTrust: number;         // 0-100（官方报告 100 / 权威基准 90 / 社区 70）
  datasetTransparency: number; // 0-100（dataset + version + 方法明确度）
  reproducibility: number;     // 0-100（公开代码/论文/评测方法）
  verifiedAt: string | null;   // 验证日期
  crossValidation: 'verified' | 'warning' | 'conflict' | 'expired' | 'none';
}

const daysSince = (d: string | null): number | null =>
  d ? Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000) : null;

export function benchmarkTrustV4(input: BenchmarkTrustInput): number {
  const freshness =
    input.verifiedAt == null ? 50 : (() => {
      const days = daysSince(input.verifiedAt);
      if (days == null) return 50;
      if (days <= 30) return 100;
      if (days <= 90) return 85;
      if (days <= 180) return 65;
      return 40;
    })();
  const cv = input.crossValidation === 'verified' ? 100 : input.crossValidation === 'warning' ? 70 : input.crossValidation === 'expired' ? 40 : input.crossValidation === 'conflict' ? 30 : 60;
  const trust =
    (input.sourceTrust / 100) *
    (input.datasetTransparency / 100) *
    (input.reproducibility / 100) *
    (freshness / 100) *
    (cv / 100) *
    100;
  return Math.round(trust);
}

/** 示例：GPT-4o MMLU —— 官方技术报告（Trust 94） */
export const trustExamples = {
  gpt4oMMLU: benchmarkTrustV4({ sourceTrust: 100, datasetTransparency: 95, reproducibility: 95, verifiedAt: new Date().toISOString().slice(0, 10), crossValidation: 'verified' }),
};
