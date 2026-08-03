# Roadmap

AI Model Intelligence Platform 的阶段化开发路线图。每个阶段完成后输出：完成内容总结 / 修改文件清单 / 运行测试方法，并等待下一阶段指令。

## 阶段总览

| Phase | 名称 | 状态 |
| --- | --- | --- |
| 1 | 项目基础架构（monorepo / frontend / worker / database / docs） | ✅ 已完成 |
| 2 | 完整国际化系统（JSON 文案 / 自动识别 / 切换体验 / SEO 组件 / hreflang） | ✅ 已完成 |
| 3 | 模型目录（content schema + 种子数据 + 列表/详情页） | ⬜ 待开发 |
| 4 | Token 计数工具（可插拔 tokenizer + UI + 测试） | ⬜ 待开发 |
| 5 | 成本估算 + 价格对比 | ⬜ 待开发 |
| 6 | Workers API + D1 落地（模型/价格接口 + seed/迁移） | ⬜ 待开发 |
| 7 | AI 行业资讯（内容集合 + 标签 + RSS 扩展） | ⬜ 待开发 |
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

## Phase 3 — 模型目录

- [ ] content collection schema（zod）：模型元信息、能力、上下文窗口等
- [ ] 种子数据（首批 30+ 主流模型，多供应商）
- [ ] 模型列表页 + 详情页（全语言），JSON-LD 结构化数据

## Phase 4 — Token 计数

- [ ] 可插拔 tokenizer 注册表（js-tiktoken 等 + 启发式回退）
- [ ] Token 计数 UI（React Island）
- [ ] 单元测试

## Phase 5 — 成本估算 + 价格对比

- [ ] 统一价格模型（每 1M tokens input/output + 多级定价）
- [ ] ���本估算器 UI + 多模型对比

## Phase 6 — Workers API + D1 落地

- [ ] Worker 路由：/api/models、/api/pricing、/api/token-count、/api/cost-estimate
- [ ] D1 migrations + seed 脚本（与 content collections 口径一致）

## Phase 7 — AI 行业资讯

- [ ] 资讯内容集合（标题/摘要/标签/原文链接/语言）
- [ ] 资讯列表页 + 标签过滤，预留 RSS 聚合

## Phase 8 — SEO/性能打磨 + 自动部署

- [ ] Lighthouse 优化、sitemap 全量、结构化数据审查
- [ ] GitHub Actions：CI（check + lint + test）→ Pages 发布 + Workers 部署

## Phase 9 — 全球化收尾

- [ ] 本地化 QA（文案、日期/数字格式）
- [ ] 隐私友好统计、反馈通道
- [ ] v1.0 发布
