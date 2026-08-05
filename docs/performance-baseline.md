# Performance Baseline（v1.0.0 上线基线）

> 生成：2026-08-05（线上实测）｜ 站点：https://ai-model-platform-my5.pages.dev

## 线上实测（Cloudflare 边缘）

| 指标 | 值 | 说明 |
| --- | --- | --- |
| 首页 TTFB（冷） | ~253ms | pages.dev 边缘响应（实测单次） |
| 首页 HTTP 状态 | 200（`/` 301 → `/en/`） | 根路径重定向默认语言 |
| 页面总量 | 596 HTML（595 页 + 404） | SSG 全静态 |
| 构建时间 | ~35s（本地）/ ~4min（Pages CI） | pnpm build |
| 产物大小（Worker） | 167.5 KiB 上传 / 43.8 KiB gzip | wrangler deploy 输出 |
| API 响应（生产） | 全部 <100ms（首字节） | D1 查询亚毫秒（sql_duration ~0.4ms） |

## 架构性能特性

- **SSG 优先**：所有 SEO 页面构建期生成，首屏零 API 依赖；静态资源走 CDN 边缘缓存
- **缓存**：`/_astro/*` 一年 immutable；页面缓存 1h；API 60s（CORS 可缓存）
- **轻量交互**：React Island 按需 hydrate；tiktoken WASM 懒加载；图表为内联 SVG（无大型图表库）
- **D1**：索引齐全（模型/价格/能力/基准/快照），单查询 <1ms

## 建议优化（后续迭代）

1. **Lighthouse 完整跑分**：需在部署环境（或本地 Chrome）运行，记录 Performance/SEO/Accessibility/Best Practices 四项基线
2. **CSP**：当前未启用 Content-Security-Policy（静态页含内联 JSON-LD）；如需加固可改为 nonce/hash 方案
3. **图片**：当前站点几乎无图片资源；未来若加图需 WebP/AVIF + 尺寸优化
4. **预渲染头条**：首页/模型列表可尝试 `prerender` + 边缘缓存提升 TTFB

## 备注

- 本基线为上线快照；每次大版本发布后应更新
- 自定义域名绑定后 canonical 切换，不影响性能基线
