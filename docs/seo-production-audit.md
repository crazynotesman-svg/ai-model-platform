# SEO Production Audit

- **Date**: 2026-08-10
- **Domain**: https://aimodel.100ideas.net
- **Auditor**: AI Model Intelligence Platform CI
- **Scope**: 生产环境全站审计（仅检查，不修改）

---

## Sitemap

- **Status**: ⚠️ **P0 问题（域名未切换）**
- **结果**:
  - `https://aimodel.100ideas.net/sitemap-index.xml` → **200 OK**，XML 合法（application/xml + prolog）
  - sitemap 文件数量：**1**（sitemap-index.xml → sitemap-0.xml）
  - **总 URL 数：8,715**（与构建页数 8,716 − 404 页一致 ✓）
  - 页面类型覆盖：models 详情 / compare（8,239）/ benchmarks / ranking / news / data-policy / calculator / ranking-recommendations ✓
  - hreflang：不在 sitemap 中（sitemap 无 hreflang，正常规范）
- **Issues**:
  - 🔴 **robots.txt 与 sitemap-index.xml 中的 URL 全部指向 `ai-model-platform-my5.pages.dev`**（旧域名），而非生产域名 `aimodel.100ideas.net`
  - ⚠️ `/en/recommendations/` 不在 sitemap 中；实际推荐页为 `/ranking/recommendations/`（7 语言，在 sitemap 内 ✓）
- **示例 URL**:
  - `https://ai-model-platform-my5.pages.dev/de/`
  - `https://ai-model-platform-my5.pages.dev/zh-CN/ranking/vision/`
  - `https://ai-model-platform-my5.pages.dev/en/ranking/recommendations/`

## Robots

- **Status**: ⚠️ **P0 问题（Sitemap 声明域名错误）**
- **结果**:
  - `https://aimodel.100ideas.net/robots.txt` → **200 OK**
  - `User-agent: *` + `Allow: /` ✓
  - `Sitemap: https://ai-model-platform-my5.pages.dev/sitemap-index.xml`（**旧域名**）
- **Issues**:
  - 🔴 Sitemap 声明指向 pages.dev → Google 抓取时 sitemap URL 跨域名，生产域名收录受影响
  - 无错误 Disallow，无阻止重要路径 ✓（除以上域名问题）

## Canonical

- **Status**: 🔴 **P0 问题（全站 canonical 指向旧域名）**
- **抽查 14 个页面**（/ 、/en/、/zh-CN/、/en/models/、/en/models/openai/gpt-4o/、/en/compare/、compare 详情、/en/ranking/、/en/benchmarks/coding/、/en/news/、/en/data-policy/、/en/calculator/token/、/de/models/、/en/recommendations/）：
  - 13/14 页面有 canonical，**全部为 `https://ai-model-platform-my5.pages.dev/...`**
  - 无 localhost ✓、无 preview 域名（`16813c59.ai-model-platform-my5.pages.dev` 等未出现）✓
  - 无重复 canonical ✓
- **Issues**:
  - 🔴 **canonical 与请求域名不一致**：`https://aimodel.100ideas.net/en/...` 页面 canonical 指向 pages.dev → 搜索引擎会将生产域名页面视为 pages.dev 的副本，生产域名几乎无法收录
  - ⚠️ `/en/recommendations/` 返回软 404（重定向页，canonical=pages.dev/en，noindex）

## hreflang

- **Status**: 🔴 **P0 问题（同 canonical，指向旧域名）**
- **检查页**：模型详情 `/en/models/openai/gpt-4o/`、比较页 `/en/compare/deepseek_deepseek-chat-vs-openai_gpt-4o/`、`/en/ranking/`
- **结果**:
  - 每页 8 个 alternate：en / zh-CN / ja / ko / es / de / fr + **x-default** ✓
  - 互相引用完整 ✓
- **Issues**:
  - 🔴 8 个 alternate URL 全部为 `https://ai-model-platform-my5.pages.dev/...`（旧域名）

## Structured Data

