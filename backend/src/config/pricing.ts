/**
 * Model pricing configuration for AI providers
 * Prices are in USD per million tokens
 * Updated: November 2025
 */

export interface ModelPricing {
  inputPrice: number;  // Per million tokens
  outputPrice: number; // Per million tokens
  displayName: string;
  deprecated?: boolean;
}

export interface ProviderPricing {
  [model: string]: ModelPricing;
}

export const PRICING_CONFIG: Record<string, ProviderPricing> = {
  openai: {
    // GPT-4o family
    'gpt-4o': {
      inputPrice: 2.50,
      outputPrice: 10.00,
      displayName: 'GPT-4o',
    },
    'gpt-4o-mini': {
      inputPrice: 0.15,
      outputPrice: 0.60,
      displayName: 'GPT-4o Mini',
    },
    // GPT-4 family
    'gpt-4': {
      inputPrice: 30.00,
      outputPrice: 60.00,
      displayName: 'GPT-4',
    },
    'gpt-4-turbo': {
      inputPrice: 10.00,
      outputPrice: 30.00,
      displayName: 'GPT-4 Turbo',
    },
    // GPT-3.5 family
    'gpt-3.5-turbo': {
      inputPrice: 0.50,
      outputPrice: 1.50,
      displayName: 'GPT-3.5 Turbo',
    },
    // Embeddings
    'text-embedding-3-small': {
      inputPrice: 0.02,
      outputPrice: 0,
      displayName: 'Text Embedding 3 Small',
    },
    'text-embedding-3-large': {
      inputPrice: 0.13,
      outputPrice: 0,
      displayName: 'Text Embedding 3 Large',
    },
    // Image models
    'dall-e-3': {
      inputPrice: 0,
      outputPrice: 0.040, // Per image (standard 1024x1024)
      displayName: 'DALL-E 3',
    },
  },

  anthropic: {
    // Claude Sonnet 4.5
    'claude-sonnet-4-5': {
      inputPrice: 3.00,
      outputPrice: 15.00,
      displayName: 'Claude Sonnet 4.5',
    },
    'claude-sonnet-4-5-20250514': {
      inputPrice: 3.00,
      outputPrice: 15.00,
      displayName: 'Claude Sonnet 4.5',
    },
    // Claude Opus 4.1
    'claude-opus-4-1': {
      inputPrice: 15.00,
      outputPrice: 75.00,
      displayName: 'Claude Opus 4.1',
    },
    // Claude Haiku 4.5
    'claude-haiku-4-5': {
      inputPrice: 1.00,
      outputPrice: 5.00,
      displayName: 'Claude Haiku 4.5',
    },
    // Claude 3.5 family
    'claude-3-5-sonnet-20241022': {
      inputPrice: 3.00,
      outputPrice: 15.00,
      displayName: 'Claude 3.5 Sonnet',
    },
    'claude-3-5-haiku-20241022': {
      inputPrice: 0.80,
      outputPrice: 4.00,
      displayName: 'Claude 3.5 Haiku',
    },
    // Claude 3 family
    'claude-3-opus-20240229': {
      inputPrice: 15.00,
      outputPrice: 75.00,
      displayName: 'Claude 3 Opus',
    },
    'claude-3-sonnet-20240229': {
      inputPrice: 3.00,
      outputPrice: 15.00,
      displayName: 'Claude 3 Sonnet',
    },
    'claude-3-haiku-20240307': {
      inputPrice: 0.25,
      outputPrice: 1.25,
      displayName: 'Claude 3 Haiku',
    },
  },

  gemini: {
    // Gemini 2.5 Flash
    'gemini-2.5-flash': {
      inputPrice: 0.15,
      outputPrice: 0.60,
      displayName: 'Gemini 2.5 Flash',
    },
    'gemini-2.5-flash-reasoning': {
      inputPrice: 0.15,
      outputPrice: 3.50,
      displayName: 'Gemini 2.5 Flash (Reasoning)',
    },
    // Gemini 2.0 Flash
    'gemini-2.0-flash': {
      inputPrice: 0.10,
      outputPrice: 0.40,
      displayName: 'Gemini 2.0 Flash',
    },
    'gemini-2.0-flash-lite': {
      inputPrice: 0.02,
      outputPrice: 0.08,
      displayName: 'Gemini 2.0 Flash Lite',
    },
    // Gemini 1.5 Pro
    'gemini-1.5-pro': {
      inputPrice: 1.25,
      outputPrice: 5.00,
      displayName: 'Gemini 1.5 Pro',
    },
    'gemini-1.5-flash': {
      inputPrice: 0.075,
      outputPrice: 0.30,
      displayName: 'Gemini 1.5 Flash',
    },
    // Gemini Pro
    'gemini-pro': {
      inputPrice: 0.50,
      outputPrice: 1.50,
      displayName: 'Gemini Pro',
    },
  },

  perplexity: {
    // Sonar models
    'sonar': {
      inputPrice: 1.00,
      outputPrice: 1.00,
      displayName: 'Sonar',
    },
    'sonar-pro': {
      inputPrice: 3.00,
      outputPrice: 15.00,
      displayName: 'Sonar Pro',
    },
    'sonar-reasoning': {
      inputPrice: 1.00,
      outputPrice: 5.00,
      displayName: 'Sonar Reasoning',
    },
    'sonar-reasoning-pro': {
      inputPrice: 3.00,
      outputPrice: 15.00,
      displayName: 'Sonar Reasoning Pro',
    },
    // Chat models (open source)
    'llama-3.1-sonar-small-128k-chat': {
      inputPrice: 0.20,
      outputPrice: 0.20,
      displayName: 'Llama 3.1 Sonar Small',
    },
    'llama-3.1-sonar-large-128k-chat': {
      inputPrice: 1.00,
      outputPrice: 1.00,
      displayName: 'Llama 3.1 Sonar Large',
    },
    'llama-3.1-sonar-huge-128k-online': {
      inputPrice: 5.00,
      outputPrice: 5.00,
      displayName: 'Llama 3.1 Sonar Huge',
    },
  },
};

