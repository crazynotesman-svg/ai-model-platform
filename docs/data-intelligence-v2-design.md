# Data Intelligence v2 Design（数据层 v2 设计）

- **Date**: 2026-08-11
- **Phase**: 11.7

## 数据生命周期（v2）

```
External Source（官方端点 / 权威榜单）
      ↓
Connector（openaiPricing / anthropicPricing / googlePricing / benchmark）
      ↓
Normalizer（结构化：input/output/cached/batch price、context、effective date、dataset/version）
      ↓
Validation（Cross Validation Engine：verified / warning / conflict / expired）
      ↓
data_events（pending，含 source_id + confidence + verified_at）
      ↓
Review（approve API）
      ↓
Production Data（pricing_history / benchmark_results / models + data_changes 记录）
      ↓
Ranking v2 / SEO 页面刷新
```

## 核心原则

1. 禁止填充未知数据 / 禁止 mock
2. 所有新增数据必须有 `source + timestamp + confidence`
3. 自动发现 ≠ 自动发布（connector 只出 pending）
4. 低可信数据只能进入 pending review
5. 保持现有 SEO 页面稳定

## 模块设计

### Model Identity Resolution（0012 model_aliases）
- 同一模型多名称关联（API 名/展示名/benchmark 名/第三方名）：GPT-4o / gpt-4o / gpt-4o-2024-05-13 → 同一 model_id
- UNIQUE(model_id, alias)；带 provider/source/confidence

### Pricing Connector v2
- 采集：input / output / **cached / batch** price + context window + effective date
- 每项含 source_url / source_id / verified_at / confidence
- 官方来源 confidence ≥95 → pending event（不直接覆盖）

### Benchmark Connector v2
- Tier A：LMSYS Arena / SWE-bench / MMLU / MMLU-Pro / GPQA / AIME / HumanEval / MMMU
- 每条强制字段：benchmark / dataset / version / score / model_version / source / date / confidence
- 缺 dataset/version/source 的数据禁止进入生产

### Cross Validation Engine（dataValidation.ts）
- Pricing：官方源 vs 现有库 → price changed / missing field / stale
- Benchmark：同模型不同 score / dataset / version 不一致
- 输出 validation_status：verified / warning / conflict / expired

### Trust Score v3（docs/trust-score-v3.md）
```
Trust = Source Authority × Freshness × Completeness × Cross Validation × Version Reliability（0-100）
```

### Data Changelog（0013 data_changes）
- 每次生产数据变更记录 before/after JSON + source + confidence + timestamp
- 公开页面展示："GPT-4o price changed: Before $5 → After $2.5, Source: OpenAI official, Date: ..."

### 公开数据页面（/[lang]/data/）
- sources：来源列表 + Tier + last checked
- changelog：最近 price/benchmark/model 更新
- methodology：ranking formula + trust score + validation rules

### SEO（DataCatalog JSON-LD）
- DataCatalog + Dataset + DatasetSeries + DataDownload：让 Google/Perplexity/ChatGPT Search/Gemini 识别为可信数据平台

## 不开发（限制）
用户系统 / 登录 / 支付 / 广告 / CMS / 社区评分 / 自动发布未验证数据
