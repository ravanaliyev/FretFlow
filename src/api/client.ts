import type { ApiError } from '../types/api';

// Storage key for persistent refresh tokens
const REFRESH_TOKEN_KEY = 'fretflow_refresh_token';
// Backend route endpoint to invoke token rotations
const REFRESH_ENDPOINT = '/api/auth/refresh';

// Synchronization states to prevent overlapping token renewal cycles
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Queue callbacks that wait for active token renewals to complete.
 */
function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

/**
 * Flush the callback queue, passing the newly generated access token.
 */
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

/**
 * Sends a physical HTTP call to backend services requesting new access and refresh tokens.
 */
async function doRefresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await fetch(REFRESH_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    throw new Error('Refresh failed');
  }

  const data = await res.json();
  // Persist the new refresh token locally
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  return data;
}

/**
 * Retrieves the fresh access token, queuing overlapping requests if a rotation is already active.
 */
async function getAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  // Queue current request if another thread is already refreshing tokens
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
  } catch (err) {
    // Catch-all
  } finally {
    isRefreshing = false;
  }
}

// Security recovery timeout: resets lock if token refresh operations hang longer than 10 seconds
setInterval(() => {
  if (isRefreshing) {
    isRefreshing = false;
    refreshSubscribers = [];
  }
}, 10000);

/**
 * Extended HTTP fetch request configuration.
 */
interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

/**
 * ApiClient Class
 * A lightweight wrapper over standard HTTP `fetch` client requests.
 * Automatically injects Authorization headers, handles token rotation loops,
 * and retries pending requests on 401 (Unauthorized) errors.
 */
class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Sets the volatile access token in runtime memory.
   */
  setToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Dispatches requests, injects auth headers, and processes auth recoveries or HTTP errors.
   */
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;

    // Append URL query parameters if present
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

    // Inject Bearer Authorization header if call is not targeting the token rotation endpoint
    if (endpoint !== REFRESH_ENDPOINT) {
      if (!this.accessToken) {
        this.accessToken = await getAccessToken();
      }
      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // 401 Unauthorized handling: attempt silent token renewal and retry
    if (response.status === 401) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken && !isRefreshing && !refreshSubscribers.length) {
        try {
          const tokens = await doRefresh(refreshToken);
          this.accessToken = tokens.accessToken;
          // Retry the original request with the fresh token
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            headers: { ...headers, 'Authorization': `Bearer ${this.accessToken}` },
          });
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        } catch {
          // Silent refresh failed: wipe tokens and force redirect to login screen
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login';
          }
        }
      }
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      
      if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
      
      throw new Error('Unauthorized');
    }

    // Capture other operational HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed', code: 'UNKNOWN' })) as ApiError;
      const error = new Error(errorData.error || 'Request failed') as Error & { code: string };
      error.code = errorData.code || 'UNKNOWN';
      throw error;
    }

    return response.json();
  }

  // RESTful Shortcut wrappers

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

// Export a single global instance of ApiClient with environment-based Base URL
export const apiClient = new ApiClient(import.meta.env.VITE_API_URL || '');

// Token persistence helpers
export function clearTokens() {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}