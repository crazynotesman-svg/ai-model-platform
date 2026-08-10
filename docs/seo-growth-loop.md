# SEO Growth Loop（数据反馈闭环）

- **Date**: 2026-08-10
- **Domain**: https://aimodel.100ideas.net
- **Phase**: 11.4

## Growth Loop

```
Search Data（Search Console）
   ↓
页面质量分析（pageQualityScore / sitemap-analysis）
   ↓
优化（title/meta/FAQ/内链）
   ↓
新页面策略（programmatic SEO 扩展）
   ↓（回到 Search Data）
```

## 1. Search Console 周期指标（每周）

| 指标 | 目标 | 数据源 |
| --- | --- | --- |
| Impressions | 周环比增长 | 效果报表 |
| Clicks | 周环比增长 | 效果报表 |
| CTR | 首页/核心页 ≥2% | 效果报表 |
| Average position | 核心词前 20 | 效果报表 |
| Indexed pages | ≥8,500（sitemap 8,820 的 96%） | 索引编制 |
| Excluded / Coverage errors | errors=0 | 索引编制 |
| Sitemap status | 成功，8,820 URLs | Sitemaps |

## 2. 页面分类

| Tier | 定义 | 例子 |
| --- | --- | --- |
| **Tier A** | 核心资产（高流量/高价值） | 首页、/models/、/ranking/、/compare/、模型详情（gpt-4o 等） |
| **Tier B** | Programmatic 页面（批量） | use-cases（56）、categories（28）、compare-intent（21）、benchmarks、ranking/[mode] |
| **Tier C** | 实验页面（新上线观察） | 新 landing 变体、未来 v2 页面 |

## 3. 优化规则（自动触发条件）

| 信号 | 规则 | 动作 |
| --- | --- | --- |
| CTR < 1%（Tier A） | 优化 title/meta | 重写标题 + description（含数字/年份/场景词） |
| Position 5–20 | 优化 FAQ/snippet | 补充 FAQPage 问答 + 结论式首段（Answer 抽取） |
| Excluded（crawled-not-indexed） | 检查 thin content | 运行 pageQualityScore，content < 60 的页面：补数据表/FAQ 或 noindex |
| Indexed 骤降 | 检查 noindex/robots | 全量健康检查（seo-health-check.mjs） |
| 新页面上线 | 质量门禁 | 满足 programmatic-index-policy.md 规则才允许生成 |

## 4. 质量工具

- `seoQuality.pageQualityScore()`：content/seo/freshness 三维评分（构建期）
- `sitemap-analysis.mjs`：内容清单统计（SEO INVENTORY REPORT）
- `seo-health-check.mjs`：线上信号巡检（canonical/hreflang/og/jsonld/robots）
- `seo-report` 页面：公开数据透明页（E-E-A-T）

## 5. 周会流程（15 分钟）

1. `node frontend/scripts/seo-health-check.mjs` → PASS
2. `node frontend/scripts/sitemap-analysis.mjs` → 清单核对
3. Search Console 效果/索引报表 → 记录到周报
4. 命中优化规则的页面 → 下一阶段排期修复
