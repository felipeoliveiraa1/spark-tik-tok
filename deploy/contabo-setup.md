# Spark scraper — deploy na Contabo VPS

Setup completo, do zero a "produção rodando", em ~15 min. Os comandos assumem
Ubuntu/Debian recente (qualquer release que a Contabo entrega por padrão).

> Todos os blocos abaixo são pra rodar **na VPS**, via SSH. Substitua os
> placeholders quando aparecem `<...>`.

## 1. Preparar o servidor (uma vez só)

```bash
# 1.1  Atualiza o sistema
sudo apt-get update && sudo apt-get upgrade -y

# 1.2  Instala Docker + Compose plugin + git
curl -fsSL https://get.docker.com | sudo sh
sudo apt-get install -y docker-compose-plugin git ufw

# 1.3  Permite seu usuário usar docker sem sudo
sudo usermod -aG docker $USER
newgrp docker     # ou: logout/login pra aplicar

# 1.4  Firewall: só 22 (SSH), 80 e 443
sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp
sudo ufw --force enable
```

## 2. Trazer o código

Você tem 2 opções: clone direto se já tem repo no Git, ou rsync local→VPS. O
rsync é mais simples enquanto o repo é privado.

### Opção A — Git (recomendado depois que subir pra GitHub privado)
```bash
mkdir -p ~/spark && cd ~/spark
git clone <git@github.com:seu-user/seu-repo.git> .
```

### Opção B — rsync do seu Mac (faz no seu terminal local, NÃO na VPS)
```bash
# do seu Mac, troca o IP/usuário:
rsync -avz --delete \
  --exclude node_modules --exclude .next --exclude '.git' \
  --exclude '_design-reference' --exclude 'app.vyral.com.br.har' \
  /Users/felipeporto/Developer/app-tiktok-shop/ \
  <user>@<vps-ip>:/home/<user>/spark/
```

## 3. Configurar env de produção

```bash
cd ~/spark
cp .env.production.example .env.production
nano .env.production
```

Preencha:
- `POSTGRES_PASSWORD` — gere com `openssl rand -hex 16`
- `SCRAPER_HMAC_SECRET` — `openssl rand -hex 32` (anote, vai no Vercel também)

## 4. Levar os cookies da Vyral pra VPS

O scraper precisa do `vyral-cookies.json` pra autenticar. Do seu Mac:

```bash
scp /Users/felipeporto/Developer/app-tiktok-shop/services/scraper/vyral-cookies.json \
  <user>@<vps-ip>:/home/<user>/spark/services/scraper/data/
```

## 5. Subir o stack

```bash
cd ~/spark
docker compose --env-file .env.production up -d --build

# Acompanha logs:
docker compose logs -f scraper
```

Esperado:
```
spark-postgres  | database system is ready to accept connections
spark-redis     | Ready to accept connections
spark-scraper   | spark-scraper: listening port=4001
```

Sanity check:
```bash
curl http://localhost:4001/health
# {"ok":true,"env":"production","db":{"ok":true},...}
```

## 6. Expor pro mundo via nginx + Let's Encrypt

Substitui `<dominio>` (ex: `scraper.spark-app.com.br`). **DNS A record dele já
deve estar apontando pro IP da VPS antes de seguir.**

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx

sudo tee /etc/nginx/sites-available/spark-scraper > /dev/null <<'NGINX'
server {
  listen 80;
  server_name <dominio>;

  # Body up to 256kb (HMAC requests are tiny)
  client_max_body_size 256k;

  location / {
    proxy_pass         http://127.0.0.1:4001;
    proxy_http_version 1.1;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_read_timeout 180s;
    proxy_connect_timeout 10s;
  }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/spark-scraper /etc/nginx/sites-enabled/spark-scraper
sudo nginx -t && sudo systemctl reload nginx

# TLS — vai trocar o block server pra 443 automaticamente
sudo certbot --nginx -d <dominio> --redirect --no-eff-email --agree-tos \
  -m <seu-email>@gmail.com
```

Pronto: `https://<dominio>/health` responde JSON.

## 7. Conectar o Vercel

No painel do projeto na Vercel → Settings → Environment Variables, adiciona:

```
SCRAPER_BASE_URL = https://<dominio>
SCRAPER_HMAC_SECRET = <mesma string que tá no .env.production>
```

Redeploy pra pegar as envs e pronto. O Next.js já vai bater no worker real.

## 8. Atualizações futuras

```bash
cd ~/spark
git pull                         # ou rsync de novo
docker compose --env-file .env.production up -d --build
docker compose logs -f scraper   # confere
```

Pra rotação de cookies da Vyral (quando expirar a sessão completamente):
```bash
scp .../vyral-cookies.json <user>@<vps-ip>:/home/<user>/spark/services/scraper/data/
docker compose restart scraper
```

## Comandos úteis no dia a dia

```bash
# Status
docker compose ps

# Logs
docker compose logs -f scraper
docker compose logs --tail=200 postgres

# Conectar ao Postgres
docker compose exec postgres psql -U spark -d spark

# Restart só do worker
docker compose restart scraper

# Parar tudo
docker compose down

# Parar + apagar dados (CUIDADO — apaga o banco)
docker compose down -v
```
