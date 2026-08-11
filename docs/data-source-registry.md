# Data Source Registry（数据来源注册表）

- **Date**: 2026-08-11
- **Phase**: 11.7

## 来源注册（data_sources，16 条）

| Tier | trust_level | 来源 |
| --- | --- | --- |
| A 官方 | 100 | OpenAI Pricing / Anthropic Pricing / Google Gemini Pricing / OpenAI Model Docs / Anthropic Model Docs / Google Gemini Docs / Meta Llama Docs |
| B 权威 | 90 | HumanEval / MMLU / GPQA / AIME / SWE-bench / LMSYS Chatbot Arena / MMMU |
| C 社区 | 70 | HuggingFace Open LLM Leaderboard |
| D 人工 | 40 | Internal Demo |

## 注册规则

1. 新来源必须：name 唯一 + type（official/benchmark/community/manual）+ url + trust_level
2. 数据写入必须关联 source_id（禁止裸数据）
3. 来源 URL 变更 → 更新 data_sources.url + 触发 data_changes

## 展示

- `/{lang}/data/sources/`：公开来源列表（Tier + Trust + 链接）
- DataCatalog JSON-LD（Dataset/DataDownload）暴露给 AI 搜索引擎

## 审计

- `data-trust-audit.mjs`：检查 pricing/benchmark/capability 的 source_id 缺失（HIGH=0 目标）
- 每日 cron：DATA TRUST DAILY REPORT
