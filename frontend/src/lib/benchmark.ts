/**
 * Benchmark 工具库（可复用于 Leaderboard / Benchmark 分类页 / 模型详情 / 比较页）。
 * TypeScript strict、无 any；数据来自构建期导出的 model-catalog.json（源头 D1）。
 */

/** 单个基准结果（与 export-models.mjs 输出一致） */
export interface BenchmarkRecord {
  category: string; // category slug（coding / reasoning / math / vision）
  categoryName: string;
  score: number;
  rank: number | null;
  dataset: string;
  version: string;
  source: string;
  testedAt: string | null;
}

/** 基准分类定义：slug → i18n 字典键 */
export interface BenchmarkCategoryDef {
  slug: string;
  labelKey: string; // 如 'benchmark.coding'
}

/** 全部基准分类（UI 展示顺序） */
export const BENCHMARK_CATEGORIES: BenchmarkCategoryDef[] = [
  { slug: 'coding', labelKey: 'benchmark.coding' },
  { slug: 'reasoning', labelKey: 'benchmark.reasoning' },
  { slug: 'math', labelKey: 'benchmark.math' },
  { slug: 'vision', labelKey: 'benchmark.vision' },
];

/** 分类 slug → 定义；未知返回 null */
export function getBenchmarkCategory(slug: string): BenchmarkCategoryDef | null {
  return BENCHMARK_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

/** 分类 slug → i18n 字典键（未知 slug 返回 null） */
export function getBenchmarkLabel(slug: string): string | null {
  return getBenchmarkCategory(slug)?.labelKey ?? null;
}

/** 某模型在某分类下的全部结果（按 score 降序） */
export function getBenchmarkByCategory(
  benchmarks: readonly BenchmarkRecord[],
  category: string,
): BenchmarkRecord[] {
  return benchmarks.filter((b) => b.category === category);
}

/** 按 score 降序排序（score 缺失视为 -Infinity 排末尾） */
export function sortByBenchmarkScore<T extends { score?: number | null }>(
  rows: readonly T[],
): T[] {
  return [...rows].sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity));
}

/** 求一组结果中的最高分；空返回 null */
export function getHighestScore(benchmarks: readonly BenchmarkRecord[]): number | null {
  if (benchmarks.length === 0) return null;
  return Math.max(...benchmarks.map((b) => b.score));
}

/** 按分类分组：Map<category, BenchmarkRecord[]> */
export function groupBenchmarks(
  benchmarks: readonly BenchmarkRecord[],
): Map<string, BenchmarkRecord[]> {
  const map = new Map<string, BenchmarkRecord[]>();
  for (const b of benchmarks) {
    const list = map.get(b.category);
    if (list) list.push(b);
    else map.set(b.category, [b]);
  }
  return map;
}

/**
 * 计算模型的"总分"：全部基准结果的平均分（无结果返回 null）。
 * 用于 Leaderboard Overall Ranking。
 */
export function overallScore(benchmarks: readonly BenchmarkRecord[]): number | null {
  if (benchmarks.length === 0) return null;
  return benchmarks.reduce((sum, b) => sum + b.score, 0) / benchmarks.length;
}
