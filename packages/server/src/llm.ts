import OpenAI from 'openai';

export interface LLMProvider {
  name: string;
  generateJSON(systemPrompt: string, userPrompt: string): Promise<any>;
}

class DeepSeekProvider implements LLMProvider {
  name = 'deepseek';
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, baseURL: string, model: string) {
    this.client = new OpenAI({ apiKey, baseURL });
    this.model = model;
  }

  async generateJSON(systemPrompt: string, userPrompt: string): Promise<any> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('LLM returned empty content');
    }

    try {
      return JSON.parse(content);
    } catch (err) {
      // 兜底：偶尔模型会带 markdown 代码块，剥掉再试
      const cleaned = content.replace(/```json\s*|\s*```/g, '').trim();
      return JSON.parse(cleaned);
    }
  }
}

export function createLLMProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER || 'deepseek';

  if (provider === 'deepseek') {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey || apiKey.startsWith('sk-your-')) {
      throw new Error(
        'DEEPSEEK_API_KEY 未配置。请到 https://platform.deepseek.com 申请后填到 .env'
      );
    }
    return new DeepSeekProvider(
      apiKey,
      process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      process.env.DEEPSEEK_MODEL || 'deepseek-chat'
    );
  }

  throw new Error(`Unknown LLM_PROVIDER: ${provider}`);
}
