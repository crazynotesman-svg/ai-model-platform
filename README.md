# AI Model Intelligence Platform

A free, open, and global AI Model Intelligence Platform. Query AI model information, compare pricing across providers, count tokens, estimate API costs, and stay up-to-date with AI industry news.

> **Free. Open. Global. SEO-friendly. Transparent data.**

## Features (planned)

- 🔍 AI model information lookup
- 💰 Multi-provider pricing comparison
- 🔢 Token counting for text
- 🧮 AI API cost estimation
- 📰 AI industry news

## Monorepo structure

| Directory   | Purpose                                             |
| ----------- | --------------------------------------------------- |
| `frontend/` | Astro + React + TypeScript + Tailwind CSS web app   |
| `worker/`   | Cloudflare Workers API backend                      |
| `database/` | Cloudflare D1 schema & migrations                   |
| `docs/`     | Architecture, roadmap, and database design docs     |

## Tech stack

- **Frontend**: Astro, React (islands), TypeScript, Tailwind CSS
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: GitHub → Cloudflare Pages + Cloudflare Workers
- **i18n**: 7 locales — `en` (default), `zh-CN`, `ja`, `ko`, `es`, `de`, `fr`

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- (Optional) a Cloudflare account with `wrangler` authenticated for worker/D1 work

## Quick start

```bash
pnpm install          # install all workspace dependencies
pnpm dev              # run frontend dev server (and worker in dev mode)
```

Frontend dev server defaults to `http://localhost:4321` — open `/en/` for the default locale.

## Documentation

See [docs/](docs/) for [architecture](docs/architecture.md), [roadmap](docs/roadmap.md), and [database design](docs/database-design.md).
