# 404 Platform Limit（Cloudflare Pages 软 404 限制说明）

- **Date**: 2026-08-10（初版）/ 2026-09-18（修订）/ 2026-09-23（结论修正 + 线上验证）
- **Domain**: https://aimodel.100ideas.net

## 2026-09-23 修订摘要（重要：推翻上一版的结论）

上一版文档断言「项目开启了 SPA fallback，必须去 Dashboard 关闭后 404 页才生效」——**这个判断是错的**。
补上 `dist/404.html` 后线上已直接返回真 404，无需任何 Dashboard 操作。本次修订把机制改成实测结论。

| 变更 | 前 | 后 |
| --- | --- | --- |
| 根路径 `/` | HTTP 200 + `<meta name="robots" content="noindex">` 的语言重定向页 | **HTTP 301 → `/en/`**（`_redirects` 实现） |
| 404 规则 | `_redirects` 中 8 条 `/404 404`（**平台不支持，从未生效**） | 已移除；改由构建产物 `dist/404.html` 承担 |
| 404 页面 | 不存在（`src/pages` 下无 404 页） | `frontend/src/pages/404.astro`（7 语言入口 + noindex） |
| 无效路径状态码 | HTTP 200 + 首页内容 + noindex（软 404） | **HTTP 404 + 自定义 404 页**（实测已生效） |
| Dashboard 手动操作 | 上一版称「必须手动切换 Not found behavior」 | **不需要**，见平台事实 3 |

### 平台事实 1：重定向优先于静态文件

Cloudflare 官方文档原文：

> "Redirects are always followed, regardless of whether or not an asset matches the incoming request."

（https://developers.cloudflare.com/pages/configuration/redirects/）

因此 `_redirects` 中的 `/ /en/ 301` **会覆盖**构建产物 `dist/index.html` —— 无需删除 `dist/index.html`，
也无需修改 `astro.config.ts` 的 `redirects: { '/': '/en' }`（后者保留为本地 dev 兜底）。

### 平台事实 2：`_redirects` 不支持 404 等状态码的 rewrite

官方支持矩阵中明确标注 Rewrite **仅支持 200 proxying**：

| 能力 | 支持 | 示例 |
| --- | --- | --- |
| Redirects (301/302/303/307/308) | ✅ | `/home / 301` |
| Rewrites (其他状态码) | ❌ | `/blog/* /blog/404.html 404` |
| Proxying | ✅ | `/blog/* /news/:splat 200` |

**这解释了为什么原有的 8 条 `/404 404` 规则从未生效** —— 它们被平台忽略，请求继续落到兜底逻辑。
现已全部移除，不再产生误导。真正的 404 由构建产物 `404.html` 承担（见事实 3）。

### 平台事实 3：`404.html` 是否存在，决定 Pages 走「404 页」还是「SPA fallback」

官方文档原文（https://developers.cloudflare.com/pages/configuration/serving-pages/）：

> "You can define a custom page to be displayed when Pages cannot find a requested file by creating a
> `404.html` file. Pages will then attempt to find the closest 404 page. If one is not found in the same
> directory as the route you are currently requesting, it will continue to look up the directory tree for a
> matching `404.html` file, ending in `/404.html`."

> "If your project does **not** include a top-level `404.html` file, Pages assumes that you are deploying a
> single-page application. … Pages' default single-page application behavior matches all incoming paths to
> the root (`/`), allowing you to capture URLs like `/about` or `/help` and respond to them from within your SPA."

结论：**SPA fallback 不是一个需要手动开关的独立配置，而是「缺少顶层 `404.html`」时的自动降级行为。**

- 修复前：`src/pages` 下无 404 页 → 无 `dist/404.html` → 平台按 SPA 处理 → 所有未命中路径返回 `index.html` + HTTP 200
- 修复后：新增 `src/pages/404.astro` → 产出 `dist/404.html` → 平台改用 404 页 → 未命中路径返回 HTTP 404

因此不需要在 Dashboard 修改 *Not found behavior*，也不需要 `_middleware.ts`。

## 当前状态（2026-09-23 线上实测）

| 检查项 | 结果 |
| --- | --- |
| 根路径 `/` HTTP 状态 | ✅ **301 → `/en/`** |
| 根路径 robots | ✅ 无 noindex（301 响应无 HTML 体） |
| `/en`（无尾斜杠） | ✅ 308 → `/en/` |
| 各语言首页 `/en/` `/zh-CN/` `/ja/` `/fr/` | ✅ 200，无 noindex |
| 模型页 `/en/models/openai/gpt-4o/` | ✅ 200，无 noindex |
| 对比页 `/en/compare/`、排名页 `/en/ranking/` | ✅ 200，无 noindex |
| 404 页 HTTP 状态 | ✅ **404 + 自定义页**（`/totally-fake-path-9999/`、`/en/nope/`、`/zz-ZZ/` 均实测） |
| 404 页 `<meta name="robots">` | ✅ `noindex, nofollow` |
| 404 页 canonical | ✅ 不输出（刻意的：不继承 BaseLayout，避免被读作软 404 替代页） |
| 404 页客户端 JS | ✅ 零 JS，7 语言入口为静态链接 |
| sitemap 收录 | ✅ 8176 条，不含根路径、不含 404 |
| robots.txt | ✅ `Allow: /` + Sitemap 指向 `sitemap-index.xml` |

## 历史方案（均未采用，留档备查）

修复前曾评估三条路径，最终证明**都不需要**：

- **方案 A：Dashboard 关闭 SPA fallback** —— 上一版推荐的方案，实施后发现平台根本没有可关闭的开关，
  补 `404.html` 即自动生效。曾遇到的「PATCH `not_found_handling` 成功但 GET 不返回、行为不变」
  并非 API 缺陷，而是该字段在缺少 `404.html` 时无意义。
- **方案 B：Pages Functions 中间件**（`_middleware.ts` + `_routes.json`）—— 需自行判定合法路径，
  且让所有请求经过 Functions 层，对 8000+ 纯静态页的 SSG 站点不划算。
- **方案 C：Cloudflare Worker 前置代理** —— 多一跳成本，无必要。

## 监控

`frontend/scripts/seo-health-check.mjs`：

- **第 2.5 步**（新增）：根路径必须返回 `301 → /en/`，否则 **FAIL**
- 原先「`/` 必须是 meta refresh + noindex 页」的断言已移除（那是修复前的错误预期）
- 无效路径探测：现在应返回 404，若回归为 200 则说明 `dist/404.html` 未产出或被平台忽略
