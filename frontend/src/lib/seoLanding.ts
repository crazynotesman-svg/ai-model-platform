/**
 * seoLanding.ts —— Programmatic SEO 数据工具库（Phase 11.3）
 *
 * 只读 model-catalog.json（构建期 D1 导出），禁止 runtime API。
 * 提供三类 landing 页数据：
 *  - getUseCaseModels()：Use Case 页（coding/reasoning/math/vision/writing/chatbot/long-context/cheap-api）
 *  - getCategoryModels()：Category 页（open-source/vision/reasoning/cheap）
 *  - getComparisonIntent()：Comparison Intent 页（gpt-4o-vs-claude-sonnet-4/best-chatbot/best-coding）
 *
 * 所有排序基于 catalog 真实数据（benchmark score / capability / price / context / ranking）。
 * 开源名单 OPEN_SOURCE_PROVIDERS 为已知事实（Meta Llama / DeepSeek / Mistral / Qwen 系列），
 * 待数据库增加 is_open_source 字段后迁移（见 docs/programmatic-seo-design.md）。
 */

export interface LandingModel {
  slug: string;
  name: string;
  providerName: string;
  score: number; // 该场景排序分（口径随场景不同，展示时说明）
  overall: number | null;
  benchmark: number | null;
  inputPrice: number | null;
  outputPrice: number | null;
  contextWindow: number | null;
  capabilities: { capability: string; supported: boolean }[];
}

interface CatalogEntry {
  slug: string;
  providerName: string;
  contextWindow: number | null;
  inputPrice: number | null;
  outputPrice: number | null;
  translations?: Partial<Record<string, { name?: string; description?: string | null } | undefined>>;
  capabilities?: { capability: string; supported: boolean }[];
  benchmarks?: { category: string; score: number; dataset: string; version: string }[];
  ranking?: { overall: number; benchmark: number; capability: number; price: number; context: number };
}

type Catalog = Record<string, CatalogEntry>;

/** Use Case 场景 slug 列表（getStaticPaths 与校验共用） */
export const USE_CASE_SLUGS = [
  'coding',
  'reasoning',
  'math',
  'vision',
  'writing',
  'chatbot',
  'long-context',
  'cheap-api',
] as const;

/** Category slug 列表 */
export const CATEGORY_SLUGS = ['open-source-models', 'vision-models', 'reasoning-models', 'cheap-models'] as const;

/** Comparison Intent slug 列表 */
export const INTENT_SLUGS = ['gpt-4o-vs-claude-sonnet-4', 'best-chatbot-model', 'best-coding-model'] as const;

/** 开源厂商（社区公认开源系列：Llama / DeepSeek / Mistral / Qwen；待 DB 字段化） */
const OPEN_SOURCE_PROVIDERS = ['Meta', 'DeepSeek', 'Mistral', 'Alibaba'];

/** 能力支持查询 */
const hasCap = (m: CatalogEntry, cap: string): boolean =>
  (m.capabilities ?? []).find((c) => c.capability === cap)?.supported ?? false;

/** 某分类 benchmark 最高分（无则 null） */
const benchScore = (m: CatalogEntry, cat: string): number | null => {
  const scores = (m.benchmarks ?? []).filter((b) => b.category === cat).map((b) => b.score);
  return scores.length ? Math.max(...scores) : null;
};

/** 模型 → LandingModel（本地化名称） */
const toModel = (m: CatalogEntry, lang: string, score: number): LandingModel => ({
  slug: m.slug,
  name: m.translations?.[lang]?.name ?? m.translations?.en?.name ?? m.slug,
  providerName: m.providerName,
  score,
  overall: m.ranking?.overall ?? null,
  benchmark: m.ranking?.benchmark ?? null,
  inputPrice: m.inputPrice,
  outputPrice: m.outputPrice,
  contextWindow: m.contextWindow,
  capabilities: m.capabilities ?? [],
});

const sortDesc = (arr: LandingModel[]) => arr.sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));

