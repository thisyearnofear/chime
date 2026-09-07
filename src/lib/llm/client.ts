// LLM client — Venice AI (primary) + Featherless AI (fallback)
// Both use OpenAI-compatible chat/completions format

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMResponse {
  content: string
  model: string
  provider: string
}

interface LLMProvider {
  name: string
  url: string
  model: string
}

const PROVIDERS: LLMProvider[] = [
  {
    name: 'venice',
    url: 'https://api.venice.ai/api/v1/chat/completions',
    model: 'mistral-31-24b',
  },
  {
    name: 'featherless',
    url: 'https://api.featherless.ai/v1/chat/completions',
    model: 'meta-llama/Llama-3.3-70B-Instruct',
  },
]

export async function chatCompletion(
  messages: LLMMessage[],
  apiKey: string,
  provider: LLMProvider
): Promise<LLMResponse> {
  const response = await fetch(provider.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(4000),
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature: 0.7,
      max_tokens: 500,
    }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${provider.name} error ${response.status}: ${text}`)
  }

  const data = await response.json()
  return {
    content: data.choices?.[0]?.message?.content ?? '',
    model: data.model ?? provider.model,
    provider: provider.name,
  }
}

export async function chatWithFallback(
  messages: LLMMessage[],
  apiKeys: Record<string, string>
): Promise<LLMResponse> {
  for (const provider of PROVIDERS) {
    const key = apiKeys[provider.name]
    if (!key) continue
    try {
      return await chatCompletion(messages, key, provider)
    } catch (error) {
      console.warn(`${provider.name} failed, trying next provider:`, error)
      continue
    }
  }
  throw new Error('All LLM providers failed')
}

export { PROVIDERS }
