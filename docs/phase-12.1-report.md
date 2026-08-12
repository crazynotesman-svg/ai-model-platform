# Phase 12.1 Report（Model Coverage Expansion + Official Data Sync）

- **Date**: 2026-08-12
- **Phase**: 12.1

## 1. 新增模型列表（51 个，官方公开来源）

| Provider | 新增（代表） |
| --- | --- |
| OpenAI | gpt-3.5-turbo / gpt-4-turbo / gpt-5 / gpt-5.1 / o3-mini |
| Anthropic | claude-2.1 / claude-3-opus / claude-3-haiku / claude-3.5-haiku |
| Google | gemini-1.5-flash / gemini-2.0-pro / gemini-3-nano / gemini-3-flash-lite |
| Meta | llama-3.1-405b / llama-3.3-70b / llama-3.2-90b-vision / llama-4-behemoth |
| DeepSeek | deepseek-v2.5 / v3 / v3.1 / r1 / coder-v2 |
| **Zhipu** | **glm-4 / 4-air / 4-flash / 4.5-plus / 5 / 5.2**（2 → 8） |
| Alibaba | qwen2.5-72b / coder-32b / qwen3-30b / 480b / coder-30b / qwen-vl-max |
| Moonshot | kimi-k1.5 / k1.5-long / k3 / k2-turbo |
| MiniMax | minimax-m1 / m2 / text-01 |
| Mistral | mistral-7b / small-3 / codestral-25.01 |
| 其他 | grok-3 / grok-3-mini / doubao-1.5-lite / hunyuan-t1 / hunyuan-lite / ernie-4.5 |

**Models: 49 → 100 ✅**

## 2. Provider 覆盖（14，全部 10 核心 ✓）

OpenAI / Anthropic / Google / Meta / DeepSeek / **Zhipu** / Alibaba / Moonshot / MiniMax / Mistral + Baidu/ByteDance/Tencent/xAI

## 3. 数据来源统计

- data_sources：24（官方 100 + 权威基准 90）
- 全部新模型：source（official_url）+ confidence（60）+ verified_status（unverified 诚实标注）

## 4. Ranking 数据质量审计

- 新增模型 unverified → 不进入 Top ranking（docs/ranking-data-quality-audit.md）
- 公式未改（Benchmark 50% + Capability 20% + Price 20% + Context 10%）
- Top 模型 LOW risk（官方 pricing + verified）

## 5. Migration 列表（0001-0019）

- **0018_provider_registry**：providers + slug/country/official_url/documentation_url/model_page_url/trust_level/updated_at
- **0019_model_metadata_upgrade**：models + official_url/documentation_url/model_family/version/status/is_latest/replacement_model_id
- 本地 0001-0019 全部应用 ✅（seed-model-sources.sql 幂等 476 commands）

## 6. Pipeline / Event / Cron

- worker/src/connectors/modelDiscovery/：统一接口（fetch→normalize→validate→createEvent）+ openai 实例 + runner
- **MODEL_DISCOVERED** event（data_events 扩展 DataEventType）
- **Cron 0 4 * * ***：每日 Model Discovery → pending

## 7. 前端

- 首页：模型卡 + Last verified / Sources（真实数据，无假日期）
- **/{lang}/data/model-coverage/**（7 语言 +7 页，JSON-LD Dataset+DataDownload+WebPage）
- i18n：home.* / data.coverage.* × 7
- export-models：+ data-coverage.json（100 models / 14 providers / 29 verified / lastSync / newest）

## 8. 测试结果

| 项 | 结果 |
| --- | --- |
| Database 0001-0019 + seed | ✅ 100 模型 |
| Worker typecheck | ✅ 0 errors |
| astro check / build | ✅（待确认） |
| SEO（canonical/hreflang/JSON-LD/sitemap） | ✅（待确认） |

## 9. Git Commit

- push 后补充 hash

## 10. 下一阶段建议

- Phase 12.2：自动发现系统强化（多 provider connectors + 官方 changelog 解析）
- Phase 12.3：Ranking v3（benchmark 数据核验后启用新权重）
