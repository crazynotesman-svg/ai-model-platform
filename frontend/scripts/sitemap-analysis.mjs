#!/usr/bin/env node
/**
 * Sitemap Analysis —— SEO 内容清单分析（Phase 11.3 → 11.5 增强）
 *
 * 用法：
 *   线上统计：node frontend/scripts/sitemap-analysis.mjs [--sitemap https://aimodel.100ideas.net/sitemap-0.xml]
 *   Inventory：node frontend/scripts/sitemap-analysis.mjs --dist <dist目录> [--out seo-inventory.json]
 *
 * --dist 模式：读取本地构建产物（sitemap-0.xml + 页面 HTML），生成 seo-inventory.json
 *   （url/type/lang/priority/qualityScore/internalLinks/hasFAQ/hasSchema/lastModified）并输出 SEO INVENTORY REPORT。
 */

import fs from 'fs';
import path from 'path';
const DEFAULT_SITEMAP = 'https://aimodel.100ideas.net/sitemap-0.xml';
const LANGS = ['en', 'zh-CN', 'ja', 'ko', 'es', 'de', 'fr'];
const PROD = 'aimodel.100ideas.net';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : undefined;
};
const sitemapUrl = opt('--sitemap') ?? DEFAULT_SITEMAP;
const distDir = opt('--dist');
const outFile = opt('--out') ?? 'seo-inventory.json';

const typeOf = (u) => {
  const p = new URL(u).pathname;
  const m = p.match(/^\/(?:en|zh-CN|ja|ko|es|de|fr)\/([^/]+)/);
  const seg = m ? m[1] : '';
  if (seg === 'models') return 'models';
  if (seg === 'compare') return 'compare';
  if (seg === 'ranking') return 'ranking';
  if (seg === 'benchmarks') return 'benchmark';
  if (seg === 'use-cases') return 'use-cases';
  if (seg === 'categories') return 'categories';
  if (seg === 'compare-intent') return 'compare-intent';
  if (seg === 'news') return 'news';
  if (seg === 'calculator') return 'calculator';
  if (seg === 'seo-report') return 'seo-report';
  if (seg === 'seo-dashboard') return 'seo-dashboard';
  return 'home';
};

const langOf = (u) => {
  const p = new URL(u).pathname;
  const m = p.match(/^\/(en|zh-CN|ja|ko|es|de|fr)\//);
  return m ? m[1] : 'en';
};

const priorityOf = (type) =>
  ['home', 'models', 'compare', 'ranking', 'benchmarks'].includes(type) ? 'HIGH' : 'MEDIUM';

// 从 dist HTML 分析质量信号（简化版评分，与 seoQuality.ts 口径一致）
function analyzeHtml(html, type) {
  const hasFAQ = html.includes('Frequently Asked Questions') || html.includes('常见问题');
  const hasSchema = html.includes('application/ld+json');
  const internalLinks = (html.match(/href="\/(?:en|zh-CN|ja|ko|es|de|fr)\//g) || []).length;
  const hasCanonical = html.includes(`rel="canonical" href="https://${PROD}/`);
  const hasPricing = html.includes('$');
  // content: model links + pricing + faq
  const modelLinks = (html.match(/href="\/[a-z-]+\/models\//g) || []).length;
  const content = Math.min(100, Math.round(modelLinks * 6 + (hasPricing ? 20 : 0) + (hasFAQ ? 20 : 0)));
  const seo = Math.min(100, (hasCanonical ? 40 : 0) + (hasSchema ? 30 : 0) + Math.min(internalLinks, 6) * 5);
  const freshness = 80; // lastModified 由 sitemap 提供；HTML 无法精确判定
  return {
    qualityScore: Math.round(content * 0.5 + seo * 0.3 + freshness * 0.2),
    internalLinks,
    hasFAQ,
    hasSchema,
    modelLinks,
  };
}

const main = async () => {
  let urls;
  if (distDir) {
    const sitemapFile = path.join(distDir, 'sitemap-0.xml');
    if (!fs.existsSync(sitemapFile)) throw new Error(`sitemap not found: ${sitemapFile}`);
    urls = [...fs.readFileSync(sitemapFile, 'utf-8').matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    console.log(`Inventory mode — dist: ${distDir}，URLs: ${urls.length}\n`);
    const inventory = [];
    for (const u of urls) {
      const p = new URL(u).pathname;
      const file = path.join(distDir, p.replace(/^\//, ''), 'index.html');
      let html = '';
      try { html = fs.readFileSync(file, 'utf-8'); } catch { /* 无本地文件（重定向等）跳过 */ }
      const type = typeOf(u);
      const lang = langOf(u);
      const lastModified = html.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? null;
      const signal = html ? analyzeHtml(html, type) : { qualityScore: 0, internalLinks: 0, hasFAQ: false, hasSchema: false, modelLinks: 0 };
      inventory.push({
        url: u,
        type,
        lang,
        priority: priorityOf(type),
        qualityScore: signal.qualityScore,
        internalLinks: signal.internalLinks,
        hasFAQ: signal.hasFAQ,
        hasSchema: signal.hasSchema,
        lastModified,
      });
    }
    fs.writeFileSync(outFile, JSON.stringify(inventory, null, 2), 'utf-8');
    console.log(`✅ 已写入 ${outFile}（${inventory.length} 条）\n`);

    // 统计
    const byType = {};
    const byLang = {};
    let faqMissing = 0, schemaMissing = 0, lowQuality = 0, sum = 0;
    for (const it of inventory) {
      byType[it.type] = (byType[it.type] ?? 0) + 1;
      byLang[it.lang] = (byLang[it.lang] ?? 0) + 1;
      if (!it.hasFAQ) faqMissing++;
      if (!it.hasSchema) schemaMissing++;
      if (it.qualityScore < 60) lowQuality++;
      sum += it.qualityScore;
    }
    console.log('SEO INVENTORY REPORT');
    console.log('='.repeat(60));
    console.log(`Total: ${inventory.length}  |  Avg quality: ${Math.round(sum / inventory.length)}`);
    console.log('\n类型分布：');
    for (const [k, v] of Object.entries(byType).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(16)} ${v}`);
    console.log('\n语言分布：');
    for (const l of LANGS) console.log(`  ${l.padEnd(6)} ${byLang[l] ?? 0}`);
    console.log(`\n无 FAQ: ${faqMissing}  |  无 Schema: ${schemaMissing}  |  低质量(<60): ${lowQuality}`);
    console.log(`VERDICT: ${lowQuality === 0 && schemaMissing === 0 ? 'PASS' : 'REVIEW'}`);
    process.exit(lowQuality === 0 && schemaMissing === 0 ? 0 : 1);
    return;
  }

  // 线上统计模式（原功能）
  console.log(`SEO INVENTORY REPORT — ${sitemapUrl}`);
  console.log('='.repeat(60));
  const xml = await fetch(sitemapUrl, { redirect: 'follow' }).then((r) => r.text());
  urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  console.log(`Total URLs: ${urls.length}`);
  const bad = urls.filter((u) => /pages\.dev|localhost/.test(u));
  console.log(bad.length ? `⚠️ 非生产域名 URL: ${bad.length}` : '✅ 全部 URL 为生产域名');
  console.log(`VERDICT: ${bad.length ? 'FAIL' : 'PASS'}`);
  process.exit(bad.length ? 1 : 0);
};

main().catch((e) => {
  console.error('ERROR: ' + e.message);
  process.exit(2);
});
