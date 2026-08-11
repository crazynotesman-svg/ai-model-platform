# Trust Score v3（数据信任评分 v3）

- **Date**: 2026-08-11
- **Phase**: 11.7

## 公式

```
Data Trust Score =
Source Authority
× Freshness
× Completeness
× Cross Validation
× Version Reliability
```

乘积加权（0-100）：任一维度低则整体显著下降——避免低可信数据进入最高排名。

## 维度

| 维度 | 取值 | 说明 |
| --- | --- | --- |
| Source Authority | Tier A 官方=100 / B 权威=90 / C 社区=70 / D 人工=40 | 来源可信度（data_sources.trust_level） |
| Freshness | ≤7d=100 / ≤30d=90 / ≤90d=75 / ≤180d=55 / >180d=30 / 无=50 | 距 lastVerifiedAt/verified_at 天数 |
| Completeness | 0-100 | 字段完整度（pricing: input/output/cached/batch；benchmark: dataset/version/source/date/model_version） |
| Cross Validation | verified=100 / warning=70 / expired=40 / conflict=30 | dataValidation 引擎输出 |
| Version Reliability | 默认 90（版本明确） | model_version / dataset version 明确度 |

## 示例

**官方价格**（OpenAI Pricing）：
```
source 100 × freshness 95 × complete 100 × validation 100 × version 90 → trust ≈ 86~98
```

**社区 benchmark**（HuggingFace）：
```
source 70 × freshness 80 × complete 80 × validation 70 × version 90 → trust ≈ 60
```

## 应用

- 与 Ranking v2 结合：`Overall = Raw × (TrustScore/100)`
- 低可信（<60）数据只能进入 pending review，不进入生产排名
- 模型页 Data Trust Card 的 Confidence 与 Trust Score v3 口径对齐

## 实现

- `worker/src/services/dataValidation.ts`：validatePricing / validateBenchmark / trustScoreV3（纯函数）
- 前端展示不暴露公式细节（DataTrustBadge 只按置信分档）
