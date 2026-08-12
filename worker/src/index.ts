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
import { getBenchmarks, getModelBySlug, getPricingHistory, listModels } from './routes/models';
import { listNews } from './routes/news';
import { buildNewsRss } from './routes/rss';
import { collectNews } from './collector';
import { rankModels } from './services/ranking';
import { createDailySnapshot } from './services/rankingSnapshot';
import { runDataTrustAudit } from './services/dataTrustAudit';
import { listPendingEvents, applyEvent } from './services/eventProcessor';
import { runDataDiscovery } from './services/dataDiscovery';
import { runModelDiscovery } from './connectors/modelDiscovery/runner';
import { loadModelProfiles } from './services/relationshipGenerator';
import { buildRelationships } from './services/modelGraph';
import { getDataQuality } from './services/dataQuality';
import { getRecommendations } from './services/recommendation';
import { getRankingTrend } from './routes/ranking';

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

    // API 版本化（Phase 9.7）：/api/v1/* 与 /api/* 等价（复用同一套 handler，旧 API 保留）
    const pathname = url.pathname.startsWith('/api/v1/')
      ? url.pathname.replace(/^\/api\/v1/, '/api')
      : url.pathname;

    // Data Events（Phase 11.6）：GET 列表（pending 审核队列）POST approve（应用事件）
    if (pathname === '/api/data-events' && request.method === 'GET') {
      try {
        const events = await listPendingEvents(env.DB);
        return json({ events });
      } catch (err) {
        return json({ error: String((err as Error).message) }, 500);
      }
    }
    const approveMatch = pathname.match(/^\/api\/data-events\/(\d+)\/approve$/);
    if (approveMatch && request.method === 'POST') {
      try {
        const id = Number(approveMatch[1]);
        const row = await env.DB.prepare('SELECT * FROM data_events WHERE id = ?').bind(id).first();
        if (!row) return json({ error: 'event not found' }, 404);
        if (row.status !== 'pending') return json({ error: `event already ${row.status}` }, 409);
        await applyEvent(env.DB, row as unknown as { event_type: string; entity_type: string; entity_id: string; payload: string; source_id: number | null; confidence: number });
        await env.DB.prepare("UPDATE data_events SET status = 'processed', processed_at = datetime('now') WHERE id = ?").bind(id).run();
        // Ranking 刷新（Phase 11.6 Step 10）：PRICE_CHANGED / BENCHMARK_UPDATED → 重算当日快照
        if (row.event_type === 'PRICE_CHANGED' || row.event_type === 'BENCHMARK_UPDATED') {
          const snap = await createDailySnapshot(env.DB);
          console.log(`[data-events] approve=${id} ranking refreshed: date=${snap.date}, inserted=${snap.inserted}`);
        }
        return json({ ok: true, id, status: 'processed' });
      } catch (err) {
        const e = err as Error;
        await env.DB.prepare("UPDATE data_events SET status = 'failed', error = ?, processed_at = datetime('now') WHERE id = ?")
          .bind(e.message, Number(approveMatch[1]))
          .run();
        return json({ error: e.message }, 500);
      }
    }
    if (request.method !== 'GET') {
      return json({ error: 'Method Not Allowed' }, 405);
    }

    // 健康检查
    if (pathname === '/' || pathname === '/api/health') {
      return json({ status: 'ok', service: 'ai-model-platform-api', version: '0.3.0' });
    }

    // Data Quality（Phase 11.9）：/api/data-quality
    if (pathname === '/api/data-quality') {
      try {
        return json(await getDataQuality(env.DB));
      } catch (err) {
        return json({ error: String((err as Error).message) }, 500);
      }
    }

    // 新闻列表：/api/news?lang=&category=
    if (pathname === '/api/news') {
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
    if (pathname === '/api/news/refresh') {
      const result = await collectNews(env);
      return json({ ok: true, ...result }, 200, { 'Cache-Control': 'no-store' });
    }

    // 新闻 RSS feed：/rss.xml（动态生成，来自 D1）
    if (pathname === '/rss.xml') {
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

    // 模型推荐：/api/recommendations?lang=（Phase 9.6）
    if (pathname === '/api/recommendations') {
      try {
        const recommendations = await getRecommendations(env.DB, url.searchParams.get('lang') ?? 'en');
        return json({ recommendations });
      } catch (err) {
        console.error('getRecommendations failed:', err);
        return json({ error: 'Internal Server Error' }, 500);
      }
    }

    // 排名趋势：/api/ranking/trend/:slug?mode=（Phase 9.6，默认 overall）
    const trendMatch = pathname.match(/^\/api\/ranking\/trend\/(.+)$/);
    if (trendMatch) {
      try {
        const slug = decodeURIComponent(trendMatch[1]);
        const trend = await getRankingTrend(env.DB, slug, url.searchParams.get('mode') ?? 'overall');
        if (!trend) return json({ error: 'Model not found' }, 404);
        return json(trend);
      } catch (err) {
        console.error('getRankingTrend failed:', err);
        return json({ error: 'Internal Server Error' }, 500);
      }
    }

    // 模型排名：/api/ranking?lang=&category=（Phase 9.5；category 可空，best-value 为特殊模式）
    if (pathname === '/api/ranking') {
      try {
        const rankings = await rankModels(env.DB, {
          lang: url.searchParams.get('lang') ?? 'en',
          category: url.searchParams.get('category') || null,
        });
        // 附 rank 编号（服务端排序后）
        const withRank = rankings.map((r, i) => ({ rank: i + 1, ...r }));
        return json({ rankings: withRank });
      } catch (err) {
        console.error('rankModels failed:', err);
        return json({ error: 'Internal Server Error' }, 500);
      }
    }

    // 模型列表：/api/models
    if (pathname === '/api/models') {
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

    // 模型基准结果：/api/models/:slug/benchmarks（Phase 9.4a）
    // 注意：必须放在详情路由之前（详情用贪婪捕获 (.+)，否则会吞掉后缀）
    const benchMatch = pathname.match(/^\/api\/models\/(.+)\/benchmarks$/);
    if (benchMatch) {
      try {
        const slug = decodeURIComponent(benchMatch[1]);
        const result = await getBenchmarks(env.DB, slug, url.searchParams.get('lang') ?? 'en');
        if (!result.model) return json({ error: 'Model not found' }, 404);
        return json(result);
      } catch (err) {
        console.error('getBenchmarks failed:', err);
        return json({ error: 'Internal Server Error' }, 500);
      }
    }

    // 模型关系（Phase 11.8 Knowledge Graph API）：/api/models/:slug/relationships
    const relMatch = pathname.match(/^\/api\/models\/(.+)\/relationships$/);
    if (relMatch) {
      try {
        const slug = decodeURIComponent(relMatch[1]);
        const profiles = await loadModelProfiles(env.DB);
        const me = profiles.find((p) => p.slug === slug);
        if (!me) return json({ error: 'Model not found' }, 404);
        const rels = buildRelationships(me, profiles);
        return json({
          slug,
          similar: rels.filter((r) => r.type === 'similar_to').map((r) => ({ model: r.targetSlug, name: r.targetName, confidence: r.confidence, reason: r.reason })),
          alternatives: rels.filter((r) => r.type === 'alternative_to' || r.type === 'cheaper_than').map((r) => ({ model: r.targetSlug, name: r.targetName, type: r.type, confidence: r.confidence, reason: r.reason })),
          competitors: rels.filter((r) => r.type === 'similar_to' && r.confidence >= 75).map((r) => ({ model: r.targetSlug, name: r.targetName, confidence: r.confidence, reason: r.reason })),
        });
      } catch (err) {
        console.error('getRelationships failed:', err);
        return json({ error: 'Internal Server Error' }, 500);
      }
    }

    // 模型价格历史：/api/models/:slug/pricing-history（Phase 9.2）
    // 注意：必须放在详情路由之前（详情用贪婪捕获 (.+)，否则会吞掉后缀）
    const historyMatch = pathname.match(/^\/api\/models\/(.+)\/pricing-history$/);
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
    const detailMatch = pathname.match(/^\/api\/models\/(.+)$/);
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
   * 定时任务：
   *   - 每天 01:00 UTC 自动抓取新闻（wrangler.toml [triggers] crons）
   *   - 每天 02:00 UTC 生成排名快照（Phase 9.6，幂等）
   * 也可用 `wrangler dev --test-scheduled` 本地模拟触发。
   */
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    // 01:00 新闻采集
    const result = await collectNews(env);
    console.log(
      `[cron ${controller.cron}] news collection: added=${result.added}, sourcesOk=${result.sourcesOk}, errors=${JSON.stringify(result.errors)}`,
    );

    // 02:00 排名快照
    if (controller.cron === '0 2 * * *') {
      try {
        const snap = await createDailySnapshot(env.DB);
        console.log(
          `[cron ${controller.cron}] ranking snapshot: date=${snap.date}, inserted=${snap.inserted}, skipped=${snap.skipped}`,
        );
      } catch (err) {
        console.error('[cron] ranking snapshot failed:', err);
      }
    }

    // 03:00 Data Trust 审计（Phase 11.5B）
    if (controller.cron === '0 3 * * *') {
      try {
        await runDataTrustAudit(env.DB);
      } catch (err) {
        console.error('[cron] data trust audit failed:', err);
      }
    }

    // 每 6 小时 Data Discovery（Phase 11.6）：connectors → pending events（不自动发布）
    if (controller.cron === '0 */6 * * *') {
      try {
        const result = await runDataDiscovery(env.DB);
        console.log(
          `[cron ${controller.cron}] data discovery: connectors=${result.connectors}, events=${result.eventsInserted}, errors=${JSON.stringify(result.errors)}`,
        );
      } catch (err) {
        console.error('[cron] data discovery failed:', err);
      }
    }
    // 每日 04:00 Model Discovery（Phase 12.1）：官方来源发现新模型/新版本 → pending
    if (controller.cron === '0 4 * * *') {
      try {
        const result = await runModelDiscovery(env.DB);
        console.log('[cron 0 4 * * *] model discovery: connectors=' + result.connectors + ', events=' + result.events + ', errors=' + JSON.stringify(result.errors));
      } catch (err) {
        console.error('[cron] model discovery failed:', err);
      }
    }
  },
} satisfies ExportedHandler<Env>;
