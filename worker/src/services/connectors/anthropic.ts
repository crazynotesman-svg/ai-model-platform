/**
 * connectors/anthropic.ts —— Anthropic 官方数据 Connector（Phase 11.6）
 * 官方端点：定价 https://www.anthropic.com/pricing；模型文档 https://docs.anthropic.com/en/docs/about-claude/models
 * 安全：只产出 pending 事件；HTML 解析映射待人工核验（data-connectors.md）。
 */
import type { DataConnector, DataEventInput } from './types';

const NAME = 'Anthropic Model Docs';

async function fetchAnthropic(): Promise<unknown> {
  const res = await fetch('https://www.anthropic.com/pricing', {
    headers: { 'user-agent': 'aimodel-data-intelligence/0.1 (+https://aimodel.100ideas.net)' },
  });
  if (!res.ok) throw new Error(`anthropic pricing HTTP ${res.status}`);
  return { html: await res.text(), fetchedAt: new Date().toISOString() };
}

async function normalize(raw: unknown): Promise<DataEventInput[]> {
  return []; // 解析映射待人工核验后启用
}

function validate(events: DataEventInput[]): DataEventInput[] {
  return events;
}

export const anthropicConnector: DataConnector = {
  name: NAME,
  fetch: fetchAnthropic,
  normalize,
  validate,
};
