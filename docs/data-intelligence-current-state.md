# Data Intelligence Current State（现状审计）

- **Date**: 2026-08-11
- **Phase**: 11.7 Step 1（只读审计，未修改代码）

## 1. 当前数据表（migration 0001-0011）

| 表 | 关键字段 | 来源 |
| --- | --- | --- |
| providers / models | slug/provider/context_window/verified_status/confidence_score/last_verified_at | 0001/0009/0010 |
| model_translations | 7 语言名称/描述 | 0001 |
| pricing | 当前价（input/output/currency/unit） | 0001 |
| pricing_history | 历史价 + source_url/verification_status + source_id/verified_at/confidence | 0004/0008/0010 |
| benchmark_categories / benchmark_results | 分类 + 结果（score/dataset/version/source）+ source_id/official_score/confidence | 0005/0007/0010 |
| model_capabilities | 能力 + source_id/confidence/verified_at | 0003/0010 |
| ranking_snapshots | 每日快照（mode/rank/score） | 0006 |
| data_sources | 来源注册表（16 条：官方 100/权威 90/社区 70/人工 40） | 0010 |
| data_verifications | 实体验证记录 | 0010 |
| data_events | 事件队列（pending/processed/failed） | 0011 |

## 2. Source System

- `data_sources` 注册 16 来源（Tier A 官方 ×7 / Tier B 权威 ×8 / Tier C 社区 ×1 / Tier D 人工 ×1）
- 关联：pricing_history/benchmark_results/model_capabilities → source_id
- 展示：DataTrustBadge（≥90 Verified / 70-89 Trusted / <70 Experimental）

## 3. Confidence 流程

- Ranking v2：`Overall = Raw × DataConfidence`（benchmark confidence 平均；无则模型 confidenceScore/100）
- 数据信任：verified_status / confidence_score / verification_status（verified/unverified/experimental）

## 4. Connector 状态（worker/src/services/connectors/）

| Connector | fetch | normalize | 状态 |
| --- | --- | --- | --- |
| openai / anthropic / google | ✅ 官方定价页 | 骨架（解析待人工核验） | adapter 就绪 |
| huggingface / lmsys | ✅ | 骨架 | adapter 就绪（不覆盖生产） |
| pricingDiff.ts | 价格 diff → PRICE_CHANGED | — | ✅ |

## 5. Event Flow

```
connector → runConnector(fetch→normalize→validate) → insertEvents(pending)
  → GET /api/v1/data-events（审核队列）→ POST /:id/approve → applyEvent → 业务表 + Ranking 刷新
状态：pending → processed / failed（error 记录）
```

## 6. Ranking 数据依赖

- benchmark_results（50%）+ model_capabilities（20%）+ pricing（20%）+ context（10%）→ Raw
- Raw × DataConfidence → overall；每日快照（02:00 UTC cron）

## 7. 当前缺口（Phase 11.7 要解决的）

| 缺口 | 现状 | 目标 |
| --- | --- | --- |
| 模型身份不统一 | GPT-4o / gpt-4o / gpt-4o-2024-05-13 无法关联 | model_aliases（0012） |
| Pricing 采集不完整 | 无 cached/batch price、无结构化解析 | Pricing Connector v2 |
| Benchmark 缺元数据 | 部分结果缺 dataset/version/source | Benchmark Connector v2（强制字段） |
| 无交叉验证 | 单源数据直接进入 | Cross Validation Engine（verified/warning/conflict/expired） |
| Trust Score 单维 | 只有 confidence 一个数 | Trust Score v3（五维） |
| 无变更历史展示 | 只有事件队列 | data_changes（0013）+ 公开 Changelog 页 |
| 数据透明页分散 | seo-report/dashboard 有部分 | /data/sources/ + /changelog/ + /methodology/ |
| 无 DataCatalog schema | 无数据集 JSON-LD | DataCatalog（Dataset/DatasetSeries/DataDownload） |
