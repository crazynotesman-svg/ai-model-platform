# Internal Link Audit（内部链接检查）

- **Date**: 2026-08-10
- **Domain**: https://aimodel.100ideas.net
- **方式**: 抓取线上代表页面，检查功能页间链接（只记录，未修改）

## 检查结果

| 源页面 | 目标 | 存在? |
| --- | --- | --- |
| 首页 | /en/models/ | ✅ |
| 首页 | /en/compare/ | ✅ |
| 首页 | /en/ranking/ | ✅ |
| 首页 | /en/benchmarks/ | ❌ **缺失** |
| 首页 | /en/news/ | ✅ |
| 模型详情 | /en/compare/ | ✅ |
| 模型详情 | /en/ranking/ | ❌ **缺失** |
| 模型详情 | /en/benchmarks/ | ❌ **缺失** |
| 模型详情 | 其他模型（相关推荐） | ❌ **缺失**（无相关模型区） |
| 模型详情 | 首页 | ✅（面包屑/导航） |
| Compare 详情 | 模型 A 详情页 | ⚠️ 待人工确认（页面有模型卡，链接格式需核对） |
| Compare 详情 | 模型 B 详情页 | ⚠️ 待人工确认 |
| Benchmark | /en/ranking/ | ❌ **缺失** |
| Ranking | /en/models/ | ✅ |

## 发现的问题（记录，本阶段不修改）

1. **首页无 Benchmarks 入口**：导航与功能卡未包含 benchmarks（首页 6 卡：模型/对比/Token/成本/排行/资讯；benchmarks 独立页无首页入口）
2. **模型详情页无 Ranking / Benchmark 入口**：详情页只有 compare 相关链接，缺少排行与基准评分入口
3. **模型详情无"相关模型"推荐**：无站内模型互链（对内链权重的利用较少）
4. **Benchmark 页无 Ranking 入口**：benchmark 结果与排行榜未互链

## 建议（后续优化项）

- 首页功能卡/导航补充 Benchmarks 入口（低风险）
- 模型详情页增加"查看 Benchmark / 排行"入口（可链接到 /ranking/? 与 /benchmarks/ 对应分类）
- Benchmark 页增加"查看完整排行榜"链接
- 模型详情页增加相关模型区（同厂商或相似定位 2-4 个）提升站内互链
- Compare 详情确认模型卡链接（如缺失则补）

> 影响评估：内部链接影响爬取效率与权重分布，但不阻塞收录（sitemap 已覆盖全部页面）。属 P2 优化。
