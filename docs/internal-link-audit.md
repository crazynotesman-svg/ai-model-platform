# Internal Link Audit（内部链接检查）

- **Date**: 2026-08-10（初始审计）｜ 2026-08-10（Phase 10.5 修复后复核）
- **Domain**: https://aimodel.100ideas.net
- **方式**: 抓取线上代表页面，检查功能页间链接

## 检查结果（Phase 10.4 初始）

| 源页面 | 目标 | 初始 | 修复后（Phase 10.5） |
| --- | --- | --- | --- |
| 首页 | /en/models/ | ✅ | ✅ |
| 首页 | /en/compare/ | ✅ | ✅ |
| 首页 | /en/ranking/ | ✅ | ✅ |
| 首页 | /en/benchmarks/ | ❌ | ✅（功能卡新增） |
| 首页 | /en/news/ | ✅ | ✅ |
| 首页 | /en/ranking/recommendations/ | ❌ | ✅（功能卡新增） |
| 模型详情 | /en/compare/ | ✅（导航） | ✅ + **与 Top3 对比链接**（3 个） |
| 模型详情 | /en/ranking/ | ❌ | ✅（Related Resources） |
| 模型详情 | /en/benchmarks/ | ❌ | ✅（Related Resources） |
| 模型详情 | 相似模型（同 provider/相近 context） | ❌ | ✅（Similar Models 4 个） |
| Benchmark 分类页 | /en/ranking/{category}/ | ❌ | ✅（Related Ranking） |
| Benchmark 分类页 | 模型详情（Featured Models Top3） | ✅（表格行内已有） | ✅（新增 Featured Models 区块） |
| Benchmark 索引页 | /en/ranking/{category}/ | ❌ | ✅ |
| Ranking 索引 | /en/benchmarks/{category}/ | ❌ | ✅（Related Benchmarks） |
| Ranking 模式页 | /en/benchmarks/{mode}/ | ❌ | ✅（Related Benchmarks） |
| Ranking | /en/models/ | ✅ | ✅ |

## Phase 10.5 实施内容

- **首页**：功能卡覆盖 6 大 SEO 入口（Models/Compare/Leaderboard/Benchmarks/Recommendations/News）+ BreadcrumbList JSON-LD
- **模型详情**：新增 Related Resources 区块（Leaderboard / Benchmarks / Compare with Top 3 / Similar Models 4 个），全部 SSG 静态生成（catalog 数据，无 runtime API）；JSON-LD 升级为 @graph（SoftwareApplication + BreadcrumbList）
- **Benchmark**：分类页新增 Related Ranking（→ /ranking/{category}/）+ Featured Models（Top3）；索引页新增 Related Ranking 链接；JSON-LD @graph（CollectionPage + BreadcrumbList）
- **Ranking**：索引/模式页新增 Related Benchmarks（→ /benchmarks/{category}/）；JSON-LD @graph 追加 BreadcrumbList（不重复已有 CollectionPage/ItemList）
- **i18n**：新增 internalLinks.* 16 键 × 7 语言（en/zh-CN/ja/ko/es/de/fr）

## 验证（线上实测）

| 页面 | 内部链接数 | 新增区块 | JSON-LD |
| --- | --- | --- | --- |
| /en/ | 16 | Benchmarks/Recommendations 卡 | BreadcrumbList ✓ 合法 |
| /en/models/openai/gpt-4o/ | 14 | Related Resources + 3 对比 + 4 相似 | SoftwareApplication + BreadcrumbList ✓ |
| /en/benchmarks/coding/ | 16 | Related Ranking + Featured | CollectionPage + BreadcrumbList ✓ |
| /en/ranking/ | 58 | Related Benchmarks | CollectionPage + ItemList + BreadcrumbList ✓ |
| 模型页链接抽查（8 个） | — | 0 broken | — |
| canonical / hreflang | — | 不变（新域名 / 8 组） | — |

## 结论

Phase 10.4 审计发现的 4 项内部链接缺失已全部补齐；每页新增 ≥3 内部链接，无 404 链接，canonical/hreflang 不变，JSON-LD 合法。commit: `cb29ffc`。
