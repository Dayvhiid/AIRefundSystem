export interface LLMResponse {
  text: string
}

export interface LLMProvider {
  generateContent(systemPrompt: string, userPrompt: string): Promise<LLMResponse>
}

export type ProviderName = 'gemini' | 'anthropic' | 'openai' | 'grok' | 'groq'
