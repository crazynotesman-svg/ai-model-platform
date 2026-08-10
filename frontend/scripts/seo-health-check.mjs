#!/usr/bin/env node
/**
 * SEO Health Check —— 生产站收录健康度巡检
 *
 * 用法：node frontend/scripts/seo-health-check.mjs [--domain https://aimodel.100ideas.net] [--pages N]
 * 验证：robots.txt / sitemap-index / 随机 N 页（默认 10）的
 *       canonical、hreflang、og:image、JSON-LD 合法性。
 * 输出：SEO HEALTH REPORT（退出码：0 = PASS，1 = 有 WARN，2 = 有 FAIL）
 *
 * 无第三方依赖，Node >= 18（全局 fetch）。
 */

const DEFAULT_DOMAIN = 'https://aimodel.100ideas.net';
const DEFAULT_PAGES = 10;

// 解析参数
const args = process.argv.slice(2);
const domainIdx = args.indexOf('--domain');
const domain = domainIdx !== -1 && args[domainIdx + 1] ? args[domainIdx + 1] : DEFAULT_DOMAIN;
const pagesIdx = args.indexOf('--pages');
const pagesArg = pagesIdx !== -1 ? Number(args[pagesIdx + 1]) : DEFAULT_PAGES;
const pageCount = Number.isFinite(pagesArg) && pagesArg > 0 ? Math.min(pagesArg, 30) : DEFAULT_PAGES;

const report = [];
let fail = 0;
let warn = 0;
const add = (level, msg) => {
  report.push(`[${level}] ${msg}`);
  if (level === 'FAIL') fail++;
  if (level === 'WARN') warn++;
};

const get = async (u) => {
  try {
    const r = await fetch(u, { redirect: 'follow' });
    return { status: r.status, url: r.url, text: await r.text() };
  } catch (e) {
    return { status: 'ERR', error: e.message, text: '' };
  }
};

// 抽查页面池（Tier 1/2 混合 + 随机模型页）
const TIER_PAGES = [
  '/', '/en/', '/zh-CN/', '/en/models/', '/en/compare/', '/en/ranking/',
  '/en/benchmarks/', '/en/news/', '/en/data-policy/',
  '/en/models/openai/gpt-4o/', '/en/models/anthropic/claude-sonnet-4/',
  '/en/models/google/gemini-2.5-pro/',
  '/en/compare/deepseek_deepseek-chat-vs-openai_gpt-4o/',
  '/en/benchmarks/coding/', '/en/ranking/recommendations/',
  '/de/models/', '/ja/ranking/', '/ko/benchmarks/reasoning/',
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pick = (n, pool) => {
  const copy = [...pool];
  const out = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  return out;
};

const fmt = (ts) => new Date(ts).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
const since = (start) => ((Date.now() - start) / 1000).toFixed(1) + 's';

const main = async () => {
  const start = Date.now();
  console.log(`SEO HEALTH CHECK — ${domain} — ${fmt(start)}`);
  console.log('='.repeat(60));

  // 1. robots.txt
  const robots = await get(`${domain}/robots.txt`);
  const robotsOk =
    robots.status === 200 &&
    robots.text.includes('sitemap-index.xml') &&
    robots.text.includes(new URL(domain).host) &&
    !robots.text.includes('pages.dev');
  if (robotsOk) {
    add('PASS', `robots.txt 200 + Sitemap 声明 ${domain}/sitemap-index.xml`);
  } else {
    add('FAIL', `robots.txt: status=${robots.status} sitemap=${robots.text.includes('sitemap-index.xml')} host=${robots.text.includes(new URL(domain).host)} pages.dev=${robots.text.includes('pages.dev')}`);
  }

  // 2. sitemap-index.xml
  const si = await get(`${domain}/sitemap-index.xml`);
  if (si.status === 200 && /<\?xml/.test(si.text)) {
    const refs = [...si.text.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    add('PASS', `sitemap-index.xml 200 XML 合法（${refs.length} 个引用）`);
  } else {
    add('FAIL', `sitemap-index.xml: status=${si.status} xml=${/<\?xml/.test(si.text)}`);
  }

  // 3. 抽查页面
  const pages = pick(pageCount, TIER_PAGES);
  let canonicalOk = 0;
  let hreflangOk = 0;
  let ogImageOk = 0;
  let jsonldOk = 0;
  for (const p of pages) {
    const r = await get(domain + p);
    if (r.status !== 200) {
      add('WARN', `${p} → HTTP ${r.status}${p === '/' ? '（重定向页，正常）' : ''}`);
      continue;
    }
    const html = r.text;
    const host = new URL(domain).host;

    // 根路径 '/'：语言重定向页（noindex + meta refresh），无 hreflang/og/jsonld 属正常
    if (p === '/') {
      if (/<meta http-equiv="refresh"/.test(html)) {
        add('INFO', `/ 语言重定向页（meta refresh → /en/，noindex）✓`);
      } else {
        add('WARN', `/ 非重定向页`);
      }
      continue;
    }

    // canonical
    const canon = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? null;
    if (canon && canon.startsWith(domain) && !canon.includes('pages.dev') && !canon.includes('localhost')) canonicalOk++;
    else add('FAIL', `${p} canonical=${canon}`);

    // hreflang
    const hreflang = (html.match(/hreflang="[^"]+" href="https?:\/\/[^/"]+/g) ?? []).length;
    if (hreflang >= 7 && !html.includes('pages.dev')) hreflangOk++;
    else add('FAIL', `${p} hreflang=${hreflang}（含 pages.dev=${html.includes('pages.dev')}）`);

    // og:image
    const ogImage = html.match(/property="og:image" content="([^"]+)"/)?.[1] ?? null;
    if (ogImage && ogImage.startsWith(domain)) ogImageOk++;
    else add('FAIL', `${p} og:image=${ogImage}`);

    // JSON-LD 合法性
    const lds = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    const valid = lds.every((m) => {
      try { JSON.parse(m[1]); return true; } catch { return false; }
    });
    if (lds.length > 0 && valid) jsonldOk++;
    else if (lds.length === 0) add('WARN', `${p} 无 JSON-LD`);
    else add('FAIL', `${p} JSON-LD 非法`);
  }
  add('INFO', `抽查 ${pages.length} 页：canonical ${canonicalOk} / hreflang ${hreflangOk} / og:image ${ogImageOk} / jsonld ${jsonldOk}`);

  // 4. 404 状态（已知平台限制 → WARN）
  const nf = await fetch(`${domain}/__seo_health_404_probe__/`, { redirect: 'manual' });
  const nfStatus = nf.status;
  if (nfStatus === 404) add('PASS', `无效路径 HTTP 404 ✓`);
  else add('WARN', `无效路径 HTTP ${nfStatus}（Cloudflare Pages SPA fallback 限制，见 docs/404-platform-limit.md）`);

  // 5. 汇总
  const elapsed = since(start);
  console.log('='.repeat(60));
  console.log('SEO HEALTH REPORT');
  console.log(`  Domain: ${domain}`);
  console.log(`  Pages checked: ${pages.length}（Tier1/2 + 随机）`);
  console.log(`  FAIL: ${fail}  WARN: ${warn}  PASS: ${report.filter((l) => l.startsWith('[PASS]')).length}`);
  console.log(`  Duration: ${elapsed}`);
  console.log('');
  console.log(report.join('\n'));
  console.log('');
  const verdict = fail > 0 ? 'FAIL' : warn > 0 ? 'PASS (with warnings)' : 'PASS';
  console.log(`VERDICT: ${verdict}`);
  process.exit(fail > 0 ? 2 : warn > 0 ? 1 : 0);
};

main();
