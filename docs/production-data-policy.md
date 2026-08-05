# Production Data Policy（生产数据策略）

> Phase 10 ｜ 定义哪些数据可以直接上线、哪些必须来自真实来源。

## 1. 原则

- 生产环境**不自动导入演示数据**（demo benchmark、示例资讯）
- 生产 seed 使用 `database/seed/seed-production.sql`（幂等，可重复执行）
- 所有数据保持"可追溯 + 可标记状态"（verification_status / data_status / source_type）

## 2. 可直接上线（production data）

| 数据 | 表 | 说明 |
| --- | --- | --- |
| 供应商 | providers | 官方名称/官网，长期稳定 |
| 模型目录 | models | slug/类型/上下文/发布日期（11 个模型，人工维护） |
| 模型本地化 | model_translations | 名称/描述/用例（en + zh-CN 已核对） |
| 定价 | pricing | ⚠️ 当前为**演示值**（seed 注释已标注），**上线前须逐条核对官方价格页**并补 verification_status='verified' + source_url |
| 能力 | model_capabilities | 9 模型 × 7 能力（人工录入，可上线） |
| 价格历史 | pricing_history | initial_import（衍生自 pricing，随定价核验） |

## 3. 不导入生产（demo data）

| 数据 | 表 | 状态 |
| --- | --- | --- |
| Benchmark 结果 | benchmark_results | **demo/manual**（dataset=internal-demo，verification_status='unverified'）→ 不上线，或仅在内测环境 |
| Benchmark 类别 | benchmark_categories | 类别定义本身可用（coding/reasoning/math/vision），随真实结果一起启用 |
| 示例资讯 | news | 4 条示例 → 不上线；上线后由 Cron 01:00 UTC 自动采集真实资讯 |

## 4. 上线前必须替换为真实来源的数据

1. **Benchmark scores**：以官方基准（HumanEval / MMLU / MMMU / GPQA 等）实测结果替换；
   录入时设置 `source_type='official'`、`source_url=<官方链接>`、`verification_status='verified'`、`verified_at=<日期>`
2. **Pricing**：逐条核对官方定价页，补 `source_url` + `verification_status='verified'`
3. **模型能力/上下文**：以官方 model card 核对

## 5. 操作指引（上线后数据录入）

- Benchmark：`INSERT ... source_type='official', source_url='...', verification_status='verified', verified_at='YYYY-MM-DD'`
- Pricing：更新 `pricing` 后追加 `pricing_history` 记录（source='manual'/'api'，补 source_url）
- 状态变更：模型退役 → `models.data_status='retired'`；数据过期 → `verification_status='deprecated'`

## 6. 透明展示

- 页面 `/{lang}/data-policy/` 自动反映当前状态（数据来源/核验/更新频率/透明声明）
- 详情页 Data Status Card 展示每模型 `data_status` 与 `last_verified_at`
