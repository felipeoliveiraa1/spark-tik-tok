# Spark · IA pra TikTok Shop

Plataforma de IA pra criadoras de TikTok Shop brasileiras. Análise de produto, descoberta de virais, geração de scripts com neurociência e tira-dúvidas — em chat estilo ChatGPT, instalável como PWA.

## Arquitetura

```
spark-tik-tok/
├── frontend/           Next.js 16 + Tailwind v4 + PWA (deploy: Vercel)
├── backend/
│   └── scraper/        Worker Vyral.com.br (deploy: Contabo VPS via Docker)
├── supabase/
│   └── migrations/     Schema Postgres (viral_videos, viral_cache, etc.)
├── deploy/             Guias passo-a-passo (Contabo + Vercel)
├── docs/               Spec de telas e referências
└── docker-compose.yml  Stack de produção (Postgres + Redis + scraper)
```

## Stack

| Camada | Tecnologia | Onde roda |
|---|---|---|
| Frontend (PWA) | Next.js 16 (App Router) + Tailwind v4 + React 19 | Vercel |
| Agentes IA | Gemini 2.0 Flash via Vercel AI SDK | Vercel (server actions) |
| Worker scraper | Node + Express + BullMQ + Playwright | Contabo VPS (Docker) |
| Banco | Postgres 16 | Contabo VPS (Docker) |
| Fila | Redis 7 | Contabo VPS (Docker) |
| Pagamento | Kiwify (R$ 49,90/mês) | Externo |
| Fonte de virais | Vyral.com.br (HTTP API + cookies) | Externo |

## Desenvolvimento local

Pré-requisitos: Node 20+, pnpm 10+, Postgres 16 (`brew install postgresql@16`).

```bash
# Instala todas as deps do monorepo
pnpm install

# Setup do banco local (uma vez)
createdb spark_dev
psql spark_dev -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
psql spark_dev -f supabase/migrations/0001_viral_research.sql

# Configura envs
cp backend/scraper/.env.example backend/scraper/.env

# Roda o frontend
pnpm dev:web                 # localhost:3000

# Em outro terminal — roda o scraper
pnpm dev:scraper             # localhost:4001
```

## Deploy

- **Frontend**: push pro `main` → Vercel auto-deploy. Root Directory na config Vercel: `frontend/`
- **Backend**: ver [deploy/contabo-setup.md](deploy/contabo-setup.md)

## Status

- [x] UI (18 telas mobile + 5 desktop responsivas)
- [x] Mock auth + PWA + onboarding fluxo
- [x] Worker Vyral em produção (Postgres + Redis + scraper)
- [x] Cache + persistência de virais
- [x] Endpoint de transcrição + insights IA (com fallback heurístico)
- [ ] Integração Gemini 2.0 Flash nos 4 agentes (Info, Virais, Scripts, Q&A)
- [ ] Auth real via Supabase Auth (magic link)
- [ ] Webhook Kiwify (ativar/desativar plano)
- [ ] Quotas + billing
