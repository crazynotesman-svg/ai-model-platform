/**
 * connectors/lmsys.ts —— LMSYS Chatbot Arena Connector（Phase 11.9 扩展）
 * 字段：ranking / elo / votes / date。来源 trust 90（真实用户偏好）。
 * 流程：fetch → normalize → validate → createEvent → data_events（pending，禁止直接写库）。
 */
import type { DataConnector, DataEventInput } from './types';

const NAME = 'LMSYS Chatbot Arena';
const SOURCE_URL = 'https://chat.lmsys.org/';

async function fetchLMSYS(): Promise<unknown> {
  const res = await fetch(SOURCE_URL, { headers: { 'user-agent': 'aimodel-data-intelligence/0.3 (+https://aimodel.100ideas.net)' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`lmsys HTTP ${res.status}`);
  return { html: await res.text(), fetchedAt: new Date().toISOString() };
}

async function normalize(raw: unknown): Promise<DataEventInput[]> {
  return []; // Elo 榜单解析映射待人工核验（避免伪事件）
}

function validate(events: DataEventInput[]): DataEventInput[] {
  return events.filter((e) => {
    const p = e.payload as Record<string, unknown>;
    return typeof p.elo === 'number' && typeof p.votes === 'number' && typeof p.date === 'string';
  });
}

function createEvent(row: Record<string, unknown>): DataEventInput {
  return {
    eventType: 'BENCHMARK_UPDATED',
    entityType: 'benchmark',
    entityId: String(row.modelKey),
    payload: { benchmark: NAME, dataset: 'lmsys-arena', version: String(row.version ?? 'v1'), score: row.elo, votes: row.votes, modelVersion: row.modelVersion, source: NAME, date: row.date, confidence: 90, sourceUrl: SOURCE_URL },
    sourceName: NAME,
    confidence: 90,
  };
}

export const lmsysConnector: DataConnector = { name: NAME, fetch: fetchLMSYS, normalize, validate, createEvent };
