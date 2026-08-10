# Indexing Audit（Sitemap 收录检查）

- **Date**: 2026-08-10
- **Domain**: https://aimodel.100ideas.net

## Sitemap 结果

| 项 | 结果 |
| --- | --- |
| `sitemap-index.xml` HTTP status | **200** ✅（application/xml） |
| sitemap 文件数量 | **1**（sitemap-index.xml → sitemap-0.xml） |
| 总 URL 数 | **8,715**（与构建页数 8,716 − 404 一致） |
| lastmod | ❌ **缺失**（sitemap 无 `<lastmod>`；可选优化项，非必需） |
| 域名 | ✅ 全部 `https://aimodel.100ideas.net`（Phase 10.2 已迁移） |

## Sitemap 分类覆盖

| 分类 | URL 数 | 状态 |
| --- | --- | --- |
| models 详情页 | ~350（49 模型 × 7 语言 + 列表页 7） | ✅ |
| compare 对比详情 | 8,232 | ✅ |
| compare 列表 | 7 | ✅ |
| benchmarks | 35 | ✅ |
| ranking | 49 | ✅ |
| recommendations（/ranking/recommendations/） | 7 | ✅ |
| news | 7 | ✅ |
| data-policy | 7 | ✅ |
| calculator | 14 | ✅ |
| 首页（7 语言） | 7 | ✅ |

## Issues

- 🟢 **lastmod 缺失**（P2 优化）：Google 支持 sitemap lastmod 加速增量抓取。可后续在 sitemap 集成配置 `lastmod: new Date()`（构建期）。影响小（Google 主要按内容变化抓取）。
- ✅ 无重复 URL、无 pages.dev、无 localhost。

## 结论

Sitemap 结构正确、URL 完整、域名正确，可提交 Google Search Console（sitemap-index.xml）。
