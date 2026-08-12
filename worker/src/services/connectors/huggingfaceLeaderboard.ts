/**
 * connectors/huggingfaceLeaderboard.ts —— HuggingFace Open LLM Leaderboard Connector（Phase 11.9）
 * 字段：benchmark / score / model / version / date。来源 trust 70（社区）。
 * 流程：fetch → normalize → validate → createEvent → pending（禁止直接写库，缺字段丢弃）。
 */
import type { DataConnector, DataEventInput } from './types';

const NAME = 'HuggingFace Open LLM Leaderboard';
const SOURCE_URL = 'https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard';

async function fetchHF(): Promise<unknown> {
  const res = await fetch(SOURCE_URL, { headers: { 'user-agent': 'aimodel-data-intelligence/0.3 (+https://aimodel.100ideas.net)' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`huggingface HTTP ${res.status}`);
  return { html: await res.text(), fetchedAt: new Date().toISOString() };
}

async function normalize(raw: unknown): Promise<DataEventInput[]> {
  return []; // Leaderboard 数据解析待人工核验（避免伪事件）
}

function validate(events: DataEventInput[]): DataEventInput[] {
  return events.filter((e) => {
    const p = e.payload as Record<string, unknown>;
    return Boolean(p.benchmark && p.dataset && p.version) && typeof p.score === 'number';
  });
}

function createEvent(row: Record<string, unknown>): DataEventInput {
  return {
    eventType: 'BENCHMARK_UPDATED',
    entityType: 'benchmark',
    entityId: String(row.modelKey),
    payload: { benchmark: NAME, dataset: String(row.dataset ?? 'open-llm'), version: String(row.version ?? 'v1'), score: row.score, modelVersion: row.modelVersion, source: NAME, date: row.date, confidence: 70, sourceUrl: SOURCE_URL },
    sourceName: NAME,
    confidence: 70,
  };
}

export const huggingfaceLeaderboardConnector: DataConnector = { name: NAME, fetch: fetchHF, normalize, validate, createEvent };
