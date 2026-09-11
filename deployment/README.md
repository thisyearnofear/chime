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

### Deploy (rsync + PM2)

Build locally, rsync to `/opt/chime/releases/<timestamp>`, update the
`current` symlink, restart PM2. See [`scripts/deploy-to-vps.sh`](../scripts/deploy-to-vps.sh).

```bash
# on your local machine
./scripts/deploy-to-vps.sh
```

Or manually:

```bash
# 1. Build standalone
npm run build

# 2. Rsync to VPS
REMOTE=/opt/chime/releases/$(date +%Y%m%d-%H%M%S)
ssh snel-bot "mkdir -p $REMOTE /opt/chime/logs /opt/chime/shared"
rsync -az --delete --exclude='.git' --exclude='node_modules' --exclude='.next/cache' . snel-bot:$REMOTE/

# 3. Update symlink + restart PM2
ssh snel-bot bash -c "
  ln -sfn '$REMOTE' /opt/chime/current
  cd /opt/chime && pm2 delete chime 2>/dev/null; pm2 start ecosystem.config.cjs && pm2 save
"
```

Set env vars in `/opt/chime/shared/.env` (loaded by PM2) or pass via
`ecosystem.config.cjs`. Required:

```
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_BASE_URL=https://chime.trustfall.xyz
```

`ecosystem.config.cjs` mounts a named volume at `/app/.data`, so tallies,
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

### Directory layout on VPS

```
/opt/chime/
├── current → releases/20260911-120000   # active release (symlink)
├── releases/
│   └── 20260911-120000/                  # timestamped release
│       ├── .next/standalone/             # Next.js standalone output
│       ├── public/
│       ├── package.json
│       └── node_modules/
├── shared/
│   └── .env                               # env vars (symlinked into release)
├── logs/
│   ├── pm2-out.log
│   ├── pm2-err.log
│   └── pm2-combined.log
├── ecosystem.config.cjs                   # PM2 config
└── .data/                                 # runtime caches (persists across releases)
```

## Runtime cache (`.data/`)

The server writes short-lived caches into `./.data/` so live windows survive an indexer hiccup. The directory is created on first write and is git-ignored. Files:

- `chime-live.json` — last successful response from the DreamDEX GraphQL indexer. Used by `/api/markets/live` and re-read on cold start or rate-limit. 30s in-memory TTL, on-disk until next refresh.
- `chime-decisions.json` — cached seat decisions (`/api/agents/window`). Max 200 entries, evicted by oldest first; rows older than 24h are dropped on read.
- `chime-chorus.json` — shared crowd tallies (`/api/chorus`). Max 200 markets, rows older than 24h dropped on read.

Both files are deterministic from upstream data and safe to delete at any time.
