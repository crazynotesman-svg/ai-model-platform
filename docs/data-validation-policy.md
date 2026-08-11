# Data Validation Policy（数据验证策略）

- **Date**: 2026-08-11
- **Phase**: 11.7

## 交叉验证（dataValidation.ts）

### Pricing
- 官方源 vs 现有库：检测 price changed / missing field / stale（>90d 源 / >180d 库）
- 输出：pctInputDiff + status

### Benchmark
- 同模型多源：dataset 不一致 / version 不一致 / 分数冲突
- 输出：issues + status

## Validation Status

| 状态 | 含义 | 处理 |
| --- | --- | --- |
| verified | 无问题 | 进入生产 |
| warning | 非关键缺失 | 展示警告 |
| conflict | 数据冲突（价格变化/分数冲突） | 需要审核，不自动覆盖 |
| expired | 数据过期（stale） | 标记待更新 |

## 强制规则

1. Benchmark 结果必须含 benchmark/dataset/version/score/model_version/source/date/confidence——**缺 dataset/version/source 禁止进入生产**（benchmarkConnector.validateRow 丢弃）
2. Pricing 官方来源 confidence ≥95 → pending event（不直接覆盖）
3. 未验证数据只进入 pending review
4. demo/manual 数据禁止标记 verified

## 集成

- Connector → validate()（字段级）→ data_events（pending）→ approve → Cross Validation → 生产
- Trust Score v3 的 Cross Validation 维度使用本引擎输出
