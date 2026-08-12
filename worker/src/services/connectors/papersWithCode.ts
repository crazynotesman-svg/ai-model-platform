/**
 * connectors/papersWithCode.ts —— Papers with Code Connector（Phase 11.9）
 * 字段：paper / dataset / metric / score。来源 trust 90（论文-指标数据库）。
 * 流程：fetch → normalize → validate → createEvent → pending（禁止直接写库）。
 */
import type { DataConnector, DataEventInput } from './types';

const NAME = 'Papers with Code';
const SOURCE_URL = 'https://paperswithcode.com/llms';

async function fetchPWC(): Promise<unknown> {
  const res = await fetch(SOURCE_URL, { headers: { 'user-agent': 'aimodel-data-intelligence/0.3 (+https://aimodel.100ideas.net)' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`paperswithcode HTTP ${res.status}`);
  return { html: await res.text(), fetchedAt: new Date().toISOString() };
}

async function normalize(raw: unknown): Promise<DataEventInput[]> {
  return []; // 论文-指标表解析待人工核验
}

function validate(events: DataEventInput[]): DataEventInput[] {
  return events.filter((e) => {
    const p = e.payload as Record<string, unknown>;
    return Boolean(p.paper && p.dataset) && typeof p.score === 'number';
  });
}

function createEvent(row: Record<string, unknown>): DataEventInput {
  return {
    eventType: 'BENCHMARK_UPDATED',
    entityType: 'benchmark',
    entityId: String(row.modelKey),
    payload: { benchmark: NAME, dataset: String(row.dataset), version: String(row.version ?? 'v1'), score: row.score, modelVersion: row.modelVersion, paper: row.paper, paperUrl: row.paperUrl ?? null, source: NAME, date: row.date, confidence: 90, sourceUrl: SOURCE_URL },
    sourceName: NAME,
    confidence: 90,
  };
}

export const papersWithCodeConnector: DataConnector = { name: NAME, fetch: fetchPWC, normalize, validate, createEvent };
