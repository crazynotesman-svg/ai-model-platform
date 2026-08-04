# Ranking 算法设计（v1）

> 目标：透明、可解释、可扩展的 AI 模型综合评分。所有输入来自 D1；公式不 hardcode 任何排名。

## 1. 总览

```
Overall Score = Benchmark × 50% + Capability × 20% + Price Efficiency × 20% + Context × 10%
```

各分量为 0-100 百分制；Overall 取加权平均（0-100）。所有分量可单独解释与审计。

## 2. 分量定义

### Benchmark Score（50%）

- 来源：`benchmark_results`（score 字段，示例数据 0-100 口径）
- 同 category：`score / 100`（归一）
- 多 benchmark：取全部结果的 **AVG(score)**（不同类别平均）
- 无数据：0 分

### Capability Score（20%）

- 来源：`model_capabilities`（supported = 1 的能力数）
- 公式：`supported_count / total_capabilities × 100`
  - `total_capabilities` = 全库出现过的能力种类数（当前 7 种：vision / reasoning / coding / audio / function_calling / multimodal / long_context）
- 说明：能力覆盖率越高分越高，可解释（等于"支持了几种标准能力"）

### Price Efficiency（20%）

- 来源：`pricing`（input_price，USD / per_1M_tokens）
- 公式：`min((max_input_price / input_price) × 100, 100)`
  - `max_input_price` = 当前全库最大输入价（分母参照）
  - 输入价越低 → 比值越高 → 分数越高；`min(..., 100)` 防止无限放大（最低价模型 = 100）
- 无价格数据：0 分

### Context Score（10%）

- 来源：`models.context_window`
- 公式：`min(context_window / 200000, 1) × 100`
  - 200K tokens 为满分阈值（≥200K 即满分）
- 无上下文数据：0 分

## 3. 排名模式

| 模式 | 排序键 | 用途 |
| --- | --- | --- |
| `overall`（默认） | Overall Score DESC | /ranking/ |
| `category=coding` 等 | 该分类 Benchmark Score DESC | /api/ranking?category=coding、/ranking/coding/ |
| `best-value` | Price Efficiency DESC | /ranking/best-value/ |

并列时按 slug 稳定排序。无该模式数据的模型排末尾（分数视为 0）。

## 4. 实现位置

- **权威实现**：`worker/src/services/ranking.ts`（`calculateFromData` 纯函数 + `rankModels`）
- **SSG 导出**：`frontend/scripts/export-models.mjs` 内置相同公式（与 ranking.ts 保持一致，注释互引），写入 `model-catalog.json` 的 `ranking` 字段
- **Worker API**：`GET /api/ranking?lang=&category=`

## 5. 扩展性（未来）

- 权重可配置（v2：支持用户自定义权重或行业权重预设）
- 新指标接入：在 `calculateFromData` 增加分量 + 调整权重即可，不影响调用方
- 排名快照/历史：未来可落库 `ranking_snapshots`（当前 v1 实时计算，不新增表）

## 6. 已知边界

- 示例 benchmark 数据（manual/internal-demo）上线前须替换为官方基准实测数据
- `max_input_price` 为全库相对值：随库内模型增减而变化（可解释为"相对性价比"）
