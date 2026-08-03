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

/** 模型详情（按 slug） */
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
  return row ? normalizeModel(row) : null;
}

/** D1 原始行（snake_case） */
interface ModelRow {
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
}

/** 行 → API 对象：解析 JSON 字段与语言列表 */
function normalizeModel(row: ModelRow): ModelRecord {
  let useCases: string[] | null = null;
  try {
    useCases = row.use_cases ? (JSON.parse(row.use_cases) as string[]) : null;
  } catch {
    useCases = null; // 非法 JSON 时安全降级
  }
  return {
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
