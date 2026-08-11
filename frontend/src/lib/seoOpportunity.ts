/**
 * seoOpportunity.ts —— SEO Opportunity Engine（Phase 11.5）
 *
 * 输入：seo inventory（页面清单 + 质量信号）→ 输出：优化建议队列。
 * 纯函数，禁止硬编码 URL；仅构建期使用。
 * 建议按优先级 HIGH / MEDIUM / LOW 排序，每项含 issue + action（i18n 键）。
 */

export interface InventoryItem {
  url: string;
  type: string; // models | compare | ranking | benchmark | landing | news | calculator | seo-report | home
  lang: string;
  hasFAQ: boolean;
  hasSchema: boolean;
  internalLinks: number;
  qualityScore: number;
  indexed?: boolean; // Search Console 回填（本阶段默认 true）
  ctr?: number | null; // Search Console 回填（可选）
  position?: number | null; // Search Console 回填（可选）
}

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Opportunity {
  page: string; // url
  issue: string; // i18n 键（seoOpportunity.*）
  action: string; // i18n 键（seoOpportunity.action*）
  priority: Priority;
}

/** 生成优化建议（每页最多 1 条，按优先级取最高） */
export function findOpportunities(inventory: InventoryItem[]): Opportunity[] {
  const out: Opportunity[] = [];
  for (const item of inventory) {
    const opp: Opportunity | null =
      // HIGH：索引风险 / 低质量 / 无 FAQ / 无 schema / 无内链
      item.indexed === false
        ? { page: item.url, issue: 'seoOpportunity.notIndexed', action: 'seoOpportunity.actionIndex', priority: 'HIGH' }
        : item.qualityScore < 60
          ? { page: item.url, issue: 'seoOpportunity.lowQuality', action: 'seoOpportunity.actionContent', priority: 'HIGH' }
          : !item.hasFAQ
            ? { page: item.url, issue: 'seoOpportunity.noFaq', action: 'seoOpportunity.actionFaq', priority: 'HIGH' }
            : !item.hasSchema
              ? { page: item.url, issue: 'seoOpportunity.noSchema', action: 'seoOpportunity.actionSchema', priority: 'HIGH' }
              : item.internalLinks < 6
                ? { page: item.url, issue: 'seoOpportunity.noLinks', action: 'seoOpportunity.actionLinks', priority: 'HIGH' }
                : // MEDIUM：CTR 低 / position 10-30（Search Console 数据可用时）
                  item.ctr != null && item.ctr < 0.01
                  ? { page: item.url, issue: 'seoOpportunity.noFaq', action: 'seoOpportunity.actionFaq', priority: 'MEDIUM' }
                  : item.position != null && item.position >= 10 && item.position <= 30
                    ? { page: item.url, issue: 'seoOpportunity.noFaq', action: 'seoOpportunity.actionFaq', priority: 'MEDIUM' }
                    : null;
    if (opp) out.push(opp);
  }
  const rank: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return out.sort((a, b) => rank[a.priority] - rank[b.priority]);
}

/** 汇总统计（dashboard 用） */
export function summarizeInventory(inventory: InventoryItem[]) {
  const byType: Record<string, number> = {};
  const byLang: Record<string, number> = {};
  let faqMissing = 0;
  let schemaMissing = 0;
  let lowQuality = 0;
  let sum = 0;
  for (const item of inventory) {
    byType[item.type] = (byType[item.type] ?? 0) + 1;
    byLang[item.lang] = (byLang[item.lang] ?? 0) + 1;
    if (!item.hasFAQ) faqMissing++;
    if (!item.hasSchema) schemaMissing++;
    if (item.qualityScore < 60) lowQuality++;
    sum += item.qualityScore;
  }
  const high = inventory.filter((i) => i.qualityScore >= 80).length;
  const medium = inventory.filter((i) => i.qualityScore >= 60 && i.qualityScore < 80).length;
  const low = lowQuality;
  return {
    total: inventory.length,
    byType,
    byLang,
    avgQuality: inventory.length ? Math.round(sum / inventory.length) : 0,
    qualityDist: { high, medium, low },
    faqMissing,
    schemaMissing,
    lowQuality,
  };
}
