# Recommendation v2 Design（推荐系统 v2 设计）

- **Date**: 2026-08-11
- **Phase**: 11.8

## v1 限制（Phase 9.6）

- best-overall / best-value / best-coding / best-reasoning：基于单一 ranking 分数排序
- 无替代概念 / 无解释 / 无关系推理

## v2：Knowledge Graph 驱动

```
best-alternative：给定模型 → 替代推荐
  Input：模型 slug
  Pipeline：loadModelProfiles → buildRelationships → 筛选 similar/alternative/cheaper
  Output：{ alternative: { slug, name, confidence, reason } }
  优先级：cheaper_than > similar_to/alternative_to（相似且更便宜最优）
```

## 推荐示例

```
GPT-4o alternative: Claude Sonnet 4
Reasons（数据驱动）:
  + Similar benchmark performance
  + Lower cost（或 comparable pricing）
  + Strong coding capability
```

## 约束

- 禁止 hardcode 推荐列表 / mock similarity / 无 reason
- 所有推荐来自知识图谱（engine-computed，trust-gated ≥50）
- successor_of 仅官方来源（本引擎不生成）

## 集成

- Worker：`getAlternativeRecommendation(db, slug)`（recommendation.ts）
- API：/api/recommendations（v1 保留）+ 关系端点（v2）
- SSG：catalog.relationships（export-models 同步公式）
