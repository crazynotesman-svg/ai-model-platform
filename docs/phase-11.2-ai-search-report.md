# Phase 11.2 GEO / AI Search Report

- **Date**: 2026-08-10
- **Domain**: https://aimodel.100ideas.net

## 交付内容

### 1. AI Search Audit（docs/ai-search-audit.md）
- AI crawler 检查：GPTBot / ChatGPT-User / ClaudeBot / PerplexityBot / Google-Extended 全部允许（`User-agent: *`），无需修改 robots
- 页面 GEO 能力分析（Entity / Answer / Evidence / Comparison）：
  - 首页 8.5 / 模型详情 9 / Compare 9 / Ranking 8.5 / Benchmark 8
  - **平均 Citation Readiness Score：8.6/10**

### 2. FAQSchema 组件（frontend/src/components/seo/FAQSchema.astro）
- `questions[]` → 独立 FAQPage JSON-LD `<script>`（head slot 注入）
- 与已有 @graph（BreadcrumbList / SoftwareApplication / Organization / CollectionPage）类型不冲突
- 无有效问答时不输出（避免空 JSON-LD）

### 3. 首页 FAQ（4 问，数据驱动）
- "What is the best AI model?" → 答案由 catalog 评分实时生成（当前 top 模型 + 分数，非 mock）
- "How are AI models ranked?" / "How often are prices updated?" / "Where does benchmark data come from?"
- 可见问答区块（details/summary）+ FAQPage JSON-LD

### 4. 模型详情动态 FAQ（数据驱动）
- "What is {name}?"（provider + 描述）
- "What is {name}'s context window?"（contextWindow 格式化）
- "How much does {name} cost?"（input/output 价格）
- "What can {name} do?"（supported capabilities，7 语言标签）

### 5. Compare 动态 FAQ（数据驱动）
- "Which model is better?"（ranking.overall 比较，含无数据 fallback）
- "Which model is cheaper?"（inputPrice 比较）
- "What are the capability differences?"（能力差集，支持无差异 fallback）

### 6. Entity Schema
- SoftwareApplication 的 sameAs：**未生成**（无可靠官方链接时不生成，避免错误实体关联）——记录待后续（有官方模型页链接后再补）

### 7. AI Crawler Policy（docs/ai-crawler-policy.md）
- crawler access / content licensing / data freshness / attribution policy 四部分

### 8. i18n
- 新增 faq.* 键（26 个）× 7 语言（en/zh-CN/ja/ko/es/de/fr，check_i18n 一致）

## 测试结果

- `astro check`：**0 errors**
- `astro build`：**8717 页**（页面数量不下降）
- FAQ JSON-LD：首页/模型详情/Compare 均输出 FAQPage（独立 block，无重复）
- JSON-LD 无重复：FAQPage 与 BreadcrumbList/SoftwareApplication/Organization 类型互斥 ✓

## 修改文件

| 文件 | 改动 |
| --- | --- |
| `frontend/src/components/seo/FAQSchema.astro` | 新增 FAQPage JSON-LD 组件 |
| `frontend/src/layouts/BaseLayout.astro` | 新增 `slot="head"`（供 FAQSchema 注入） |
| `frontend/src/pages/[lang]/index.astro` | FAQ 区块 + FAQPage JSON-LD（数据驱动） |
| `frontend/src/pages/[lang]/models/[...slug].astro` | 动态 FAQ（4 问）+ FAQPage JSON-LD |
| `frontend/src/pages/[lang]/compare/[pair].astro` | 动态 FAQ（3 问）+ FAQPage JSON-LD |
| `frontend/src/i18n/translations/*.json` × 7 | faq.* 26 键 |
| `docs/ai-search-audit.md` | 新增 |
| `docs/ai-crawler-policy.md` | 新增 |
| `docs/phase-11.2-ai-search-report.md` | 本报告 |
