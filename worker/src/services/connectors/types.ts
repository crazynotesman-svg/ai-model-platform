/**
 * connectors/types.ts —— Data Connector 统一接口（Phase 11.6）
 *
 * 数据流：External Data → connector.fetch() → normalize() → validate() → DataEvent（pending）
 * 约束：connector 禁止直接写数据库；只产出 normalized event，交给 Event Processor 处理。
 */

/** 数据事件（与 migration 0011 data_events 对应） */
export interface DataEventInput {
  eventType: 'MODEL_CREATED' | 'MODEL_UPDATED' | 'PRICE_CHANGED' | 'BENCHMARK_UPDATED' | 'MODEL_DEPRECATED';
  entityType: 'model' | 'pricing' | 'benchmark';
  entityId: string; // 模型 slug 等
  payload: Record<string, unknown>; // 变更内容（JSON）
  sourceName: string; // 对应 data_sources.name
  confidence: number; // 0-100
}

/** Connector 标准化结果 */
export interface NormalizedResult {
  events: DataEventInput[];
  rawCount: number;
  errors: string[];
}

/** 统一 Connector 接口 */
export interface DataConnector {
  name: string; // 与 data_sources.name 对应（如 'OpenAI Pricing'）
  /** 拉取外部数据（官方端点/页面；无凭据时返回空并记录 notice） */
  fetch(): Promise<unknown>;
  /** 原始数据 → 标准化事件（diff 旧状态：context/价格变化等） */
  normalize(raw: unknown): Promise<DataEventInput[]>;
  /** 校验事件（必填字段/数值范围/来源匹配） */
  validate(events: DataEventInput[]): DataEventInput[];
  /** Phase 11.9：normalized 行 → 事件（含 source/confidence 注入；禁止直接写库） */
  createEvent?(row: Record<string, unknown>): DataEventInput;
}

/** 运行一个 connector 的完整流程：fetch → normalize → validate（不写库） */
export async function runConnector(c: DataConnector): Promise<NormalizedResult> {
  const errors: string[] = [];
  let raw: unknown;
  try {
    raw = await c.fetch();
  } catch (err) {
    return { events: [], rawCount: 0, errors: [`${c.name} fetch failed: ${(err as Error).message}`] };
  }
  if (raw == null || (Array.isArray(raw) && raw.length === 0)) {
    return { events: [], rawCount: 0, errors: [] };
  }
  try {
    const events = c.validate(await c.normalize(raw));
    return { events, rawCount: Array.isArray(raw) ? raw.length : 1, errors };
  } catch (err) {
    return { events: [], rawCount: 0, errors: [`${c.name} normalize failed: ${(err as Error).message}`] };
  }
}

/** 校验单个事件（通用规则） */
export function validateEvent(e: DataEventInput): string | null {
  if (!e.eventType || !e.entityType || !e.entityId) return 'missing required fields';
  if (e.confidence < 0 || e.confidence > 100) return 'confidence out of range';
  if (typeof e.payload !== 'object' || e.payload === null) return 'payload must be object';
  return null;
}
