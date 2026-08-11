# Data Trust Design（数据可信体系设计）

- **Date**: 2026-08-11
- **Phase**: 11.5A

## Data Trust Architecture

```
Data Source（来源：官方文档 / 公开基准 / 社区 / 人工）
   ↓
Raw Data（原始数据）
   ↓
Validation（核验：verified_at / verification_status）
   ↓
Normalized Data（规范化：score / price / capability 统一口径）
   ↓
Public Display（展示：Data Trust Badge / Confidence / 来源标注）
```

## 数据等级（trust_level）

| Tier | 来源 | 例子 | trust_level |
| --- | --- | --- | --- |
| **A** | 官方 | OpenAI API docs / Anthropic pricing / Google Gemini docs / Meta Llama docs | **100** |
| **B** | 公开权威 Benchmark | HumanEval / MMLU / GPQA / AIME / SWE-bench / MMMU / **LMSYS Chatbot Arena**（真实用户偏好 Elo，需记录 source+methodology+date，参考 https://www.lmsys.org/blog/2023-05-03-arena/） | **90** |
| **C** | 社区/第三方 | HuggingFace Open LLM Leaderboard | **70** |
| **D** | 人工录入 | demo 数据（internal-demo） | **40** |

**原则**：禁止隐藏来源；demo 数据必须显示 Experimental。

## 可信评分算法（Ranking Engine v2）

```
Raw     = Benchmark×50% + Capability×20% + PriceEfficiency×20% + Context×10%
Overall = Raw × DataConfidence（0-1）
```

- DataConfidence = benchmark confidence 平均值 / 100（无 benchmark 时用模型 confidenceScore / 100）
- 目的：避免低可信数据进入最高排名
- 输出：score（overall）、confidence、breakdown（rawScore + 各分量）

## 数据库

- migration `0010_data_trust.sql`：`data_sources`（来源注册表）+ `data_verifications`（实体验证记录）+ benchmark_results/pricing_history/models/model_capabilities 补列
- seed `seed-trust.sql`：16 个来源注册 + 幂等映射（OpenAI/Anthropic/Google/Meta → 官方源；demo → Internal Demo 40）

## 展示

- **DataTrustBadge**：confidence ≥90=Verified（绿）/ 70-89=Trusted（蓝）/ <70=Experimental（琥珀）——颜色只根据 confidence
- 模型详情 Data Trust Card（Model/Pricing/Benchmark 验证 + Confidence%）
- 首页 Ranking Methodology + Data Confidence
- Compare Data Reliability（Benchmark/Pricing 可信状态）
- Benchmark Source Information（dataset/version/date）
