/**
 * AI Model Intelligence Platform — Cloudflare Worker API 入口
 *
 * Phase 1：基础骨架，仅提供健康检查占位。
 * 后续阶段将在此挂载 /api/models、/api/pricing、/api/token-count、/api/cost-estimate 等路由，
 * 并通过 Env.DB（D1 绑定）访问数据库。
 */

export interface Env {
  /**
   * Cloudflare D1 数据库绑定（wrangler.toml 中声明）。
   * Phase 1 仅占位，Phase 5 启用。
   */
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 健康检查：用于部署后确认服务在线（部署平台探活 / 本地 smoke test 均可使用）
    if (url.pathname === '/' || url.pathname === '/api/health') {
      return Response.json({
        status: 'ok',
        service: 'ai-model-platform-api',
        version: '0.1.0',
      });
    }

    // 未匹配路由：404
    return Response.json({ error: 'Not Found' }, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
