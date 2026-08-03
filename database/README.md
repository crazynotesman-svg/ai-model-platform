# Cloudflare D1 Database

本目录管理 AI Model Intelligence Platform 的 Cloudflare D1（SQLite）数据库资产。

## 目录结构

```
database/
├── schema/schema.sql    # 最新全量 schema（幂等，可重复执行）
├── migrations/          # 增量迁移（wrangler d1 migrations 标准格式）
│   └── 0001_init.sql    # 初始表结构
├── seed/seed.sql        # 种子数据（幂等 INSERT OR IGNORE，可重复执行）
└── README.md            # 本说明
```

## 使用方式（需 Cloudflare 账号；本地开发无需登录）

### 1. 创建数据库

```bash
npx wrangler d1 create ai-model-platform-db
# 将输出中的 database_id 填入 worker/wrangler.toml 的 [d1_databases]
```

### 2. 应用迁移（建表）

```bash
npx wrangler d1 migrations apply ai-model-platform-db --local   # 本地
npx wrangler d1 migrations apply ai-model-platform-db --remote  # 远程
```

### 3. 写入种子数据

```bash
npx wrangler d1 execute ai-model-platform-db --local --file=database/seed/seed.sql
npx wrangler d1 execute ai-model-platform-db --remote --file=database/seed/seed.sql
```

### 4. 查询验证（示例）

```bash
npx wrangler d1 execute ai-model-platform-db --local --command="SELECT COUNT(*) FROM models"
```

## 表结构（v1 落地版，与 docs/database-design.md 对齐）

| 表 | 说明 |
| --- | --- |
| providers | 供应商（name / website） |
| models | 模型目录（slug / provider / model_type / context_window / release_date） |
| model_translations | 模型多语言（name / description / use_cases，每模型每语言一条） |
| pricing | 定价（input/output 单价 / currency / unit / updated_at） |
| news | AI 行业资讯（title / content / language / source / published_at） |

## 约定

- **Schema 演进**：`migrations/` 按序号增量；`schema/schema.sql` 始终为"最新全量"，两者最终一致。
- **数据透明**：seed 中的参数/价格为演示值，正式上线前须核对官方来源（见 seed.sql 头部声明）。
- **幂等**：seed 全部 `INSERT OR IGNORE`（依赖唯一约束），可安全重复执行。
