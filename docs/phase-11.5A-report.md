# Phase 11.5A Data Trust Report（数据可信体系）

- **Date**: 2026-08-11
- **Phase**: 11.5A

## 1. 数据库变化

### Migration `0010_data_trust.sql`
- 新增表：`data_sources`（id/name/type/url/description/trust_level/created_at）+ `data_verifications`（entity_type/entity_id/source_id/verified_at/verification_status/confidence_score/notes）+ 索引
- 升级（兼容 ALTER）：benchmark_results（source_id/official_score/confidence）、pricing_history（source_id/verified_at/confidence）、models（verified_status/confidence_score）、model_capabilities（source_id/confidence/verified_at）
- 本地测试：0001-0010 全部应用 ✅ + seed 执行成功

### Seed `seed-trust.sql`（幂等）
- 注册 16 个来源：官方（OpenAI/Anthropic/Google/Meta，100）、权威基准（HumanEval/MMLU/GPQA/AIME/SWE-bench/LMSYS Arena/MMMU，90）、社区（HuggingFace，70）、Internal Demo（40）
- 映射：OpenAI/Anthropic/Google/Meta 模型 → 官方源（verified，confidence 95/90）；demo 数据 → Internal Demo（Experimental，40）
- 本地验证：pricing 27 条有源、capabilities 329 条有源、models 29 个 verified

## 2. 数据来源体系（Tier A/B/C/D）

| Tier | trust_level | 例子 |
| --- | --- | --- |
| A 官方 | 100 | OpenAI API docs / Anthropic pricing / Google Gemini docs / Meta Llama docs |
| B 公开权威 | 90 | HumanEval / MMLU / GPQA / AIME / SWE-bench / MMMU / LMSYS Arena（真实用户 Elo，记录 source+methodology+date） |
| C 社区 | 70 | HuggingFace Open LLM Leaderboard |
| D 人工 | 40 | Internal Demo（必须显示 Experimental，禁止隐藏） |

## 3. 可信评分算法（Ranking Engine v2）

```
Raw     = Benchmark×50% + Capability×20% + PriceEfficiency×20% + Context×10%
Overall = Raw × DataConfidence（benchmark confidence 平均/100；无 benchmark 用模型 confidenceScore/100）
输出：score（overall）、confidence、breakdown（rawScore + 分量）
```
验证：gpt-4o overall 41.4 = raw 43.5 × 0.95 ✅（worker ranking.ts 与 export-models.mjs 同步）

## 4. 页面变化

- **DataTrustBadge 组件**（components/data/）：≥90 Verified（绿）/ 70-89 Trusted（蓝）/ <70 Experimental（琥珀），7 语言
- **模型详情**：Data Trust Card（Model/Pricing/Benchmark 验证徽章 + Confidence 95% + 来源链接）
- **首页**：Ranking Methodology 块（评分/基准源/价格源/更新）+ 每行 Data Confidence %
- **Compare**：Data Reliability（两模型 Benchmark/Pricing 可信徽章）
- **Benchmark 页**：Source Information 块（dataset/version/date + 诚实标注）——当前库无 benchmark 数据不显示，数据到位自动出现

## 5. 工具

- `data-trust-audit.mjs`：检查模型/价格/基准/能力来源缺失（HIGH=0 目标）
- 外部数据源 Connector 接口设计（docs/data-source-policy.md）：LMSYS→HuggingFace→SWE-bench→HumanEval→MMMU；官方定价/文档——本阶段仅设计不爬取

## 6. 测试结果

- database migration 0001-0010：✅ 应用成功
- seed（production + trust）：✅ 执行成功
- worker typecheck：✅ 0 errors
- astro check：✅ 0 errors
- astro build：✅ 8835 html / sitemap 8834（页数不下降）
- 页面验证：模型 Trust Card（Confidence 95）✓、首页 Methodology/Confidence ✓、Compare Reliability ✓
- JSON-LD：无变化（新增页面无新 schema 冲突）

## 7. 修改文件

| 文件 | 说明 |
| --- | --- |
| `database/migrations/0010_data_trust.sql` | 新增：可信表 + 字段升级 |
| `database/seed/seed-trust.sql` | 新增：来源注册 + 幂等映射 |
| `worker/src/services/ranking.ts` | 升级：Ranking v2（confidence adjustment） |
| `frontend/scripts/export-models.mjs` | 升级：导出 trust 字段 + 公式同步 |
| `frontend/src/components/data/DataTrustBadge.astro` | 新增：可信徽章组件 |
| `frontend/src/pages/[lang]/models/[...slug].astro` | Data Trust Card |
| `frontend/src/pages/[lang]/index.astro` | Ranking Methodology + Data Confidence |
| `frontend/src/pages/[lang]/compare/[pair].astro` | Data Reliability |
| `frontend/src/pages/[lang]/benchmarks/[category].astro` | Source Information |
| `frontend/scripts/data-trust-audit.mjs` | 新增：可信审计 |
| `frontend/src/generated/model-catalog.json` | 重新导出（含 trust 字段） |
| `frontend/src/i18n/translations/*.json` × 7 | trust/verification/confidence/source 键 |
| `docs/data-trust-design.md` / `docs/data-source-policy.md` | 新增 |
| `docs/phase-11.5A-report.md` | 本报告 |

## 8. 注意

- 生产部署需执行：`wrangler d1 migrations apply --remote` + `wrangler d1 execute --remote --file=database/seed/seed-trust.sql`（CI deploy-worker.yml 已含 migrations 步骤，seed-trust 待加入）
- demo benchmark 数据（internal-demo）已诚实标注 Experimental；接入权威基准后 confidence 提升
