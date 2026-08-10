# Phase 11.3 Programmatic SEO Report（规模化 Landing 页）

- **Date**: 2026-08-10
- **Domain**: https://aimodel.100ideas.net

## 交付内容

### A. Use Case Pages（56 页 = 7 语言 × 8 场景）
- 路径 `/{lang}/use-cases/[slug]/`：coding / reasoning / math / vision / writing / chatbot / long-context / cheap-api
- 排序全部数据驱动（benchmark 分类分数 / capability / contextWindow / inputPrice）
- 结构：Hero → Recommended Models（Top5）→ Ranking Table（含能力标签）→ Benchmark/Price 列 → FAQ

### B. Category Pages（28 页 = 7 × 4）
- `/{lang}/categories/[slug]/`：open-source / vision / reasoning / cheap-models
- open-source 用社区公认开源厂商名单（Meta/DeepSeek/Mistral/Alibaba），待 DB `is_open_source` 字段迁移（见设计文档）

### C. Comparison Intent Pages（21 页 = 7 × 3）
- `/{lang}/compare-intent/[slug]/`：gpt-4o-vs-claude-sonnet-4（复用现有 compare/[pair] 页 + comparePairKey 规范 URL）/ best-chatbot-model / best-coding-model
- 不复制 compare 算法，仅取数据展示 + 链接

### 数据工具库
- `frontend/src/lib/seoLanding.ts`（只读 catalog）：getUseCaseModels / getCategoryModels / getComparisonIntent

### i18n
- `landing.*` + `useCase.*` + `category.*` + `intent.*` 键 × 7 语言（check_i18n 一致）

### 内部链接
- 首页功能卡 + Use Cases 入口
- 模型详情 Related Use Cases（该模型出现在哪些场景 Top5）
- Benchmark 分类页 / Ranking 模式页 + Related Use Case

## 测试结果

| 检查项 | 结果 |
| --- | --- |
| astro check | **0 errors** |
| astro build | **8,822 页**（+105 新增，8717 → 8822） |
| sitemap | **8,820 URLs**（+105），含 use-cases/categories/compare-intent |
| canonical | ✅ 生产域名（抽查 3 类页） |
| hreflang | ✅ 8 组（抽查） |
| JSON-LD | ✅ CollectionPage+ItemList+BreadcrumbList + FAQPage（2 blocks，无重复） |
| 薄内容 | ✅ 抽查 4 页均 ≥3 模型 + FAQ（11/11/11/3） |
| intent 对比链接 | ✅ /en/compare/anthropic_claude-sonnet-4-vs-openai_gpt-4o/ |

## 修改文件

| 文件 | 说明 |
| --- | --- |
| `frontend/src/lib/seoLanding.ts` | 新增：landing 数据工具库 |
| `frontend/src/pages/[lang]/use-cases/[slug].astro` | 新增：场景页 |
| `frontend/src/pages/[lang]/categories/[slug].astro` | 新增：分类页 |
| `frontend/src/pages/[lang]/compare-intent/[slug].astro` | 新增：对比意图页 |
| `frontend/src/pages/[lang]/index.astro` | 首页 Use Cases 入口 |
| `frontend/src/pages/[lang]/models/[...slug].astro` | Related Use Cases |
| `frontend/src/pages/[lang]/benchmarks/[category].astro` | Related Use Case 链接 |
| `frontend/src/pages/[lang]/ranking/[mode].astro` | Related Use Case 链接 |
| `frontend/src/i18n/translations/*.json` × 7 | landing/useCase/category/intent 键 |
| `docs/programmatic-seo-design.md` | 设计文档 |
| `docs/phase-11.3-programmatic-seo-report.md` | 本报告 |

## 后续（非本阶段）

- DB 增加 is_open_source 字段（替换厂商名单常量）
- writing 接入写作类 benchmark
- 观察索引质量后扩展场景（每语言 ≤100 页预算）
