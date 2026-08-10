#!/usr/bin/env node
/**
 * Sitemap Analysis —— SEO 内容清单分析
 *
 * 用法：node frontend/scripts/sitemap-analysis.mjs [--sitemap https://aimodel.100ideas.net/sitemap-0.xml]
 * 统计：models / compare / ranking / benchmarks / landing (use-cases+categories+compare-intent) / news / 其他。
 * 输出：SEO INVENTORY REPORT。
 */

const DEFAULT_SITEMAP = 'https://aimodel.100ideas.net/sitemap-0.xml';
const args = process.argv.slice(2);
const url = args[args.indexOf('--sitemap') + 1] ?? DEFAULT_SITEMAP;

const fetchXml = async (u) => {
  const r = await fetch(u, { redirect: 'follow' });
  if (r.status !== 200) throw new Error(`HTTP ${r.status} for ${u}`);
  return r.text();
};

const main = async () => {
  console.log(`SEO INVENTORY REPORT — ${url}`);
  console.log('='.repeat(60));
  const xml = await fetchXml(url);
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  console.log(`Total URLs: ${urls.length}`);
  console.log(`Hosts: ${[...new Set(urls.map((u) => new URL(u).host))].join(', ')}`);

  const cat = (re) => urls.filter((u) => re.test(u)).length;
  const detail = (re) => [...new Set(urls.filter((u) => re.test(u)).map((u) => u.replace(/^https:\/\/[^/]+/, '').replace(/^\/(en|zh-CN|ja|ko|es|de|fr)\//, '/<lang>/')))].length;

  const rows = [
    ['models 详情', cat(/\/models\/.+\/models\//), detail(/\/models\/.+\/models\//)],
    ['compare 详情', cat(/\/compare\/.+-vs-.+\//), detail(/\/compare\/.+-vs-.+\//)],
    ['ranking', cat(/\/ranking\/(?!recommendations)/), detail(/\/ranking\/(?!recommendations)/)],
    ['benchmarks', cat(/\/benchmarks\//), detail(/\/benchmarks\//)],
    ['use-cases', cat(/\/use-cases\//), detail(/\/use-cases\//)],
    ['categories', cat(/\/categories\//), detail(/\/categories\//)],
    ['compare-intent', cat(/\/compare-intent\//), detail(/\/compare-intent\//)],
    ['news', cat(/\/news\//), detail(/\/news\//)],
    ['calculator', cat(/\/calculator\//), detail(/\/calculator\//)],
    ['seo-report', cat(/\/seo-report\//), detail(/\/seo-report\//)],
    ['首页/其他', urls.length - cat(/\/models\/|\/compare\/|\/ranking\/|\/benchmarks\/|\/use-cases\/|\/categories\/|\/compare-intent\/|\/news\/|\/calculator\/|\/seo-report\//), 0],
  ];

  console.log('\n分类         URL 数    独立路径（去语言）');
  for (const [name, total, unique] of rows) {
    console.log(`${name.padEnd(12)} ${String(total).padEnd(9)} ${unique}`);
  }

  const landing = rows.filter((r) => ['use-cases', 'categories', 'compare-intent'].includes(r[0]));
  const landingTotal = landing.reduce((s, r) => s + r[1], 0);
  console.log('\nLanding 合计: ' + landingTotal);

  // 域名检查
  const bad = urls.filter((u) => /pages\.dev|localhost/.test(u));
  console.log(bad.length ? `\n⚠️ 发现非生产域名 URL: ${bad.length}` : '\n✅ 全部 URL 为生产域名');

  const pct = ((urls.length / (urls.length || 1)) * 100).toFixed(1);
  console.log(`\nVERDICT: ${bad.length ? 'FAIL' : 'PASS'}（${urls.length} URLs, ${pct}% 生产域名）`);
  process.exit(bad.length ? 1 : 0);
};

main().catch((e) => {
  console.error('ERROR: ' + e.message);
  process.exit(2);
});
