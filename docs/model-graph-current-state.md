# Model Graph Current State（模型关系现状审计）

- **Date**: 2026-08-11
- **Phase**: 11.8 Step 1（只读审计）

## 1. 当前实体

| 实体 | 表 | 关键字段 |
| --- | --- | --- |
| Model | models | slug/provider/context_window/model_type |
| Provider | providers | name/website |
| Capability | model_capabilities | capability/supported/confidence |
| Benchmark | benchmark_categories + benchmark_results | category/score/dataset/version/confidence |
| Pricing | pricing + pricing_history | input/output price |
| Source | data_sources | trust_level/type |
| Event | data_events / data_changes | 变更记录 |

## 2. 已存在关系

- **隐式**：Model→Provider（provider 外键）、Model→Capability（capabilities 外键）、Model→Benchmark（results 外键）、Model→Pricing（pricing 外键）
- **显式**：无模型间关系表

## 3. 缺失关系

- 模型↔模型：similar_to / competitor_of / successor_of / alternative_to / cheaper_than / better_for —— **完全没有**
- 推荐只基于单一维度（ranking 分），无关系推理

## 4. 推荐系统限制（recommendation.ts）

- best-overall / best-value / best-coding 等模式基于 ranking score 排序
- 无"替代模型"概念：用户无法知道"谁和 GPT-4o 类似但更便宜"
- 无 reason 链：推荐只有分数没有解释
- 无关系可追踪：相似度无法追溯来源

## 5. 结论

需要：model_relationships 表（0014）+ Relationship Engine（可解释相似度）+ Alternative Recommendation v2 + 前端关系展示 + 关系 API。