- **Status**: ⚠️ 部分符合（JSON 全部合法；类型与规范期望有差异）
- **结果**:
  | 页面 | 实际 @type | 审计期望 | 判定 |
  | --- | --- | --- | --- |
  | /en/models/openai/gpt-4o/ | Product | SoftwareApplication | ⚠️ 不符 |
  | /en/compare/.../ | @graph: SoftwareApplication ×2 + BreadcrumbList | SoftwareApplication + BreadcrumbList | ✅ 符合 |
  | /en/ranking/ | @graph: CollectionPage + ItemList | ItemList | ✅ 符合 |
  | /en/benchmarks/coding/ | CollectionPage | CollectionPage | ✅ 符合 |
  | /en/data-policy/ | WebPage | — | ℹ️ 合理 |
- **Issues**:
  - 🟡 模型详情页使用 `Product`（含 offers.price）；Google 模型类建议 `SoftwareApplication`（或 SoftwareApplication + offers）。非阻塞，但结构化增强机会
  - 所有 JSON-LD valid JSON ✓；URL 均为生产可访问（但域名同 P0 问题）

## Open Graph

- **Status**: ⚠️ **P1（og:image 缺失）**
- **结果**（模型详情页抽查）:
  - `og:title` ✅ / `og:description` ✅ / `og:url` ✅（但为 pages.dev）/ `og:type` = website ✅
  - `twitter:card` = summary ✅ / `twitter:title` ✅ / `twitter:description` ✅
- **Issues**:
  - 🟡 **`og:image` 缺失**：所有页面无社交分享图片（Google/社交平台展示无缩略图）
  - 🔴 og:url 同 P0 域名问题
  - 无 localhost、无占位图片 ✓

## Recommended Fixes

### P0（必须修复）
1. **站点基础 URL 切换到生产域名**（根因：前端 SEO 组件 SITE_URL/BASE_URL 硬编码 `https://ai-model-platform-my5.pages.dev`，构建期写入全部 canonical/hreflang/og:url/sitemap/robots）
   - 修改 frontend SEO 配置/环境变量为 `https://aimodel.100ideas.net`
   - 重新构建并部署后，全站 canonical / og:url / hreflang（8 组）/ sitemap（8,715 URL）/ robots.txt 自动切到生产域名
   - 部署后**验证**：任意页面 canonical == 请求域名
2. **Google Search Console 添加生产域名资源**（网址前缀 `https://aimodel.100ideas.net/`）并提交 `sitemap-index.xml`（验证文件流程同前）
3. **sitemap 域名切换后重新提交**；若 pages.dev 仍需保留，建议旧域名加 301 重定向到生产域名（或至少保持 robots 允许，避免重复内容；双域名收录需 canonical 统一）

### P1（建议修复）
4. **补充 og:image**：生成一张 1200×630 品牌图（含站点名称/标语），全站 SEO 组件输出 og:image + twitter:image
5. **/en/recommendations/ 路径**：若产品规划存在"推荐页"，确认是否应为独立页面；当前推荐功能位于 `/ranking/recommendations/`（已在 sitemap）——若审计清单中的 `/en/recommendations/` 是预期路径，需新增页面（或保持现状并移除对不存在的 `/recommendations/` 的期望）
6. **模型详情 JSON-LD 升级为 SoftwareApplication**（可保留 offers/价格信息），提升 Google 模型富结果识别

### P2（优化项）
7. 首页补充 Organization JSON-LD（当前首页无结构化数据）
8. 根路径 `/` 为语言重定向页（noindex，正常）；可考虑 302/307 服务端重定向以加快语言探测
9. 后续模型扩充至 60+ 时，评估 compare 全组合页规模（当前 8,239 页）；如需控制，改为热门组合

---

## 审计结论

- **可用性**：生产域名 200 正常，14 个抽查页面 13 个正常渲染（1 个为预期的软 404 路径）
- **致命问题**：全站 SEO 标签（canonical/hreflang/og:url/sitemap/robots）仍为旧 pages.dev 域名 → **生产域名目前无法被 Google 有效收录**，必须优先修复（P0-1）
- **次要**：og:image 缺失、模型页 schema 类型、recommendations 路径确认
- 修复完成后需重新抓取验证 + Search Console 重新提交
