# Programmatic Index Policy（规模化页面索引策略）

- **Date**: 2026-08-10
- **Domain**: https://aimodel.100ideas.net
- **Phase**: 11.4

## 允许生成（✔）

数据丰富页面，满足以下**至少一条**：

- ✅ **≥3 个模型**（真实排序/数据表）
- ✅ **Benchmark evidence**（含 benchmark 分数/数据集/版本/日期）
- ✅ **Pricing comparison**（≥2 模型有价格对比）
- ✅ FAQ（FAQPage JSON-LD + 可见问答）

当前 Programmatic 页面（105 页）全部满足（抽查模型数 3–11 + FAQ + 数据表）。

## 禁止生成（✘）

- ✘ **单模型复制页**（内容与模型详情重复、无增量）
- ✘ **空分类页**（无模型数据——先有数据再生成页面）
- ✘ **无 benchmark/价格/FAQ 的薄页面**
- ✘ 无独立数据价值的变体页（仅关键词替换）

## 质量门禁（构建期）

新 landing 页上线前自动校验：

```ts
// seoQuality.pageQualityScore 门禁
const { content, seo, freshness } = pageQualityScore(input);
// content >= 60 且 seo >= 70 才允许生成（否则跳过该页 + 记录）
```

| 维度 | 门槛 | 说明 |
| --- | --- | --- |
| content | ≥60 | modelCount≥3 + benchmark/pricing/FAQ 证据 |
| seo | ≥70 | canonical + schema + 内链 ≥6 |
| freshness | ≥40 | lastVerified ≤180 天 |

## 索引质量观察（上线后）

1. 上线 2 周后检查 Search Console：Programmatic 页面的 indexed / crawled-not-indexed 比例
2. 若 excluded 占比 >20% → 收缩页面范围（每语言 ≤50）或补强内容
3. 每季度复核页面清单（sitemap-analysis.mjs）与 sitemap 一致性

## 执行

- 新页面类型先过本政策评审
- 薄页面（content < 60）自动 noindex（后续实现）或移除
