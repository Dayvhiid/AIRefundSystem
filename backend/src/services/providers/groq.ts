import OpenAI from 'openai'
import type { LLMProvider, LLMResponse } from './types'

const GROQ_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.3-70b-versatile', 'qwen-qwen3-32b']
const QUOTA_COOLDOWN_MS = 60_000

const cooldowns = new Map<string, number>()

export class GroqProvider implements LLMProvider {
  private client: OpenAI
  private model: string

  constructor(apiKey: string, model = 'openai/gpt-oss-120b') {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    })
    this.model = model
  }

  async generateContent(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    const models = [this.model, ...GROQ_MODELS.filter(m => m !== this.model)]
    let lastError: unknown

    for (const modelName of models) {
      const cooldownUntil = cooldowns.get(modelName) ?? 0
      if (cooldownUntil > Date.now()) {
        console.warn(`[groq] skipping ${modelName} (quota cooldown, ${Math.ceil((cooldownUntil - Date.now()) / 1000)}s left)`)
        continue
      }

      try {
        const response = await this.client.chat.completions.create({
          model: modelName,
          max_tokens: 1024,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        })

        const text = response.choices[0]?.message?.content
        if (!text) {
          throw new Error('Groq response was empty')
        }

        if (modelName !== this.model) {
          console.log(`[groq] succeeded with ${modelName}`)
        }
        return { text }
      } catch (error) {
        lastError = error
        const msg = error instanceof Error ? error.message : String(error)
        console.warn(`[groq] ${modelName} failed: ${msg.slice(0, 200)}`)

        if (/429|rate.limit|quota/i.test(msg)) {
          cooldowns.set(modelName, Date.now() + QUOTA_COOLDOWN_MS)
          console.warn(`[groq] ${modelName} on cooldown for 60s`)
          continue
        }
        if (/503|500|502|overloaded/i.test(msg)) {
          continue
        }
        throw error instanceof Error ? error : new Error('Groq request failed')
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Groq request failed')
  }
}
