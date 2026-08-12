# Model Update Strategy（模型更新策略）

- **Date**: 2026-08-12
- **Phase**: 12.1 Part K

## 数据来源优先级

1. **官方文档**（Trust 100）：OpenAI / Anthropic / Google / Meta / DeepSeek / Zhipu / Alibaba / Moonshot / MiniMax / Mistral 官方 API 文档与定价页
2. **权威基准**（Trust 90）：LMSYS / SWE-bench / MMLU / MLPerf / Papers with Code
3. **社区**（Trust 70）：HuggingFace Leaderboard
4. **人工**（Trust 40）：Internal Demo（禁止进入排名）

## 更新频率

| 类别 | 频率 | 机制 |
| --- | --- | --- |
| 模型清单 | 每日（04:00 cron） | Model Discovery → pending |
| 价格 | 每 6 小时 | Data Discovery connectors |
| 基准 | 月度（人工核验） | Benchmark Connector + approve |
| 状态（deprecated/latest） | 每周 | 官方 changelog 核验 |

## 验证流程

```
官方来源 → connector（fetch/normalize/validate/createEvent）
  → data_events（MODEL_DISCOVERED / MODEL_UPDATED / PRICE_CHANGED，pending）
  → 人工 approve（对比官方文档）
  → production（models / pricing / translations）
  → ranking 刷新（PRICE/BENCHMARK 事件触发快照重算）
  → data_changes 记录（可审计）
```

## Trust 标准

- 新模型：source_url + confidence（官方 60-100）+ verified_status（未核验=unverified）
- unverified 模型不进入 Top ranking（ranking confidence 门控）
- 所有数据可追溯（source_id + timestamp）

## 治理

- 宁缺毋滥：不确定的价格为 NULL、无 benchmark 不编造
- 不删除已有数据（replacement_model_id 关联）
- 不自动覆盖已验证数据（ON CONFLICT 幂等 / 版本化追加）
