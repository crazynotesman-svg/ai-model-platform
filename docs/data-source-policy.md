# Data Source Policy（数据来源策略）

- **Date**: 2026-08-11
- **Phase**: 11.5A

## 1. 数据来源原则

- **透明**：所有数据标注来源（data_sources 注册表：name/type/url/trust_level）
- **分级**：官方（100）> 公开权威基准（90）> 社区（70）> 人工（40）
- **禁止隐藏来源**：无来源数据不进入展示，或明确标注 Experimental
- **禁止人工猜测**：capability/benchmark 无来源不得标记 verified

## 2. 更新频率

| 数据 | 来源 | 频率 |
| --- | --- | --- |
| 模型/价格（官方） | OpenAI / Anthropic / Google / Meta 官方文档 | 定期同步（lastVerifiedAt） |
| Ranking 评分 | 每日快照（Worker Cron 02:00 UTC） | 每日 |
| Benchmark（权威） | HumanEval / MMLU / GPQA / AIME / SWE-bench / MMMU / LMSYS Arena | 随数据源版本更新（dataset/version 记录） |
| 社区数据 | HuggingFace Leaderboard 等 | 随数据源 |
| Demo 数据 | 人工录入 | Experimental 标注 |

## 3. 可信等级与展示

- DataTrustBadge：≥90 Verified（绿）/ 70-89 Trusted（蓝）/ <70 Experimental（琥珀）
- Confidence：benchmark confidence 平均 / 100（模型级 confidenceScore 兜底）
- Ranking：Overall = Raw × DataConfidence（低可信数据不进入最高排名）

## 4. 用户反馈机制

- 每页显示来源链接（sourceUrl）与核验时间（verified_at / tested_at）
- 数据争议反馈渠道：`docs/seo-report` 页面透明声明 + 站点反馈通道（后续阶段）
- 发现错误数据 → 更新来源 → 更新 verified_at → 重新导出/部署

## 5. 审计

- `data-trust-audit.mjs`：HIGH（无 confidence / manual 标 verified）必须 = 0
- 每周 SEO Health Check 附带运行

## 6. 外部数据源整合（Connector 接口设计，本阶段不爬取）

| 类别 | 优先级 | 接口 |
| --- | --- | --- |
| Benchmark | 1. LMSYS Arena（Elo + methodology + date） 2. HuggingFace Leaderboard 3. SWE-bench 4. HumanEval 5. MMMU | 周期性拉取 → data_sources + benchmark_results（source_id/confidence/verified_at） |
| Pricing | OpenAI / Anthropic / Google 官方定价页 | 定期核验 → pricing_history（source_id/verified_at/confidence） |
| Model Metadata | OpenAI / Anthropic / Google AI / Meta AI docs | 定期同步 → models + model_capabilities（verified_status/confidence_score） |

> 本阶段仅定义接口；实际采集器（scripts/connectors/*）留待下一阶段，采集前需人工核验映射。
