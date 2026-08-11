# Roadmap

AI Model Intelligence Platform 的阶段化开发路线图。每个阶段完成后输出：完成内容总结 / 修改文件清单 / 运行测试方法，并等待下一阶段指令。

## 阶段总览

| Phase | 名称 | 状态 |
| --- | --- | --- |
| 1 | 项目基础架构（monorepo / frontend / worker / database / docs） | ✅ 已完成 |
| 2 | 完整国际化系统（JSON 文案 / 自动识别 / 切换体验 / SEO 组件 / hreflang） | ✅ 已完成 |
| 3 | 模型数据系统（D1：schema + migration + seed，4 供应商 11 模型） | ✅ 已完成 |
| 4 | Model Database 页面（Worker API + 列表/搜索/排序 + 详情 + 三态） | ✅ 已完成 |
| 5 | Token Calculator（tiktoken 精确 + estimate 回退 + 成本对比） | ✅ 已完成 |
| 6 | 模型比较（选择页 + SSG 对比页 + JSON-LD，Google SEO） | ✅ 已完成 |
| 7 | AI 行业资讯（News Collector Service + Cron + 列表页） | ✅ 已完成 |
| 8 | SEO/性能打磨 + GitHub Actions 自动部署 | ✅ 已完成 |
| 9 | 全球化收尾（本地化 QA、隐私友好统计、反馈通道） | ⬜ 待开发 |
| 9.1 | 模型能力数据库（model_capabilities + 详情 API 扩展） | ✅ 已完成 |
| 9.2 | 价格历史系统（pricing_history + 初始导入 + history API） | ✅ 已完成 |
| 9.3 | 比较页增强（能力矩阵 + 价格趋势 + JSON-LD SoftwareApplication/BreadcrumbList） | ✅ 已完成 |
| 9.4a | Benchmark 数据系统（categories + results + benchmarks API） | ✅ 已完成 |
| 9.4b | Benchmark 展示系统（Leaderboard + Benchmark SEO 页面） | ✅ 已完成 |
| 9.5 | AI Model Ranking 算法体系（评分引擎 + 排名 API + SEO 页面） | ✅ 已完成 |
| 9.6 | AI Model Ranking 增强（趋势/推荐/快照） | ✅ 已完成 |
| 9.7 | 评测平台收尾（数据源接入、合规、v1.0） | ✅ 已完成 |
| v1.0 | **AI Model Platform v1.0 已上线**（2026-08-05，tag v1.0.0） | 🎉 **已上线** |
| v2 | 用户体系 / 社区 / 商业化 / 自动 benchmark pipeline | ⬜ 规划中 |
| 10.1 | SEO 生产审计（aimodel.100ideas.net 域名） | ✅ 已完成 |
| 10.2 | 生产域名迁移 P0 修复（canonical/sitemap/robots → 生产域名） | ✅ 已完成 |
| 10.3 | SEO P1 增强（og:image / SoftwareApplication / recommendations 301） | ✅ 已完成 |
| 10.4 | Google Search Console & Indexing 策略（setup/audit/priority URLs） | ✅ 已完成 |
| 10.5 | 内部链接 SEO 增强（Related Resources/BreadcrumbList/导航补齐） | ✅ 已完成 |
| 10.6 | 收录后优化（P2：sitemap lastmod、404 状态、首页 Organization JSON-LD） | ⬜ 待开发 |
| 11.1 | Google 收录监控与 SEO 数据闭环（analytics opt-in / health script / monitoring plan） | ✅ 已完成 |
| 11.2 | GEO/AI Search 优化（FAQPage schema / crawler policy / citation audit 8.6/10） | ✅ 已完成 |
| 11.3 | Programmatic SEO 规模化（use-cases/categories/compare-intent，+105 页） | ✅ 已完成 |
| 11.4 | SEO Growth 系统（quality score / seo-report / inventory / 索引策略） | ✅ 已完成 |
| 11.5 | SEO Growth & Index Intelligence（opportunity engine / dashboard / 内链检测 / Health Score 93） | ✅ 已完成 |
| 11.5A | AI Model Data Trust（data_sources/verifications + Ranking v2 confidence + Trust Card） | ✅ 已完成 |

