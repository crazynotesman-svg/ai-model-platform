# Data Intelligence Pipeline（AI 数据情报管道）

- **Date**: 2026-08-11
- **Phase**: 11.6

## 目标

将平台从「人工维护静态数据库」升级为「持续自更新 AI 情报系统」：

```
Discovery（connectors 发现）
   ↓
Raw Data（原始数据）
   ↓
Validation（校验）
   ↓
Trust Score（置信度）
   ↓
Database（事件队列 → 审核 → 应用）
   ↓
Ranking Update（Ranking v2 刷新）
   ↓
SEO Refresh（页面/JSON-LD 更新）
```

## Data Event（数据事件）

| 事件 | 含义 | 应用动作 |
| --- | --- | --- |
| MODEL_CREATED | 新模型发布 | 记录（人工建模型） |
| MODEL_UPDATED | 元数据变化（context 等） | 更新 models + data_verifications |
| PRICE_CHANGED | 价格变化 | 追加 pricing_history + 更新 pricing + Ranking 刷新 |
| BENCHMARK_UPDATED | 基准分数更新 | 追加/更新 benchmark_results + Ranking 刷新 |
| MODEL_DEPRECATED | 模型下架 | 记录（人工处理 data_status） |

状态机：`pending`（connector 生成）→ `processed`（approve 应用）／`failed`（处理失败 + error）。

**安全原则**：connector 只生成 pending 事件；未经 approve API 不写业务表（禁止自动发布未验证数据）。

## 组件

- `worker/src/services/connectors/`：统一 `DataConnector` 接口（fetch → normalize → validate）
  - openai / anthropic / google（官方 Tier A）：发现模型/上下文/价格变化
  - huggingface / lmsys（社区/权威 Tier B/C）：Benchmark adapter（不自动覆盖生产）
- `pricingDiff.ts`：旧 vs 新价格 → PRICE_CHANGED 事件（纯函数，官方来源 confidence 100）
- `eventProcessor.ts`：applyEvent（MODEL_UPDATED / PRICE_CHANGED / BENCHMARK_UPDATED）+ insertEvents + listPendingEvents
- `dataDiscovery.ts`：cron 调度运行全部 connectors

## Cron

| Cron | 任务 |
| --- | --- |
| 0 1 * * * | 新闻采集 |
| 0 2 * * * | Ranking 快照 |
| 0 3 * * * | Data Trust 审计（DATA TRUST DAILY REPORT） |
| 0 */6 * * * | **Data Discovery**（connectors → pending events，每天 4 次） |

## Verification Queue（审核 API）

- `GET /api/v1/data-events`：pending 事件列表（event/source/confidence/payload）
- `POST /api/v1/data-events/:id/approve`：校验 → 应用事件 → 业务表更新 → （价格/基准）触发 Ranking 刷新 → status=processed；失败 → failed + error

## Ranking 自动刷新

- PRICE_CHANGED / BENCHMARK_UPDATED approve 后 → `createDailySnapshot` 重算当日快照（幂等）
- 记录：事件 processed_at + cron 日志（ranking_refresh_events 记入日志）

## 前端

- `DataFreshnessBadge`：Updated today / Updated N days ago / Needs verification（基于 lastVerifiedAt）
- 模型页：Data Trust Card + Freshness 徽章；SoftwareApplication JSON-LD 增加 `dateModified`

## 审计

- `data-trust-audit.mjs` → **DATA INTELLIGENCE REPORT**（事件队列 pending/processed/failed + stale models >180 天）

## 数据生命周期（示例）

```
OpenAI 发布新模型 → openaiConnector 发现 → MODEL_CREATED(pending)
   → 管理员 approve → 人工建模型（不自动发布）
Anthropic 降价 → pricingDiff → PRICE_CHANGED(pending, confidence 100)
   → approve → pricing_history 追加 → Ranking 刷新 → SEO 页面更新
LMSYS Elo 更新 → lmsysConnector → BENCHMARK_UPDATED(pending)
   → approve → benchmark_results 更新 → Ranking 重算 → 趋势图更新
```
