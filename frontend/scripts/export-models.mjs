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
if (!existsSync(D1_STATE_DIR)) {
  console.error('[export-models] 未找到本地 D1 数据库。请先在 worker/ 目录执行：');
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
    `SELECT m.id, m.slug, m.model_type, m.context_window, m.release_date, p.name AS provider_name
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
  .prepare(`SELECT model_id, capability, supported FROM model_capabilities`)
  .all();
// Phase 9.2：价格历史（按生效日期升序）
const pricingHistory = db
  .prepare(
    `SELECT model_id, input_price, output_price, effective_date
     FROM pricing_history
     WHERE currency = 'USD' AND unit = 'per_1M_tokens'
     ORDER BY effective_date ASC`,
  )
  .all();
// Phase 9.4a/9.4b：基准结果（join 类别名，按 category 排序）
const benchmarks = db
  .prepare(
    `SELECT br.model_id, br.score, br.rank, br.dataset, br.version, br.source, br.tested_at,
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
    inputPrice: null,
    outputPrice: null,
    currency: 'USD',
    unit: 'per_1M_tokens',
    languages: [],
    translations: {},
    capabilities: [], // [{ capability, supported }]
    pricingHistory: [], // [{ effectiveDate, inputPrice, outputPrice }]
    benchmarks: [], // [{ category, categoryName, score, rank, dataset, version, source, testedAt }]
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
  });
}
for (const ph of pricingHistory) {
  const entry = catalog[slugById[ph.model_id]];
  if (!entry) continue;
  entry.pricingHistory.push({
    effectiveDate: ph.effective_date,
    inputPrice: ph.input_price,
    outputPrice: ph.output_price,
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
  });
}
for (const entry of Object.values(catalog)) {
  entry.languages.sort();
  entry.capabilities.sort((a, b) => a.capability.localeCompare(b.capability));
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

console.log(
  `[export-models] 完成：${slugs.length} 个模型 → src/generated/（数据源：${candidates[0].name}）`,
);
db.close();
