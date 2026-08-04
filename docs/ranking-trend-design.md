# Ranking 趋势 / 快照 / 推荐设计（Phase 9.6）

> 在 v1 实时评分（docs/ranking-design.md）之上增加时间维度：快照、趋势、推荐。

## 1. Ranking Snapshot（每日快照）

- 表：`ranking_snapshots`（migration 0006）
  - `model_id`（FK CASCADE）、`ranking_mode`（overall / coding / reasoning / best-value）、
    `score`（当日 overall 分数）、`rank`（该模式当日排名）、`snapshot_date`（YYYY-MM-DD）
  - `UNIQUE(model_id, ranking_mode, snapshot_date)` → 幂等（同一天重复执行不重复写入）
  - 索引：model_id / snapshot_date / ranking_mode
- 生成：`worker/src/services/rankingSnapshot.ts` 的 `createDailySnapshot(db, date?)`
  - 对 4 个模式分别调用 `rankModels`（真实引擎），批量 `INSERT OR IGNORE`（44 行/天 = 11 模型 × 4 模式）
  - **幂等**：当天已存在则跳过
- 调度：Cloudflare Cron `0 2 * * *`（每日 02:00 UTC），见 `worker/src/index.ts` 的 `scheduled()`
- 本地触发：`wrangler dev --test-scheduled` + `POST /__scheduled?cron=0+2+*+*+*`

## 2. Ranking Trend（趋势）

- 查询：`GET /api/ranking/trend/:slug?mode=overall`（`worker/src/routes/ranking.ts` 的 `getRankingTrend`）
- 返回：
  ```json
  { "model": "...", "mode": "overall",
    "history": [ { "date": "2026-08-02", "rank": 6, "score": 88.5 }, ... ],
    "change": { "rank": 0, "score": 0 } }   // rank 正 = 排名上升；score 正 = 分数上升
  ```
- 模型不存在 → 404
- SSG 侧：`export-models.mjs` 读取快照历史（最近 30 天，overall 模式）写入
  `model-catalog.json` 的 `trend`（首尾 rank/score 变化）与 `rankingHistory`（30 天序列），
  供 Ranking 页趋势列、详情页 SVG 折线、Compare 趋势比较使用（数据仍全部来自 D1）。

## 3. Model Recommendation（推荐）

- 引擎：`worker/src/services/recommendation.ts` 的 `getRecommendations(db, lang)`
- 四类（全部来自实时排名，无 hardcode）：

| type | 依据 | 例（2026-08 示例数据） |
| --- | --- | --- |
| best-overall | Overall Score 最高 | Gemini 2.5 Pro |
| best-value | Price Efficiency 最高（score/price 最优） | Claude Haiku 3.5 |
| best-coding | coding benchmark 最高 | Claude Opus 4 |
| best-reasoning | reasoning benchmark 最高 | o3 |

- API：`GET /api/recommendations?lang=`，返回 `{ recommendations: [{ type, model, reason }] }`
- SSG 页：`/{lang}/ranking/recommendations/`（7 语言）——页面用 catalog 的 ranking/benchmarks 字段
  静态计算四类推荐（真实 D1 数据），JSON-LD：CollectionPage + ItemList。

## 4. 数据链路

```
D1 (models/capabilities/pricing/benchmarks)
 ↓ ranking.ts（实时引擎）
 ↓ createDailySnapshot（Cron 02:00 UTC，幂等）
 ↓ ranking_snapshots（每日 44 条）
 ├─ /api/ranking/trend/:slug（动态趋势）
 ├─ export-models.mjs（SSG 只读快照）→ catalog.trend / rankingHistory
 └─ frontend：Ranking 页趋势列 · 详情页 SVG 折线 · Compare 趋势比较 · recommendations SEO 页
```

## 5. 已知边界

- 快照历史从首个 Cron 运行日起累积；新站点初期趋势显示 "→"（无变化/无历史）
- 本地验证曾用真实引擎输出回填历史日期（测试用途）；生产仅由 Cron 生成
- 推荐 reason 为固定英文模板（未来可 i18n 化）
