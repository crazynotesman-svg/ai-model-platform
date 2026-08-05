# AI Model Platform — v1.0 发布报告（Launch Report）

> 生成时间：2026-08-04 ｜ 阶段：Phase 9.7（v1.0 收尾）｜ **已于 2026-08-05 正式上线（tag v1.0.0）**

## 上线结果（2026-08-05，Phase 10）

- **前端**：https://ai-model-platform-my5.pages.dev（Cloudflare Pages 原生集成，596 HTML，12/12 冒烟通过）
- **API**：https://ai-model-platform-api.crazynotesman.workers.dev（11/11 接口通过，含 /api/v1/*）
- **数据库**：生产 D1 `ai-model-platform-db`（9 迁移 + seed-production：11 模型/63 能力/11 价格历史；benchmark/news 均为 0，demo 不导入）
- **CI/CD**：GitHub Actions `deploy-worker.yml` 全链路成功（migrations→seed→typecheck→deploy→smoke），secrets：CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID
- **发布**：commit `12db5cf` + tag `v1.0.0` + CHANGELOG.md
- **CI 适配**：export-models.mjs CI 回退模式（无本地 D1 时用已提交 catalog）；generated/ 提交进仓库

## Architecture

- **Monorepo**（pnpm workspace）：`frontend/`（Astro 7 SSG + React Islands + Tailwind v4）+ `worker/`（Cloudflare Workers + D1）+ `database/` + `docs/`
- **7 语言 i18n**：en（默认）/ zh-CN / ja / ko / es / de / fr（URL 前缀 + hreflang + fallback）
- **双层数据**：content 生成（构建期 D1 → model-catalog.json → SSG 静态页）+ 动态 API（Worker + D1）
- **部署**：GitHub Actions → Cloudflare Pages（静态）+ Worker（API + Cron）+ 远程 D1 迁移/seed

## Database（D1，10 表 / 9 迁移）

| 表 | 说明 |
| --- | --- |
| providers / models / model_translations | 模型目录 + 多语言 |
| pricing / pricing_history | 当前定价 + 历史（来源/核验字段） |
| model_capabilities | 能力（7 类） |
| benchmark_categories / benchmark_results | 基准分类 + 结果（来源/核验字段） |
| news | AI 资讯 |
| ranking_snapshots | 每日排名快照（趋势） |

全部迁移幂等；外键 + UNIQUE 约束 + 索引齐全。

## API（Worker，`/api/*` 与 `/api/v1/*` 等价）

- `GET /api/models` / `/:slug` / `/:slug/benchmarks` / `/:slug/pricing-history`
- `GET /api/ranking`（?category=）、`/api/ranking/trend/:slug`、`/api/recommendations`
- `GET /api/news`（?lang/category）、`/api/news/refresh`、`/rss.xml`、`/api/health`
- Cron：01:00 新闻采集；02:00 排名快照
- 安全：CORS 只读 + 安全头 + 参数白名单 + prepared statement

## SEO

- **595+ 静态页**：首页 / 模型库 77 页（列表+详情×7 语言） / 比较页（55 对×7） / Token 计算器 / 资讯 / Leaderboard / Benchmarks（4×7） / Ranking（索引 + 4 模式×7 + 推荐×7） / Data Policy（7）
- Sitemap（全量 + hreflang alternates）、robots.txt、canonical、hreflang（7 + x-default）
- JSON-LD：SoftwareApplication（详情/比较）、BreadcrumbList（比较）、ItemList/CollectionPage（排行榜/基准/推荐）、WebPage（Data Policy）
- RSS feed（/rss.xml）

## Performance

- SSG 全静态（首屏零 API 依赖）；`/_astro/*` 一年 immutable 缓存；页面 CDN 缓存 1h；API 60s 缓存
- tiktoken WASM 懒加载；图表为轻量内联 SVG（无大型图表库）
- 构建产物约 600 页，构建时间 ~35s

## Security

- 安全头（nosniff / Referrer-Policy / X-Frame-Options / Permissions-Policy）；外链 noopener nofollow
- 无写接口（公开只读）；Cron 仅内部采集；SQL 全 prepared + 白名单排序
- 无用户系统/登录/支付（v2 范围）

## Data Transparency（数据可信度）

| 数据 | 状态 |
| --- | --- |
| 模型信息（名称/上下文/日期） | verified（人工维护，来源官方文档）；`dataStatus=active` |
| 价格 | manual（来源官方定价页，待补 source_url）；pricing_history `unverified` |
| **Benchmark** | **demo / manual**（dataset=internal-demo，source_type=internal，**verification_status=unverified**）⚠️ |
| Ranking | 实时计算（透明公式，见 ranking-design.md）；快照每日 Cron |
| 资讯 | API 自动采集（每日） |

透明声明页：`/{lang}/data-policy/`（Data Sources / Verification Status / Update Frequency / Transparency Statement）。

## Known Limitations（已知限制）

1. **Benchmark 为示例数据**：上线前必须替换为官方基准（HumanEval/MMLU/MMMU 等）实测数据并置为 verified；当前 Ranking 的 Benchmark 分量基于 demo 数据
2. 域名为占位（`ai-model-platform.example.com`），上线前替换 astro.config.ts + robots.txt
3. pricing_history / source_url 多为 NULL，需人工/API 补录来源链接
4. max_input_price 为库内相对值（排名随库内模型变化）
5. 无用户系统、登录、付费（v2 规划）；无自动 benchmark pipeline
6. 快照历史自首个 Cron 起累积（初期趋势显示 →）

## 上线前必做（承接 Phase 8 checklist）

- [ ] 替换正式域名；[ ] d1 create + secrets 配置；[ ] Pages 项目创建；[ ] push main 自动部署
- [ ] 用官方 benchmark 数据替换 demo 数据并置 verified；[ ] GSC/Bing 提交 sitemap；[ ] Lighthouse 基线
