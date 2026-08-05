# 模型价格与参数核对报告（v1.0 数据核验）

> 核对日期：2026-08-05 ｜ 数据源：生产 D1（当前值）vs 厂商官方定价页/官方文档（官方值）
> 计价单位：USD / 1M tokens（input / output），上下文 window 为 tokens

## 1. 核对总览（21 模型）

| 模型 | 当前 input/output | 官方 input/output | 当前上下文 | 官方上下文 | 价格 | 参数 | 数据来源 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| openai/gpt-4o | 2.5 / 10 | 2.5 / 10 | 128,000 | 128,000 | ✅ | ✅ | openai.com/api/pricing、developers.openai.com |
| openai/gpt-4o-mini | 0.15 / 0.6 | 0.15 / 0.6 | 128,000 | 128,000 | ✅ | ✅ | developers.openai.com（docs/models/gpt-4o） |
| openai/gpt-4.1 | 2 / 8 | 2 / 8 | 1,047,576 | 1,047,576 | ✅ | ✅ | platform.openai.com/docs/models/gpt-4.1 |
| openai/gpt-4.1-mini | 0.4 / 1.6 | 0.4 / 1.6（发布价；2026 priority 表 0.7/2.8） | 1,047,576 | 1,047,576 | ⚠️ | ✅ | openai.com/api/pricing（priority 价差） |
| openai/o3 | 2 / 8 | 2 / 8（发布价；2026 priority 表 3.5/14） | 200,000 | 200,000 | ⚠️ | ✅ | openai.com/api/pricing |
| anthropic/claude-opus-4 | 15 / 75 | 15 / 75 | 200,000 | 200,000 | ✅ | ✅ | docs.anthropic.com/pricing（**已 retired**） |
| anthropic/claude-sonnet-4 | 3 / 15 | 3 / 15 | 200,000 | 200,000 | ✅ | ✅ | docs.anthropic.com/pricing（**已 retired**） |
| anthropic/claude-3.7-sonnet | 3 / 15 | 3 / 15 | 200,000 | 200,000 | ✅ | ✅ | docs.anthropic.com/pricing（**deprecated**） |
| anthropic/claude-3.5-sonnet | 3 / 15 | 3 / 15 | 200,000 | 200,000 | ✅ | ✅ | docs.anthropic.com/pricing（**已 retired**） |
| anthropic/claude-haiku-3.5 | 0.8 / 4 | 0.8 / 4 | 200,000 | 200,000 | ✅ | ✅ | docs.anthropic.com/pricing（**已 retired**） |
| google/gemini-2.5-pro | 1.25 / 10 | 1.25 / 10（>200K 输入 2.5） | 1,048,576 | 1,000,000 | ✅ | ✅ | Google AI Studio / apicents.com（官方价） |
| google/gemini-2.5-flash | 0.3 / 2.5 | 0.3 / 2.5 | 1,048,576 | 1,048,576 | ✅ | ✅ | Google AI Studio / apicents.com |
| google/gemini-2.0-flash | 0.1 / 0.4 | 0.1 / 0.4 | 1,048,576 | 1,048,576 | ✅ | ✅ | Google（**官方 DEPRECATED**） |
| google/gemini-1.5-pro | 1.25 / 5 | 1.25 / 5 | 2,000,000 | 2,000,000 | ✅ | ✅ | Google（**官方 RETIRED**） |
| meta/llama-4-maverick | 0.25 / 0.75 | 0.15–0.27 / 0.60–0.97（合作伙伴） | 1,000,000 | 1,000,000 | ⚠️ | ✅ | Together/Bedrock/DeepInfra |
| mistral/mistral-large-2 | 2 / 6 | 2 / 6 | 128,000 | 128,000 | ✅ | ✅ | mistral.ai（官方） |
| alibaba/qwen3-235b | 0.4 / 1.2 | 0.2 / 0.6–0.8 | 131,072 | 131,072 | ⚠️ | ✅ | 阿里云百炼 / Together / Novita |
| zhipu/glm-4.5 | 0.8 / 4 | 0.6 / 2.2 | 128,000 | 131,072 | ⚠️ | ✅ | 智谱开放平台 / JD Cloud（折算） |
| moonshot/kimi-k2 | 0.6 / 2.5 | 0.57–0.6 / 2.2–2.5 | 131,072 | 131,072 | ✅ | ✅ | Moonshot / OpenRouter / Novita |
| deepseek/deepseek-chat | 0.27 / 1.1 | 0.27 / 1.1 | **65,536** | **128,000** | ✅ | ❌ | api-docs.deepseek.com |
| deepseek/deepseek-reasoner | 0.55 / 2.19 | 0.55 / 2.19 | **65,536** | **128,000** | ✅ | ❌ | api-docs.deepseek.com |

