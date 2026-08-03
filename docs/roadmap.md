# Roadmap

AI Model Intelligence Platform 的阶段化开发路线图。每个阶段完成后输出：完成内容总结 / 修改文件清单 / 运行测试方法，并等待下一阶段指令。

## 阶段总览

| Phase | 名称 | 状态 |
| --- | --- | --- |
| 1 | 项目基础架构（monorepo / frontend / worker / database / docs） | ✅ 已完成 |
| 2 | i18n 壳 + UI 基础（布局、导航、语言切换、SEO 基础） | ⬜ 待开发 |
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

## Phase 2 — i18n 壳 + UI 基础（下一个）

- [ ] 全局布局完善（Header/Footer/导航）
- [ ] 7 语言 UI 文案字典补齐（按模块拆分）
- [ ] SEO 基础：hreflang / sitemap / robots.txt / OG / canonical
- [ ] 设计令牌（design tokens）与组件库基础

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
