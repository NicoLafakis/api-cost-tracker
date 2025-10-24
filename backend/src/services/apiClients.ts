import axios, { AxiosInstance } from 'axios';

export interface UsageData {
  totalCost: number;
  tokenUsage: number;
  requestCount: number;
  modelBreakdown: Record<string, any>;
}

export interface ApiClient {
  validateKey(apiKey: string): Promise<boolean>;
  fetchUsage(apiKey: string, startDate: Date, endDate: Date): Promise<UsageData>;
}

class OpenAIClient implements ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.openai.com/v1',
      timeout: 10000,
    });
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const response = await this.client.get('/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async fetchUsage(apiKey: string, startDate: Date, endDate: Date): Promise<UsageData> {
    try {
      // OpenAI usage endpoint - using the billing/usage endpoint
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      const response = await this.client.get(`/usage?start_date=${start}&end_date=${end}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      const data = response.data;

      return {
        totalCost: data.total_usage || 0,
        tokenUsage: data.total_tokens || 0,
        requestCount: data.total_requests || 0,
        modelBreakdown: data.data || {},
      };
    } catch (error) {
      console.error('Error fetching OpenAI usage:', error);
      return {
        totalCost: 0,
        tokenUsage: 0,
        requestCount: 0,
        modelBreakdown: {},
      };
    }
  }
}

class AnthropicClient implements ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.anthropic.com/v1',
      timeout: 10000,
      headers: {
        'anthropic-version': '2023-06-01',
      },
    });
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      // Test with a minimal completion request
      const response = await this.client.post(
        '/messages',
        {
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        },
        {
          headers: { 'x-api-key': apiKey },
        }
      );
      return response.status === 200;
    } catch (error: any) {
      // If we get a 401, the key is invalid
      // Other errors might mean the key is valid but request failed
      return error.response?.status !== 401;
    }
  }

  async fetchUsage(apiKey: string, startDate: Date, endDate: Date): Promise<UsageData> {
    try {
      // Note: Anthropic doesn't have a direct usage API endpoint yet
      // This is a placeholder that would need to be implemented based on
      // their billing API when available

      // For now, we'll return mock data structure
      // In production, you'd query their usage/billing endpoint

      return {
        totalCost: 0,
        tokenUsage: 0,
        requestCount: 0,
        modelBreakdown: {},
      };
    } catch (error) {
      console.error('Error fetching Anthropic usage:', error);
      return {
        totalCost: 0,
        tokenUsage: 0,
        requestCount: 0,
        modelBreakdown: {},
      };
    }
  }
}

export const openaiClient = new OpenAIClient();
export const anthropicClient = new AnthropicClient();

export function getClient(provider: 'openai' | 'anthropic'): ApiClient {
  return provider === 'openai' ? openaiClient : anthropicClient;
}
