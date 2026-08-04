/**
 * 模型查询服务（D1）——列表 + 详情。
 *
 * 说明：
 * - 列表支持 search（模糊匹配 slug/名称/供应商）与 sort（白名单排序）；
 * - 名称/描述按请求语言（lang）本地化，缺语言回退英文/原文；
 * - languages 为该模型已提供翻译的语言列表（逗号串 → 数组）。
 */
import type { D1Database } from '@cloudflare/workers-types';

/** 列表排序白名单：API 值 → ORDER BY 子句（防 SQL 注入） */
const SORT_ORDERS: Record<string, string> = {
  newest: 'm.release_date DESC, m.id DESC',
  price_asc: 'pr.input_price ASC, pr.output_price ASC',
  price_desc: 'pr.input_price DESC, pr.output_price DESC',
  name: 'COALESCE(mt.name, m.slug) COLLATE NOCASE ASC',
  context: 'm.context_window DESC',
};

/** 列表/详情共用的查询字段（保持返回结构一致） */
const MODEL_SELECT = `
  m.id,
  m.slug,
  m.model_type,
  m.context_window,
  m.release_date,
  p.name AS provider_name,
  COALESCE(mt.name, m.slug) AS name,
  mt.description,
  mt.use_cases,
  pr.input_price,
  pr.output_price,
  pr.currency,
  pr.unit,
  (SELECT GROUP_CONCAT(language) FROM model_translations WHERE model_id = m.id) AS languages
`;

const MODEL_JOIN = `
  FROM models m
  JOIN providers p ON p.id = m.provider
  LEFT JOIN model_translations mt ON mt.model_id = m.id AND mt.language = ?
  LEFT JOIN pricing pr ON pr.model_id = m.id AND pr.currency = 'USD' AND pr.unit = 'per_1M_tokens'
`;

export interface ListModelsParams {
  lang: string;
  search?: string | null;
  sort?: string;
}

/** 模型列表（支持 search / sort） */
export async function listModels(
  db: D1Database,
  { lang, search, sort }: ListModelsParams,
): Promise<ModelRecord[]> {
  const orderBy = SORT_ORDERS[sort ?? 'newest'] ?? SORT_ORDERS.newest;
  // 参数顺序：1=lang, 2=search（search 为 null 时整个条件短路）
  const sql = `
    SELECT ${MODEL_SELECT}
    ${MODEL_JOIN}
    WHERE (? IS NULL OR m.slug LIKE '%' || ? || '%'
      OR COALESCE(mt.name, '') LIKE '%' || ? || '%'
      OR p.name LIKE '%' || ? || '%')
    ORDER BY ${orderBy}
  `;
  const { results } = await db
    .prepare(sql)
    .bind(lang, search, search, search, search)
    .all<ModelRow>();
  return (results ?? []).map(normalizeModel);
}

/** 模型详情（按 slug）；附带 capabilities（Phase 9.1） */
export async function getModelBySlug(
  db: D1Database,
  slug: string,
  lang: string,
): Promise<ModelRecord | null> {
  const sql = `
    SELECT ${MODEL_SELECT}
    ${MODEL_JOIN}
    WHERE m.slug = ?
  `;
  const row = await db.prepare(sql).bind(lang, slug).first<ModelRow>();
  if (!row) return null;

  const model = normalizeModel(row);
  // 能力列表：按能力名排序（vision/reasoning/coding/audio/function_calling/multimodal/long_context）
  const caps = await db
    .prepare(
      'SELECT capability, supported FROM model_capabilities WHERE model_id = ? ORDER BY capability',
    )
    .bind(row.id)
    .all<{ capability: string; supported: number }>();
  model.capabilities = (caps.results ?? []).map((c) => ({
    capability: c.capability,
    supported: c.supported === 1,
  }));
  return model;
}

/** D1 原始行（snake_case） */
interface ModelRow {
  id: number;
  slug: string;
  model_type: string;
  context_window: number | null;
  release_date: string | null;
  provider_name: string;
  name: string;
  description: string | null;
  use_cases: string | null;
  input_price: number | null;
  output_price: number | null;
  currency: string | null;
  unit: string | null;
  languages: string | null;
}

/** 模型能力项（Phase 9.1，仅详情接口返回） */
export interface ModelCapability {
  capability: string;
  supported: boolean;
}

/** API 返回的模型对象（camelCase） */
export interface ModelRecord {
  slug: string;
  modelType: string;
  contextWindow: number | null;
  releaseDate: string | null;
  providerName: string;
  name: string;
  description: string | null;
  useCases: string[] | null;
  inputPrice: number | null;
  outputPrice: number | null;
  currency: string | null;
  unit: string | null;
  languages: string[];
  /** 能力列表（详情接口附带；列表接口不返回，保持旧字段兼容） */
  capabilities?: ModelCapability[];
}

