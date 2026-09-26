import OpenAI from 'openai'
import type { LLMProvider, LLMResponse } from './types'

export class GrokProvider implements LLMProvider {
  private client: OpenAI
  private model: string

  constructor(apiKey: string, model = 'grok-2') {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.x.ai/v1',
    })
    this.model = model
  }

  async generateContent(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })

    const text = response.choices[0]?.message?.content
    if (!text) {
      throw new Error('Grok response was empty')
    }

    return { text }
  }
}
