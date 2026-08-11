/**
 * connectors/openai.ts —— OpenAI 官方数据 Connector（Phase 11.6）
 *
 * 发现：新模型 / context window / pricing 变化 → MODEL_UPDATED / PRICE_CHANGED（pending）。
 * 官方端点：定价页 https://openai.com/api/pricing/（HTML 渲染，需人工/解析器核验）；
 * 模型列表 https://platform.openai.com/docs/models。
 * 安全：本阶段只产出 pending 事件，不自动发布；实际解析映射由人工核验后启用。
 */
import type { DataConnector, DataEventInput } from './types';

const NAME = 'OpenAI Model Docs';

async function fetchOpenAI(): Promise<unknown> {
  // 官方定价页（公开，无凭据可访问；内容为 SSR/CSR 混合，解析留待核验）
  const res = await fetch('https://openai.com/api/pricing/', {
    headers: { 'user-agent': 'aimodel-data-intelligence/0.1 (+https://aimodel.100ideas.net)' },
  });
  if (!res.ok) throw new Error(`openai pricing HTTP ${res.status}`);
  return { html: await res.text(), fetchedAt: new Date().toISOString() };
}

async function normalize(raw: unknown): Promise<DataEventInput[]> {
  // 第一阶段：管道验证。HTML 解析（提取模型/价格）待人工核验映射后启用（data-connectors.md）。
  // 返回空事件 = 发现管道就绪但当前无自动解析；避免伪事件。
  return [];
}

function validate(events: DataEventInput[]): DataEventInput[] {
  return events;
}

export const openaiConnector: DataConnector = {
  name: NAME,
  fetch: fetchOpenAI,
  normalize,
  validate,
};
