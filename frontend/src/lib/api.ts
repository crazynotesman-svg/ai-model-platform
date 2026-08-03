/**
 * Worker API 客户端：模型列表/详情的类型与请求封装。
 * API 基址：PUBLIC_API_BASE（环境变量）→ 开发默认 http://localhost:8787（wrangler dev）。
 */
import type { Locale } from '../i18n/locales';

export const API_BASE: string = import.meta.env.PUBLIC_API_BASE ?? 'http://localhost:8787';

/** 与 Worker /api/models 返回结构一致的模型对象 */
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

/** 列表排序（与 Worker SORT_ORDERS 白名单一致） */
export type ModelSort = 'newest' | 'price_asc' | 'price_desc' | 'name' | 'context';

export interface FetchModelsParams {
  lang: Locale;
  search?: string;
  sort?: ModelSort;
  signal?: AbortSignal;
}

/** 获取模型列表（search 模糊匹配、sort 白名单排序） */
export async function fetchModels({
  lang,
  search,
  sort,
  signal,
}: FetchModelsParams): Promise<ModelRecord[]> {
  const params = new URLSearchParams({ lang });
  if (search) params.set('search', search);
  if (sort && sort !== 'newest') params.set('sort', sort);
  const res = await fetch(`${API_BASE}/api/models?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = (await res.json()) as { models: ModelRecord[] };
  return data.models;
}
