import type { ApiError } from '../types/api';

const REFRESH_TOKEN_KEY = 'fretflow_refresh_token';
const REFRESH_ENDPOINT = '/api/auth/refresh';

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

async function doRefresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await fetch(REFRESH_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.location.href = '/login';
    throw new Error('Refresh failed');
  }

  const data = await res.json();
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  return data;
}

async function getAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  if (isRefreshing) {
    return new Promise(resolve => {
      subscribeTokenRefresh(resolve);
    });
  }

  isRefreshing = true;

  try {
    const tokens = await doRefresh(refreshToken);
    onTokenRefreshed(tokens.accessToken);
    return tokens.accessToken;
  } finally {
    isRefreshing = false;
  }
}

// Recovery timeout for stuck refresh
setInterval(() => {
  if (isRefreshing) {
    isRefreshing = false;
    refreshSubscribers = [];
  }
}, 10000);

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
      const query = searchParams.toString();
      if (query) url += `?${query}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    };

    const accessToken = await getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (response.status === 401) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
<<<<<<< HEAD
      if (refreshToken && !isRefreshing && !refreshSubscribers.length) {
=======
      if (refreshToken && !isRefreshing && !refreshSubscribers.length) {
>>>>>>> origin/main
        try {
          const tokens = await doRefresh(refreshToken);
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            headers: { ...headers, 'Authorization': `Bearer ${tokens.accessToken}` },
          });
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        } catch {
          // Refresh failed, redirect to login
        }
      }
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed', code: 'UNKNOWN' })) as ApiError;
      const error = new Error(errorData.error || 'Request failed') as Error & { code: string };
      error.code = errorData.code || 'UNKNOWN';
      throw error;
    }

    return response.json();
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

export function clearTokens() {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}