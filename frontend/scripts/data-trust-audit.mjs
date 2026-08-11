#!/usr/bin/env node
/**
 * Data Trust Audit —— 数据可信审计（Phase 11.5A）
 *
 * 用法：node frontend/scripts/data-trust-audit.mjs --dist <dist目录>
 *       （或 --catalog <catalog.json>）
 *
 * 读取 model-catalog.json（build 产物导出），检查：
 *   Models missing source（verifiedStatus/confidenceScore）
 *   Pricing missing source（pricingHistory.confidence/sourceUrl）
 *   Benchmark missing source（benchmarks.confidence/verificationStatus）
 *   Capability missing source（capabilities.confidence）
 *
 * 目标：HIGH = 0；MEDIUM 允许（demo/无数据项）。
 * 输出：DATA TRUST REPORT。
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i !== -1 ? args[i + 1] : undefined; };
const distDir = opt('--dist');
const catalogFile = opt('--catalog') ?? (distDir ? path.join(distDir, 'seo-inventory.json') : 'frontend/dist/model-catalog.json');
const distCatalog = distDir ? path.join(distDir, 'model-catalog.json') : null;

let catalog;
const candidates = [catalogFile, distCatalog].filter(Boolean);
for (const f of candidates) {
  try { catalog = JSON.parse(fs.readFileSync(f, 'utf8')); break; } catch {}
}
if (!catalog) {
  console.error('未找到 model-catalog.json（请指定 --dist 或 --catalog）');
  process.exit(2);
}

const out = [];
let high = 0;
let medium = 0;
const add = (level, msg) => {
  out.push(`[${level}] ${msg}`);
  if (level === 'HIGH') high++;
  if (level === 'MED') medium++;
};

console.log('DATA TRUST REPORT');
console.log('='.repeat(60));
const entries = Object.values(catalog);
console.log(`Models: ${entries.length}\n`);

for (const m of entries) {
  // Model
  if (!m.verifiedStatus || m.verifiedStatus === 'unverified') {
    add('MED', `model ${m.slug}: 未核验（verifiedStatus=${m.verifiedStatus ?? 'none'}）`);
  }
  if (m.confidenceScore == null) {
    add('HIGH', `model ${m.slug}: 无 confidenceScore`);
  } else if (m.confidenceScore < 40) {
    add('MED', `model ${m.slug}: confidence ${m.confidenceScore}（<40）`);
  }
  // Pricing
  const ph = m.pricingHistory ?? [];
  if (ph.length > 0 && ph.every((p) => p.confidence == null)) {
    add('HIGH', `model ${m.slug}: pricing 无 confidence`);
  }
  // Benchmark
  const bm = m.benchmarks ?? [];
  if (bm.length > 0 && bm.every((b) => b.confidence == null)) {
    add('HIGH', `model ${m.slug}: benchmark 无 confidence`);
  }
  if (bm.length > 0 && bm.some((b) => b.source === 'manual' && b.verificationStatus === 'verified')) {
    add('HIGH', `model ${m.slug}: manual source 标记为 verified（禁止）`);
  }
  // Capability
  const caps = m.capabilities ?? [];
  if (caps.length > 0 && caps.every((c) => c.confidence == null)) {
    add('HIGH', `model ${m.slug}: capabilities 无 confidence`);
  }
}

console.log('='.repeat(60));
console.log(`HIGH: ${high}  |  MEDIUM: ${medium}`);
console.log(`VERDICT: ${high === 0 ? 'PASS' : 'FAIL'}${medium ? `（${medium} 项 MEDIUM 待处理）` : ''}`);
process.exit(high === 0 ? 0 : 1);
