/**
 * modelDiscovery/openai.ts —— OpenAI Model Discovery Connector（Phase 12.1）
 * 官方模型文档端点发现（新模型/新版本/deprecated）。解析映射待人工核验后启用。
 * 流程：fetch → normalize → validate → createEvent → MODEL_DISCOVERED（pending）
 */
import type { ModelDiscoveryConnector, ModelDiscoveryRow } from './types';
import { discoveryToEvent } from './types';
import type { DataEventInput } from '../../services/connectors/types';

const SOURCE_URL = 'https://platform.openai.com/docs/models';

async function fetchOpenAIModels(): Promise<unknown> {
  const res = await fetch(SOURCE_URL, { headers: { 'user-agent': 'aimodel-data-intelligence/0.4 (+https://aimodel.100ideas.net)' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`openai models HTTP ${res.status}`);
  return { html: await res.text(), fetchedAt: new Date().toISOString() };
}

async function normalize(raw: unknown): Promise<ModelDiscoveryRow[]> {
  return []; // 模型文档解析（新模型/版本）待人工核验映射（避免伪发现）
}

function validate(rows: ModelDiscoveryRow[]): ModelDiscoveryRow[] {
  return rows.filter((r) => r.modelKey && (r.status === 'active' || r.status === 'deprecated' || r.status === 'preview'));
}

export const openaiDiscovery: ModelDiscoveryConnector = {
  name: 'OpenAI Model Docs',
  providerSlug: 'openai',
  fetch: fetchOpenAIModels,
  normalize,
  validate,
  createEvent(row: ModelDiscoveryRow): DataEventInput {
    return discoveryToEvent(openaiDiscovery, row);
  },
};
