# Model Refresh Policy（模型更新策略）

- **Date**: 2026-08-12
- **Phase**: 12.1 Part K

## 更新频率

| 数据 | 来源 | 频率 |
| --- | --- | --- |
| 模型发现（新模型/新版本） | 官方文档（Model Discovery cron 04:00） | 每日 |
| Pricing | 官方定价页（Data Discovery cron 每 6h） | 每 6 小时 |
| Benchmark | 官方报告/榜单（人工核验后） | 月度 |
| 能力/上下文 | 官方文档 | 每周 |

## 流程

```
官方来源 → Connector → normalize → validate → data_events（pending）
  → approve → production → ranking 刷新 → SEO 更新
```

## 规则

1. 新模型必须：source_url + confidence + verified_status（否则 unverified，不进 Top ranking）
2. 自动发现 ≠ 自动发布（pending 审核）
3. 禁止覆盖已有可信数据（INSERT OR IGNORE / 版本化追加）
4. 旧模型通过 replacement_model_id 关联新版本（不删除）

## 验证标准

- 数据可追溯（source_id）
- 更新时间可查（last_verified_at / data_changes）
- 未核验数据诚实标注
