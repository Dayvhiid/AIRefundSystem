import OpenAI from 'openai'
import type { LLMProvider, LLMResponse } from './types'

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI
  private model: string

  constructor(apiKey: string, model = 'gpt-4o') {
    this.client = new OpenAI({ apiKey })
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
      throw new Error('OpenAI response was empty')
    }

    return { text }
  }
}
