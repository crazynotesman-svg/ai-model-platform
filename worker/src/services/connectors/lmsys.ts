/**
 * connectors/lmsys.ts —— LMSYS Chatbot Arena Connector（Phase 11.6）
 * 公开权威来源（trust_level 90，真实用户偏好 Elo）。Benchmark Sync Framework adapter。
 * 需记录 source + methodology + date（LMSYS Arena methodology：https://www.lmsys.org/blog/2023-05-03-arena/）。
 * 本阶段仅 adapter 接口，不自动覆盖生产 benchmark。
 */
import type { DataConnector, DataEventInput } from './types';

const NAME = 'LMSYS Chatbot Arena';

async function fetchLMSYS(): Promise<unknown> {
  // Arena Elo 数据（公开页面；解析映射待人工核验后启用）
  const res = await fetch('https://chat.lmsys.org/', {
    headers: { 'user-agent': 'aimodel-data-intelligence/0.1 (+https://aimodel.100ideas.net)' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`lmsys HTTP ${res.status}`);
  return { html: await res.text(), fetchedAt: new Date().toISOString() };
}

async function normalize(raw: unknown): Promise<DataEventInput[]> {
  return []; // adapter 就绪；Elo 解析 + 人工审批见 data-connectors.md
}

function validate(events: DataEventInput[]): DataEventInput[] {
  return events;
}

export const lmsysConnector: DataConnector = {
  name: NAME,
  fetch: fetchLMSYS,
  normalize,
  validate,
};
