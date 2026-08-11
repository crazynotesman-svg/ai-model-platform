/**
 * connectors/google.ts —— Google Gemini 官方数据 Connector（Phase 11.6）
 * 官方端点：定价 https://ai.google.dev/pricing；模型文档 https://ai.google.dev/gemini-api/docs/models
 * 安全：只产出 pending 事件；解析映射待人工核验。
 */
import type { DataConnector, DataEventInput } from './types';

const NAME = 'Google Gemini Model Docs';

async function fetchGoogle(): Promise<unknown> {
  const res = await fetch('https://ai.google.dev/pricing', {
    headers: { 'user-agent': 'aimodel-data-intelligence/0.1 (+https://aimodel.100ideas.net)' },
  });
  if (!res.ok) throw new Error(`google pricing HTTP ${res.status}`);
  return { html: await res.text(), fetchedAt: new Date().toISOString() };
}

async function normalize(raw: unknown): Promise<DataEventInput[]> {
  return []; // 解析映射待人工核验后启用
}

function validate(events: DataEventInput[]): DataEventInput[] {
  return events;
}

export const googleConnector: DataConnector = {
  name: NAME,
  fetch: fetchGoogle,
  normalize,
  validate,
};
