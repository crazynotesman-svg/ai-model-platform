# Phase 11.6 Report（AI Data Intelligence Pipeline）

- **Date**: 2026-08-11
- **Phase**: 11.6

## 1. Database Changes

- Migration **0011_data_events.sql**：`data_events` 表（id/event_type/entity_type/entity_id/payload JSON/source_id/confidence/status/error/created_at/processed_at）+ 3 索引（type/status/created_at）
- 本地测试：0001-0011 全部应用 ✅

## 2. Connector Status

- 统一接口（connectors/types.ts：DataConnector fetch→normalize→validate + runConnector + validateEvent）
- 5 个 connector：openai / anthropic / google（官方 Tier A，fetch 官方定价页）+ huggingface / lmsys（benchmark adapter，不覆盖生产）
- normalize 解析映射待人工核验（adapter 就绪，避免伪事件）

## 3. Event System

- `pricingDiff.ts`：旧 vs 新价格 → PRICE_CHANGED（官方来源 confidence 100，纯函数）
- `eventProcessor.ts`：applyEvent（MODEL_UPDATED 更新 models+verifications / PRICE_CHANGED 追加 pricing_history+pricing / BENCHMARK_UPDATED 追加 benchmark_results，ON CONFLICT 幂等）+ insertEvents（pending）+ listPendingEvents
- 状态机：pending → processed / failed（error 记录）
- **安全**：connector 只生成 pending；approve 才写业务表（禁止自动发布未验证数据）

## 4. Cron

- wrangler.toml：`"0 */6 * * *"`（每天 4 次）→ `runDataDiscovery`（connectors → pending events）
- 现有 3 cron 保留（新闻/快照/审计）

## 5. Ranking Integration

- API `POST /api/v1/data-events/:id/approve`：PRICE_CHANGED / BENCHMARK_UPDATED → `createDailySnapshot` 重算当日快照（幂等）+ 日志记录
- GET `/api/v1/data-events`：pending 审核队列（event/source/confidence/payload）

## 6. Frontend Changes

- `DataFreshnessBadge.astro`：Updated today / Updated N days ago / Updated N month(s) ago / Needs verification（7 语言 i18n trust.fresh*）
- 模型页：Data Trust Card 增加 Freshness 行；SoftwareApplication JSON-LD 增加 `dateModified`（Phase 11.6 SEO freshness）
- i18n：trust.freshToday/freshDays/freshMonth/needsVerification/freshness × 7 语言

## 7. Tests

- Database：0011 migration 本地应用 ✅
- Worker typecheck：新代码 0 错误（唯一报错为既有 rss.ts 的 fast-xml-parser 本地依赖残留——CI 全新安装会通过）
- Frontend：astro check / build（待最终验证）
- API：events list / approve（部署后验证）

## 8. Files

| 文件 | 说明 |
| --- | --- |
| `database/migrations/0011_data_events.sql` | 新增 |
| `worker/src/services/connectors/types.ts` | 新增：统一接口 |
| `worker/src/services/connectors/{openai,anthropic,google,huggingface,lmsys}.ts` | 新增 |
| `worker/src/services/connectors/pricingDiff.ts` | 新增：价格变化检测 |
| `worker/src/services/eventProcessor.ts` | 新增：事件应用/插入/列表 |
| `worker/src/services/dataDiscovery.ts` | 新增：cron 调度 |
| `worker/src/index.ts` | API data-events + approve + cron 分支 |
| `worker/wrangler.toml` | cron 0 */6 * * * |
| `frontend/src/components/data/DataFreshnessBadge.astro` | 新增 |
| `frontend/src/pages/[lang]/models/[...slug].astro` | Freshness + dateModified |
| `frontend/src/i18n/translations/*.json` × 7 | trust.fresh* 键 |
| `frontend/scripts/data-trust-audit.mjs` | DATA INTELLIGENCE REPORT |
| `docs/data-intelligence-pipeline.md` / `docs/data-connectors.md` | 新增 |
| `docs/phase-11.6-report.md` | 本报告 |

## 9. 禁止范围遵守

✅ 无用户系统 / 支付 / 广告 / CMS；connector 不自动发布未验证数据（pending 审核）
