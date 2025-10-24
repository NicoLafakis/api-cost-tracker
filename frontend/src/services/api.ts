import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface ApiKey {
  id: number;
  label: string;
  provider: 'openai' | 'anthropic';
  workspace: string | null;
  is_active: boolean;
  created_at: string;
  last_validated_at: string | null;
}

export interface DashboardCard {
  keyId: number;
  label: string;
  provider: string;
  workspace: string | null;
  currentBalance: number;
  mtdSpend: number;
  dailyAverage: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

export interface DashboardData {
  cards: DashboardCard[];
  totals: {
    totalSpend: number;
    totalKeys: number;
    avgDailySpend: number;
  };
}

export interface UsageSnapshot {
  snapshot_date: string;
  total_cost: number;
  token_usage: number;
  request_count: number;
  model_breakdown: any;
}

export interface SpendingAlert {
  id: number;
  api_key_id: number;
  threshold_amount: number;
  threshold_type: 'daily' | 'monthly';
  alert_email: string | null;
  is_enabled: boolean;
  last_triggered_at: string | null;
}

// API Key endpoints
export const apiKeyService = {
  getAll: () => api.get<ApiKey[]>('/keys'),
  add: (data: { label: string; provider: string; apiKey: string; workspace?: string }) =>
    api.post('/keys', data),
  update: (id: number, data: { label?: string; workspace?: string }) =>
    api.patch(`/keys/${id}`, data),
  delete: (id: number) => api.delete(`/keys/${id}`),
  validate: (id: number) => api.post(`/keys/${id}/validate`),
};

// Usage endpoints
export const usageService = {
  getDashboard: (timeRange = '30d') =>
    api.get<DashboardData>('/usage/dashboard', { params: { timeRange } }),
  getTimeSeries: (keyId: number, days = 30) =>
    api.get<UsageSnapshot[]>(`/usage/timeseries/${keyId}`, { params: { days } }),
  getComparison: (keyIds: number[], days = 30) =>
    api.get('/usage/compare', { params: { keyIds: keyIds.join(','), days } }),
  getModelBreakdown: (keyId: number, days = 30) =>
    api.get(`/usage/models/${keyId}`, { params: { days } }),
};

// Alert endpoints
export const alertService = {
  getAll: () => api.get<SpendingAlert[]>('/alerts'),
  getByKey: (keyId: number) => api.get<SpendingAlert[]>(`/alerts/key/${keyId}`),
  create: (data: {
    apiKeyId: number;
    thresholdAmount: number;
    thresholdType: 'daily' | 'monthly';
    alertEmail?: string;
  }) => api.post('/alerts', data),
  update: (
    id: number,
    data: {
      thresholdAmount?: number;
      thresholdType?: 'daily' | 'monthly';
      alertEmail?: string;
      isEnabled?: boolean;
    }
  ) => api.patch(`/alerts/${id}`, data),
  delete: (id: number) => api.delete(`/alerts/${id}`),
};

// Preferences endpoints
export const preferencesService = {
  getAll: () => api.get<Record<string, string>>('/preferences'),
  update: (key: string, value: string) => api.put(`/preferences/${key}`, { value }),
};

export default api;
