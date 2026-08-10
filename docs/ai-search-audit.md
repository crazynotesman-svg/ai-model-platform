# AI Search Audit（生成式引擎审计）

- **Date**: 2026-08-10
- **Domain**: https://aimodel.100ideas.net
- **Phase**: 11.2（GEO / AI Search）

## 1. AI Crawler 访问检查

### robots.txt 现状
```text
User-agent: *
Allow: /

Sitemap: https://aimodel.100ideas.net/sitemap-index.xml
```

### AI Crawler 结论（当前全部允许，无需修改）

| Crawler | 状态 | 说明 |
| --- | --- | --- |
| GPTBot | ✅ 允许（通配 `User-agent: *`） | OpenAI 搜索/训练爬虫 |
| ChatGPT-User | ✅ 允许 | ChatGPT 检索 |
| ClaudeBot | ✅ 允许 | Anthropic |
| PerplexityBot | ✅ 允许 | Perplexity |
| Google-Extended | ✅ 允许 | Google Gemini/AI 训练（通配包含） |
| Bingbot / Applebot-Extended / CCBot 等 | ✅ 允许 | 通配覆盖 |

> 通配 `*` 允许所有 UA 访问；如需针对个别 crawler 单独控制（如训练抓取 opt-out），可在 robots.txt 增加显式段（本阶段不修改，见 docs/ai-crawler-policy.md 策略）。

## 2. 页面 GEO 能力分析

### 评估维度
- **Entity**（实体清晰：schema.org 类型 + 名称/URL）
- **Answer**（可直接回答的问答内容：FAQ/描述/结论）
- **Evidence**（数据证据：数字、来源、日期）
- **Comparison**（对比信息）

| 页面 | Entity | Answer | Evidence | Comparison | 综合 |
| --- | --- | --- | --- | --- | --- |
| 首页 `/en/` | ✅ Organization + WebSite + BreadcrumbList | ✅ FAQ（4 问） | ✅ Top 排行数字 | ⚠️ 对比入口（链接） | **8.5/10** |
| 模型详情 `/en/models/.../` | ✅ SoftwareApplication | ✅ 动态 FAQ（4 问）+ 描述 | ✅ 价格/上下文/基准数字+日期 | ✅ 与 Top3 对比链接 + 相似模型 | **9/10** |
| Compare `/en/compare/.../` | ✅ SoftwareApplication ×2 + BreadcrumbList | ✅ 动态 FAQ（3 问） | ✅ 价格/评分/能力矩阵/趋势 | ✅ 核心功能 | **9/10** |
| Ranking `/en/ranking/` | ✅ CollectionPage + ItemList | ✅ 排名结论（第一名/分数） | ✅ 评分构成数字 | ✅ 行内对比入口 | **8.5/10** |
| Benchmark `/en/benchmarks/.../` | ✅ CollectionPage | ⚠️ 分类结论（最高分） | ✅ 分数/数据集/版本/日期 | ⚠️ 相关排行链接 | **8/10** |

### 平均 Citation Readiness Score：**8.6 / 10**

## 3. 建议（后续阶段）

- FAQ 已落地（首页/模型/Compare）→ AI 引擎可抽取问答
- 每页结论式首段（如 "X is currently ranked #1"）增强 Answer 抽取
- Benchmark 页增加结论摘要句（Top1 模型 + 分数一句话）
- 逐步补充 sameAs（官方链接）增强 Entity 可信度（无可靠链接时不生成）