## Phase 10 — Production Launch ✅ 已完成（git: release: v1.0.0，tag v1.0.0）

- [x] 生产 D1：创建 ai-model-platform-db（94d5cd6c）→ 远程迁移 0001-0009 → seed-production.sql（11 模型/63 能力/11 价格历史；benchmark=0、news=0，demo 不导入）
- [x] Worker 部署：https://ai-model-platform-api.crazynotesman.workers.dev（D1 绑定 + 2 Cron）
- [x] 生产 API 冒烟：11/11 通过（v1 版本化接口 + 404 兜底）
- [x] Frontend：Cloudflare Pages 原生集成（ai-model-platform-my5.pages.dev），PUBLIC_API_BASE=worker URL
- [x] CI 修复：export-models.mjs 增加 CI 回退模式（无本地 D1 用已提交 catalog）；generated/ 提交进仓库
- [x] SEO 最终检查：canonical 正式域名、hreflang 8、sitemap 无占位、安全头（DENY/nosniff/Referrer-Policy/Permissions-Policy）
- [x] 文档：docs/performance-baseline.md、docs/production-data-policy.md、CHANGELOG.md
- [x] GitHub Actions：deploy-worker.yml（migrations→seed-production→typecheck→deploy→smoke），需 secrets：CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID
- [x] 已知限制：CSP 未启用；benchmark 为 demo（unverified）；定价为演示值待核验；未绑定自定义域名

## Phase 9.1 — 模型能力数据库 ✅ 已完成（git: feat: add model capabilities database）

- [x] 迁移 0003：`model_capabilities` 表（id / model_id FK CASCADE / capability / supported / created_at，UNIQUE(model_id, capability) + 双索引）
- [x] Seed：9 模型 × 7 能力（vision/reasoning/coding/audio/function_calling/multimodal/long_context）= 63 条，INSERT OR IGNORE 幂等
- [x] Worker 详情 API：`GET /api/models/:slug` 返回 `capabilities[]`（旧字段完全兼容，列表接口不变）
- [x] 文档：database-design.md ER 图 + 表说明；roadmap 标记完成
- [x] 验证：空库迁移/seed/幂等/外键/查询全通过；worker typecheck、frontend check（0 错误）、build（497 页）全通过

## Phase 9.2 — 价格历史系统 ✅ 已完成（git: feat: add pricing history database）

- [x] 迁移 0004：`pricing_history` 表（id / model_id FK CASCADE / input_price / output_price / currency / unit / effective_date / source / created_at，UNIQUE(model_id, effective_date, currency, unit) + 双索引）
- [x] Seed：`pricing → pricing_history` 初始导入（11 模型各 1 条，effective_date = date(updated_at) 回退 date('now')，source = 'initial_import'，INSERT OR IGNORE 幂等）
- [x] Worker API：`GET /api/models/:slug/pricing-history`（时间升序返回价格变化，支持 currency/unit 筛选，模型不存在 404；路由置于详情贪婪匹配之前，旧 API 完全兼容）
- [x] 文档：database-design.md ER 图 + 表说明；roadmap 标记完成
- [x] 验证：空库迁移 0001-0004/seed 11 条/重复 seed 幂等/外键 0 悬空/UNIQUE 约束生效；worker typecheck、frontend check（0 错误）、build（497 页）全通过

## Phase 9.3 — 比较页增强 ✅ 已完成（git: feat: enhance model comparison pages）

- [x] 数据模型：`src/lib/compare.ts` 新增 CAPABILITY_ROWS（vision/reasoning/coding/audio/tools/long_context，function_calling → Tools 映射）与 capabilityMap
- [x] 导出扩展：`scripts/export-models.mjs` 同时导出 capabilities（model_capabilities）与 pricingHistory（pricing_history），写入 model-catalog.json（仍 100% 来自 D1，无运行时 mock）
- [x] UI 模块：能力矩阵表格（✓/✗ 状态）+ 价格历史响应式表格（日期/Input/Output，无历史显示 i18n 提示），移动端友好
- [x] JSON-LD：Product → SoftwareApplication（applicationCategory "AI Model"、operatingSystem "Cloud API"、offers 价格）+ 新增 BreadcrumbList（Home > Compare > A vs B）；旧 Product schema 已删除
- [x] i18n：7 语言新增 compare.capabilities / priceHistory / vision / reasoning / coding / audio / tools / longContext / noHistory 等键，键集一致
- [x] 验证：check 0 错误；build 497 页（SSG 不减少）；en/zh-CN 随机页验证能力矩阵/价格历史/canonical/8×hreflang/SoftwareApplication×2/BreadcrumbList×1/Product×0 全通过

