# Ranking Data Quality Audit（排名数据质量审计）

- **Date**: 2026-08-12
- **Phase**: 12.1 Part G

## 方法

对 Top 模型逐项检查：last benchmark date / benchmark sources / pricing freshness / confidence / risk。
（本阶段不改 Ranking 公式——Benchmark 50% + Capability 20% + Price 20% + Context 10%，× confidence）

## 风险分级

| Risk | 条件 | 处理 |
| --- | --- | --- |
| HIGH | benchmark 数据过期（>180d）或 confidence <50 | 不进 Top ranking |
| MEDIUM | pricing 缺失 / benchmark 无 source | 展示警告 |
| LOW | 官方来源 + 新鲜 | 正常 |

## 关键发现

| 项 | 状态 |
| --- | --- |
| Top 模型 benchmark 数据 | 生产 seed 无 demo benchmark（诚实：ranking 由能力/价格/上下文驱动） |
| 12.1 新增 51 模型 | **verified_status=unverified**（不进入 Top ranking 高分）✓ |
| pricing freshness | 官方来源映射 + effective_date（新增模型部分价格 NULL=待核验） |
| confidence | 新增模型 60（官方来源未核验）；既有 verified 模型 76+ |

## 风险清单（Top 50 抽查代表）

| 模型 | score | 风险 | 说明 |
| --- | --- | --- | --- |
| openai/gpt-5.4 | 高 | LOW | 官方 pricing + 能力 + verified |
| anthropic/claude-sonnet-4 | 高 | LOW | 官方 pricing + verified |
| deepseek/deepseek-chat | 高 | LOW（诚实标注 demo benchmark） | benchmark 为 demo 数据（Experimental） |
| zhipu/glm-5（新增） | 低 | MEDIUM | unverified + 无 benchmark → 不进 Top |
| minimax/minimax-m3 | 低 | MEDIUM | unverified |

## 结论

- 公式稳定（本阶段不改）
- 新增模型 unverified → 不污染 Top ranking ✓
- 后续：生产 benchmark 数据逐条核验后，ranking 质量随 Trust v4 提升
