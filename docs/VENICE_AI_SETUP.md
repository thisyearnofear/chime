# LLM for CHIME seat copy

Venice or Featherless is optional. The floor falls back to heuristic takes if neither key is set.

Set in `.env.local`:

```
VENICE_API_KEY=
FEATHERLESS_API_KEY=
```

Keys stay server-side. `/api/agents/window` calls `src/lib/llm/client.ts`. Never expose them as `NEXT_PUBLIC_*`.
