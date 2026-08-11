/**
 * connectors/googlePricing.ts —— Google Gemini 官方 Pricing Connector v2（Phase 11.7）
 * 采集 input/output/cached/batch price + context + effective date；官方 confidence 95 → pending。
 */
import type { DataConnector, DataEventInput } from './types';

const NAME = 'Google Gemini Pricing';
const SOURCE_URL = 'https://ai.google.dev/pricing';

async function fetchGooglePricing(): Promise<unknown> {
  const res = await fetch(SOURCE_URL, {
    headers: { 'user-agent': 'aimodel-data-intelligence/0.2 (+https://aimodel.100ideas.net)' },
  });
  if (!res.ok) throw new Error(`google pricing HTTP ${res.status}`);
  return { html: await res.text(), fetchedAt: new Date().toISOString() };
}

async function parsePricing(raw: unknown): Promise<{ modelKey: string; inputPrice: number; outputPrice: number; cachedPrice: number | null; batchPrice: number | null; contextWindow: number | null; effectiveDate: string }[]> {
  return []; // 解析映射待人工核验
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
    confidence: 95,
  }));
}

function validate(events: DataEventInput[]): DataEventInput[] {
  return events.filter((e) => {
    const p = e.payload as Record<string, unknown>;
    return typeof p.inputPrice === 'number' && typeof p.outputPrice === 'number' && typeof p.effectiveDate === 'string';
  });
}

export const googlePricingConnector: DataConnector = {
  name: NAME,
  fetch: fetchGooglePricing,
  normalize,
  validate,
};
