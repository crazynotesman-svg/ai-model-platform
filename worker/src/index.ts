/**
 * AI Model Intelligence Platform — Cloudflare Worker API 入口
 *
 * 路由：
 *   GET /api/health                 健康检查
 *   GET /api/models?lang=&search=&sort=   模型列表（search 模糊匹配；sort 白名单排序）
 *   GET /api/models/:slug?lang=     模型详情（按 slug）
 *
 * 约定：所有响应为 JSON + CORS 头（公开只读 API）。
 */
import { getModelBySlug, listModels } from './routes/models';

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

/** JSON 响应助手 */
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS },
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
      return json({ status: 'ok', service: 'ai-model-platform-api', version: '0.2.0' });
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
} satisfies ExportedHandler<Env>;
