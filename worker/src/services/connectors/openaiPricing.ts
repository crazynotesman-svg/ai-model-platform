/**
 * connectors/openaiPricing.ts —— OpenAI 官方 Pricing Connector v2（Phase 11.7）
 *
 * 采集：input / output / cached / batch price + context window + effective date。
 * 每项必须包含 source_url / source_id / verified_at / confidence。
 * 官方来源 confidence ≥ 95 → 进入 pending event（不直接覆盖生产）。
 * 解析映射（HTML → 结构化字段）待人工核验后启用；结构校验已就绪。
 */
import type { DataConnector, DataEventInput } from './types';

export interface PriceRow {
  modelKey: string;        // 规范化模型名（gpt-4o）
  inputPrice: number;      // USD / per 1M tokens
  outputPrice: number;
  cachedPrice: number | null;   // 缓存输入价（如适用）
  batchPrice: number | null;    // 批量价（如适用）
  contextWindow: number | null;
  effectiveDate: string;        // YYYY-MM-DD
}

const NAME = 'OpenAI Pricing';
const SOURCE_URL = 'https://openai.com/api/pricing/';

async function fetchOpenAIPricing(): Promise<unknown> {
  const res = await fetch(SOURCE_URL, {
    headers: { 'user-agent': 'aimodel-data-intelligence/0.2 (+https://aimodel.100ideas.net)' },
  });
  if (!res.ok) throw new Error(`openai pricing HTTP ${res.status}`);
  return { html: await res.text(), fetchedAt: new Date().toISOString() };
}

/** 解析：第一阶段返回空（HTML 解析映射待人工核验，见 data-connectors.md）；结构校验就绪 */
async function parsePricing(raw: unknown): Promise<PriceRow[]> {
  return [];
}

async function normalize(raw: unknown): Promise<DataEventInput[]> {
  const rows = await parsePricing(raw);
  return rows.map((r) => ({
    eventType: 'PRICE_CHANGED' as const,
    entityType: 'pricing' as const,
    entityId: r.modelKey,
    payload: {
      inputPrice: r.inputPrice,
      outputPrice: r.outputPrice,
      cachedPrice: r.cachedPrice,
      batchPrice: r.batchPrice,
      contextWindow: r.contextWindow,
      effectiveDate: r.effectiveDate,
      sourceUrl: SOURCE_URL,
    },
    sourceName: NAME,
    confidence: 95, // 官方定价 ≥95（来源可信，见 trust-score-v3）
  }));
}

function validate(events: DataEventInput[]): DataEventInput[] {
  return events.filter((e) => {
    const p = e.payload as Record<string, unknown>;
    return typeof p.inputPrice === 'number' && typeof p.outputPrice === 'number' && typeof p.effectiveDate === 'string';
  });
}

export const openaiPricingConnector: DataConnector = {
  name: NAME,
  fetch: fetchOpenAIPricing,
  normalize,
  validate,
};
