# CHIME deploy

Ship the Next.js app on Netlify. Do not revive the old Hetzner / Socket.IO / Postgres layout.

- Config: [`netlify.toml`](../../netlify.toml)
- Notes: [`../README.md`](../README.md)
- Production URL: https://chimeapp.netlify.app
- Repo: https://github.com/thisyearnofear/chime

Set `NEXT_PUBLIC_BASE_URL=https://chimeapp.netlify.app` in the Netlify env so Open Graph and metadata resolve to the live host.