/** Use Case：Top5 推荐模型（评分口径随场景，见 docs/programmatic-seo-design.md） */
export function getUseCaseModels(uc: string, lang: string, catalog: Catalog): LandingModel[] {
  const list: LandingModel[] = [];
  for (const m of Object.values(catalog)) {
    let score: number | null = null;
    switch (uc) {
      case 'coding':
      case 'reasoning':
      case 'math':
      case 'vision':
        score = benchScore(m, uc); // 该 Benchmark 分类最高分
        break;
      case 'writing':
        score = m.ranking?.overall ?? null; // 通用能力强（无 writing 专用数据）
        break;
      case 'chatbot':
        score = m.ranking?.overall ?? null; // 通用对话能力（整体评分）
        break;
      case 'long-context':
        score = m.contextWindow != null ? m.contextWindow : null; // 上下文越大越好
        break;
      case 'cheap-api':
        score = m.inputPrice != null ? -m.inputPrice : null; // 价格越低越好（负号升序）
        break;
    }
    if (score != null) list.push(toModel(m, lang, score));
  }
  return sortDesc(list).slice(0, 5);
}

/** Category：模型列表（Top10 或全量） */
export function getCategoryModels(cat: string, lang: string, catalog: Catalog): LandingModel[] {
  const list: LandingModel[] = [];
  for (const m of Object.values(catalog)) {
    let ok = false;
    let score: number | null = null;
    switch (cat) {
      case 'open-source-models':
        ok = OPEN_SOURCE_PROVIDERS.includes(m.providerName);
        score = m.ranking?.overall ?? 0;
        break;
      case 'vision-models':
        ok = hasCap(m, 'vision');
        score = m.ranking?.overall ?? 0;
        break;
      case 'reasoning-models':
        ok = hasCap(m, 'reasoning') || benchScore(m, 'reasoning') != null;
        score = m.ranking?.overall ?? 0;
        break;
      case 'cheap-models':
        ok = m.inputPrice != null;
        score = m.inputPrice != null ? -m.inputPrice : null; // 价格升序
        break;
    }
    if (ok && score != null) list.push(toModel(m, lang, score));
  }
  const sorted = sortDesc(list);
  return cat === 'cheap-models' ? sorted.slice(0, 10) : sorted.slice(0, 10);
}

export interface ComparisonIntent {
  /** 意图描述标题（i18n 键由页面负责） */
  pairSlugs: [string, string] | null; // gpt-4o-vs-claude-sonnet-4 专用
  /** 目标模型 slug（best-* 意图） */
  targetSlug: string | null;
  models: LandingModel[]; // 相关模型（≤3）
}

/** Comparison Intent：复用 catalog 数据（不复制 compare 算法，仅取数据展示 + 指向现有 compare 页） */
export function getComparisonIntent(slug: string, lang: string, catalog: Catalog): ComparisonIntent {
  if (slug === 'gpt-4o-vs-claude-sonnet-4') {
    const a = catalog['openai/gpt-4o'];
    const b = catalog['anthropic/claude-sonnet-4'];
    const list: LandingModel[] = [];
    if (a) list.push(toModel(a, lang, a.ranking?.overall ?? 0));
    if (b) list.push(toModel(b, lang, b.ranking?.overall ?? 0));
    return { pairSlugs: ['openai/gpt-4o', 'anthropic/claude-sonnet-4'], targetSlug: null, models: list };
  }
  if (slug === 'best-chatbot-model') {
    const top = sortDesc(
      Object.values(catalog)
        .filter((m) => m.ranking?.overall != null)
        .map((m) => toModel(m, lang, m.ranking?.overall ?? 0)),
    )[0];
    return { pairSlugs: null, targetSlug: top?.slug ?? null, models: top ? [top] : [] };
  }
  // best-coding-model
  const top = sortDesc(
    Object.values(catalog)
      .filter((m) => benchScore(m, 'coding') != null)
      .map((m) => toModel(m, lang, benchScore(m, 'coding') ?? 0)),
  )[0];
  return { pairSlugs: null, targetSlug: top?.slug ?? null, models: top ? [top] : [] };
}
