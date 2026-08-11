/**
 * eventProcessor.ts —— 数据事件处理器（Phase 11.6）
 *
 * 读取 pending events（管理员 approve 后 status=processed 前被批准？设计：approve API 将事件标记
 * 为 approved 并立即在此执行 apply；或 processor 处理 status='pending' 且 confidence>=阈值？
 *
 * 安全设计（本阶段）：事件默认 pending。approve API（POST /api/v1/data-events/:id/approve）
 * 校验置信度后调用 applyEvent() 写入业务表，成功后 status=processed；失败 status=failed + error。
 *
 * 事件应用：
 *   MODEL_UPDATED     → 更新 models（context_window 等）+ 追加 data_verifications
 *   PRICE_CHANGED     → 追加 pricing_history（新价格记录）
 *   BENCHMARK_UPDATED → 追加 benchmark_results（新 score 记录）
 *   MODEL_CREATED / MODEL_DEPRECATED → 记录（不自动建/删模型，需人工数据库操作）
 */
import type { DataEventInput } from './connectors/types';

interface Row {
  event_type: string;
  entity_type: string;
  entity_id: string;
  payload: string;
  source_id: number | null;
  confidence: number;
}

/** 应用单个事件到业务表（approve 后调用） */
export async function applyEvent(db: D1Database, row: Row): Promise<void> {
  const payload = JSON.parse(row.payload) as Record<string, unknown>;
  switch (row.event_type) {
    case 'MODEL_UPDATED': {
      // 更新 models：context_window / 其他元数据（只更新 payload 提供且非空字段）
      const sets: string[] = [];
      const binds: unknown[] = [];
      if (payload.contextWindow != null) {
        sets.push('context_window = ?');
        binds.push(payload.contextWindow as number);
      }
      if (sets.length > 0) {
        binds.push(row.entity_id);
        await db.prepare(`UPDATE models SET ${sets.join(', ')} WHERE slug = ?`).bind(...binds).run();
      }
      // 记录验证
      await db
        .prepare(
          `INSERT INTO data_verifications (entity_type, entity_id, source_id, verified_at, verification_status, confidence_score, notes)
           VALUES ('model', ?, ?, datetime('now'), 'verified', ?, ?)`,
        )
        .bind(row.entity_id, row.source_id, row.confidence, `event ${row.event_type}`)
        .run();
      break;
    }
    case 'PRICE_CHANGED': {
      const model = await db.prepare('SELECT id FROM models WHERE slug = ?').bind(row.entity_id).first<{ id: number }>();
      if (!model) throw new Error(`model not found: ${row.entity_id}`);
      const now = new Date().toISOString().slice(0, 10);
      await db
        .prepare(
          `INSERT INTO pricing_history (model_id, input_price, output_price, currency, unit, effective_date, source_id, confidence, verified_at)
           VALUES (?, ?, ?, 'USD', 'per_1M_tokens', ?, ?, ?, datetime('now'))`,
        )
        .bind(model.id, payload.inputPrice as number, payload.outputPrice as number, now, row.source_id, row.confidence)
        .run();
      // 同步当前 pricing 表（最新价）
      await db
        .prepare(
          `INSERT INTO pricing (model_id, input_price, output_price, currency, unit) VALUES (?, ?, ?, 'USD', 'per_1M_tokens')
           ON CONFLICT(model_id, currency, unit) DO UPDATE SET input_price = excluded.input_price, output_price = excluded.output_price`,
        )
        .bind(model.id, payload.inputPrice as number, payload.outputPrice as number)
        .run();
      break;
    }
    case 'BENCHMARK_UPDATED': {
      // 需要 category_id/dataset/version（payload 提供）；不自动覆盖同 dataset 记录，追加新版本行
      const model = await db.prepare('SELECT id FROM models WHERE slug = ?').bind(row.entity_id).first<{ id: number }>();
      if (!model) throw new Error(`model not found: ${row.entity_id}`);
      const cat = await db
        .prepare('SELECT id FROM benchmark_categories WHERE slug = ?')
        .bind(payload.category as string)
        .first<{ id: number }>();
      if (!cat) throw new Error(`benchmark category not found: ${payload.category}`);
      await db
        .prepare(
          `INSERT INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, confidence, source_id, verification_status)
           VALUES (?, ?, ?, ?, ?, ?, 'connector', ?, ?, ?, 'verified')
           ON CONFLICT(model_id, category_id, dataset, version) DO UPDATE SET score = excluded.score, confidence = excluded.confidence, verification_status = 'verified'`,
        )
        .bind(model.id, cat.id, payload.score as number, payload.rank ?? null, payload.dataset as string, payload.version as string, payload.testedAt ?? new Date().toISOString().slice(0, 10), row.confidence, row.source_id)
        .run();
      break;
    }
    default:
      // MODEL_CREATED / MODEL_DEPRECATED：记录为 processed（人工数据库操作流程，见 docs/data-connectors.md）
      break;
  }
}

/** 获取所有 pending 事件（Verification Queue） */
export async function listPendingEvents(db: D1Database): Promise<unknown[]> {
  const { results } = await db
    .prepare(
      `SELECT e.id, e.event_type, e.entity_type, e.entity_id, e.payload, e.confidence, e.status, e.created_at,
              COALESCE(s.name, 'unknown') AS source_name, s.trust_level
       FROM data_events e LEFT JOIN data_sources s ON e.source_id = s.id
       WHERE e.status = 'pending'
       ORDER BY e.created_at ASC`,
    )
    .all();
  return (results ?? []).map((r) => ({
    id: r.id,
    eventType: r.event_type,
    entityType: r.entity_type,
    entityId: r.entity_id,
    payload: JSON.parse(String(r.payload)),
    confidence: r.confidence,
    status: r.status,
    createdAt: r.created_at,
    source: r.source_name,
    trustLevel: r.trust_level,
  }));
}

/** 将 connector 事件写入 data_events（pending） */
export async function insertEvents(db: D1Database, events: DataEventInput[]): Promise<number> {
  let inserted = 0;
  for (const e of events) {
    const source = await db.prepare('SELECT id FROM data_sources WHERE name = ?').bind(e.sourceName).first<{ id: number }>();
    await db
      .prepare(
        `INSERT INTO data_events (event_type, entity_type, entity_id, payload, source_id, confidence, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      )
      .bind(e.eventType, e.entityType, e.entityId, JSON.stringify(e.payload), source?.id ?? null, e.confidence)
      .run();
    inserted++;
  }
  return inserted;
}
