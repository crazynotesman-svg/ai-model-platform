/**
 * dataTrustAudit.ts —— Data Trust 每日审计（Phase 11.5B）
 *
 * 由 Cron（每日 03:00 UTC）触发，输出 DATA TRUST DAILY REPORT：
 *   - verified models / unverified models
 *   - missing source（pricing/benchmark/capability 无 source_id）
 *   - expired verification（last_verified_at 超过 180 天）
 *   - low confidence ranking（confidence < 0.7 仍进入 Top10）
 */

export async function runDataTrustAudit(db: D1Database): Promise<Record<string, unknown>> {
  const [models, pricingMissing, benchMissing, capsMissing, expired, lowConfTop] = await Promise.all([
    db
      .prepare(`SELECT verified_status, COUNT(*) AS n FROM models GROUP BY verified_status`)
      .all<{ verified_status: string; n: number }>(),
    db
      .prepare(`SELECT COUNT(*) AS n FROM pricing_history WHERE source_id IS NULL`)
      .first<{ n: number }>(),
    db
      .prepare(`SELECT COUNT(*) AS n FROM benchmark_results WHERE source_id IS NULL`)
      .first<{ n: number }>(),
    db
      .prepare(`SELECT COUNT(*) AS n FROM model_capabilities WHERE source_id IS NULL`)
      .first<{ n: number }>(),
    db
      .prepare(`SELECT COUNT(*) AS n FROM models WHERE last_verified_at IS NOT NULL AND julianday('now') - julianday(last_verified_at) > 180`)
      .first<{ n: number }>(),
    db
      .prepare(`SELECT m.slug, rs.score, m.confidence_score FROM ranking_snapshots rs JOIN models m ON rs.model_id = m.id WHERE rs.ranking_mode = 'overall' ORDER BY rs.score DESC LIMIT 10`)
      .all<{ slug: string; score: number; confidence_score: number | null }>(),
  ]);

  const verified = models.results?.find((r) => r.verified_status === 'verified')?.n ?? 0;
  const unverified = models.results?.find((r) => r.verified_status === 'unverified')?.n ?? 0;
  const lowConfTop10 = (lowConfTop.results ?? []).filter(
    (r) => (r.confidence_score ?? 0) < 70,
  ).length;

  const report = {
    date: new Date().toISOString().slice(0, 10),
    verified_models: verified,
    unverified_models: unverified,
    pricing_missing_source: pricingMissing?.n ?? 0,
    benchmark_missing_source: benchMissing?.n ?? 0,
    capability_missing_source: capsMissing?.n ?? 0,
    expired_verification_gt180d: expired?.n ?? 0,
    low_confidence_in_top10: lowConfTop10,
  };

  console.log(`[cron data-trust-audit] DATA TRUST DAILY REPORT ${JSON.stringify(report)}`);
  return report;
}
