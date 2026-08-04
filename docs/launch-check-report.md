# 上线检查报告（Launch Checklist）

> 生成时间：2026-08-04 ｜ 项目：ai-model-platform ｜ Phase 8 交付
> 结论：**代码/配置层面已就绪，可进入真实部署**；上线前需完成"上线前必做清单"（见 §6）。

## 1. SEO 检查

| 检查项 | 状态 | 说明 |
| --- | --- | --- |
| Sitemap | ✅ | `@astrojs/sitemap` 集成：`sitemap-index.xml` + `sitemap-0.xml`，**497 个 URL** 全覆盖；每条 URL 带 **hreflang alternates**（7 语言） |
| robots.txt | ✅ | `public/robots.txt`：Allow 全部 + Sitemap 声明（域名占位，待替换） |
| 页面 hreflang | ✅ | 每页输出 7 语言 `<link rel="alternate">` + `x-default`（Phase 2 起） |
| Canonical | ✅ | 每页 canonical 指向当前语言版本（SEO 组件统一输出） |
| Open Graph | ✅ | og:type/locale/url/site_name/title/description（+ 可选 og:image） |
| Twitter Card | ✅ | 本轮新增 `twitter:card=summary` + title/description/image |
| Schema.org（JSON-LD） | ✅ | 模型详情页：`Product`+`Offer`；比较页：`@graph` 双 `Product` |
| 多语言 URL 结构 | ✅ | `/en/ /zh-CN/ …` 前缀 + 默认语言 301 |
| **待办** | ⚠️ | ① 替换占位域名 `ai-model-platform.example.com`（astro.config.ts、robots.txt）；② 上线后用 Google Search Console 提交 sitemap；③ 建议补默认 `og:image`（1200×630 品牌图） |

## 2. 性能检查

| 检查项 | 状态 | 说明 |
| --- | --- | --- |
| 构建产物 | ✅ | 497 静态页，SSG 优先（首屏无服务端依赖） |
| 资源缓存 | ✅ | `_headers`：`/_astro/*` 长缓存（1 年 immutable）、页面 HTML CDN 缓存 1h |
| JS 按需加载 | ✅ | 交互页为 Astro Island（仅加载用到的 React chunk）；tiktoken（5.6MB WASM）仅在 Token 计算器选 GPT 时懒加载 |
| API 缓存 | ✅ | Worker GET 接口 `Cache-Control: public, max-age=60` |
| 渲染模式 | ✅ | 全部页面静态渲染，无阻塞脚本（除首屏 island） |
| **建议** | ⚠️ | ① 上线后跑 Lighthouse（移动端/桌面）并优化 score；② 模型详情/比较页为纯静态，可预判性能良好；③ 考虑为 `og:image` 等图片资源做格式优化 |

## 3. 安全检查

| 检查项 | 状态 | 说明 |
| --- | --- | --- |
| 静态站响应头 | ✅ | `_headers`：X-Content-Type-Options: nosniff / Referrer-Policy / X-Frame-Options: DENY / Permissions-Policy（禁摄像头/麦克风/定位） |
| API 响应头 | ✅ | Worker 统一附加安全头 + CORS（只读 GET，`Access-Control-Allow-Origin: *` 符合公开数据定位） |
| 外链安全 | ✅ | 新闻"阅读原文"链接 `target="_blank" rel="noopener noreferrer nofollow"` |
| SQL 注入防护 | ✅ | 全部 D1 查询使用 prepared statement + bind；排序白名单（防 ORDER BY 注入） |
| XSS 防护 | ✅ | 文案全部走 i18n 字典；用户输入仅存在于文本域（无渲染）；RSS XML 输出做实体转义 |
| 定时任务 | ✅ | Cron 仅触发内部采集函数（无外部可控参数） |
| **建议** | ⚠️ | ① `Access-Control-Allow-Origin: *` 可评估收紧为具体域名（如需）；② 未来如增加写接口（反馈等）需加鉴权/限流 |

## 4. Cloudflare 配置检查

| 项 | 状态 | 说明 |
| --- | --- | --- |
| Worker 配置 | ✅ | `wrangler.toml`：D1 绑定（migrations_dir 正确）、Cron `0 1 * * *`（每日 01:00 UTC 新闻采集） |
| 迁移体系 | ✅ | `database/migrations/` 0001（表结构）、0002（news category/link）；`schema.sql` 为最新全量 |
| Seed 幂等 | ✅ | `INSERT OR IGNORE`，可安全重复执行 |
| 本地链路 | ✅ | `wrangler d1 migrations apply --local` + seed + `export-models`（构建期数据源） |
| **上线前必做** | ⚠️ | ① `npx wrangler d1 create ai-model-platform-db` 获取真实 `database_id` 并填入 `wrangler.toml`（Actions 中由 `D1_DATABASE_ID` secret 注入）；② 创建 Pages 项目 `ai-model-platform`；③ Worker 部署后确认 Cron 生效（Dashboard → Workers → Triggers） |

## 5. 部署（GitHub Actions 自动部署）

文件：`.github/workflows/deploy.yml` —— **push main 自动触发**（支持手动 `workflow_dispatch`）

```
push main → install → typecheck → 本地 D1 migrate+seed → build（含数据导出）
         → Pages 部署（静态站点）→ Worker 部署（API+Cron）
         → 远程 D1 迁移 + seed（幂等）
```

需要配置的 GitHub Secrets：

| Secret | 值来源 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare 创建 API Token（权限：Workers Scripts Edit / Pages Edit / D1 Edit） |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → 右下角账户 ID |
| `D1_DATABASE_ID` | `npx wrangler d1 create ai-model-platform-db` 的输出 |

## 6. 上线前必做清单（按顺序）

- [ ] 1. 确定正式域名，更新 `frontend/astro.config.ts` 的 `SITE_URL` 与 `frontend/public/robots.txt`
- [ ] 2. `npx wrangler d1 create ai-model-platform-db`（在 worker/ 目录）→ 记下 database_id
- [ ] 3. GitHub 仓库添加 3 个 Secrets（见 §5）
- [ ] 4. 创建 Pages 项目：`npx wrangler pages project create ai-model-platform`（或 Dashboard）
- [ ] 5. push main → 观察 Actions 绿色通过 → 访问 Pages 域名 + Worker 域名验证
- [ ] 6. 验证 Cron：Dashboard → Worker → Triggers 查看定时任务；手动 `POST /__scheduled?cron=0+1+*+*+*` 测试采集
- [ ] 7. Google Search Console 提交 sitemap；Bing Webmaster 同步
- [ ] 8. 跑 Lighthouse（移动/桌面）记录基线分数
- [ ] 9. 建议补默认 `og:image` 品牌图

## 7. 交付时验证摘要（本轮实测）

- [x] `astro check`：0 errors（26 文件）；`astro build`：497 页成功
- [x] sitemap-index.xml + sitemap-0.xml（497 URL + hreflang）已生成；robots.txt / _headers 已随构建输出
- [x] Worker typecheck 通过；`GET /rss.xml` 返回 RSS 2.0（含新闻条目、`application/rss+xml`、安全头）
- [x] API 安全头实测：nosniff / Referrer-Policy / X-Frame-Options / CORS / Cache-Control 全部生效
- [x] twitter:card 随页面输出
