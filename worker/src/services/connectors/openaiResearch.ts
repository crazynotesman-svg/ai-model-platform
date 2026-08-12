/**
 * connectors/openaiResearch.ts —— OpenAI Research / Release Notes Connector（Phase 11.9）
 * 官方发布说明（模型 release/update/deprecated + 能力评测依据）。
 * 流程：fetch → normalize → validate → createEvent → pending（禁止直接写库）。
 */
import type { DataConnector, DataEventInput } from './types';

const NAME = 'OpenAI Release Notes';
const SOURCE_URL = 'https://platform.openai.com/docs/changelog';

async function fetchOpenAIResearch(): Promise<unknown> {
  const res = await fetch(SOURCE_URL, { headers: { 'user-agent': 'aimodel-data-intelligence/0.3 (+https://aimodel.100ideas.net)' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`openai changelog HTTP ${res.status}`);
  return { html: await res.text(), fetchedAt: new Date().toISOString() };
}

async function normalize(raw: unknown): Promise<DataEventInput[]> {
  return []; // 发布说明解析待人工核验（避免伪 release 事件）
}

function validate(events: DataEventInput[]): DataEventInput[] {
  return events.filter((e) => {
    const p = e.payload as Record<string, unknown>;
    return Boolean(p.publishedAt) && (p.eventType === 'release' || p.eventType === 'update' || p.eventType === 'deprecated');
  });
}

function createEvent(row: Record<string, unknown>): DataEventInput {
  return {
    eventType: 'MODEL_UPDATED',
    entityType: 'model',
    entityId: String(row.modelKey),
    payload: { releaseEvent: row.eventType, publishedAt: row.publishedAt, sourceUrl: SOURCE_URL, notes: row.notes ?? null },
    sourceName: NAME,
    confidence: 100,
  };
}

export const openaiResearchConnector: DataConnector = { name: NAME, fetch: fetchOpenAIResearch, normalize, validate, createEvent };
