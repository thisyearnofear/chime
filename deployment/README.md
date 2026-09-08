# Deploy CHIME

Next.js app. Netlify builds from the repo root using [`netlify.toml`](../netlify.toml). There is no separate backend — DreamDEX is the venue.

- Site: `chimeapp.netlify.app`
- Repo: `thisyearnofear/chime`
- Build: `npm run build`
- Publish: `.next`

Set:

```
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_BASE_URL=https://chimeapp.netlify.app
```

Optional server-only: `VENICE_API_KEY`, `FEATHERLESS_API_KEY`.
