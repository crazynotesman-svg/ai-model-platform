# Cloudflare D1 Database

本目录管理 AI Model Intelligence Platform 的 Cloudflare D1（SQLite）数据库资产。

## 目录结构

```
database/
├── schema/          # D1 数据库 schema（DDL）
│   └── schema.sql   # 全量 schema（Phase 5 落地业务表）
└── README.md        # 本说明
```

## 使用方式（需 Cloudflare 账号）

### 1. 创建数据库（远程）

```bash
# 在项目根（pnpm workspace）执行
npx wrangler d1 create ai-model-platform-db
# 将输出中的 database_id 填入 worker/wrangler.toml 的 [d1_databases] 段
```

### 2. 本地开发数据库

```bash
# worker 目录内
pnpm dev   # wrangler dev 会自动创建/使用本地 D1（.wrangler/state 下）
```

### 3. 应用 schema / 迁移

```bash
# 本地
npx wrangler d1 execute ai-model-platform-db --local --file=database/schema/schema.sql
# 远程
npx wrangler d1 execute ai-model-platform-db --remote --file=database/schema/schema.sql
```

## 约定

- **Schema 演进**：`schema/schema.sql` 为最新全量 DDL；后续按迁移（migration）方式增量演进（Phase 5 起）。
- **表结构设计**：详见 [docs/database-design.md](../docs/database-design.md)。
- **数据同步策略**：模型目录等静态内容以 git 内 content collection 为源，通过 seed 脚本写入 D1，保证前端静态页与 API 口径一致（Phase 5 实现）。
