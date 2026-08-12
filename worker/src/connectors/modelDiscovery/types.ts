/**
 * modelDiscovery/types.ts —— Model Discovery Connector（Phase 12.1 Part E）
 *
 * 统一接口：fetch → normalize → validate → createEvent → MODEL_DISCOVERED（pending）
 * 禁止直接写 models：官方来源 → connector → normalize → validation → data_events → approve → production
 */
import type { DataEventInput } from '../../services/connectors/types';

export interface ModelDiscoveryConnector {
  name: string; // 与 data_sources.name 对应
  providerSlug: string;
  fetch(): Promise<unknown>;
  normalize(raw: unknown): Promise<ModelDiscoveryRow[]>;
  validate(rows: ModelDiscoveryRow[]): ModelDiscoveryRow[];
  createEvent(row: ModelDiscoveryRow): DataEventInput;
}

export interface ModelDiscoveryRow {
  modelKey: string;      // 规范化 slug（provider/model）
  modelType: string;     // chat / reasoning / coding / vision
  contextWindow: number | null;
  releaseDate: string | null;
  family: string | null;
  version: string | null;
  status: 'active' | 'deprecated' | 'preview';
  changes: Record<string, unknown>; // 相对上次的变更
  sourceUrl: string;
}

/** 将发现行转为 MODEL_DISCOVERED / MODEL_UPDATED 事件（pending） */
export function discoveryToEvent(c: ModelDiscoveryConnector, row: ModelDiscoveryRow): DataEventInput {
  const isNew = Object.keys(row.changes).length === 0;
  return {
    eventType: isNew ? 'MODEL_DISCOVERED' : 'MODEL_UPDATED',
    entityType: 'model',
    entityId: row.modelKey,
    payload: {
      provider: c.providerSlug,
      model: row.modelKey,
      modelType: row.modelType,
      contextWindow: row.contextWindow,
      releaseDate: row.releaseDate,
      family: row.family,
      version: row.version,
      status: row.status,
      changes: row.changes,
      source: c.name,
      sourceUrl: row.sourceUrl,
      detectedAt: new Date().toISOString(),
    },
    sourceName: c.name,
    confidence: 95, // 官方来源（pending 等待人工核验）
  };
}
