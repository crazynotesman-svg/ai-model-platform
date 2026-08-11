# Search Console Data Model（数据模型设计）

- **Date**: 2026-08-11
- **Phase**: 11.5（本阶段仅设计，不接入 API）

## 表：`search_console_pages`

周期从 Google Search Console 导出页面级效果/索引数据，用于 SEO Growth Loop 回填。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | INTEGER PK AUTOINCREMENT | 主键 |
| `url` | TEXT UNIQUE NOT NULL | 页面 URL（含语言前缀） |
| `clicks` | INTEGER DEFAULT 0 | 周期点击量 |
| `impressions` | INTEGER DEFAULT 0 | 周期展示量 |
| `ctr` | REAL DEFAULT 0 | 点击率（clicks/impressions） |
| `position` | REAL NULL | 平均排名 |
| `indexed` | BOOLEAN DEFAULT 1 | 是否收录（索引编制状态） |
| `last_checked` | TEXT NOT NULL | 检查日期（ISO 8601） |

索引建议：
- UNIQUE(url)：按 URL 周期 upsert
- INDEX(last_checked)：按检查时间查询

## 关联使用（构建期/分析期）

```
search_console_pages（真实效果）
   + seo-inventory.json（结构信号：qualityScore/FAQ/schema/links）
   → seoOpportunity 规则扩展：
     - indexed=false            → HIGH（收录风险）
     - ctr < 1%                 → MEDIUM（title/meta）
     - position 10-30           → MEDIUM（FAQ/snippet）
     - qualityScore < 60        → HIGH（薄内容）
```

## 接入方式（后续阶段）

- 方案 A：GitHub Actions 每周调度 → Search Console API（service account）→ 写入 Worker/D1
- 方案 B：手动 CSV 导出 → 导入脚本（scripts/import-gsc.mjs）
- 频率：每周一次（与 GSC 报表一致）
- 隐私：仅聚合页面级数据，无用户级信息

## 注意

- GSC 数据有 2-3 天延迟，查询需回退窗口
- CTR/position 为空值时应存 NULL 而非 0（区分"无数据"与"真实为 0"）
