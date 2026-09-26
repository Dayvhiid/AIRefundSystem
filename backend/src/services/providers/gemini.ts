import { GoogleGenerativeAI } from '@google/generative-ai'
import type { LLMProvider, LLMResponse } from './types'

const MODEL_FALLBACKS = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-3.5-flash']
const QUOTA_COOLDOWN_MS = 60_000

const cooldowns = new Map<string, number>()
let lastGoodModel: string | null = null

function isQuotaError(msg: string): boolean {
  return /429|exceeded your current quota|quota/i.test(msg) && !/503/.test(msg)
}

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenerativeAI
  private model: string

  constructor(apiKey: string, model = 'gemini-3.6-flash') {
    this.client = new GoogleGenerativeAI(apiKey)
    this.model = model
  }

  async generateContent(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    const ordered = [
      ...(lastGoodModel ? [lastGoodModel] : []),
      this.model,
      ...MODEL_FALLBACKS,
    ].filter((m, i, arr) => arr.indexOf(m) === i)

    let lastError: unknown

    for (const modelName of ordered) {
      const cooldownUntil = cooldowns.get(modelName) ?? 0
      if (cooldownUntil > Date.now()) {
        console.warn(`[gemini] skipping ${modelName} (quota cooldown, ${Math.ceil((cooldownUntil - Date.now()) / 1000)}s left)`)
        continue
      }

      try {
        const model = this.client.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
        })

        const result = await model.generateContent(userPrompt)
        const text = result.response.text()

        lastGoodModel = modelName
        cooldowns.delete(modelName)
        if (modelName !== this.model) {
          console.log(`[gemini] succeeded with ${modelName}`)
        }
        return { text }
      } catch (error) {
        lastError = error
        const msg = error instanceof Error ? error.message : String(error)
        console.warn(`[gemini] ${modelName} failed: ${msg.slice(0, 200)}`)

        if (isQuotaError(msg)) {
          cooldowns.set(modelName, Date.now() + QUOTA_COOLDOWN_MS)
          console.warn(`[gemini] ${modelName} on cooldown for 60s (daily quota)`)
          continue
        }
        if (/503|500|502|overloaded|high demand/i.test(msg)) {
          continue
        }
        throw error instanceof Error ? error : new Error('Gemini request failed')
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Gemini request failed')
  }
}
