# Robots Audit

- **Date**: 2026-08-10
- **URL**: https://aimodel.100ideas.net/robots.txt

## 结果

```text
# robots.txt —— AI Model Intelligence Platform

User-agent: *
Allow: /

Sitemap: https://ai-model-platform-my5.pages.dev/sitemap-index.xml
```

| 检查项 | 结果 |
| --- | --- |
| HTTP status | **200 OK** |
| `User-agent: *` | ✅ |
| `Allow: /` | ✅（全站允许爬取） |
| Sitemap 声明 | ⚠️ 存在，但**指向旧域名 pages.dev** |
| 阻止重要路径 | ✅ 无 Disallow，models/compare/ranking/benchmarks/news 等均未被阻止 |
| 错误 Disallow | ✅ 无 |

## Issues

- 🔴 **P0**：`Sitemap:` 声明为 `https://ai-model-platform-my5.pages.dev/sitemap-index.xml`，需改为 `https://aimodel.100ideas.net/sitemap-index.xml`（与 canonical/sitemap 域名切换一并修复）
