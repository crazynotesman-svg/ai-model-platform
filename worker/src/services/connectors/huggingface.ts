/**
 * connectors/huggingface.ts —— HuggingFace Open LLM Leaderboard Connector（Phase 11.6）
 * 社区来源（trust_level 70）。Benchmark Sync Framework：本阶段仅 adapter 接口，
 * 不自动覆盖生产数据（External Data → Validation → Approval）。
 */
import type { DataConnector, DataEventInput } from './types';

const NAME = 'HuggingFace Open LLM Leaderboard';

async function fetchHF(): Promise<unknown> {
  // Leaderboard 数据集（公开 JSON；解析映射待人工核验后启用）
  const res = await fetch('https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard', {
    headers: { 'user-agent': 'aimodel-data-intelligence/0.1 (+https://aimodel.100ideas.net)' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`huggingface HTTP ${res.status}`);
  return { html: await res.text(), fetchedAt: new Date().toISOString() };
}

async function normalize(raw: unknown): Promise<DataEventInput[]> {
  return []; // adapter 就绪；数据解析与人工审批流程见 data-connectors.md
}

function validate(events: DataEventInput[]): DataEventInput[] {
  return events;
}

export const huggingfaceConnector: DataConnector = {
  name: NAME,
  fetch: fetchHF,
  normalize,
  validate,
};
