# Model Source Registry（模型来源注册）

- **Date**: 2026-08-12
- **Phase**: 12.1 Part K

## Provider ↔ Source 映射（provider ≠ data source）

| Provider | 官方来源（data_sources） | 用途 |
| --- | --- | --- |
| OpenAI | OpenAI Model Docs / Pricing / Release Notes / Technical Report | 模型/价格/发布 |
| Anthropic | Anthropic Model Docs / Pricing / Release Notes | 模型/价格/发布 |
| Google | Gemini Docs / Pricing / Technical Reports | 模型/价格/能力 |
| Meta | Llama Docs / Papers | 开源模型 |
| DeepSeek | DeepSeek API Docs | 模型/价格 |
| Zhipu | docs.bigmodel.cn | GLM 系列模型/价格 |
| Alibaba | qwenlm.github.io | Qwen 系列 |
| Moonshot | platform.moonshot.cn | Kimi 系列 |
| MiniMax | platform.minimaxi.com | MiniMax 系列 |
| Mistral | docs.mistral.ai | Mistral 系列 |

## 新增模型来源要求

- 官方 URL（official_url / documentation_url）
- trust_level（官方 100）
- 新增数据带 source_id + confidence + 时间戳

## 更新策略（model-update-strategy）

1. **发现**：Model Discovery cron（04:00）→ MODEL_DISCOVERED（pending）
2. **核验**：人工 approve（对比官方文档）
3. **入库**：models 插入（INSERT OR IGNORE，slug 唯一）
4. **同步**：pricing / translations / ranking 刷新
5. **记录**：data_changes + data_events（可审计）

## 禁止

- 编造 benchmark / 猜测评分
- 无来源模型参数
- 自动覆盖已有可信数据
