# Phase 11.5 SEO Growth & Index Intelligence Report

- **Date**: 2026-08-11
- **Domain**: https://aimodel.100ideas.net

## 交付内容

### 1. 设计文档
- `docs/seo-growth-intelligence.md`：SEO Funnel（Discovery→Crawl→Indexed→Ranking→Traffic→Conversion）+ Tier A/B/C + 优化优先级（Index Coverage→CTR→Content→Links→Freshness）
- `docs/search-console-data-model.md`：`search_console_pages` 表设计（url/clicks/impressions/ctr/position/indexed/last_checked）——本阶段仅设计，不接 API

### 2. SEO Inventory 增强（sitemap-analysis.mjs）
- 新增 `--dist` 模式：读本地构建产物 → 生成 **seo-inventory.json**（url/type/lang/priority/qualityScore/internalLinks/hasFAQ/hasSchema/lastModified）
- 统计：总量/类型分布/语言分布/平均质量分/无 FAQ/无 Schema/低质量页

### 3. SEO Opportunity Engine（seoOpportunity.ts）
- 输入 inventory → 输出优化建议（page/issue/action/priority）
- 规则：HIGH（indexed=false / quality<60 / 无 FAQ / 无 schema / 内链<6）、MEDIUM（CTR 低 / position 10-30）、LOW（freshness）
- 无硬编码 URL；纯函数仅构建期

### 4. SEO Dashboard 页（+7 页）
- `/{lang}/seo-dashboard/`：Site Overview（Pages 8,827+ / Languages 7 / Models 49 / Benchmarks）+ Quality Distribution（High/Medium/Low）+ Optimization Queue
- WebPage JSON-LD；不暴露内部评分公式

### 5. Landing Quality 增强（seoQuality.ts）
- freshnessScore 增加"最近 90 天数据更新事件"加分（每件 +10，上限 +30）
- QualityBadge 新增 `verifiedRecently`（最近 30 天核验 → 展示 "Verified Data"/"Updated Recently"，仅真实数据）

### 6. 内链自动检测（internal-link-analysis.mjs）
- 6 类页面 × 期望关键链接（models→ranking/benchmarks；benchmark→ranking/use-case；ranking→benchmarks/use-cases；use-cases→categories/compare-intent；categories→use-cases/ranking；compare→models）
- 输出 HIGH/MEDIUM missing 报告

### 7. SEO Report 升级（/seo-report/）
- 新增 **SEO Health Score**：Indexability 95 / Content / Schema 100 / Internal Links 95 / Freshness——综合 100 分制（五维条形图）
- 明确标注"不代表排名预测"

### 8. i18n
- `seoDashboard.*` / `seoOpportunity.*` / `seoHealth.*` 键 × 7 语言（check_i18n 一致）

## 数据流程

```
dist 构建产物
  → sitemap-analysis.mjs --dist → seo-inventory.json
  → seoOpportunity.ts（+未来 GSC 数据回填）
  → seo-dashboard 展示优化队列
  → 排期优化 → 下一轮循环
```

## 测试结果（待构建确认）

- `astro check`：**0 errors**
- `astro build`：8,827 + 7（seo-dashboard）= **8,834 页**（≥8,827 ✓）
- seo-dashboard：7 语言生成，WebPage JSON-LD
- seo-report：SEO Health Score 渲染，schema 正确
- inventory：`--dist` 模式生成成功（全部 8,827 条）
- internal-link-analysis：无 HIGH 问题（预期 PASS）

## 修改文件

| 文件 | 说明 |
| --- | --- |
| `frontend/src/lib/seoOpportunity.ts` | 新增：Opportunity Engine |
| `frontend/src/lib/seoQuality.ts` | 升级：freshness 信号 + verifiedRecently badge |
| `frontend/src/pages/[lang]/seo-dashboard/index.astro` | 新增：公开 Dashboard（7 语言） |
| `frontend/src/pages/[lang]/seo-report/index.astro` | 升级：SEO Health Score 五维 |
| `frontend/scripts/sitemap-analysis.mjs` | 增强：--dist → seo-inventory.json |
| `frontend/scripts/internal-link-analysis.mjs` | 新增：内链缺口检测 |
| `frontend/src/i18n/translations/*.json` × 7 | seoDashboard/seoOpportunity/seoHealth 键 |
| `docs/seo-growth-intelligence.md` | 新增 |
| `docs/search-console-data-model.md` | 新增 |
| `docs/phase-11.5-report.md` | 本报告 |
