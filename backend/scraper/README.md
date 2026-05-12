# Spark Scraper Worker

HTTP service that scrapes [Vyral.com.br](https://www.vyral.com.br) on behalf of the Spark app. Runs on a Contabo VPS (one process, serial Playwright queue) and exposes HMAC-signed endpoints to the Next.js app.

## Why a separate service

- Vercel serverless can't run Playwright/Chrome.
- Vyral session needs to persist across requests (cookies + localStorage).
- Scraping is naturally serial — 1 logged-in account = 1 session at a time.
- Keeping it off the user-facing path means TOS-risk and infra-risk live in one box.

## Quickstart (local dev)

```bash
# from the repo root
pnpm install                         # also installs scraper deps via workspace
cd services/scraper
cp .env.example .env                 # set SCRAPER_HMAC_SECRET — leave Vyral creds blank for mock mode

# Redis (BullMQ requires it)
docker run --rm -p 6379:6379 redis:7-alpine        # or: brew services start redis

# Run the worker in watch mode
pnpm dev
```

The worker listens on `PORT` (default `4001`).

In the Next.js side, point at it:

```bash
# .env.local (repo root)
SCRAPER_BASE_URL=http://localhost:4001
SCRAPER_HMAC_SECRET=<same value as above>
```

## Mock mode vs real mode

| Mode | Trigger | What happens |
|---|---|---|
| **Mock** | `VYRAL_EMAIL` / `VYRAL_PASSWORD` not set | Returns deterministic mock data for every job. No browser launched. Use this for development + Next.js wiring. |
| **Real** | Both credentials set | Launches Playwright, loads `vyral-session.json` if present, ensures login, performs the scrape. Falls back to mock until selectors are filled in. |

The mock data lives in `src/vyral/mocks.ts` and mirrors the production response shape (defined in `src/types.ts`).

## Endpoints

All `/jobs*` endpoints require HMAC signing with `SCRAPER_HMAC_SECRET`. The Next.js side handles this via [`lib/scraper-client.ts`](../../lib/scraper-client.ts).

```
GET  /health                        -> { ok, env, ts }
POST /jobs                          -> enqueue job, returns { jobId, status: 'queued' }
GET  /jobs/:id                      -> poll status (queued|running|done|error)
```

### Job payload shape

```jsonc
{
  "kind": "vyral.search-videos",
  "params": { "country": "BR", "sortBy": "revenue", "limit": 10 }
}
```

Supported kinds:
- `vyral.search-videos` — list trending videos with filters
- `vyral.get-transcription` — fetch hook/problem/solution/CTA for a video
- `vyral.top-products` — Vyral's leaderboard of trending products

## Smoke test

```bash
# from anywhere, with the Next.js dev server running on :3000:
curl -X POST http://localhost:3000/api/vyral/search \
  -H 'content-type: application/json' \
  -d '{"country":"BR","sortBy":"revenue","limit":3}'
```

Expected: JSON with up to 3 viral videos from the mock catalog.

## Deploy on Contabo VPS

```bash
# on the VPS, after first SSH:
sudo apt-get update && sudo apt-get install -y nodejs npm redis-server
sudo systemctl enable redis-server --now

# clone the repo, install deps:
git clone <repo> /opt/spark
cd /opt/spark
pnpm install

# install Chromium for Playwright:
cd services/scraper
pnpm playwright:install --with-deps

# build + run:
pnpm build
pnpm start
```

Then create a systemd unit at `/etc/systemd/system/spark-scraper.service`:

```ini
[Unit]
Description=Spark scraper worker
After=network.target redis-server.service
Requires=redis-server.service

[Service]
Type=simple
WorkingDirectory=/opt/spark/services/scraper
EnvironmentFile=/opt/spark/services/scraper/.env
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=5
User=spark

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable spark-scraper --now
```

Expose port 4001 behind nginx + Let's Encrypt under `scraper.<your-domain>` and set `SCRAPER_BASE_URL` on Vercel to that HTTPS URL.

## What's a stub right now

`src/vyral/{search,transcribe,top-products}.ts` all return mock data even when a real browser context exists. The TODO blocks mark exactly where the production Playwright code goes once we have access to a paid Vyral account and can map selectors.

When you log into Vyral for the first time:

1. Use Chrome DevTools to record the request the dashboard makes when you search (`/api/search` or similar JSON XHR — if it exists, we'll prefer that over DOM scraping).
2. Note the URL structure: `/dashboard?country=BR&q=...` or whatever they use.
3. Capture 1 example of each result: search list, video detail page, transcription panel.

Share that with me and I'll fill in the selectors.
