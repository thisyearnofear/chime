# Deploy CHIME

Two targets: Netlify (static, judging link) and an optional VPS
(24/7 chorus tally + watcher during judging).

- Site: `usechime.netlify.app`
- Repo: `thisyearnofear/chime`

## Netlify (submission link)

Builds from the repo root using [`netlify.toml`](../netlify.toml).

- Build: `npm run build`
- Publish: `.next`

### Environment

```
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_BASE_URL=https://usechime.netlify.app
```

Optional server-only: `VENICE_API_KEY`, `FEATHERLESS_API_KEY`.

## VPS (judging-period backend)

The chorus aggregate (`/api/chorus` → `.data/chime-chorus.json`) is
file-backed, so on Netlify it resets per deploy/region. During judging,
run one persistent copy so every judge sees the same live crowd.

```bash
# on the VPS (Docker + compose plugin required)
git clone https://github.com/thisyearnofear/chime.git && cd chime
cp .env.example .env.local   # set NEXT_PUBLIC_BASE_URL to the VPS URL
NEXT_PUBLIC_BASE_URL=https://chime.example.com docker compose up -d --build
curl localhost:9127/api/chorus?marketId=ping   # expect {"marketId":"ping",...}
docker compose logs -f chime
```

`docker-compose.yml` mounts a named volume at `/app/.data`, so tallies,
seat decisions, and the live cache survive restarts. Put Caddy/Nginx in
front for TLS and point the submission notes at the VPS URL as the live
crowd instance (keep Netlify as the fallback link).

### Nginx site block

```nginx
upstream chime {
    server 127.0.0.1:9127;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name chime.example.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://chime;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }
}
```

After creating the site config:
```bash
sudo ln -s /etc/nginx/sites-available/chime.example.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d chime.example.com
```

## Runtime cache (`.data/`)

The server writes short-lived caches into `./.data/` so live windows survive an indexer hiccup. The directory is created on first write and is git-ignored. Files:

- `chime-live.json` — last successful response from the DreamDEX GraphQL indexer. Used by `/api/markets/live` and re-read on cold start or rate-limit. 30s in-memory TTL, on-disk until next refresh.
- `chime-decisions.json` — cached seat decisions (`/api/agents/window`). Max 200 entries, evicted by oldest first; rows older than 24h are dropped on read.
- `chime-chorus.json` — shared crowd tallies (`/api/chorus`). Max 200 markets, rows older than 24h dropped on read.

Both files are deterministic from upstream data and safe to delete at any time.