/**
 * Calculate the cost for a given model and token usage
 */
export function calculateCost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const providerPricing = PRICING_CONFIG[provider.toLowerCase()];
  if (!providerPricing) {
    console.warn(`Unknown provider: ${provider}`);
    return 0;
  }

  // Try exact match first
  let pricing = providerPricing[model];

  // If no exact match, try to find a partial match
  if (!pricing) {
    const modelKey = Object.keys(providerPricing).find(key =>
      model.includes(key) || key.includes(model)
    );
    if (modelKey) {
      pricing = providerPricing[modelKey];
    }
  }

  if (!pricing) {
    console.warn(`Unknown model: ${model} for provider ${provider}`);
    return 0;
  }

  // Calculate cost: (tokens / 1,000,000) * price_per_million
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPrice;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPrice;

  return inputCost + outputCost;
}

/**
 * Get pricing info for a specific model
 */
export function getModelPricing(provider: string, model: string): ModelPricing | null {
  const providerPricing = PRICING_CONFIG[provider.toLowerCase()];
  if (!providerPricing) {
    return null;
  }

  // Try exact match first
  let pricing = providerPricing[model];

  // If no exact match, try to find a partial match
  if (!pricing) {
    const modelKey = Object.keys(providerPricing).find(key =>
      model.includes(key) || key.includes(model)
    );
    if (modelKey) {
      pricing = providerPricing[modelKey];
    }
  }

  return pricing || null;
}

/**
 * Get all available models for a provider
 */
export function getProviderModels(provider: string): string[] {
  const providerPricing = PRICING_CONFIG[provider.toLowerCase()];
  if (!providerPricing) {
    return [];
  }
  return Object.keys(providerPricing);
}

/**
 * Get all supported providers
 */
export function getSupportedProviders(): string[] {
  return Object.keys(PRICING_CONFIG);
}
