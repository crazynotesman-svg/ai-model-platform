/**
 * relationshipGenerator.ts —— 自动关系生成规则（Phase 11.8 Step 6）
 *
 * 规则：
 *   similar_to    ：capability similarity > 阈值 且 benchmark 重叠（引擎计算）
 *   cheaper_than  ：同能力类别 且 更低价格（引擎计算）
 *   successor_of  ：仅官方 source / provider 公告（禁止自动猜测——本阶段不生成）
 *
 * 关系写入 model_relationships（UNIQUE(source,target,type) ON CONFLICT 更新）。
 * 信任 < 50 的关系不写入（relationshipTrust）。
 */
import type { D1Database } from '@cloudflare/workers-types';
import { buildRelationships, type ModelProfile, relationshipTrust } from './modelGraph';

/** 从 D1 构建全部模型画像（API/export 共用） */
export async function loadModelProfiles(db: D1Database): Promise<ModelProfile[]> {
  const models = await db.prepare('SELECT id, slug, provider, model_type, context_window FROM models').all<{
    id: number; slug: string; provider: number; model_type: string; context_window: number | null;
  }>();
  const capsRows = await db.prepare('SELECT model_id, capability FROM model_capabilities WHERE supported = 1').all<{ model_id: number; capability: string }>();
  const benchRows = await db
    .prepare(`SELECT br.model_id, bc.slug AS category, br.score, br.confidence FROM benchmark_results br JOIN benchmark_categories bc ON br.category_id = bc.id`)
    .all<{ model_id: number; category: string; score: number; confidence: number | null }>();
  const priceRows = await db
    .prepare("SELECT model_id, input_price FROM pricing WHERE currency = 'USD' AND unit = 'per_1M_tokens'")
    .all<{ model_id: number; input_price: number }>();
  const transRows = await db
    .prepare("SELECT model_id, language, use_cases FROM model_translations WHERE language = 'en'")
    .all<{ model_id: number; language: string; use_cases: string }>();

  const capsByModel = new Map<number, string[]>();
  for (const c of capsRows.results ?? []) {
    const arr = capsByModel.get(c.model_id) ?? [];
    arr.push(c.capability);
    capsByModel.set(c.model_id, arr);
  }
  const benchByModel = new Map<number, { category: string; score: number; confidence: number | null }[]>();
  for (const b of benchRows.results ?? []) {
    const arr = benchByModel.get(b.model_id) ?? [];
    arr.push({ category: b.category, score: b.score, confidence: b.confidence });
    benchByModel.set(b.model_id, arr);
  }
  const priceByModel = new Map<number, number>();
  for (const p of priceRows.results ?? []) priceByModel.set(p.model_id, p.input_price);
  const useCasesByModel = new Map<number, string[]>();
  for (const t of transRows.results ?? []) {
    try {
      useCasesByModel.set(t.model_id, JSON.parse(t.use_cases ?? '[]'));
    } catch {}
  }

  return (models.results ?? []).map((m) => ({
    slug: m.slug,
    name: m.slug.split('/').pop() ?? m.slug,
    provider: String(m.provider),
    modelType: m.model_type,
    capabilities: capsByModel.get(m.id) ?? [],
    benchmarks: benchByModel.get(m.id) ?? [],
    contextWindow: m.context_window,
    inputPrice: priceByModel.get(m.id) ?? null,
    useCases: useCasesByModel.get(m.id) ?? [],
  }));
}

/** 为全部模型生成关系并写入 model_relationships（幂等 upsert） */
export async function generateAndPersistRelationships(db: D1Database, freshness = 90): Promise<number> {
  const profiles = await loadModelProfiles(db);
  let written = 0;
  for (const me of profiles) {
    const rels = buildRelationships(me, profiles, freshness);
    for (const r of rels) {
      const target = profiles.find((p) => p.slug === r.targetSlug);
      if (!target) continue;
      const srcRow = await db.prepare('SELECT id FROM models WHERE slug = ?').bind(me.slug).first<{ id: number }>();
      const tgtRow = await db.prepare('SELECT id FROM models WHERE slug = ?').bind(r.targetSlug).first<{ id: number }>();
      if (!srcRow || !tgtRow) continue;
      const trust = relationshipTrust({ sourceTrust: 40, evidenceStrength: r.confidence, freshness });
      if (trust < 50) continue;
      await db
        .prepare(
          `INSERT INTO model_relationships (source_model_id, target_model_id, relationship_type, confidence, reason, source_id, verified_at)
           VALUES (?, ?, ?, ?, ?, (SELECT id FROM data_sources WHERE name = 'Internal Demo'), datetime('now'))
           ON CONFLICT(source_model_id, target_model_id, relationship_type) DO UPDATE SET confidence = excluded.confidence, reason = excluded.reason, verified_at = excluded.verified_at`,
        )
        .bind(srcRow.id, tgtRow.id, r.type, r.confidence, r.reason)
        .run();
      written++;
    }
  }
  return written;
}
