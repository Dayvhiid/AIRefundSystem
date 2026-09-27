import type { LLMProvider, ProviderName } from './types'
import { GeminiProvider } from './gemini'
import { AnthropicProvider } from './anthropic'
import { OpenAIProvider } from './openai'
import { GrokProvider } from './grok'
import { GroqProvider } from './groq'

export type { LLMProvider, LLMResponse, ProviderName } from './types'

export function createProvider(provider?: ProviderName): LLMProvider {
  const name = provider || (process.env.LLM_PROVIDER as ProviderName) || 'groq'

  switch (name) {
    case 'gemini': {
      const key = process.env.GEMINI_API_KEY
      if (!key) throw new Error('GEMINI_API_KEY is required when using gemini provider')
      return new GeminiProvider(key)
    }
    case 'anthropic': {
      const key = process.env.ANTHROPIC_API_KEY
      if (!key) throw new Error('ANTHROPIC_API_KEY is required when using anthropic provider')
      return new AnthropicProvider(key)
    }
    case 'openai': {
      const key = process.env.OPENAI_API_KEY
      if (!key) throw new Error('OPENAI_API_KEY is required when using openai provider')
      return new OpenAIProvider(key)
    }
    case 'grok': {
      const key = process.env.XAI_API_KEY
      if (!key) throw new Error('XAI_API_KEY is required when using grok provider')
      return new GrokProvider(key)
    }
    case 'groq': {
      const key = process.env.GROQ_API_KEY
      if (!key) throw new Error('GROQ_API_KEY is required when using groq provider')
      return new GroqProvider(key)
    }
    default:
      throw new Error(`Unknown LLM provider: ${name}. Supported: gemini, anthropic, openai, grok, groq`)
  }
}