## Phase 9.4a — Benchmark 数据系统 ✅ 已完成（git: feat: add benchmark data system）

- [x] 迁移 0005：`benchmark_categories`（id/slug UNIQUE/name/description）+ `benchmark_results`（id/model_id FK/category_id FK/score/rank/dataset/version/source/tested_at，UNIQUE(model_id,category_id,dataset,version) + 索引 model/category/score）
- [x] Seed：4 类别（coding/reasoning/math/vision）+ 9 模型 28 条结果（每模型 ≥2，source=manual/dataset=internal-demo/version=v1，INSERT OR IGNORE 幂等；注释明确为示例/人工录入数据）
- [x] Worker API：`GET /api/models/:slug/benchmarks`（按 category 排序，返回 model + benchmarks[]；路由置于详情贪婪匹配之前，旧 API 兼容）
- [x] 文档：database-design.md（ER：models → benchmark_results → benchmark_categories）+ roadmap 标记完成
- [x] 验证：空库 0001-0005（9 表）/seed 4+28/重复 seed 幂等/外键 0/查询正常/UNIQUE 生效；worker typecheck、frontend check（0 错误）、build（497 页）、API 冒烟全通过

## Phase 9.4b — Benchmark 展示系统 ✅ 已完成（git: feat: add benchmark leaderboard and seo pages）

- [x] 导出扩展：export-models.mjs 新增 benchmarks[]（join benchmark_categories，按 category 排序，含 score/rank/dataset/version/source/testedAt）
- [x] Benchmark 库：src/lib/benchmark.ts（BENCHMARK_CATEGORIES + getBenchmarkLabel/getHighestScore/sortByBenchmarkScore/groupBenchmarks/overallScore，TS strict 无 any）
- [x] Leaderboard `/{lang}/leaderboard/`：Overall（平均分）表格 + `?benchmark=` 分类筛选（客户端排序）；Rank/Model/Provider/4 分类列；移动端横向滚动 + sticky header + 卡片模式；ItemList JSON-LD
- [x] Benchmark SEO 页 `/{lang}/benchmarks/` + `/{lang}/benchmarks/[category]/`（7×4=28 页）：Best AI Models for X Benchmark 排名表（Rank/Model/Provider/Score/Dataset/Version/Date）；CollectionPage JSON-LD
- [x] 详情页 Benchmark Results 区块（Benchmark/Score/Dataset/Version）；比较页 Benchmark Comparison（同 dataset+version 才比较，缺失 '—'）
- [x] i18n：leaderboard.* + benchmark.* 26 键 × 7 语言（键集一致）
- [x] 验证：check 0 errors；build 539 页（497+7+7+28）；SEO 产物全命中（leaderboard ItemList/benchmarks CollectionPage en+zh/compare/详情页）

## Phase 9.5 — AI Model Ranking 算法体系 ✅ 已完成（git: feat: add ai model ranking system）

