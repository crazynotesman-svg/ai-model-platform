# Changelog

All notable changes to the AI Model Intelligence Platform.

## [1.0.0] — 2026-08-05 — 🎉 Initial Production Release

正式上线（v1.0.0）：免费、开放、全球化的 AI 模型情报平台。
前端：https://ai-model-platform-my5.pages.dev ｜ API：https://ai-model-platform-api.crazynotesman.workers.dev

### Added（Phase 1-9.7 全量）

- **模型库**：21 个模型 × 7 语言（en/zh-CN/ja/ko/es/de/fr），SSG 双层数据（content collections + Workers/D1）
- **定价对比**：价格、价格历史（pricing_history）、成本估算、Token 计算器（tiktoken WASM）
- **能力矩阵**：7 类能力（vision/reasoning/coding/audio/function_calling/multimodal/long_context）
- **Benchmark**：4 分类 × 28 结果（demo 数据，unverified 标记）；Leaderboard + 分类 SEO 页
- **Ranking 体系**：透明评分引擎（Benchmark 50% + Capability 20% + Price 20% + Context 10%）、
  `/api/ranking`、趋势（每日快照 Cron 02:00 UTC）、推荐（Best Overall/Value/Coding/Reasoning）
- **比较页**：能力矩阵 + 价格趋势 + Benchmark/排名对比 + JSON-LD
- **资讯**：每日采集（Cron 01:00 UTC）+ RSS
- **数据透明**：`/data-policy/`（7 语言）、Data Status Card、verification_status 体系
- **API v1**：`/api/v1/*`（models/ranking/news/trend/recommendations，旧 `/api/*` 保留）
- **生产就绪**：GitHub Actions（Worker+D1 自动部署）、Cloudflare Pages（前端）、D1 生产库、安全头、SEO（1751 页、sitemap、JSON-LD）

### Known Limitations

- Benchmark 为 demo/manual 数据（unverified），上线后须以官方基准替换
- 定价为演示值，须逐条核对官方价格页（补 source_url + verified）
- 未绑定自定义域名（当前 pages.dev / workers.dev）
