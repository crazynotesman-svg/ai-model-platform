/**
 * dataQuality.ts —— Data Quality 统计（Phase 11.9 Step 7）
 * GET /api/v1/data-quality：
 *   totalModels / verifiedModels / averageTrust / staleModels / missingSources
 * 全部来自 D1 实时查询（诚实统计，无 mock）。
 */
import type { D1Database } from '@cloudflare/workers-types';

export interface DataQualityReport {
  totalModels: number;
  verifiedModels: number;
  unverifiedModels: number;
  averageTrust: number;
  staleModels: number;      // last_verified_at > 180 天
  missingSources: number;   // pricing/benchmark/capability 无 source_id 的记录数
  dataSources: number;
}

export async function getDataQuality(db: D1Database): Promise<DataQualityReport> {
  const [models, verified, trust, stale, missingSrc, sources] = await Promise.all([
    db.prepare('SELECT COUNT(*) AS n FROM models').first<{ n: number }>(),
    db.prepare("SELECT COUNT(*) AS n FROM models WHERE verified_status = 'verified'").first<{ n: number }>(),
    db.prepare('SELECT AVG(confidence_score) AS a FROM models WHERE confidence_score IS NOT NULL').first<{ a: number | null }>(),
    db.prepare("SELECT COUNT(*) AS n FROM models WHERE last_verified_at IS NOT NULL AND julianday('now') - julianday(last_verified_at) > 180").first<{ n: number }>(),
    db.prepare(`SELECT (SELECT COUNT(*) FROM pricing_history WHERE source_id IS NULL) + (SELECT COUNT(*) FROM benchmark_results WHERE source_id IS NULL) + (SELECT COUNT(*) FROM model_capabilities WHERE source_id IS NULL) AS n`).first<{ n: number }>(),
    db.prepare('SELECT COUNT(*) AS n FROM data_sources').first<{ n: number }>(),
  ]);
  return {
    totalModels: models?.n ?? 0,
    verifiedModels: verified?.n ?? 0,
    unverifiedModels: (models?.n ?? 0) - (verified?.n ?? 0),
    averageTrust: trust?.a != null ? Math.round(trust.a) : 0,
    staleModels: stale?.n ?? 0,
    missingSources: missingSrc?.n ?? 0,
    dataSources: sources?.n ?? 0,
  };
}
