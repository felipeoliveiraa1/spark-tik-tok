# syntax=docker/dockerfile:1.7

# =============================================================================
# Spark scraper worker — runs on the Contabo VPS
# Stage 1: install + compile in the full workspace
# Stage 2: pnpm deploy creates a self-contained package
# Stage 3: copy that package into a slim runtime image
# =============================================================================

FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Pinned pnpm — must match the workspace root
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

# Copy the workspace skeleton so pnpm can resolve workspace links.
# We only need the scraper package — frontend is filtered out.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY backend/scraper/package.json backend/scraper/

# Install only @spark/scraper and its transitive deps (frontend filtered out).
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --filter @spark/scraper... --frozen-lockfile

# Compile TypeScript
COPY backend/scraper/tsconfig.json backend/scraper/
COPY backend/scraper/src backend/scraper/src
RUN pnpm --filter @spark/scraper run build

# Create a self-contained deployment package with flat node_modules (prod only).
# `pnpm deploy` rewrites symlinks into real copies — perfect for Docker.
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm --filter=@spark/scraper deploy --prod --legacy /spark-deploy \
 && cp -r backend/scraper/dist /spark-deploy/dist

# =============================================================================
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=4001 \
    SCRAPER_SYNC=false \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN apt-get update \
 && apt-get install -y --no-install-recommends tini ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Bring across the self-contained deployment from the builder stage
COPY --from=builder /spark-deploy/package.json   ./package.json
COPY --from=builder /spark-deploy/node_modules   ./node_modules
COPY --from=builder /spark-deploy/dist           ./dist

# Scripts auxiliares (login interativo etc) — não precisam de compile
COPY backend/scraper/scripts ./scripts

# Instala Chromium do Playwright DENTRO da imagem (em /ms-playwright pra ficar
# acessível pra todos os users) + as deps do sistema que o Chrome precisa
# (libs gráficas, fonts). Sem isso o container recriado perde o browser e os
# jobs vyral.search-videos / vyral.transcribe falham com "Executable doesn't
# exist". --with-deps roda apt-get sob a hood, exige root (a gente ainda tá
# root aqui).
RUN npx playwright install --with-deps chromium \
 && chmod -R a+rX /ms-playwright \
 && rm -rf /var/lib/apt/lists/*

# Run as non-root for safety. UID 10001 must match the bind-mounted ./data
# directory ownership on the VPS so the scraper can rotate vyral-cookies.json.
RUN useradd -r -u 10001 -m -d /home/spark spark \
 && chown -R spark:spark /app
USER spark

EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/server.js"]
