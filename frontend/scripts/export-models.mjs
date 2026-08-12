/**
 * 构建期数据导出：从本地 Cloudflare D1（SQLite）导出模型目录 → src/generated/
 *
 * 用途：/models/[slug] 详情页为 SSG 静态页，构建时需要模型数据。
 * 数据来源是真实的 D1（本地库），与 Worker API 读取的是同一份 seed 数据，
 * 保证"页面数据来自 D1、无静态 mock"。
 *
 * 前置条件（worker/ 目录下已执行）：
 *   npx wrangler d1 migrations apply ai-model-platform-db --local
 *   npx wrangler d1 execute ai-model-platform-db --local --file=../database/seed/seed.sql
 *
 * 输出：
 *   src/generated/model-catalog.json   全部模型详情（详情页渲染用）
 *   src/generated/model-slugs.ts       模型 slug 列表（getStaticPaths 用）
 */
import { readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const FRONTEND_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = join(FRONTEND_DIR, '..');
const GENERATED_DIR = join(FRONTEND_DIR, 'src', 'generated');

// ---- 1. 定位本地 D1 数据库文件 ----
const D1_STATE_DIR = join(REPO_ROOT, 'worker', '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject');
const COMMITTED_CATALOG = join(GENERATED_DIR, 'model-catalog.json');
if (!existsSync(D1_STATE_DIR)) {
  // CI / 无本地 D1 环境（如 Cloudflare Pages 构建）：回退到已提交的生成数据
  if (existsSync(COMMITTED_CATALOG)) {
    console.log('[export-models] CI 模式：未找到本地 D1，使用已提交的 src/generated/model-catalog.json');
    process.exit(0);
  }
  console.error('[export-models] 未找到本地 D1 数据库，且无已提交的生成数据。');
  console.error('  本地开发请先在 worker/ 目录执行：');
  console.error('  npx wrangler d1 migrations apply ai-model-platform-db --local');
  console.error('  npx wrangler d1 execute ai-model-platform-db --local --file=../database/seed/seed.sql');
  process.exit(1);
}
const candidates = readdirSync(D1_STATE_DIR)
  .filter((f) => f.endsWith('.sqlite') && f !== 'metadata.sqlite')
  .map((f) => ({ name: f, mtime: statSync(join(D1_STATE_DIR, f)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime);
if (candidates.length === 0) {
  console.error('[export-models] 本地 D1 目录中未找到数据文件。');
  process.exit(1);
}
const db = new DatabaseSync(join(D1_STATE_DIR, candidates[0].name), { readOnly: true });

// ---- 2. 查询（与 Worker API 同一套口径）----
const models = db
  .prepare(
    `SELECT m.id, m.slug, m.model_type, m.context_window, m.release_date,
            m.last_verified_at, m.data_status, m.verified_status, m.confidence_score,
            p.name AS provider_name
     FROM models m JOIN providers p ON p.id = m.provider ORDER BY m.slug`,
  )
  .all();
const translations = db
  .prepare(`SELECT model_id, language, name, description, use_cases FROM model_translations`)
  .all();
const pricing = db
  .prepare(
    `SELECT model_id, input_price, output_price, currency, unit
     FROM pricing WHERE currency = 'USD' AND unit = 'per_1M_tokens'`,
  )
  .all();
// Phase 9.1：模型能力（vision/reasoning/...）
const capabilities = db
  .prepare(`SELECT model_id, capability, supported, confidence FROM model_capabilities`)
  .all();
// Phase 9.2：价格历史（按生效日期升序）
const pricingHistory = db
  .prepare(
    `SELECT model_id, input_price, output_price, effective_date, confidence, source_url
     FROM pricing_history
     WHERE currency = 'USD' AND unit = 'per_1M_tokens'
     ORDER BY effective_date ASC`,
  )
  .all();
// Phase 9.4a/9.4b：基准结果（join 类别名，按 category 排序）
const benchmarks = db
  .prepare(
    `SELECT br.model_id, br.score, br.rank, br.dataset, br.version, br.source, br.tested_at,
            br.confidence, br.official_score, br.source_url, br.verification_status,
            bc.slug AS category, bc.name AS category_name
     FROM benchmark_results br
     JOIN benchmark_categories bc ON br.category_id = bc.id
     ORDER BY br.model_id, bc.slug ASC`,
  )
  .all();

const slugById = Object.fromEntries(models.map((m) => [m.id, m.slug]));
const safeParse = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ---- 3. 组装 catalog ----
const catalog = {};
for (const m of models) {
  catalog[m.slug] = {
    slug: m.slug,
    modelType: m.model_type,
    contextWindow: m.context_window,
    releaseDate: m.release_date,
    providerName: m.provider_name,
    lastVerifiedAt: m.last_verified_at, // Phase 9.7
    dataStatus: m.data_status ?? 'active', // Phase 9.7
    verifiedStatus: m.verified_status ?? 'unverified', // Phase 11.5A
    confidenceScore: m.confidence_score ?? null, // Phase 11.5A
    inputPrice: null,
    outputPrice: null,
    currency: 'USD',
    unit: 'per_1M_tokens',
    languages: [],
    translations: {},
    capabilities: [], // [{ capability, supported, confidence }]
    pricingHistory: [], // [{ effectiveDate, inputPrice, outputPrice, confidence, sourceUrl }]
    benchmarks: [], // [{ category, categoryName, score, rank, dataset, version, source, testedAt, confidence, officialScore, sourceUrl, verificationStatus }]
  };
}
for (const t of translations) {
  const entry = catalog[slugById[t.model_id]];
  if (!entry) continue;
  entry.languages.push(t.language);
  entry.translations[t.language] = {
    name: t.name,
    description: t.description,
    useCases: safeParse(t.use_cases),
  };
}
for (const pr of pricing) {
  const entry = catalog[slugById[pr.model_id]];
  if (!entry) continue;
  entry.inputPrice = pr.input_price;
  entry.outputPrice = pr.output_price;
  entry.currency = pr.currency;
  entry.unit = pr.unit;
}
for (const cap of capabilities) {
  const entry = catalog[slugById[cap.model_id]];
  if (!entry) continue;
  entry.capabilities.push({
    capability: cap.capability,
    supported: cap.supported === 1,
    confidence: cap.confidence ?? null,
  });
}
for (const ph of pricingHistory) {
  const entry = catalog[slugById[ph.model_id]];
  if (!entry) continue;
  entry.pricingHistory.push({
    effectiveDate: ph.effective_date,
    inputPrice: ph.input_price,
    outputPrice: ph.output_price,
    confidence: ph.confidence ?? null,
    sourceUrl: ph.source_url ?? null,
  });
}
for (const bm of benchmarks) {
  const entry = catalog[slugById[bm.model_id]];
  if (!entry) continue;
  entry.benchmarks.push({
    category: bm.category,
    categoryName: bm.category_name,
    score: bm.score,
    rank: bm.rank,
    dataset: bm.dataset,
    version: bm.version,
    source: bm.source,
    testedAt: bm.tested_at,
    confidence: bm.confidence ?? null,
    officialScore: bm.official_score ?? null,
    sourceUrl: bm.source_url ?? null,
    verificationStatus: bm.verification_status ?? 'unverified',
  });
}
for (const entry of Object.values(catalog)) {
  entry.languages.sort();
  entry.capabilities.sort((a, b) => a.capability.localeCompare(b.capability));
}

// ---- Phase 9.5 + 11.5A：Ranking 计算（公式与 worker/src/services/ranking.ts 保持一致，权威定义见 docs/ranking-design.md）----
// v2：Overall = Raw × DataConfidence（benchmark confidence 平均；无 benchmark 用模型 confidenceScore/100）
const TOTAL_CAPABILITIES = 7;
const CONTEXT_FULL_SCORE = 200_000;
const round1 = (n) => Math.round(n * 10) / 10;
const maxInputPrice = Math.max(0, ...Object.values(catalog).map((e) => e.inputPrice ?? 0));
for (const entry of Object.values(catalog)) {
  const scores = entry.benchmarks.map((b) => b.score);
  const benchmark = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const capability =
    (entry.capabilities.filter((c) => c.supported).length / TOTAL_CAPABILITIES) * 100;
  const priceEfficiency =
    entry.inputPrice != null && entry.inputPrice > 0
      ? Math.min((maxInputPrice / entry.inputPrice) * 100, 100)
      : 0;
  const context =
    entry.contextWindow != null ? Math.min(entry.contextWindow / CONTEXT_FULL_SCORE, 1) * 100 : 0;
  const raw = benchmark * 0.5 + capability * 0.2 + priceEfficiency * 0.2 + context * 0.1;
  // Data confidence：benchmark confidence 平均（0-100 → 0-1）；无 benchmark 用模型 confidenceScore
  const benchConf = entry.benchmarks.map((b) => b.confidence).filter((c) => c != null);
  const dataConfidence = benchConf.length > 0
    ? benchConf.reduce((a, b) => a + b, 0) / benchConf.length / 100
    : (entry.confidenceScore ?? 50) / 100;
  entry.ranking = {
    overall: round1(raw * dataConfidence),
    benchmark: round1(benchmark),
    capability: round1(capability),
    price: round1(priceEfficiency),
    context: round1(context),
    rawScore: round1(raw),
    confidence: Math.round(dataConfidence * 100) / 100,
  };
}

// ---- Phase 9.6：读取排名快照历史（只读；快照由 Worker Cron 02:00 UTC 生成）----
// 快照 score = 当日 overall 分数，rank = 该模式当日排名（与 worker/services/rankingSnapshot.ts 一致）
const snapshotRows = db
  .prepare(
    `SELECT rs.model_id, rs.snapshot_date, rs.rank, rs.score, m.slug AS slug
     FROM ranking_snapshots rs
     JOIN models m ON rs.model_id = m.id
     WHERE rs.ranking_mode = 'overall'
     ORDER BY rs.snapshot_date ASC, rs.model_id`,
  )
  .all();
const trendCutoff = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
for (const entry of Object.values(catalog)) {
  const history = snapshotRows
    .filter((s) => s.slug === entry.slug && s.snapshot_date >= trendCutoff)
    .map((s) => ({ date: s.snapshot_date, rank: s.rank, score: s.score }));
  let trend = null;
  if (history.length >= 2) {
    const first = history[0];
    const last = history[history.length - 1];
    trend = {
      rankChange: first.rank - last.rank, // 正 = 排名上升
      scoreChange: Math.round((last.score - first.score) * 10) / 10,
    };
  }
  entry.trend = trend; // { rankChange, scoreChange } | null
  entry.rankingHistory = history.slice(-30); // [{ date, rank, score }]
}

// ---- Phase 11.7：每个模型补充 dataTrust（overall/sources/lastVerified/warnings）----
for (const entry of Object.values(catalog)) {
  const sources = new Set();
  const warnings = [];
  for (const b of entry.benchmarks ?? []) {
    if (b.sourceUrl) sources.add(b.sourceUrl);
    if (b.source === 'manual' && b.verificationStatus === 'verified') warnings.push(`benchmark ${b.dataset}: manual 标记为 verified`);
    if (b.confidence == null) warnings.push(`benchmark ${b.dataset}: 无 confidence`);
  }
  for (const p of entry.pricingHistory ?? []) {
    if (p.sourceUrl) sources.add(p.sourceUrl);
  }
  entry.dataTrust = {
    overall: entry.confidenceScore ?? (entry.ranking?.confidence != null ? Math.round((entry.ranking.confidence ?? 1) * 100) : null),
    sources: [...sources],
    lastVerified: entry.lastVerifiedAt ?? null,
    warnings,
  };
}

// ---- Phase 11.8：Knowledge Graph 关系计算（公式与 worker/src/services/modelGraph.ts 同步）----
// Similarity = 0.35×Capability Jaccard + 0.25×Benchmark 距离 + 0.15×Context + 0.15×Price + 0.10×Use Case
const relWeight = { cap: 0.45, bench: 0.2, context: 0.1, price: 0.15, uc: 0.1 };
const relJaccard = (a, b) => {
  const setA = new Set(a);
  const inter = b.filter((x) => setA.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
};
const relBenchSim = (a, b) => {
  const mapB = new Map(b.benchmarks.map((x) => [x.category, x.score]));
  const diffs = [];
  for (const x of a.benchmarks) {
    if (mapB.has(x.category)) diffs.push(Math.abs(x.score - mapB.get(x.category)));
  }
  if (diffs.length === 0) return 0;
  return Math.max(0, 100 - (diffs.reduce((s, d) => s + d, 0) / diffs.length) * 5);
};
const relPriceSim = (a, b) => {
  if (a.inputPrice == null || b.inputPrice == null) return 0;
  const max = Math.max(a.inputPrice, b.inputPrice, 0.01);
  return Math.max(0, 100 - (Math.abs(a.inputPrice - b.inputPrice) / max) * 200);
};
const relCtxSim = (a, b) => {
  if (a.contextWindow == null || b.contextWindow == null) return 0;
  const max = Math.max(a.contextWindow, b.contextWindow, 1);
  return Math.min(100, (Math.min(a.contextWindow, b.contextWindow) / max) * 100);
};
const relSim = (a, b) =>
  Math.round(
    (relWeight.cap * relJaccard(a.capabilities, b.capabilities) * 100 +
      relWeight.bench * relBenchSim(a, b) +
      relWeight.context * relCtxSim(a, b) +
      relWeight.price * relPriceSim(a, b) +
      relWeight.uc * relJaccard(a.useCases, b.useCases) * 100) *
      10,
  ) / 10;
const relTrust = (evidence, fresh = 90) => Math.round(0.5 * 40 + 0.3 * evidence + 0.2 * fresh);

// 构建画像：从 catalog（capabilities/benchmarks/use cases 已导出）
const profiles = Object.values(catalog).map((e) => ({
  slug: e.slug,
  name: e.translations?.en?.name ?? e.slug,
  capabilities: (e.capabilities ?? []).filter((c) => c.supported).map((c) => c.capability),
  benchmarks: (e.benchmarks ?? []).map((b) => ({ category: b.category, score: b.score })),
  contextWindow: e.contextWindow,
  inputPrice: e.inputPrice,
  useCases: Object.values(e.translations ?? {})[0]?.useCases ?? [],
}));
for (const me of profiles) {
  const rels = [];
  for (const o of profiles) {
    if (o.slug === me.slug) continue;
    const sim = relSim(me, o);
    const sharedCaps = me.capabilities.filter((c) => o.capabilities.includes(c));
    const benchOverlap = me.benchmarks.some((x) => o.benchmarks.some((y) => y.category === x.category));
    if (sim >= 45 && (benchOverlap || sharedCaps.length >= 4)) {
      const trust = relTrust(sim);
      if (trust >= 50) {
        rels.push({ type: 'similar_to', model: o.slug, name: o.name, confidence: trust, reason: `Similar ${sharedCaps.slice(0, 3).join(', ') || 'capability profile'} with comparable pricing (sim ${sim}%)` });
      }
    }
    if (sharedCaps.length >= 2 && me.inputPrice != null && o.inputPrice != null && o.inputPrice > me.inputPrice * 1.2) {
      const trust = relTrust(90);
      if (trust >= 50) {
        rels.push({ type: 'cheaper_than', model: o.slug, name: o.name, confidence: trust, reason: `Lower input price ($${me.inputPrice}/1M vs $${o.inputPrice}/1M) with ${sharedCaps.slice(0, 2).join(', ') || 'overlapping'} capabilities` });
      }
    }
    if (sim >= 40 && sim < 45) {
      const trust = relTrust(sim);
      if (trust >= 50) {
        rels.push({ type: 'alternative_to', model: o.slug, name: o.name, confidence: trust, reason: `Alternative choice with similar benchmark performance and ${sharedCaps.slice(0, 2).join(', ') || 'shared'} capabilities` });
      }
    }
  }
  catalog[me.slug].relationships = rels.sort((a, b) => b.confidence - a.confidence);
}

// ---- 4. 写出生成文件 ----
mkdirSync(GENERATED_DIR, { recursive: true });
writeFileSync(join(GENERATED_DIR, 'model-catalog.json'), JSON.stringify(catalog, null, 2) + '\n', 'utf-8');
const slugs = Object.keys(catalog);
writeFileSync(
  join(GENERATED_DIR, 'model-slugs.ts'),
  `// 自动生成（scripts/export-models.mjs，数据源：本地 D1）——请勿手改\n` +
    `export const MODEL_SLUGS = ${JSON.stringify(slugs)} as const;\n`,
  'utf-8',
);

// ---- Phase 11.7：数据来源与变更日志导出（公开页面用）----
const sourcesRows = db
  .prepare(`SELECT name, type, url, description, trust_level, created_at FROM data_sources ORDER BY trust_level DESC, name`)
  .all();
writeFileSync(
  join(GENERATED_DIR, 'data-sources.json'),
  JSON.stringify(
    (sourcesRows ?? []).map((s) => ({ name: s.name, type: s.type, url: s.url, description: s.description, trustLevel: s.trust_level, createdAt: s.created_at })),
    null,
    2,
  ) + '\n',
  'utf-8',
);
const changesRows = db
  .prepare(`SELECT entity_type, entity_id, change_type, before_json, after_json, confidence, created_at FROM data_changes ORDER BY created_at DESC LIMIT 50`)
  .all();
writeFileSync(
  join(GENERATED_DIR, 'data-changes.json'),
  JSON.stringify(
    (changesRows ?? []).map((c) => ({ entityType: c.entity_type, entityId: c.entity_id, changeType: c.change_type, before: c.before_json ? JSON.parse(c.before_json) : null, after: JSON.parse(c.after_json), confidence: c.confidence, createdAt: c.created_at })),
    null,
    2,
  ) + '\n',
  'utf-8',
);
// ---- Phase 12.1：Coverage 统计导出 ----
const covModels = db.prepare('SELECT COUNT(*) AS n FROM models').get();
const covProviders = db.prepare('SELECT COUNT(DISTINCT provider) AS n FROM models').get();
const covVerified = db.prepare("SELECT COUNT(*) AS n FROM models WHERE verified_status = 'verified'").get();
const covNewest = db.prepare('SELECT slug FROM models ORDER BY release_date DESC LIMIT 6').all();
const covMissing = db.prepare("SELECT COUNT(*) AS n FROM models WHERE verified_status != 'verified' OR verified_status IS NULL").get();
writeFileSync(
  join(GENERATED_DIR, 'data-coverage.json'),
  JSON.stringify({
    totalModels: covModels?.n ?? 0,
    providers: covProviders?.n ?? 0,
    verified: covVerified?.n ?? 0,
    missingVerification: covMissing?.n ?? 0,
    lastSync: new Date().toISOString().slice(0, 10),
    newestModels: (covNewest ?? []).map((x) => x.slug),
  }, null, 2) + '\n',
  'utf-8',
);
console.log('[export-models] 导出 data-coverage.json');
console.log('[export-models] 导出 data-sources.json + data-changes.json');

console.log(
  `[export-models] 完成：${slugs.length} 个模型 → src/generated/（数据源：${candidates[0].name}）`,
);
db.close();
