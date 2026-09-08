# Deploy CHIME

Next.js app. Netlify builds from the repo root using [`netlify.toml`](../netlify.toml). There is no separate backend — DreamDEX is the venue.

- Site: `usechime.netlify.app`
- Repo: `thisyearnofear/chime`
- Build: `npm run build`
- Publish: `.next`

## Environment

```
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_BASE_URL=https://usechime.netlify.app
```

Optional server-only: `VENICE_API_KEY`, `FEATHERLESS_API_KEY`.

## Runtime cache (`.data/`)

The server writes short-lived caches into `./.data/` so live windows survive an indexer hiccup. The directory is created on first write and is git-ignored. Files:

- `chime-live.json` — last successful response from the DreamDEX GraphQL indexer. Used by `/api/markets/live` and re-read on cold start or rate-limit. 30s in-memory TTL, on-disk until next refresh.
- `chime-decisions.json` — cached seat decisions (`/api/agents/window`). Max 200 entries, evicted by oldest first; rows older than 24h are dropped on read.

Both files are deterministic from upstream data and safe to delete at any time.
