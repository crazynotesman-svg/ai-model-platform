# Model Graph API（模型知识图谱 API）

- **Date**: 2026-08-11
- **Phase**: 11.8

## 端点

```
GET /api/v1/models/:slug/relationships
```

（`/api/models/:slug/relationships` 等价——版本化兼容）

## 响应

```json
{
  "slug": "openai/gpt-4o",
  "similar": [
    { "model": "anthropic/claude-sonnet-4", "name": "Claude Sonnet 4", "confidence": 54, "reason": "Similar coding, function_calling, multimodal with comparable pricing (sim 56%)" }
  ],
  "alternatives": [
    { "model": "anthropic/claude-3.5-sonnet", "name": "Claude 3.5 Sonnet", "type": "alternative_to", "confidence": 53, "reason": "..." }
  ],
  "competitors": [
    { "model": "...", "name": "...", "confidence": 78, "reason": "..." }
  ]
}
```

## 计算

- 实时计算（worker 读 D1 → loadModelProfiles → buildRelationships）
- Similarity = 0.45×Capability Jaccard + 0.2×Benchmark 距离 + 0.1×Context + 0.15×Price + 0.1×Use Case
- Relationship Trust = 0.5×Source Authority + 0.3×Evidence Strength + 0.2×Freshness（<50 不返回）
- 关系来源：engine-computed（引擎计算，可解释）

## 兼容

- 404：模型不存在；500：内部错误
- 不影响既有 /api/models、/api/ranking 等端点
