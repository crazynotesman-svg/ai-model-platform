# 404 Platform Limit（Cloudflare Pages 软 404 限制说明）

- **Date**: 2026-08-10（初版）/ 2026-09-18（修订）
- **Domain**: https://aimodel.100ideas.net

## 2026-09-18 修订摘要

本轮排查 GSC「网址检查报 noindex」时确认了两条 Cloudflare Pages 平台事实，并据此重构了根路径与 404 的处理方式：

| 变更 | 前 | 后 |
| --- | --- | --- |
| 根路径 `/` | HTTP 200 + `<meta name="robots" content="noindex">` 的语言重定向页 | **HTTP 301 → `/en/`**（`_redirects` 实现） |
| 404 规则 | `_redirects` 中 8 条 `/404 404`（**平台不支持，从未生效**） | 已移除；改由构建产物 `dist/404.html` 承担 |
| 404 页面 | 不存在（`src/pages` 下无 404 页） | `frontend/src/pages/404.astro`（7 语言入口 + noindex） |

### 平台事实 1：重定向优先于静态文件

Cloudflare 官方文档原文：

> "Redirects are always followed, regardless of whether or not an asset matches the incoming request."

（https://developers.cloudflare.com/pages/configuration/redirects/）

因此 `_redirects` 中的 `/ /en/ 301` **会覆盖**构建产物 `dist/index.html` —— 无需删除 `dist/index.html`，
也无需修改 `astro.config.ts` 的 `redirects: { '/': '/en' }`（后者保留为兜底）。

### 平台事实 2：`_redirects` 不支持 404 等状态码的 rewrite

官方支持矩阵中明确标注 Rewrite **仅支持 200 proxying**：

| 能力 | 支持 | 示例 |
| --- | --- | --- |
| Redirects (301/302/303/307/308) | ✅ | `/home / 301` |
| Rewrites (其他状态码) | ❌ | `/blog/* /blog/404.html 404` |
| Proxying | ✅ | `/blog/* /news/:splat 200` |

**这解释了为什么原有的 8 条 `/404 404` 规则从未生效** —— 它们被平台忽略，请求继续落到 SPA fallback。
现已全部移除，不再产生误导。

## 当前状态（2026-09-18 后）

| 检查项 | 结果 |
| --- | --- |
| 根路径 HTTP 状态 | ✅ **301 → /en/** |
| 根路径 robots | ✅ 无 noindex（301 响应本身无 HTML 体） |
| 404 页 `<meta name="robots">` | ✅ `noindex, nofollow`（`src/pages/404.astro`） |
| 404 页 canonical | ✅ 不输出 canonical（刻意的：不继承 BaseLayout） |
| sitemap 收录 | ✅ 不含 404 页（`astro.config.ts` sitemap filter 已排除） |
| 无效路径 HTTP 状态 | ⚠️ 仍为 **200**（软 404）—— 取决于项目 Not found behavior 设置 |

## 根因（软 404 部分，仍未解决）

Cloudflare Pages 项目默认启用 **Single-Page-Application fallback**（`not_found_handling: single-page-application`）：

- 未匹配静态文件的路径 → 返回 `index.html`（HTTP 200）而非 404
- `_redirects` 的 404 规则优先级低于 SPA fallback，且平台本就不支持 404 rewrite
- Pages API 的 `deployment_configs.*.not_found_handling` 字段无法通过 API 持久化
  （PATCH success 但 GET 不返回、行为不变）—— 需 **Cloudflare Dashboard 手动操作**

> 注：`dist/404.html` 现在已存在，但 SPA fallback 开启时平台**不会**使用它。
> 必须先在 Dashboard 切换 Not found behavior，404 页才会生效。

## 影响评估

- 根路径：**已解决**。原 200 + noindex 会导致 GSC 报「检测到 noindex」、裸域名权重无法传递；
  现为 301，权重正常传递至 `/en/`
- 软 404：**SEO 影响低**（404 页带 `noindex, nofollow` → Google 不收录；sitemap 不含无效路径）
  - 主要风险：外部链接指向失效 URL 时，Google 拿到 200 + noindex 而非 404，仅影响无效 URL 的索引清理速度

## 解决方案（按推荐顺序）

### 方案 A：Cloudflare Dashboard（推荐，1 分钟，零代码）
1. Cloudflare 控制台 → Workers & Pages → ai-model-platform → **Settings → General**
2. 将 **Not found behavior** 设为 **404 page**（关闭 "Single-page application"）
3. 保存后无效路径立即返回真 404 + `dist/404.html`
> 当前站点为纯 SSG（无客户端路由依赖），关闭 SPA fallback **不影响任何合法页面**。

### 方案 B：Pages Functions 中间件（代码方案，未采用）
- 需 `frontend/functions/_middleware.ts` + `_routes.json`，且要自行判定「合法路径」
- 会让所有请求经过 Functions 层，可能影响缓存与性能 —— 对一个 8000+ 静态页的纯 SSG 站点收益不划算，暂不采用

### 方案 C：Cloudflare Worker 前置代理
- 成本高（额外一跳），仅当 A/B 均不可行时采用

## 监控

`frontend/scripts/seo-health-check.mjs` 已同步更新：

- 新增 **第 2.5 步**：根路径必须返回 `301 → /en/`，否则 **FAIL**
- 无效路径探测仍为 WARN 项（方案 A 完成后自动转 PASS）
