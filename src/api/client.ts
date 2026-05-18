import type { ApiError } from '../types/api';

/**
 * FretFlow HTTP İstemcisi Yapılandırma Dosyası
 * 
 * Bu dosya, backend sunucumuz ile kurulan tüm ağ (network) iletişimini yönetir.
 * - Tarayıcıda oturum sürekliliğini sağlamak için Token Rotasyonunu (Silent Refresh Token) yönetir.
 * - İsteklere otomatik olarak JWT token ekleyen interceptor (kesici) mantığına sahiptir.
 * - 401 Unauthorized (Yetkisiz Giriş) hatası alındığında kullanıcıyı otomatik olarak giriş ekranına yönlendirir.
 */

// Oturumu taze tutmak için kullanılan Refresh Token'ın tarayıcı belleğindeki (localStorage) anahtarı
const REFRESH_TOKEN_KEY = 'fretflow_refresh_token';

// Sunucuda token yenileme isteğinin yapılacağı uç nokta (API endpoint)
const REFRESH_ENDPOINT = '/api/auth/refresh';

// Aynı anda birden fazla istek yapıldığında, sunucuya mükerrer token tazeleme istekleri 
// gönderilmesini engelleyen eşzamanlılık (synchronization) kilitleri
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Token tazeleme işlemi devam ederken gelen diğer API isteklerini sıraya (kuyruğa) ekler.
 */
function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

/**
 * Token başarıyla yenilendiğinde, kuyrukta bekleyen tüm istekleri yeni token ile tetikler.
 */
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

/**
 * Sunucuya fiziksel bir POST isteği atarak yeni Access Token ve Refresh Token çiftini talep eder.
 */
async function doRefresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  const res = await fetch(`${cleanBaseUrl}${REFRESH_ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  // Yenileme başarısız olursa tarayıcıdaki tüm eski oturum verilerini sil ve hata fırlat
  if (!res.ok) {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    throw new Error('Refresh failed');
  }

  const data = await res.json();
  // Yeni gelen Refresh Token'ı tarayıcıda güncelle
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  return data;
}

/**
 * Kuyruk kilidini kontrol ederek anlık erişim token'ını (Access Token) döndürür veya yeniler.
 */
async function getAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  // Eğer arka planda zaten bir yenileme işlemi devam ediyorsa, isteği kuyruğa sok
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
    return null;
  } finally {
    isRefreshing = false;
  }
}

// Güvenlik Kilidi: Eğer token yenileme işlemi herhangi bir sebeple 10 saniyeden uzun sürerse kilidi sıfırla
setInterval(() => {
  if (isRefreshing) {
    isRefreshing = false;
    refreshSubscribers = [];
  }
}, 10000);

/**
 * Genişletilmiş HTTP istek parametre arayüzü.
 */
interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

/**
 * ApiClient Sınıfı
 * fetch API'sini saran hafif bir HTTP istemci sarmalayıcısıdır.
 * İstek başlıklarına (headers) otomatik Authorization JWT ekler, hata yakalamalarını yapar.
 */
class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string = '') {
    // Çift slaş hatasını (//api) önlemek için sondaki slaşları temizler
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  /**
   * Çalışma zamanı hafızasındaki Access Token'ı günceller.
   */
  setToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Sunucuya asenkron HTTP isteği fırlatan ve JWT hatalarını yöneten ana gövde fonksiyonu.
   */
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;

    // URL parametreleri (Query Params) varsa url sonuna ekle (Örn: ?page=1&limit=20)
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

    // Eğer istek token yenileme endpoint'ine gitmiyorsa, isteğe JWT Bearer ekle
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

    // 401 Yetkisiz Giriş Hatası Alındığında: Otomatik Token yenilemeyi dene ve isteği tekrar fırlat
    if (response.status === 401) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken && !isRefreshing && !refreshSubscribers.length) {
        try {
          const tokens = await doRefresh(refreshToken);
          this.accessToken = tokens.accessToken;
          // İsteği yeni token ile tekrar fırlat (Retry)
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            headers: { ...headers, 'Authorization': `Bearer ${this.accessToken}` },
          });
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        } catch {
          // Token yenileme başarısızsa tüm yerel depoyu temizle ve giriş sayfasına postala
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

    // 401 dışındaki diğer tüm HTTP hatalarını (500, 400, 404 vb.) yakala ve hata fırlat
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed', code: 'UNKNOWN' })) as ApiError;
      const error = new Error(errorData.error || 'Request failed') as Error & { code: string };
      error.code = errorData.code || 'UNKNOWN';
      throw error;
    }

    return response.json();
  }

  // REST Kısayol Yardımcıları

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

// Projede kullanılacak global apiClient nesnesini dışa aktarır
export const apiClient = new ApiClient(import.meta.env.VITE_API_URL || '');

// Oturum temizleme ve kaydetme yardımcı fonksiyonları
export function clearTokens() {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}