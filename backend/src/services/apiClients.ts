import axios, { AxiosInstance } from 'axios';
import { calculateCost } from '../config/pricing';

export interface ModelUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  requests: number;
}

export interface UsageData {
  totalCost: number;
  tokenUsage: number; // Total tokens (for backward compatibility)
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  requestCount: number;
  requestsWithSearch?: number;
  modelBreakdown: ModelUsage[];
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
      // Convert dates to Unix timestamps
      const startTime = Math.floor(startDate.getTime() / 1000);
      const endTime = Math.floor(endDate.getTime() / 1000);

      // Use OpenAI's Usage API
      const response = await axios.get(
        `https://api.openai.com/v1/organization/usage/completions`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          params: {
            start_time: startTime,
            end_time: endTime,
            bucket_width: '1d',
          },
        }
      );

      const buckets = response.data.data || [];
      const modelUsageMap: Record<string, ModelUsage> = {};
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let totalCachedTokens = 0;
      let totalRequests = 0;

      // Aggregate usage across all buckets
      for (const bucket of buckets) {
        const results = bucket.results || [];
        for (const result of results) {
          const model = result.model || 'unknown';
          const inputTokens = result.input_tokens || 0;
          const outputTokens = result.output_tokens || 0;
          const cachedTokens = result.input_cached_tokens || 0;
          const requests = result.num_model_requests || 0;

          if (!modelUsageMap[model]) {
            modelUsageMap[model] = {
              model,
              inputTokens: 0,
              outputTokens: 0,
              cachedTokens: 0,
              requests: 0,
            };
          }

          modelUsageMap[model].inputTokens += inputTokens;
          modelUsageMap[model].outputTokens += outputTokens;
          modelUsageMap[model].cachedTokens += cachedTokens;
          modelUsageMap[model].requests += requests;

          totalInputTokens += inputTokens;
          totalOutputTokens += outputTokens;
          totalCachedTokens += cachedTokens;
          totalRequests += requests;
        }
      }

      const modelBreakdown = Object.values(modelUsageMap);

      // Calculate total cost using pricing config
      let totalCost = 0;
      for (const usage of modelBreakdown) {
        totalCost += calculateCost('openai', usage.model, usage.inputTokens, usage.outputTokens);
      }

      return {
        totalCost,
        tokenUsage: totalInputTokens + totalOutputTokens,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cachedTokens: totalCachedTokens,
        requestCount: totalRequests,
        modelBreakdown,
      };
    } catch (error) {
      console.error('Error fetching OpenAI usage:', error);
      return {
        totalCost: 0,
        tokenUsage: 0,
        inputTokens: 0,
        outputTokens: 0,
        cachedTokens: 0,
        requestCount: 0,
        modelBreakdown: [],
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
      // Use Anthropic's Admin API for usage reporting
      // Note: This requires an Admin API key, not a regular API key
      const startingAt = startDate.toISOString();

      const response = await axios.get(
        `https://api.anthropic.com/v1/organizations/usage_report/messages`,
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          params: {
            starting_at: startingAt,
            'group_by[]': ['model'],
            limit: 1000,
          },
        }
      );

      const data = response.data.data || [];
      const modelUsageMap: Record<string, ModelUsage> = {};
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let totalCachedTokens = 0;
      let totalRequests = 0;
      let searchRequests = 0;

      // Process all time buckets
      for (const bucket of data) {
        const endingAt = new Date(bucket.ending_at);
        // Only include data within our date range
        if (endingAt > endDate) break;

        const results = bucket.results || [];
        for (const result of results) {
          const model = result.model || 'unknown';
          const inputTokens = result.uncached_input_tokens || 0;
          const outputTokens = result.output_tokens || 0;
          const cacheCreationTokens =
            (result.cache_creation?.ephemeral_1h_input_tokens || 0) +
            (result.cache_creation?.ephemeral_5m_input_tokens || 0);
          const cacheReadTokens = result.cache_read_input_tokens || 0;

          // Estimate requests (Anthropic doesn't provide this directly)
          // We'll use a heuristic based on token usage
          const estimatedRequests = Math.max(1, Math.floor((inputTokens + outputTokens) / 1000));

          if (!modelUsageMap[model]) {
            modelUsageMap[model] = {
              model,
              inputTokens: 0,
              outputTokens: 0,
              cachedTokens: 0,
              requests: 0,
            };
          }

          modelUsageMap[model].inputTokens += inputTokens + cacheCreationTokens;
          modelUsageMap[model].outputTokens += outputTokens;
          modelUsageMap[model].cachedTokens += cacheReadTokens;
          modelUsageMap[model].requests += estimatedRequests;

          totalInputTokens += inputTokens + cacheCreationTokens;
          totalOutputTokens += outputTokens;
          totalCachedTokens += cacheReadTokens;
          totalRequests += estimatedRequests;

          // Track search requests if available
          if (result.server_tool_use?.web_search_requests) {
            searchRequests += result.server_tool_use.web_search_requests;
          }
        }
      }

      const modelBreakdown = Object.values(modelUsageMap);

      // Calculate total cost using pricing config
      let totalCost = 0;
      for (const usage of modelBreakdown) {
        totalCost += calculateCost('anthropic', usage.model, usage.inputTokens, usage.outputTokens);
      }

      return {
        totalCost,
        tokenUsage: totalInputTokens + totalOutputTokens,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cachedTokens: totalCachedTokens,
        requestCount: totalRequests,
        requestsWithSearch: searchRequests,
        modelBreakdown,
      };
    } catch (error: any) {
      console.error('Error fetching Anthropic usage:', error.response?.data || error.message);
      // If it's a 401, the API key might not be an Admin key
      if (error.response?.status === 401) {
        console.warn('Anthropic Admin API requires an Admin API key, not a regular API key');
      }
      return {
        totalCost: 0,
        tokenUsage: 0,
        inputTokens: 0,
        outputTokens: 0,
        cachedTokens: 0,
        requestCount: 0,
        modelBreakdown: [],
      };
    }
  }
}

