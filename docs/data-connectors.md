# Data Connectors（外部数据源接入说明）

- **Date**: 2026-08-11
- **Phase**: 11.6

## Connector Architecture

```
External Data（官方端点 / 权威榜单 / 社区）
   ↓ fetch()
Raw Data
   ↓ normalize()
标准化事件（DataEventInput）
   ↓ validate()
校验通过的事件
   ↓ insertEvents（status=pending）
Verification Queue → approve → Event Processor → 业务表
```

**约束**：connector 禁止直接写数据库；只产出 normalized event。

## 统一接口（worker/src/services/connectors/types.ts）

```ts
interface DataConnector {
  name: string;              // 与 data_sources.name 对应
  fetch(): Promise<unknown>; // 拉取外部数据
  normalize(raw): Promise<DataEventInput[]>; // 原始数据 → 事件
  validate(events): DataEventInput[];        // 校验
}
```

## 来源优先级（Benchmark）

| 优先级 | 来源 | trust_level | 类型 |
| --- | --- | --- | --- |
| 1 | LMSYS Chatbot Arena（真实用户 Elo，记录 source+methodology+date） | 90 | benchmark |
| 2 | HuggingFace Open LLM Leaderboard | 70 | community |
| 3 | SWE-bench | 90 | benchmark |
| 4 | HumanEval | 90 | benchmark |
| 5 | MMMU | 90 | benchmark |

## 来源优先级（Pricing / Metadata）

| 类别 | 官方来源 | trust_level |
| --- | --- | --- |
| Pricing | OpenAI / Anthropic / Google 官方定价页 | 100 |
| Model Metadata | OpenAI / Anthropic / Google AI / Meta AI docs | 100 |

## 实现状态（Phase 11.6 第一阶段）

| Connector | fetch | normalize | 状态 |
| --- | --- | --- | --- |
| openai.ts | ✅ 官方定价页 | 骨架（解析待人工核验映射） | adapter 就绪 |
| anthropic.ts | ✅ | 骨架 | adapter 就绪 |
| google.ts | ✅ | 骨架 | adapter 就绪 |
| huggingface.ts | ✅ | 骨架 | adapter 就绪（不覆盖生产） |
| lmsys.ts | ✅ | 骨架 | adapter 就绪（不覆盖生产） |

> normalize 的 HTML 解析映射（官方页面 → 模型/价格字段）需人工核验后启用（data-connectors 下一阶段），避免伪事件。

## Validation Rules

1. 必填字段：eventType / entityType / entityId 缺失 → 丢弃
2. confidence 0-100；来源 trust_level 决定默认置信（官方 ≥90 → confidence 100）
3. payload 必须为对象
4. demo/manual 数据禁止标记 verified（走 Internal Demo 40）
5. 价格变化：旧价存在且不等 → PRICE_CHANGED；官方来源 confidence=100
6. Benchmark：新版本（dataset+version）插入新行，不覆盖旧版本（保留历史）

## 审核流程

- connector → pending → `GET /api/v1/data-events`（管理员查看）
- `POST /api/v1/data-events/:id/approve` → 应用 + Ranking 刷新
- 失败 → failed + error（可查）

## 后续阶段（非本阶段）

- 官方页面 HTML 解析映射（人工核验后启用 normalize 实际解析）
- SWE-bench / MMMU connector 落地
- 自动核验回执（fetch 后 diff → 置信度加权）
