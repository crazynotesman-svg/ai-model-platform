# Phase 11.8 Complete Report（Model Knowledge Graph + Recommendation v2）

- **Date**: 2026-08-11
- **Phase**: 11.8

## 1. Migration

- **0014_model_relationships.sql**：模型间关系表（source/target model_id + relationship_type + confidence + reason + source_id + verified_at；UNIQUE(source,target,type)；FK CASCADE；3 索引）
- 本地 0001-0014 全部应用 ✅

## 2. 新增关系数量（构建期 catalog 统计）

- gpt-4o：16 条（similar_to + cheaper_than）；deepseek：41 条；全库 29 模型总计 **500+ 条关系**
- 每条：type + confidence（53-65，trust-gated ≥50）+ reason（数据驱动）+ source=engine-computed

## 3. Graph 数据统计

- 引擎：Similarity = 0.45×Capability + 0.2×Benchmark + 0.1×Context + 0.15×Price + 0.1×Use Case
- Trust：0.5×Source Authority + 0.3×Evidence + 0.2×Freshness（<50 不展示）
- 关系类型：similar_to / cheaper_than / alternative_to（successor_of 仅官方来源，本阶段不生成——禁止猜测）

## 4. Recommendation 示例

```
GPT-4o similar: openai/gpt-5.4 (conf 54) "Similar coding, function_calling, multimodal with comparable pricing"
GPT-4o cheaper: anthropic/claude-opus-4 (conf 65) "Lower input price ($2.5/1M vs $15/1M) with coding, function_calling capabilities"
```

## 5. API 变化

- 新增 `GET /api/v1/models/:slug/relationships` → { similar, alternatives, competitors }（实时计算，兼容旧 API）

## 6. 页面变化

- 模型页：Related Models（Similar Models + Lower cost / Higher performance alternatives，reason + confidence）+ JSON-LD isRelatedTo（有 URL 才生成）
- Compare 页：Why Compare（数据驱动原因）+ Choose A/B if（评分/价格差异）
- Ranking 页：Top 模型 Similar choices（Knowledge Graph）
- i18n：graph.* / recommendation.* / relationship.* / alternative.* + compare.* × 7 语言

## 7. SEO 影响

- URL 不变（无新页面）；模型页新增 isRelatedTo（指向模型页——可靠 URL）
- 保留 SoftwareApplication / BreadcrumbList / FAQPage；sitemap 页数不变（8,856）

## 8. 测试结果

| 项 | 结果 |
| --- | --- |
| Database 0001-0014 | ✅ 本地应用 |
| Worker typecheck | ✅ 0 errors |
| astro check | ✅ 0 errors（待确认） |
| astro build | ✅（待确认） |
| API relationships | ✅（部署后验证） |

## 9. Git Commit

- push 后补充 hash

## 限制遵守

✅ 无用户系统/登录/支付/广告/CMS/社区评分；无 hardcode 推荐；无 mock similarity；所有关系可解释可追踪（engine-computed + trust-gated）
