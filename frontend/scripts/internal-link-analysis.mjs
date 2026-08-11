#!/usr/bin/env node
/**
 * Internal Link Analysis —— 页面类型内链缺口检测（Phase 11.5）
 *
 * 用法：node frontend/scripts/internal-link-analysis.mjs --dist <dist目录>
 *
 * 检查每类代表页面是否包含指向关键目标类型的链接：
 *   models 详情   → ranking / benchmarks
 *   compare       → models（两模型链接）
 *   benchmark     → ranking / use-cases
 *   ranking       → benchmarks / use-cases
 *   use-cases     → categories / compare-intent / models
 *   categories    → use-cases / ranking
 * 输出 missing links 报告；HIGH = 关键链接缺失。
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const distDir = args[args.indexOf('--dist') + 1];
if (!distDir) {
  console.error('用法：node internal-link-analysis.mjs --dist <dist目录>');
  process.exit(2);
}

const L = '(?:en|zh-CN|ja|ko|es|de|fr)';
const read = (p) => {
  try { return fs.readFileSync(path.join(distDir, p, 'index.html'), 'utf-8'); } catch { return null; }
};

// 每类检查定义：代表页 + 期望链接（HIGH 关键）
const checks = [
  { type: 'models', page: 'en/models/openai/gpt-4o', expect: [{ re: new RegExp(`href="/${L}/ranking/`), label: 'ranking', high: true }, { re: new RegExp(`href="/${L}/benchmarks/`), label: 'benchmarks', high: true }, { re: new RegExp(`href="/${L}/use-cases/`), label: 'use-cases', high: false }] },
  { type: 'compare', page: 'en/compare/deepseek_deepseek-chat-vs-openai_gpt-4o', expect: [{ re: new RegExp(`href="/${L}/models/`), label: 'models 详情', high: true }, { re: new RegExp(`href="/${L}/ranking/`), label: 'ranking', high: false }] },
  { type: 'benchmark', page: 'en/benchmarks/coding', expect: [{ re: new RegExp(`href="/${L}/ranking/`), label: 'ranking', high: true }, { re: new RegExp(`href="/${L}/use-cases/coding/`), label: 'use-case', high: true }, { re: new RegExp(`href="/${L}/models/`), label: 'models', high: false }] },
  { type: 'ranking', page: 'en/ranking/coding', expect: [{ re: new RegExp(`href="/${L}/benchmarks/`), label: 'benchmarks', high: true }, { re: new RegExp(`href="/${L}/use-cases/`), label: 'use-cases', high: true }, { re: new RegExp(`href="/${L}/models/`), label: 'models', high: false }] },
  { type: 'use-cases', page: 'en/use-cases/coding', expect: [{ re: new RegExp(`href="/${L}/categories/`), label: 'categories', high: true }, { re: new RegExp(`href="/${L}/compare-intent/`), label: 'compare-intent', high: true }, { re: new RegExp(`href="/${L}/models/`), label: 'models', high: false }] },
  { type: 'categories', page: 'en/categories/vision-models', expect: [{ re: new RegExp(`href="/${L}/use-cases/`), label: 'use-cases', high: true }, { re: new RegExp(`href="/${L}/ranking/`), label: 'ranking', high: true }] },
];

let highMissing = 0;
let mediumMissing = 0;
console.log('INTERNAL LINK ANALYSIS');
console.log('='.repeat(60));
for (const c of checks) {
  const html = read(c.page);
  if (!html) {
    console.log(`[SKIP] ${c.type}（${c.page} 不存在）`);
    continue;
  }
  const missing = c.expect.filter((e) => !e.re.test(html));
  if (missing.length === 0) {
    console.log(`[OK]   ${c.type}（${c.page}）— 全部关键链接存在`);
  } else {
    for (const m of missing) {
      const tag = m.high ? 'HIGH' : 'MED';
      console.log(`[${tag}] ${c.type} 页（${c.page}）missing ${m.label} 链接`);
      if (m.high) highMissing++;
      else mediumMissing++;
    }
  }
}
console.log('='.repeat(60));
console.log(`HIGH missing: ${highMissing}  |  MEDIUM missing: ${mediumMissing}`);
console.log(`VERDICT: ${highMissing === 0 ? 'PASS' : 'FAIL'}${mediumMissing ? '（MEDIUM 项待优化）' : ''}`);
process.exit(highMissing === 0 ? 0 : 1);
