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
| 8 | SEO/性能打磨 + GitHub Actions 自动部署 | ⬜ 待开发 |
| 9 | 全球化收尾（本地化 QA、隐私友好统计、反馈通道） | ⬜ 待开发 |

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

## Phase 8 — SEO/性能打磨 + 自动部署

- [ ] Lighthouse 优化、sitemap 全量、结构化数据审查
- [ ] GitHub Actions：CI（check + lint + test）→ Pages 发布 + Workers 部署

## Phase 9 — 全球化收尾

- [ ] 本地化 QA（文案、日期/数字格式）
- [ ] 隐私友好统计、反馈通道
- [ ] v1.0 发布
