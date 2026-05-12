# Spark frontend — deploy na Vercel

## Pré-requisitos
- Conta Vercel já existente
- Worker rodando na Contabo com domínio + HTTPS (veja [contabo-setup.md](./contabo-setup.md))
- `SCRAPER_HMAC_SECRET` em mãos (mesmo valor do `.env.production` da VPS)

## Primeira subida (CLI)

```bash
# do seu Mac, dentro do repo
cd /Users/felipeporto/Developer/app-tiktok-shop

# Login (se ainda não fez)
npx vercel login

# Linka projeto — escolhe o time/escopo e nome ("spark-tiktok-shop", por ex)
npx vercel link

# Deploy de preview
npx vercel
# (URL .vercel.app sai no terminal)

# Quando estiver feliz com o preview, sobe pra produção:
npx vercel --prod
```

## Variáveis de ambiente na Vercel

Painel → Settings → Environment Variables. Adicione em todos os 3 envs
(Production, Preview, Development) a menos que indicado:

| Nome | Valor | Onde usar |
|---|---|---|
| `SCRAPER_BASE_URL` | `https://scraper.<dominio>` | All |
| `SCRAPER_HMAC_SECRET` | (mesmo do `.env.production` da VPS) | All |
| `NEXT_PUBLIC_SITE_URL` | `https://<dominio-do-app>` | Production |

> O `NEXT_PUBLIC_SITE_URL` é usado pelo `metadataBase` no `app/layout.tsx`
> pra gerar URLs absolutas dos OG images / manifest.

Depois de adicionar, dispara um redeploy: `npx vercel --prod` de novo.

## Domínio próprio

Settings → Domains → Add → digite `spark-app.com.br` (ou o seu). A Vercel
mostra o registro DNS pra adicionar no registrador. Em ~5 min sai HTTPS.

## Por que não deployar o scraper também na Vercel

- A Vercel é serverless: cada request roda numa function isolada, sem fila
  persistente, sem estado entre execuções. O scraper precisa de Redis (fila
  BullMQ) e do cookie store da Vyral persistido em disco — impossível serverless.
- O scraping em si fica caro em compute time da Vercel (cada query Vyral leva
  ~3-8s) e estouraria limite de função.
- VPS dedicada faz sentido aqui: $5-10/mês pra um servidor que segura tudo.

## Como verificar que tá tudo amarrado

Depois do deploy de produção:

```bash
# Substitua pelo domínio real
DOMAIN=spark-app.com.br

# 1) Front responde
curl -sI https://$DOMAIN/landing | head -3

# 2) API do front chama o worker via HMAC e volta dados reais da Vyral
curl -s -X POST https://$DOMAIN/api/vyral/search \
  -H 'content-type: application/json' \
  -d '{"country":"BR","sortBy":"revenue","limit":3,"lastDays":7}' \
  | jq '.cached, .total, .videos[0].creator'
```

Se o 2º curl retornar dados reais, a integração está completa.
