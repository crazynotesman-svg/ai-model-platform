# 404 Platform Limit（Cloudflare Pages 软 404 限制说明）

- **Date**: 2026-08-10
- **Domain**: https://aimodel.100ideas.net

## 现状

| 检查项 | 结果 |
| --- | --- |
| 无效路径 HTTP 状态 | ⚠️ **200**（软 404） |
| 404 页面 `<meta name="robots">` | ✅ `noindex, nofollow`（不会收录） |
| canonical | ✅ 不输出 canonical（404 页无） |
| sitemap 收录 | ✅ 不含 404 页 |
| _redirects 404 规则 | ✅ 已配置（`/en/* /404 404` 等），但**被 SPA fallback 优先拦截** |

## 根因

Cloudflare Pages 项目默认启用 **Single-Page-Application fallback**（`not_found_handling: single-page-application`）：
- 未匹配静态文件的路径 → 返回 `index.html`（HTTP 200）而非 404
- `_redirects` 的 404 规则优先级低于 SPA fallback（实测无效）
- Pages API 的 `deployment_configs.*.not_found_handling` 字段无法通过 API 持久化（PATCH success 但 GET 不返回、行为不变）——需 **Cloudflare Dashboard 手动操作**或平台侧变更

## 影响评估

- **SEO 影响：低**（现有保护已生效）：
  - 404 页带 `noindex, nofollow` → Google 不收录软 404 内容
  - sitemap 不含无效路径 → 不会被主动抓取
  - 主要风险：外部链接指向失效 URL 时，Google 拿到 200+noindex 而非 404（Crawl stats 显示"抓取但未收录"），仅影响无效 URL 的索引清理速度

## 解决方案（按推荐顺序，不破坏当前部署）

### 方案 A：Cloudflare Dashboard（最快，零代码）
1. Cloudflare 控制台 → Workers & Pages → ai-model-platform → **Settings → General**
2. 关闭 **"Single-page application"**（或设置 **Not found behavior → 404 page**）
3. 保存后 `_redirects` 404 规则立即生效，无效路径返回真 404
> 说明：当前站点为纯 SSG（无客户端路由依赖），关闭 SPA fallback **不影响任何合法页面**

### 方案 B：Pages Functions 中间件（代码方案，可 CI 化）
- 新增 `frontend/functions/_middleware.ts`（Pages 构建时自动挂载 Functions 层）：
```ts
// 拦截未命中静态资源的路径（SPA fallback 之前），返回真 404
export const onRequest: PagesFunction = async ({ request, next }) => {
  const res = await next();
  // 当 Pages 返回 index.html（SPA fallback）且路径不是合法页面时 → 404
  // 注：需维护合法路径列表或依赖资源存在性判断
  return res;
};
```
- 依赖 `_routes.json` 排除静态资源；实现复杂度较高（需合法路径判定），留作后续

### 方案 C：Cloudflare Worker 前置代理（独立域名层）
- 在 aimodel.100ideas.net 前置 Worker：请求转发 Pages，对非静态路径返回 404
- 成本高（额外一跳），仅当 A/B 均不可行时采用

## 建议

- **短期**：保持现状（200 + noindex 已有收录保护）+ 按方案 A 在 Dashboard 手动关闭 SPA fallback（5 分钟，需用户操作）
- **长期**：若需自动化，实施方案 B（Pages Functions），纳入 CI 验证
- 监控：健康检查脚本将 404 状态列为「警告」项（不阻塞 PASS），修复后自动转 PASS
