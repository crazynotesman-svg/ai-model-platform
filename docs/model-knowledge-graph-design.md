# Model Knowledge Graph Design（模型知识图谱设计）

- **Date**: 2026-08-11
- **Phase**: 11.8

## 节点（Node）

```
Model / Provider / Benchmark / Capability / Dataset / Price Plan / Source
```

## 关系（Relationship）

| 类型 | 含义 | 生成方式 |
| --- | --- | --- |
| similar_to | 能力/基准相似 | 引擎计算（相似度 > 阈值） |
| competitor_of | 同能力类竞争 | 引擎计算 |
| successor_of | 官方换代 | **仅官方 source / provider 公告，禁止猜测** |
| alternative_to | 替代选择 | 引擎（similar + price/能力权衡） |
| cheaper_than | 同能力类更低价格 | 引擎（同能力 + 价低） |
| better_for | 特定场景更优 | 引擎（use case 匹配） |
| hosted_by | 模型↔厂商 | 外键（静态） |
| evaluated_by | 模型↔基准 | 外键（静态） |

## 关系字段（必须）

```
source（来源）/ confidence（可信度）/ created_at / reason（可解释理由）
```

## 相似度计算（Relationship Engine）

```
Similarity =
  0.35 × Capability Jaccard（能力集合重合）
+ 0.25 × Benchmark 距离（同类别分数差反向）
+ 0.15 × Context 差
+ 0.15 × Price 差
+ 0.10 × Use Case 重合
→ 0-100
```

## 推荐 v2（best-alternative）

```
GPT-4o alternative: Claude Sonnet 4
Reasons（数据驱动）:
  + Similar benchmark performance（score 差 < 5）
  + Lower cost（价格更低）
  + Strong coding capability（同能力）
```

## Trust Integration（关系可信度）

```
Relationship Trust = Source Authority × Evidence Strength × Freshness
低于 50 禁止展示
```

- 引擎计算关系：Source=Internal Engine（Trust 40×证据强度×新鲜度——本阶段诚实标注"引擎计算"）
- 官方 successor：Source=官方（Trust 100×证据×新鲜度）

## API

```
GET /api/v1/models/:slug/relationships
→ { similar: [], alternatives: [], competitors: [] }
```

## SEO（JSON-LD）

- isRelatedTo / sameAs / about：**无可靠 URL 不生成**
- 保留 SoftwareApplication / BreadcrumbList / FAQPage

## 禁止

- hardcode 推荐列表 / mock similarity / 无 reason 推荐
