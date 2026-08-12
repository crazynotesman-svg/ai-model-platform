/**
 * comparePairsGen.ts —— Compare 组合生成（Phase 12.1 修复）
 *
 * 统一"哪些 compare 页会被 SSG 生成"的判定逻辑，供三处共用：
 *   1. compare/[pair].astro getStaticPaths（生成集合）
 *   2. 模型页 "Compare with top models"（过滤链接，避免 404）
 *   3. compare 选择器（过滤可选组合，避免 404）
 *
 * 组合规则（在"全量 24 万页不可行"与"覆盖常用对比"间平衡）：
 *   A. 全模型 × Top N（默认 10）两两——任意模型都能与热门模型对比
 *   B. 同 provider 前 3 模型两两——厂商内部对比
 *   C. 知识图谱关系对（每模型 confidence 前 2）——相似/低价替代
 */
import { allComparePairs, comparePairKey } from './compare';

export interface ComparePairCatalogEntry {
  slug: string;
  ranking?: { overall?: number };
  relationships?: { type: string; model: string; confidence?: number }[];
}

export interface ComparePairGenInput {
  catalog: Record<string, ComparePairCatalogEntry>;
  slugs: readonly string[];
  topN?: number; // 默认 10
}

/** 返回全部将被生成的组合 key 集合 */
export function buildComparePairSet(input: ComparePairGenInput): Set<string> {
  const { catalog, slugs } = input;
  const topN = input.topN ?? 10;
  const rankedTop = Object.entries(catalog)
    .map(([slug, m]) => ({ slug, score: m.ranking?.overall ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((x) => x.slug);

  const set = new Set<string>();
  const addAll = (list: readonly string[]) => {
    for (const p of allComparePairs(list)) set.add(p);
  };

  // A. 全模型 × Top N（去重后）
  for (const slug of slugs) {
    for (const top of rankedTop) {
      if (slug !== top) set.add(comparePairKey(slug, top));
    }
  }

  // B. 同 provider 前 3 两两
  const byProvider = new Map<string, string[]>();
  for (const slug of slugs) {
    const prov = slug.split('/')[0] ?? 'other';
    const arr = byProvider.get(prov) ?? [];
    arr.push(slug);
    byProvider.set(prov, arr);
  }
  for (const list of byProvider.values()) addAll(list.slice(0, 3));

  // C. 知识图谱关系对（每模型 confidence 前 2）
  for (const m of Object.values(catalog)) {
    const rels = (m.relationships ?? [])
      .filter((r) => r.type === 'similar_to' || r.type === 'cheaper_than')
      .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
      .slice(0, 2);
    for (const r of rels) set.add(comparePairKey(m.slug, r.model));
  }

  return set;
}

/** 判断某组合是否会被生成（避免链接到不存在的页） */
export function isComparePairAvailable(pairSet: Set<string>, a: string, b: string): boolean {
  return pairSet.has(comparePairKey(a, b));
}
