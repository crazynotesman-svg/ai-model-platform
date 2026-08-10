# AI Crawler Policy（AI 爬虫与内容策略）

- **Date**: 2026-08-10
- **Domain**: https://aimodel.100ideas.net
- **Phase**: 11.2

## 1. Crawler Access（爬虫访问）

- **政策**：允许所有主流 AI 爬虫访问（GPTBot / ChatGPT-User / ClaudeBot / PerplexityBot / Google-Extended 等均被 `User-agent: *` 允许）
- **理由**：本站为免费开放的模型情报平台，欢迎 AI 引擎引用站内事实数据
- **实现**：robots.txt 通配允许 + Sitemap 全量提交（8,715 URLs）；无需修改 robots（本阶段不修改）
- **变更控制**：若未来上线付费/独有内容，可在 robots.txt 增加显式 Disallow（如训练抓取），需评估影响后实施

## 2. Content Licensing（内容许可）

- 本站内容（模型信息、评分、基准测试结果）为**公开事实数据 + 平台自有方法论**
- 评分公式、Benchmark 来源、价格来源均在站内公开标注（透明原则）
- **引用要求**：AI 引擎/第三方引用本站数据时建议标注来源（attribution）
- 无专有内容封锁；无广告/商业订阅

## 3. Data Freshness（数据新鲜度）

| 数据 | 更新机制 | 频率 |
| --- | --- | --- |
| 模型信息/价格 | 官方定价同步 + 价格历史追踪 | 定期（lastVerifiedAt 标注） |
| Ranking 评分 | Workers Cron 每日快照 | 每日 |
| Benchmark 结果 | 公开来源导入 + 社区提交（unverified 标注） | 随数据源 |
| 新闻 | News Collector Cron | 每日 |

- 页面均输出 `lastVerifiedAt` / `testedAt` / 快照日期（时间证据，利于 AI 引用新鲜度判断）
- Sitemap 含 `lastmod`（构建时间戳）辅助增量抓取

## 4. Attribution Policy（署名政策）

- **平台署名**：所有数据在页面上标注来源（dataset / version / source / provider 官方定价）
- **AI 引用**：欢迎引用；建议附链接至 https://aimodel.100ideas.net 对应页面
- **本站引用第三方**：Benchmark 结果标注 dataset/version/test date；demo/unverified 数据明确标注
- 无版权风险内容；透明度优先（与产品定位一致）

## 5. 执行

- 本政策随代码仓库维护（docs/ai-crawler-policy.md）
- robots.txt 如需调整（如新增 crawler 段），按流程修改 + 部署 + 健康检查（seo-health-check.mjs 自动校验 robots）
