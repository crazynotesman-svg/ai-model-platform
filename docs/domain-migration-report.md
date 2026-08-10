# Domain Migration Report

- **Date**: 2026-08-10
- **Old domain**: `https://ai-model-platform-my5.pages.dev`
- **New domain**: `https://aimodel.100ideas.net`

## Changed Files

| 文件 | 改动 | 用途 |
| --- | --- | --- |
| `frontend/astro.config.ts` | `SITE_URL` 硬编码 pages.dev → 环境变量 `PUBLIC_SITE_URL ?? 'http://localhost:4321'` | canonical / hreflang / og:url / sitemap 全站基准 URL |
| `frontend/public/robots.txt` | `Sitemap:` 指向 `https://aimodel.100ideas.net/sitemap-index.xml` | robots Sitemap 声明 |
| Cloudflare Pages env_vars | production + preview 添加 `PUBLIC_SITE_URL=https://aimodel.100ideas.net`（保留 PUBLIC_API_BASE） | 生产/预览构建注入站点根 URL |

> 本地开发：无 PUBLIC_SITE_URL 时默认 `http://localhost:4321`，不污染生产 SEO 信号。

## Build Result

- `astro check`: **0 errors** ✅
- `astro build`: **success**（16m50s，8716 页，页数未减少）✅
- 构建时注入 `PUBLIC_SITE_URL=https://aimodel.100ideas.net`

## Production Verification

### Before（Phase 10.1 审计）
- canonical → `https://ai-model-platform-my5.pages.dev/...`
- hreflang（8 组）→ pages.dev
- og:url → pages.dev
- sitemap（8,715 URL）→ pages.dev
- robots.txt Sitemap → pages.dev

### After（部署 283b7a2 后线上实测）
| 检查项 | 结果 |
| --- | --- |
| `https://aimodel.100ideas.net/sitemap-index.xml` | ✅ 200 → `https://aimodel.100ideas.net/sitemap-0.xml` |
| `https://aimodel.100ideas.net/sitemap-0.xml` | ✅ 8,715 URLs，全部 `aimodel.100ideas.net`，零 pages.dev |
| 首页 `/en/` canonical / og:url | ✅ `https://aimodel.100ideas.net/en/` |
| 模型页 `/en/models/openai/gpt-4o/` canonical | ✅ `https://aimodel.100ideas.net/en/models/openai/gpt-4o/` |
| 比较页 canonical | ✅ `https://aimodel.100ideas.net/en/compare/.../` |
| Ranking canonical | ✅ `https://aimodel.100ideas.net/en/ranking/` |
| hreflang（8 组）host | ✅ 全部 `https://aimodel.100ideas.net` |
| 页面 HTML 残留 pages.dev | ✅ 无 |
| robots.txt 源文件 | ✅ `Sitemap: https://aimodel.100ideas.net/sitemap-index.xml`（⚠️ 边缘缓存 max-age=86400，线上自动刷新 ≤24h，绕过缓存 `?v=` 验证已为新内容） |

## Commit

- `283b7a2 fix: migrate seo canonical to production domain`
- CI/Pages 部署 success（domains: ai-model-platform-my5.pages.dev, aimodel.100ideas.net）

## Notes

- P0 已全部解决：canonical / hreflang / og:url / sitemap 已切换生产域名。
- robots.txt 因 Cloudflare 边缘缓存（1 天）在线上暂显旧值，源文件已正确，24h 内自动生效；如需立即生效可清除 Cloudflare 缓存。
- P1/P2（og:image、schema 升级、recommendations 路径）按阶段要求未处理，留待后续。