- [x] 评分引擎：`worker/src/services/ranking.ts`（calculateFromData 纯函数 + calculateModelScore + rankModels，TS strict；公式权威定义 docs/ranking-design.md）
- [x] 评分公式：Overall = Benchmark×50% + Capability×20% + Price Efficiency×20% + Context×10%（全百分制，透明可解释）
- [x] Worker API：`GET /api/ranking?lang=&category=`（overall 默认 / best-value / 分类模式；rank 编号，camelCase breakdown）
- [x] SSG 导出：export-models.mjs 内置同公式（互引注释），model-catalog.json 新增 `ranking` 字段
- [x] 页面：`/{lang}/ranking/`（Rank/Model/Score/Benchmark/Price/Capability，移动端卡片+横向+sticky，CollectionPage+ItemList）+ `/{lang}/ranking/[mode]/`（coding/reasoning/best-value × 7 语言 = 21 页）
- [x] 详情页 Overall Ranking Card（5 卡片）；比较页 Ranking Comparison（Overall/Benchmark/Capability/Price/Context 五行）
- [x] i18n：ranking.* 17 键 × 7 语言（键集一致）
- [x] 验证：worker typecheck / check 0 errors / build 581 页 / API 冒烟（rankings 11 条降序、category=coding 模式）/ SEO 6/6（ranking 索引+分类+best-value en/zh、详情页、比较页）
- [x] 踩坑：Astro 中 getStaticPaths 引用的模块级 const 需 `export`（否则被编译闭包化报 ReferenceError）

## Phase 9.6 — Ranking 增强（趋势/快照/推荐） ✅ 已完成（git: feat: add ranking trend and recommendation system）

- [x] 迁移 0006：`ranking_snapshots`（model_id/mode/score/rank/snapshot_date，UNIQUE(model_id,mode,date) + 3 索引，FK CASCADE）
- [x] 快照服务：`worker/src/services/rankingSnapshot.ts`（createDailySnapshot：4 模式 × 11 模型 = 44 行/天，INSERT OR IGNORE 幂等）；Cron `0 2 * * *`（scheduled() 保留 01:00 新闻 + 02:00 快照）
- [x] Trend API：`GET /api/ranking/trend/:slug?mode=`（history 升序 + change{rank,score}，404 兜底）
- [x] 推荐引擎：`worker/src/services/recommendation.ts`（best-overall/value/coding/reasoning，全实时计算）+ `GET /api/recommendations`
- [x] SSG 导出：export-models.mjs 只读快照历史 → catalog.trend + rankingHistory（30 天）
- [x] 前端：Ranking 页趋势列（↑/↓/→ + Rank Change）；详情页 SVG 折线（30 天，无图表库）；Compare 页 Ranking Trend Comparison；`/{lang}/ranking/recommendations/` SEO 页（7 语言，CollectionPage+ItemList）
- [x] i18n：trend.* / snapshot.* / recommendation.* 24 键 × 7 语言（键集一致）
- [x] 文档：docs/ranking-trend-design.md；roadmap 标记完成
- [x] 验证：空库 0001-0006（10 表）/UNIQUE/FK/CASCADE；worker typecheck / check 0 errors / build 588 页；API 冒烟（trend 3 条 history+change、404、recommendations 4 项）；SEO 全命中（Rank Change/趋势符号/recommendations 页/详情页 polyline/compare 趋势）

## Phase 9.7 — v1.0 收尾（数据透明 + 合规 + 发布准备） ✅ 已完成（git: feat: prepare v1 launch with data transparency）

- [x] 迁移 0007：benchmark_results 加 source_url / source_type / verified_at / verification_status（默认 unverified，internal-demo 标记 source_type=internal）
- [x] 迁移 0008：pricing_history 加 source_url / verification_status（默认 unverified）
- [x] 迁移 0009：models 加 last_verified_at / data_status（默认 active）
- [x] Worker API：模型详情返回 lastVerifiedAt / dataStatus（旧字段完全兼容）
- [x] 前端：详情页 Data Status Card（Status + Last verified，i18n）；`/{lang}/data-policy/` 透明页（7 语言：Data Sources / Verification Status / Update Frequency / Transparency Statement，WebPage JSON-LD）
- [x] API 版本化：`/api/v1/*` 与 `/api/*` 等价（pathname 规范化复用同一 handler，旧 API 保留；3 组接口双版本 deepEqual 一致）
- [x] SEO：sitemap 含 models/compare/benchmark/ranking/recommendations/data-policy 全量；data-policy WebPage schema
- [x] 文档：docs/v1-launch-report.md（架构/数据库/API/SEO/性能/安全/数据透明/已知限制 + 上线前必做）
- [x] 验证：空库 0001-0009（10 表）/seed/幂等/FK/UNIQUE；worker typecheck / check 0 errors（35 files）/ build 596 HTML（595 页 + 404）；API 双版本一致；SEO 产物全命中
- [x] 踩坑：Astro 嵌套目录页（[lang]/data-policy/index.astro）import 需多一层 ../../../；API 版本剥离需 replace(/^\/api\/v1/, '/api') 保留 /api 前缀

