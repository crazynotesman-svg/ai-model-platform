# SEO Growth Intelligence（增长情报系统）

- **Date**: 2026-08-11
- **Domain**: https://aimodel.100ideas.net
- **Phase**: 11.5

## 1. SEO Funnel

```
Discovery（发现：sitemap / 外链 / AI 爬虫）
   ↓
Crawl（抓取：robots / 内链 / 抓取预算）
   ↓
Indexed（收录：indexability / canonical / noindex）
   ↓
Ranking（排名：内容质量 / E-E-A-T / 结构化数据）
   ↓
Traffic（流量：CTR / title / snippet）
   ↓
Conversion（转化：工具使用 / 回访）
```

## 2. 页面等级

| Tier | 页面 | 策略 |
| --- | --- | --- |
| **Tier A**（核心） | 首页、models、compare、ranking、benchmarks | 全量质量保证 + 手动提交索引 |
| **Tier B**（Programmatic） | use-cases、categories、compare-intent | 质量门禁（≥3 模型/FAQ/数据表）+ 批量观察 |
| **Tier C**（信息/工具） | news、calculator、seo-report、seo-dashboard、实验页 | 不主动外推，靠 sitemap + 内链自然收录 |

## 3. 优化优先级

```
1. Index Coverage（收录：indexed=false 最高优先级——不收录则一切归零）
2. CTR（title/meta/snippet 优化）
3. Content Quality（薄内容补强）
4. Internal Link（互链网络）
5. Freshness（数据更新）
```

## 4. 工具链

| 工具 | 用途 |
| --- | --- |
| `sitemap-analysis.mjs --dist` | 生成 seo-inventory.json（页面清单 + 质量信号） |
| `seoOpportunity.ts` | 优化建议队列（HIGH/MEDIUM/LOW，无硬编码 URL） |
| `seo-dashboard` 页 | 公开展示统计 + 队列（不暴露公式） |
| `seo-report` 页 | 站点级 SEO Health Score（五维） |
| `internal-link-analysis.mjs` | 页面类型内链缺口检测 |

## 5. 数据流

```
build 产物（dist）
   ↓ sitemap-analysis --dist
seo-inventory.json
   ↓ seoOpportunity.ts
优化建议 → seo-dashboard 展示 → 排期 → 下一阶段优化
   ↓（回填）
Search Console 数据（search_console_pages，Phase 11.5 仅设计）
```