/** 行 → API 对象：解析 JSON 字段与语言列表 */
function normalizeModel(row: ModelRow): ModelRecord {
  let useCases: string[] | null = null;
  try {
    useCases = row.use_cases ? (JSON.parse(row.use_cases) as string[]) : null;
  } catch {
    useCases = null; // 非法 JSON 时安全降级
  }  return {
    slug: row.slug,
    modelType: row.model_type,
    contextWindow: row.context_window,
    releaseDate: row.release_date,
    providerName: row.provider_name,
    name: row.name,
    description: row.description,
    useCases,
    inputPrice: row.input_price,
    outputPrice: row.output_price,
    currency: row.currency,
    unit: row.unit,
    languages: row.languages ? row.languages.split(',') : [],
  };
}

/** 价格历史记录（camelCase，供 /api/models/:slug/pricing-history） */
export interface PricingHistoryRecord {
  id: number;
  modelId: number;
  inputPrice: number;
  outputPrice: number;
  currency: string;
  unit: string;
  effectiveDate: string;
  source: string;
  createdAt: string | null;
}

/**
 * 模型价格历史（时间升序：价格随时间的变化序列）。
 * 模型不存在返回 null（由路由层映射 404）。
 */
export async function getPricingHistory(
  db: D1Database,
  slug: string,
  opts: { currency?: string | null; unit?: string | null } = {},
): Promise<PricingHistoryRecord[] | null> {
  const model = await db.prepare('SELECT id FROM models WHERE slug = ? LIMIT 1').bind(slug).first<{ id: number }>();
  if (!model) return null;

  const sql = `
    SELECT ph.id, ph.model_id, ph.input_price, ph.output_price, ph.currency, ph.unit,
           ph.effective_date, ph.source, ph.created_at
    FROM pricing_history ph
    WHERE ph.model_id = ?
      AND (? IS NULL OR ph.currency = ?)
      AND (? IS NULL OR ph.unit = ?)
    ORDER BY ph.effective_date ASC, ph.id ASC
  `;
  const { results } = await db
    .prepare(sql)
    .bind(model.id, opts.currency ?? null, opts.currency ?? null, opts.unit ?? null, opts.unit ?? null)
    .all();
  return (results ?? []).map((row) => ({
    id: row.id as number,
    modelId: row.model_id as number,
    inputPrice: row.input_price as number,
    outputPrice: row.output_price as number,
    currency: row.currency as string,
    unit: row.unit as string,
    effectiveDate: row.effective_date as string,
    source: row.source as string,
    createdAt: (row.created_at as string | null) ?? null,
  }));
}

/** 基准结果记录（camelCase，供 /api/models/:slug/benchmarks） */
export interface BenchmarkRecord {
  category: string;
  score: number;
  rank: number | null;
  dataset: string;
  version: string;
  source: string;
  testedAt: string | null;
}

/**
 * 模型基准结果（按 category 排序）。模型不存在返回 model=null（路由层映射 404）。
 */
export async function getBenchmarks(
  db: D1Database,
  slug: string,
  lang: string,
): Promise<{ model: { slug: string; name: string } | null; benchmarks: BenchmarkRecord[] }> {
  const model = await db
    .prepare(
      `SELECT m.id, m.slug, COALESCE(mt.name, m.slug) AS name
       FROM models m
       LEFT JOIN model_translations mt ON mt.model_id = m.id AND mt.language = ?
       WHERE m.slug = ?
       LIMIT 1`,
    )
    .bind(lang, slug)
    .first<{ id: number; slug: string; name: string }>();
  if (!model) return { model: null, benchmarks: [] };

  const { results } = await db
    .prepare(
      `SELECT bc.slug AS category, br.score, br.rank, br.dataset, br.version, br.source, br.tested_at
       FROM benchmark_results br
       JOIN benchmark_categories bc ON br.category_id = bc.id
       WHERE br.model_id = ?
       ORDER BY bc.slug ASC`,
    )
    .bind(model.id)
    .all();
  return {
    model: { slug: model.slug, name: model.name },
    benchmarks: (results ?? []).map((row) => ({
      category: row.category as string,
      score: row.score as number,
      rank: (row.rank as number | null) ?? null,
      dataset: row.dataset as string,
      version: row.version as string,
      source: row.source as string,
      testedAt: (row.tested_at as string | null) ?? null,
    })),
  };
}