## Phase 8 — 生产环境准备 ✅ 已完成（上线检查报告见 docs/launch-check-report.md）

- [x] Sitemap：`@astrojs/sitemap`（sitemap-index + sitemap-0，497 URL 全量 + hreflang alternates）
- [x] robots.txt（Allow 全部 + Sitemap 声明）；`_headers`（静态站安全头 + 缓存策略：_astro 1 年 immutable、HTML CDN 1h）
- [x] RSS：Worker `GET /rss.xml`（新闻 RSS 2.0 动态生成，来自 D1，安全头 + 缓存 300s）
- [x] 安全：Worker 响应统一安全头（nosniff/Referrer-Policy/X-Frame-Options）+ API 缓存 60s；外链 nofollow noopener；SQL 全 prepared statement
- [x] Open Graph / Schema.org 审查通过；新增 Twitter Card
- [x] GitHub Actions `.github/workflows/deploy.yml`：push main → CI → 构建（D1 seed+export）→ Pages + Worker 部署 → 远程 D1 迁移/seed；Secrets 文档化
- [x] 验证：check 0 错误；build 497 页；RSS/安全头实测生效

## Phase 1（已完成）— 项目基础架构

- [x] pnpm workspace monorepo：`frontend/` + `worker/` + `database/` + `docs/`
- [x] Frontend：Astro 7 + TypeScript(strict) + Tailwind CSS v4 + React 集成
- [x] i18n 基础：7 语言路由（`/en/ /zh-CN/ /ja/ /ko/ /es/ /de/ /fr/`），默认 en，fallback 机制，语言切换器
- [x] Worker：Cloudflare Worker 骨架（健康检查 + D1 绑定占位）
- [x] Database：D1 schema 目录与说明
- [x] Docs：architecture / roadmap / database-design

## Phase 2 — 完整国际化系统（i18n + SEO 基础）✅ 已完成

- [x] UI 文案全部迁移至 7 个 JSON 语言文件（`frontend/src/i18n/translations/`），编译期键一致性约束
- [x] 自动语言识别（`auto-locale.ts`）：navigator.language 匹配 + 手动偏好(localStorage)优先，内联脚本无 FOUC
- [x] 语言切换体验完善：路径翻译切换、当前语言高亮、无障碍（aria-label/当前语言提示）、偏好记忆
- [x] SEO 组件结构（`src/components/seo/SEO.astro`）：canonical / 全语言 hreflang + x-default / OG / JSON-LD 插槽
- [x] metadata 多语言（title/description/og:locale 等随语言切换）
- [x] 页面 layout 规范化（BaseLayout 统一 head + 导航 + 页脚）
- [ ] 后续：sitemap / robots.txt（随 Phase 8 SEO 打磨落地）

## Phase 3a — 模型数据系统（D1）✅ 已完成

- [x] `database/schema/schema.sql`：最新全量 schema（providers / models / model_translations / pricing / news + 索引 + 外键）
- [x] `database/migrations/0001_init.sql`：初始迁移（wrangler d1 migrations 标准格式）
- [x] `database/seed/seed.sql`：种子数据（OpenAI / Anthropic / Google / DeepSeek，11 个模型 + 22 条多语言翻译 + 11 条定价 + 4 条资讯；幂等可重复执行）
- [x] wrangler.toml 配置 `migrations_dir`；docs/database-design.md 与落地对齐
- [x] SQLite 实测：语法/外键/翻译覆盖/幂等性全部通过

## Phase 4 — Model Database 页面 ✅ 已完成（数据 100% 来自 D1，无 mock）

