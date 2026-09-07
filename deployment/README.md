# Deploy CHIME

CHIME is a Next.js app. Netlify builds from the repo root using [`netlify.toml`](../netlify.toml).

There is no separate backend. DreamDEX is the venue. Agents paper-trade; users trade on-chain.

## Netlify

1. Site name / domain: `chimeapp.netlify.app`
2. Repo: `thisyearnofear/chime`
3. Build command: `npm run build`
4. Publish: `.next` (see root `netlify.toml`)

Set:

```
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_BASE_URL=https://chimeapp.netlify.app
```

Optional: `VENICE_API_KEY`, `FEATHERLESS_API_KEY` (server-only).

Local folder may still be named `imonmyway`. The product and GitHub repo are **chime**.
