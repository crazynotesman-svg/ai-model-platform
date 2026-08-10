# SEO Monitoring Plan（Google 收录监控方案）

- **Date**: 2026-08-10
- **Domain**: https://aimodel.100ideas.net
- **关联**: Phase 11.1（监控基础）｜ docs/phase-11.1-seo-monitoring-report.md

## 1. Google Search Console 指标

### 核心指标（每周查看「效果」与「索引编制」）

| 指标 | 来源 | 关注点 |
| --- | --- | --- |
| Indexed pages | 索引编制 | 目标 ≥ 8,000（sitemap 8,715 的 90%+） |
| Excluded pages | 索引编制 | 关注原因：404/crawled-not-indexed 占比 |
| Coverage errors | 索引编制 | 必须 = 0 或说明原因（软 404 类） |
| Sitemap status | Sitemaps | 必须显示「成功」，URL 数 8,715 |
| Search impressions | 效果 | 周环比 |
| Clicks | 效果 | 周环比 |
| CTR | 效果 | 与行业对比（低 CTR 页面 → title/desc 优化） |
| Average position | 效果 | 核心词目标前 20 |

### 工具
- Google Search Console（https://search.google.com/search-console）Domain Property：`aimodel.100ideas.net`
- Cloudflare Web Analytics（可选）：实时 PV/UV（无 cookie）

## 2. 重点监控 URL

### Tier 1（核心路径，7 语言中至少监控 en + zh-CN）
- https://aimodel.100ideas.net/
- https://aimodel.100ideas.net/en/
- https://aimodel.100ideas.net/en/models/
- https://aimodel.100ideas.net/en/compare/
- https://aimodel.100ideas.net/en/ranking/
- https://aimodel.100ideas.net/en/benchmarks/
- https://aimodel.100ideas.net/en/news/

### Tier 2（高价值模型页）
- https://aimodel.100ideas.net/en/models/openai/gpt-4o/
- https://aimodel.100ideas.net/en/models/anthropic/claude-sonnet-4/
- https://aimodel.100ideas.net/en/models/google/gemini-2.5-pro/

> 方法：在 Search Console「效果」中筛选 URL 前缀监控以上路径的 impressions/clicks/position 变化。

## 3. 每周 SEO 检查流程（~15 分钟）

1. **运行健康检查脚本**：`node frontend/scripts/seo-health-check.mjs`（robots/sitemap/10 页抽查）→ 全部 PASS
2. **Search Console「索引编制」**：Indexed pages 变化、Coverage errors = 0、Sitemap 状态成功
3. **Search Console「效果」**：Tier 1/2 URL 的 impressions/clicks/CTR/position 环比（记录在周报）
4. **抽查 3 个新增/修改页面**：canonical / hreflang / og:image / JSON-LD（健康脚本已覆盖）
5. **异常处理**：Indexed 骤降 → 检查 noindex 误加/robots；Coverage errors → 修复后重新提交 sitemap
6. **记录**：每周结果追加到 `docs/seo-weekly-logs.md`（后续阶段建立）

## 4. 触发条件（非每周例行）

- 部署新功能页（如 v2 用户页）→ 提交 sitemap + 健康检查
- 模型库变更（新增/下架模型）→ 验证详情页 404 正确处理
- Google 算法/收录异常 → 立即全量健康检查 + GSC 报表导出
