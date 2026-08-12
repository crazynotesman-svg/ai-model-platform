# AI Citation Guidelines（AI 引用优化指南）

- **Date**: 2026-08-12
- **Phase**: 11.9

## 目标

让 Google / Perplexity / ChatGPT Search / Gemini 能将 aimodel.100ideas.net 作为**可信 AI 模型数据源**引用（E-E-A-T + AI citation readiness）。

## AI Crawler 推荐格式

AI 搜索引擎在提取答案时优先读取结构明确、带来源与时间戳的数据。平台所有数据页遵循：

### 1. 明确数据更新时间
- JSON-LD `dateModified`（模型页 SoftwareApplication / 数据页 Dataset）
- 页面可见 "Last updated: YYYY-MM-DD"

### 2. 明确来源
- 每条价格/基准数据带 sourceUrl（官方定价页 / 论文 / 榜单）
- Data Trust Card 显示来源 + 可信等级

### 3. 明确计算方法
- /data/methodology/ 公开 Ranking 公式 + Trust Score v3/v4 公式
- Benchmark 结果含 dataset + version + evaluation_method

### 4. 明确版本
- benchmark_results.dataset_version / model_version
- pricing_history.effective_date（价格生效日期）

## Answer Extraction Readiness 清单

| 信号 | 实现 |
| --- | --- |
| Dataset schema | /data/sources/ + /data/authority/（DataCatalog + Dataset） |
| dateModified | 模型页 JSON-LD（有数据时输出） |
| Source links | Data Trust Card 来源 + benchmark sourceUrl |
| Author/Publisher | JSON-LD publisher Organization |
| Citation blocks | Data History / Evidence Timeline（变更时间戳） |
| Trust badge | DataTrustBadge（置信分档） |
| Changelog | /data/changelog/（公开变更记录） |

## 规则

- 无可靠 URL 不生成 sameAs/isRelatedTo（Phase 11.8 约定）
- 未核验数据不进入排名（不向 AI crawler 暴露实验性数据）
- 页面不硬编码推荐/评分（AI 提取的必须是计算值）