图例：✅ 与官方一致 ｜ ⚠️ 有差异/需注意 ｜ ❌ 不一致

## 2. 需要修正/关注项

### 2.1 参数错误（建议修正）
| 模型 | 字段 | 当前值 | 官方值 | 来源 |
| --- | --- | --- | --- | --- |
| deepseek/deepseek-chat | context_window | 65,536 | **128,000** | api-docs.deepseek.com（V3 上下文 128K） |
| deepseek/deepseek-reasoner | context_window | 65,536 | **128,000** | api-docs.deepseek.com（R1 上下文 128K） |

### 2.2 价格建议修正（第三方官方渠道区间）
| 模型 | 当前 | 官方渠道区间 | 建议值 | 来源 |
| --- | --- | --- | --- | --- |
| alibaba/qwen3-235b | 0.4 / 1.2 | 0.2 / 0.6（阿里百炼、Together） | 0.2 / 0.6 | 阿里云百炼 Model Studio |
| zhipu/glm-4.5 | 0.8 / 4 | 0.6 / 2.2（智谱、JD Cloud 折算） | 0.6 / 2.2 | 智谱开放平台 |
| meta/llama-4-maverick | 0.25 / 0.75 | 0.15–0.27 / 0.60–0.97 | 0.25 / 0.75（保留） | Meta 无直营 API，经合作伙伴 |

### 2.3 状态标记建议（官方已下线/弃用）
| 模型 | 官方状态 | 建议 data_status |
| --- | --- | --- |
| anthropic/claude-opus-4 | retired（除 Google Cloud） | deprecated |
| anthropic/claude-sonnet-4 | retired（除 Bedrock/GCP） | deprecated |
| anthropic/claude-3.5-sonnet | retired（除 Bedrock/GCP） | deprecated |
| anthropic/claude-3.7-sonnet | deprecated | deprecated |
| anthropic/claude-haiku-3.5 | retired（除 Bedrock/GCP） | deprecated |
| google/gemini-1.5-pro | retired | deprecated |
| google/gemini-2.0-flash | deprecated | deprecated |

### 2.4 需持续跟踪（价格可能调整）
- **openai/gpt-4.1-mini、o3**：官方 2026-08 的 Priority Processing 表格显示 0.7/2.8、3.5/14（优先处理加价档）；标准档价格未在抓取页面明确列出，当前库值（0.4/1.6、2/8）为模型发布时官方标准价，**建议保持并标记"待复核"**。
- 所有定价均为演示值（verification_status=unverified），修正后建议补 `source_url` 并标记 verified。

## 3. 数据来源清单

| 厂商 | 来源 URL |
| --- | --- |
| OpenAI | https://openai.com/api/pricing/ ｜ https://developers.openai.com/api/docs/models/gpt-4o ｜ https://platform.openai.com/docs/models/gpt-4.1 |
| Anthropic | https://docs.anthropic.com/en/docs/about-claude/pricing ｜ https://www.anthropic.com/pricing |
| Google Gemini | https://ai.google.dev/gemini-api/docs/pricing ｜ https://apicents.com/provider/google（校验参考） |
| DeepSeek | https://api-docs.deepseek.com/ ｜ https://www.deepseek.ai/deepseek-api |
| Meta Llama | https://ai.meta.com/llama/ ｜ AWS Bedrock / Together AI（无直营 API） |
| Mistral | https://mistral.ai/pricing |
| Alibaba Qwen | https://www.alibabacloud.com/en/product/modelstudio（百炼定价） |
| Zhipu GLM | https://open.bigmodel.cn/pricing |
| Moonshot Kimi | https://platform.moonshot.cn/docs/pricing |

## 4. 说明

- 价格为**抓取时的公开标价**，厂商可能随时调整；本报告数据抓取于 2026-08-05。
- 汇率折算（人民币模型）按近似 1 USD ≈ 7.2 CNY，仅作参考。
- 建议上线展示时在页面保留"价格为参考值，请以官方定价页为准"提示（现已有）。
- 修正操作（如需）：更新 `pricing`/`models` 表 + `pricing_history` 记录 + 标记 verification_status/source_url，然后重新构建前端。
