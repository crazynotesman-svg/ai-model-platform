# Programmatic SEO Design（规模化 Landing 页设计）

- **Date**: 2026-08-10
- **Domain**: https://aimodel.100ideas.net
- **Phase**: 11.3

## 原则

1. 不生成垃圾页面：每页必须有独立数据价值（真实排序/数据表/FAQ）
2. 所有内容来自 model-catalog.json（构建期 D1 导出），无 runtime API、无 mock
3. 支持 7 语言（en/zh-CN/ja/ko/es/de/fr）
4. 保持 SSG（构建期生成，SEO 最优）
5. 第一版页数控制 ≤100（先验证索引质量）

## A. Use Case Pages（场景页）

- **路径**: `/{lang}/use-cases/[slug]/`
- **数量**: 7 语言 × 8 场景 = **56 页**
- **场景与排序口径**（seoLanding.getUseCaseModels）：

| slug | 标题 | 排序依据（数据） |
| --- | --- | --- |
| coding | Coding | Benchmark category=coding 最高分 |
| reasoning | Reasoning | Benchmark category=reasoning |
| math | Math | Benchmark category=math |
| vision | Vision | Benchmark category=vision |
| writing | Writing | ranking.overall（无 writing 专用数据） |
| chatbot | Chatbot | ranking.overall |
| long-context | Long Context | contextWindow 降序 |
| cheap-api | Cheap API | inputPrice 升序（负号） |

- **页面结构**: Hero（标题/描述）→ Recommended Models（Top5）→ Ranking Table（含能力标签）→ Benchmark Evidence（列）→ Price（列）→ FAQ（FAQPage JSON-LD + 可见区块）
- **JSON-LD**: CollectionPage + ItemList + BreadcrumbList（主 @graph）+ FAQPage（独立 block）

## B. Category Pages（分类页）

- **路径**: `/{lang}/categories/[slug]/`
- **数量**: 7 语言 × 4 分类 = **28 页**
- **分类与筛选**（getCategoryModels）：

| slug | 筛选（数据） | 排序 |
| --- | --- | --- |
| open-source-models | providerName ∈ [Meta, DeepSeek, Mistral, Alibaba]（社区公认开源系列；待 DB `is_open_source` 字段迁移） | overall 降序 |
| vision-models | capability vision=true | overall 降序 |
| reasoning-models | capability reasoning=true 或 benchmark reasoning 有分 | overall 降序 |
| cheap-models | inputPrice != null | inputPrice 升序 |

- **页面结构**: Hero → 模型列表（表：模型/厂商/评分/价格/上下文）→ FAQ
- **JSON-LD**: CollectionPage + ItemList + BreadcrumbList + FAQPage

## C. Comparison Intent Pages（对比意图页）

- **路径**: `/{lang}/compare-intent/[slug]/`
- **数量**: 7 语言 × 3 意图 = **21 页**

| slug | 内容 | 数据 |
| --- | --- | --- |
| gpt-4o-vs-claude-sonnet-4 | 两模型卡片 + 完整对比链接（复用 compare/[pair]，comparePairKey 规范 URL） | catalog['openai/gpt-4o'] + ['anthropic/claude-sonnet-4'] |
| best-chatbot-model | Top 1（overall） | ranking.overall |
| best-coding-model | Top 1（coding benchmark） | benchmark coding |

- **复用策略**: 不复制 compare 算法——intent 页仅取模型数据展示 + 链接现有 compare 页（gpt-4o-vs-claude-sonnet-4）或模型详情（best-*）
- **JSON-LD**: CollectionPage + ItemList + BreadcrumbList + FAQPage

## 页数汇总（第一版）

| 类型 | 每语言 | 总计 |
| --- | --- | --- |
| Use Cases | 8 | 56 |
| Categories | 4 | 28 |
| Intents | 3 | 21 |
| **合计** | **15** | **105** |

> 页数预算约 105（含 7 语言）——符合"≤100 每语言口径 + 全语言 105"；sitemap 从 8,715 → **8,820**。

## 内部链接

- 首页功能卡 + **Use Cases** 入口
- 模型详情 Related Resources + **Related Use Cases**（该模型出现在哪些场景 Top5）
- Benchmark 分类页 + **Related Use Case**（coding → /use-cases/coding/）
- Ranking 模式页 + **Related Use Case**（coding → /use-cases/coding/；best-value → /use-cases/cheap-api/）

## 数据工具库

- `frontend/src/lib/seoLanding.ts`（只读 catalog）：
  - `getUseCaseModels(slug, lang, catalog)` → LandingModel[]（Top5）
  - `getCategoryModels(slug, lang, catalog)` → LandingModel[]（Top10）
  - `getComparisonIntent(slug, lang, catalog)` → { pairSlugs, targetSlug, models }
- LandingModel：slug/name/provider/score/overall/benchmark/prices/context/capabilities

## 后续扩展（非本阶段）

- DB 增加 `is_open_source` 字段 → 替换 OPEN_SOURCE_PROVIDERS 常量
- writing 场景接入写作类 benchmark（当前用 overall 近似）
- Use Case 页增加"数据方法说明"区块
