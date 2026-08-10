# Phase 10.4 Indexing Report（Google 收录准备）

- **Date**: 2026-08-10
- **Domain**: https://aimodel.100ideas.net

## Search Console

- **Status**: ⚠️ 待用户操作（Google 账号）
- 已验证文件已上线：`https://aimodel.100ideas.net/google66c05094a2cab20f.html`（200，内容匹配）
- **推荐**：添加 **Domain Property** `aimodel.100ideas.net` → HTML 文件验证（或 DNS TXT）→ 提交 `sitemap-index.xml`
- 详细步骤见 `docs/search-console-setup.md`

## Sitemap

- **Status**: ✅ 可提交
- `sitemap-index.xml` 200 / XML 合法 / 1 个引用
- `sitemap-0.xml` **8,715 URLs**，全部生产域名，分类完整（models/compare/benchmarks/ranking/recommendations/news/data-policy/calculator/首页）
- 优化项：lastmod 缺失（P2）

## Priority URLs

- **Status**: ✅ 已整理（见 `docs/priority-index-pages.md`）
- Tier 1（核心 15 个 URL：首页/模型库/排行/基准/对比/高价值模型/推荐/工具）→ Tier 2（6 语言版本）
- 提交节奏建议：Tier 1 首日 ≤10 个/日，其余靠 sitemap

## Internal Linking

- **Status**: ⚠️ 4 项缺失（见 `docs/internal-link-audit.md`）
  1. 首页无 Benchmarks 入口
  2. 模型详情无 Ranking/Benchmark 入口
  3. 模型详情无相关模型互链
  4. Benchmark 无 Ranking 入口
- 影响：爬取效率/权重分布优化项，不阻塞收录（P2）

## Risks（收录风险检查）

| 检查项 | 结果 |
| --- | --- |
| 主要页面 robots meta | ✅ 无 noindex（首页/模型/compare/benchmark/ranking 均 index,follow） |
| canonical | ✅ 全部 `https://aimodel.100ideas.net/...`（Phase 10.2 已修复） |
| hreflang | ✅ 8 组（7 语言 + x-default），新域名 |
| 404 页面 | ⚠️ **HTTP 200 + noindex**（Cloudflare Pages SPA fallback 导致软 404；有 noindex 保护不会收录，但状态码不规范，P2） |
| JSON-LD | ✅ 合法（模型 SoftwareApplication / compare BreadcrumbList / ranking CollectionPage+ItemList） |
| OG 图 | ✅ og-default.png 全站输出 |

## Recommended Actions

1. **用户操作（必须）**：Search Console 添加资源 → 验证 → 提交 sitemap-index.xml → Tier 1 URL 请求编入索引
2. **可选（P2）**：
   - sitemap 增加 lastmod
   - 首页/模型详情/Benchmark 补充互链（internal-link-audit.md 建议）
   - 404 状态码规范化（Cloudflare 控制台关闭 SPA fallback）
3. 收录节奏：提交后 1–14 天开始抓取，完整收录数周；每周查看 Search Console「索引编制」
