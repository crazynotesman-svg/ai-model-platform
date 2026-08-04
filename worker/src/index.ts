/**
 * AI Model Intelligence Platform — Cloudflare Worker API 入口
 *
 * 路由：
 *   GET /api/health                 健康检查
 *   GET /api/models?lang=&search=&sort=   模型列表（search 模糊匹配；sort 白名单排序）
 *   GET /api/models/:slug?lang=     模型详情（按 slug）
 *   GET /api/news?lang=&category=   新闻列表（按语言/分类筛选）
 *   GET /api/news/refresh           手动触发新闻采集（本地调试；生产由 Cron）
 *   GET /rss.xml                    新闻 RSS 2.0 feed（聚合，动态生成）
 *
 * 定时任务：
 *   scheduled（wrangler.toml [triggers] crons，默认每天 01:00 UTC）→ 新闻采集
 *
 * 约定：所有响应为 JSON + CORS 头（公开只读 API）+ 安全头；GET 缓存 60s。
 */
import { getModelBySlug, getPricingHistory, listModels } from './routes/models';
import { listNews } from './routes/news';
import { buildNewsRss } from './routes/rss';
import { collectNews } from './collector';

export interface Env {
  /** Cloudflare D1 数据库绑定（wrangler.toml 声明） */
  DB: D1Database;
}

/** 公开只读 API 的 CORS 响应头 */
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/** 基础安全响应头 */
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
};

/** JSON 响应助手（安全头 + 60s 公共缓存） */
function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...SECURITY_HEADERS,
      'Cache-Control': 'public, max-age=60',
      ...extra,
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'GET') {
      return json({ error: 'Method Not Allowed' }, 405);
    }

    // 健康检查
    if (url.pathname === '/' || url.pathname === '/api/health') {
      return json({ status: 'ok', service: 'ai-model-platform-api', version: '0.3.0' });
    }

    // 新闻列表：/api/news?lang=&category=
    if (url.pathname === '/api/news') {
      try {
        const news = await listNews(env.DB, {
          lang: url.searchParams.get('lang') || null,
          category: url.searchParams.get('category') || null,
        });
        return json({ news });
      } catch (err) {
        console.error('listNews failed:', err);
        return json({ error: 'Internal Server Error' }, 500);
      }
    }

    // 手动触发新闻采集：/api/news/refresh（本地调试/运维；生产由 Cron 调度）
    if (url.pathname === '/api/news/refresh') {
      const result = await collectNews(env);
      return json({ ok: true, ...result }, 200, { 'Cache-Control': 'no-store' });
    }

    // 新闻 RSS feed：/rss.xml（动态生成，来自 D1）
    if (url.pathname === '/rss.xml') {
      try {
        const xml = await buildNewsRss(env.DB, url.origin);
        return new Response(xml, {
          headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            ...SECURITY_HEADERS,
            'Cache-Control': 'public, max-age=300',
          },
        });
      } catch (err) {
        console.error('buildNewsRss failed:', err);
        return json({ error: 'Internal Server Error' }, 500);
      }
    }

    // 模型列表：/api/models
    if (url.pathname === '/api/models') {
      try {
        const models = await listModels(env.DB, {
          lang: url.searchParams.get('lang') ?? 'en',
          search: url.searchParams.get('search') || null,
          sort: url.searchParams.get('sort') ?? 'newest',
        });
        return json({ models });
      } catch (err) {
        console.error('listModels failed:', err);
        return json({ error: 'Internal Server Error' }, 500);
      }
    }

    // 模型价格历史：/api/models/:slug/pricing-history（Phase 9.2）
    // 注意：必须放在详情路由之前（详情用贪婪捕获 (.+)，否则会吞掉后缀）
    const historyMatch = url.pathname.match(/^\/api\/models\/(.+)\/pricing-history$/);
    if (historyMatch) {
      try {
        const slug = decodeURIComponent(historyMatch[1]);
        const history = await getPricingHistory(env.DB, slug, {
          currency: url.searchParams.get('currency') || null,
          unit: url.searchParams.get('unit') || null,
        });
        if (!history) return json({ error: 'Model not found' }, 404);
        return json({ pricingHistory: history });
      } catch (err) {
        console.error('getPricingHistory failed:', err);
        return json({ error: 'Internal Server Error' }, 500);
      }
    }

    // 模型详情：/api/models/:slug（slug 含 /，如 openai/gpt-4o，用贪婪捕获）
    const detailMatch = url.pathname.match(/^\/api\/models\/(.+)$/);
    if (detailMatch) {
      try {
        const slug = decodeURIComponent(detailMatch[1]);
        const model = await getModelBySlug(env.DB, slug, url.searchParams.get('lang') ?? 'en');
        if (!model) return json({ error: 'Model not found' }, 404);
        return json({ model });
      } catch (err) {
        console.error('getModelBySlug failed:', err);
        return json({ error: 'Internal Server Error' }, 500);
      }
    }

    // 未匹配路由
    return json({ error: 'Not Found' }, 404);
  },

  /**
   * 定时任务：每天 01:00 UTC 自动抓取新闻（wrangler.toml [triggers] crons）。
   * 也可用 `wrangler dev --test-scheduled` 本地模拟触发。
   */
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    const result = await collectNews(env);
    console.log(
      `[cron ${controller.cron}] news collection: added=${result.added}, sourcesOk=${result.sourcesOk}, errors=${JSON.stringify(result.errors)}`,
    );
  },
} satisfies ExportedHandler<Env>;
