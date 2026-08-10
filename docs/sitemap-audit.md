# Sitemap Audit

- **Date**: 2026-08-10
- **URL**: https://aimodel.100ideas.net/sitemap-index.xml

## 结果

| 检查项 | 结果 |
| --- | --- |
| HTTP status | **200 OK** |
| XML 格式 | ✅ 合法（`<?xml version="1.0" encoding="UTF-8"?>`，content-type: application/xml） |
| sitemap 文件数量 | **1**（sitemap-index.xml → sitemap-0.xml） |
| 总 URL 数 | **8,715**（与构建页数 8,716 − 404 页一致） |
| 页面类型覆盖 | models ✅ / compare ✅（8,239）/ benchmarks ✅ / ranking ✅ / recommendations（/ranking/recommendations/）✅ / data-policy ✅ / news ✅ / calculator ✅ |
| 域名 | 🔴 **全部为旧域名 `ai-model-platform-my5.pages.dev`** |

## 示例 URL

- https://ai-model-platform-my5.pages.dev/de/
- https://ai-model-platform-my5.pages.dev/en/models/openai/gpt-4o/
- https://ai-model-platform-my5.pages.dev/zh-CN/ranking/vision/
- https://ai-model-platform-my5.pages.dev/en/ranking/recommendations/

## hreflang

- sitemap 中不包含 hreflang（sitemap 协议规范不支持；hreflang 位于页面 HTML `<link rel="alternate">`，每页 8 组：7 语言 + x-default）✅

## Issues

- 🔴 **P0**：sitemap 所有 URL 指向 pages.dev 旧域名 → 需切换为 `https://aimodel.100ideas.net`
- ⚠️ `/en/recommendations/` 独立路径不存在（推荐功能实际位于 `/ranking/recommendations/`，已在 sitemap）
