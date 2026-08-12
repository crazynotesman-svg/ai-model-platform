/**
 * connectors/mlcommons.ts —— MLCommons MLPerf Connector（Phase 11.9）
 * MLPerf Inference / Training 官方榜单（trust 90）。
 * 流程：fetch → normalize → validate → createEvent → pending（禁止直接写库）。
 */
import type { DataConnector, DataEventInput } from './types';

const NAME = 'MLCommons MLPerf';
const SOURCE_URL = 'https://mlcommons.org/benchmarks/inference-datacenter/';

async function fetchMLCommons(): Promise<unknown> {
  const res = await fetch(SOURCE_URL, { headers: { 'user-agent': 'aimodel-data-intelligence/0.3 (+https://aimodel.100ideas.net)' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`mlcommons HTTP ${res.status}`);
  return { html: await res.text(), fetchedAt: new Date().toISOString() };
}

async function normalize(raw: unknown): Promise<DataEventInput[]> {
  return []; // MLPerf 榜单解析待人工核验
}

function validate(events: DataEventInput[]): DataEventInput[] {
  return events.filter((e) => {
    const p = e.payload as Record<string, unknown>;
    return Boolean(p.dataset) && typeof p.score === 'number';
  });
}

function createEvent(row: Record<string, unknown>): DataEventInput {
  return {
    eventType: 'BENCHMARK_UPDATED',
    entityType: 'benchmark',
    entityId: String(row.modelKey),
    payload: { benchmark: NAME, dataset: String(row.dataset), version: String(row.version ?? 'mlperf-latest'), score: row.score, modelVersion: row.modelVersion, source: NAME, date: row.date, confidence: 90, sourceUrl: SOURCE_URL },
    sourceName: NAME,
    confidence: 90,
  };
}

export const mlcommonsConnector: DataConnector = { name: NAME, fetch: fetchMLCommons, normalize, validate, createEvent };