class GeminiClient implements ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      timeout: 10000,
    });
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      // Test by listing models
      const response = await this.client.get('/models', {
        params: { key: apiKey },
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async fetchUsage(apiKey: string, startDate: Date, endDate: Date): Promise<UsageData> {
    try {
      // Note: Google AI Studio API doesn't have a direct usage reporting endpoint
      // Usage needs to be tracked in Google Cloud Console or through Cloud Monitoring API
      // This is a limitation of the free Gemini API tier

      // For production use, you'd need to:
      // 1. Use Vertex AI on Google Cloud Platform instead
      // 2. Set up Cloud Monitoring and query metrics programmatically
      // 3. Or track usage client-side by logging each API response's usage_metadata

      console.warn('Gemini API does not provide historical usage data. Use Google Cloud Console or Vertex AI for usage tracking.');

      return {
        totalCost: 0,
        tokenUsage: 0,
        inputTokens: 0,
        outputTokens: 0,
        cachedTokens: 0,
        requestCount: 0,
        modelBreakdown: [],
      };
    } catch (error) {
      console.error('Error fetching Gemini usage:', error);
      return {
        totalCost: 0,
        tokenUsage: 0,
        inputTokens: 0,
        outputTokens: 0,
        cachedTokens: 0,
        requestCount: 0,
        modelBreakdown: [],
      };
    }
  }
}

class PerplexityClient implements ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.perplexity.ai',
      timeout: 10000,
    });
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      // Test with a minimal completion request
      const response = await this.client.post(
        '/chat/completions',
        {
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.status === 200;
    } catch (error: any) {
      // If we get a 401, the key is invalid
      return error.response?.status !== 401;
    }
  }

  async fetchUsage(apiKey: string, startDate: Date, endDate: Date): Promise<UsageData> {
    try {
      // Note: Perplexity API does not provide a usage/billing endpoint yet
      // Users need to check usage in the Perplexity API dashboard
      // For production tracking, you would need to:
      // 1. Log each API response's usage field client-side
      // 2. Store usage data in your own database
      // 3. Check the dashboard manually at https://www.perplexity.ai/settings/api

      console.warn('Perplexity API does not provide historical usage data endpoint. Check dashboard at perplexity.ai/settings/api');

      return {
        totalCost: 0,
        tokenUsage: 0,
        inputTokens: 0,
        outputTokens: 0,
        cachedTokens: 0,
        requestCount: 0,
        modelBreakdown: [],
      };
    } catch (error) {
      console.error('Error fetching Perplexity usage:', error);
      return {
        totalCost: 0,
        tokenUsage: 0,
        inputTokens: 0,
        outputTokens: 0,
        cachedTokens: 0,
        requestCount: 0,
        modelBreakdown: [],
      };
    }
  }
}

export const openaiClient = new OpenAIClient();
export const anthropicClient = new AnthropicClient();
export const geminiClient = new GeminiClient();
export const perplexityClient = new PerplexityClient();

export function getClient(provider: 'openai' | 'anthropic' | 'gemini' | 'perplexity'): ApiClient {
  switch (provider) {
    case 'openai':
      return openaiClient;
    case 'anthropic':
      return anthropicClient;
    case 'gemini':
      return geminiClient;
    case 'perplexity':
      return perplexityClient;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
