# Data Changelog Policy（数据变更日志策略）

- **Date**: 2026-08-11
- **Phase**: 11.7

## data_changes 表（0013）

```
id / entity_type / entity_id / change_type / before_json / after_json / source_id / confidence / created_at
```

## 记录规则

1. 每次生产数据变更必须写 data_changes（before/after 快照）
2. change_type：price_changed / benchmark_updated / model_updated / capability_updated
3. source_id + confidence 必填（可追踪）
4. 由 eventProcessor.applyEvent 在业务表更新时同步写入（后续接线）

## 展示

- `/{lang}/data/changelog/`：公开最近 50 条变更（时间戳 + before/after + confidence）
- 示例：
  ```
  GPT-4o price changed
  Before: { "inputPrice": 5, "outputPrice": 15 }
  After:  { "inputPrice": 2.5, "outputPrice": 10 }
  Source: OpenAI official | Confidence: 95% | Date: 2026-xx-xx
  ```

## 审计

- 变更与 data_events 关联：approve 事件 → data_changes 记录
- 公开透明：任何用户可追溯每次数据变化的来源与时间