- [x] Worker API：`GET /api/models`（search 模糊匹配 / sort 白名单排序）+ `GET /api/models/:slug`（详情），实时查询 D1，CORS
- [x] 本地 D1 链路：`wrangler d1 migrations apply --local` + seed（4 供应商 / 11 模型 / 22 翻译 / 11 定价）
- [x] 列表页 `/{lang}/models/`：React Island（搜索防抖、价格/名称/上下文排序、loading/error/empty 三态）
- [x] 详情页 `/{lang}/models/[...slug]/`：SSG 91 页（构建期 `scripts/export-models.mjs` 从本地 D1 导出，非 mock），展示名称/Provider/Context/价格/支持语言/描述/用途 + JSON-LD(Product)
- [x] 7 语言文案扩展（models.* 26 键，键集编译期一致校验）
- [x] 验证：astro check 0 错误；build 91 页；API 联调（搜索/排序/详情/404）；preview 页面渲染 200

## Phase 5 — Token Calculator ✅ 已完成（token 计数 + 成本估算合并交付）

- [x] 可插拔 tokenizer 注册表（`src/lib/tokenizer/registry.ts`）：GPT 系列 → OpenAI tiktoken 真实 tokenizer（o200k_base，动态懒加载）；Claude/Gemini/DeepSeek → 启发式估算（CJK 1.6 字符/token、其他 4 字符/token）
- [x] 页面 `/{lang}/calculator/token/`：TokenInput（文本 + 4 系列选择）/ TokenResult（Token 数 + 字符数）/ CostComparison（4 模型成本对比，按成本排序）
- [x] 成本数据来自 D1（Worker /api/models 价格），成本 = tokens × 价格 / 1M
- [x] 移动端适配（textarea 全宽、系列选择 2 列→4 列、对比表横向滚动）
- [x] 7 语言文案扩展（token.* 24 键）
- [x] 验证：纯函数 node 实测（估算与 tiktoken 偏差 ≤1）；check 0 错误；build 98 页；preview + API 联调 200

## Phase 6 — 模型比较 ✅ 已完成（选择页 + SSG 对比页 + JSON-LD）

- [x] 选择页 `/{lang}/compare/`：Model A/B 双下拉（选项来自 D1 导出的 catalog，静态渲染），选择后跳转规范比较 URL
- [x] 比较页 `/{lang}/compare/{a}-vs-{b}/`：SSG 385 页（7 语言 × 55 对），对比价格/Context/Provider/发布日期/适合场景
- [x] URL 规范：slug 中 `/`→`_` 编码，模型按字典序排序（同对唯一 URL，避免 SEO 重复内容）
- [x] JSON-LD：`@graph` 两个 schema.org Product（含价格），Google 结构化数据友好
- [x] 7 语言文案扩展（compare.* 18 键）
- [x] 验证：check 0 错误；build 490 页；preview 冒烟（选择页/对比页 200、非法 pair 404、8×hreflang）

## Phase 7 — AI 行业资讯

- [ ] Worker 路由：/api/news（列表/详情，按语言）
- [ ] 资讯页：列表 + 标签过滤，预留 RSS 聚合

## Phase 7 — AI 行业资讯 ✅ 已完成（News Collector Service + Cron + 列表页）

- [x] News Collector Service（worker/src/collector/）：5 大来源 RSS 抓取 → 摘要（≤240 字符，不复制全文）→ 关键词分类 → 按 (source, link) 去重写入 D1
- [x] 来源：OpenAI / Google AI 实测可用；Anthropic 无官方 RSS（enabled=false 待接入自建 RSSHub）；Meta AI / Hugging Face 生产（Cloudflare 边缘）可用，本机网络受限
- [x] 定时任务：wrangler.toml `[triggers] crons = ["0 1 * * *"]`（每天 01:00 UTC）+ scheduled handler；手动触发 `GET /api/news/refresh`
- [x] API：`GET /api/news?lang=&category=`（语言/分类筛选，倒序）
- [x] 迁移 0002：news 表新增 category/link；seed 更新
- [x] 前端 `/{lang}/news/`：NewsFeed 岛组件（分类 chips 筛选 + 语言 badge + 三态 + 移动端适配）
- [x] 验证：collector 实测入库 20 条且幂等（重跑 added=0）；check 0 错误；build 497 页；preview + API 联调

## Phase 9 — 全球化收尾（下一个）

- [ ] 本地化 QA（文案、日期/数字格式）
- [ ] 隐私友好统计、反馈通道
- [ ] v1.0 发布
