import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiClient, clearTokens, setRefreshToken } from '../api/client';
import type { User, AuthResponse } from '../types/api';

/**
 * Kimlik Doğrulama Durum Arayüzü (AuthState)
 */
interface AuthState {
  user: User | null;          // Giriş yapmış kullanıcının profil detaylarını barındıran nesne (yoksa null)
  isAuthenticated: boolean;   // Oturumun açık olup olmadığını hızlıca kontrol eden boolean
  isLoading: boolean;         // Sayfa ilk açıldığında localStorage'dan oturum kurtarılırken aktif olan yükleniyor durumu
  accessToken: string | null; // Çalışma zamanı RAM belleğinde saklanan geçici JWT Access Token'ı
  authError: string | null;   // Oturum açma/kayıt işlemleri sırasında oluşan hata mesajları
}

/**
 * React Context Tarafından Dışa Aktarılan Fonksiyonlar ve Durumlar Arayüzü (AuthContextValue)
 */
interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  updateUser: (newUser: User) => void;
  clearAuthError: () => void;
}

// React Context nesnesinin oluşturulması
const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * AuthProvider Bileşeni
 * 
 * Uygulamanın en tepesinde yer alan ve tüm alt sayfalara (components) oturum durumunu
 * dağıtan global sağlayıcıdır.
 * - Tarayıcı ilk açıldığında localStorage'daki refresh token ile sessiz oturum açma (`/api/auth/me`) gerçekleştirir.
 * - Giriş yapma, üye olma, çıkış yapma ve kullanıcı XP puanı güncellemelerini tek bir merkezden yönetir.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Hata mesajlarını sıfırlayan yardımcı fonksiyon
  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Kullanıcı nesnesini günceller (Örn: Ders bitiminde XP arttığında veya avatar değiştiğinde çağrılır)
  const updateUser = useCallback((newUser: User) => {
    setUser(newUser);
  }, []);

  // Kullanıcı oturumunu tarayıcıda ve sunucuda kalıcı olarak sonlandırır (Çıkış yapar)
  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('fretflow_refresh_token');
    setUser(null);
    setAccessToken(null);
    clearTokens(); // Tarayıcıdaki token'ları temizler
    if (refreshToken) {
      // Sunucuya da çıkış yapıldığını bildirir ki token geçersiz kılınsın
      apiClient.post('/api/auth/logout', { refreshToken }).catch(() => { });
    }
  }, []);

  // Uygulama ilk açıldığında (App Boot) çalışarak eski oturumu otomatik kurtarır (Auto-login)
  useEffect(() => {
    const refreshToken = localStorage.getItem('fretflow_refresh_token');
    if (refreshToken) {
      // apiClient sınıfı token süresi bittiyse arka planda otomatik yenileme (refresh) yapar
      apiClient.get<User>('/api/auth/me')
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          // Oturum tamamen eskimiş veya geçersiz kılınmışsa token'ları temizle
          clearTokens();
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  /**
   * login - E-posta ve şifre ile sisteme giriş yapar.
   * Başarılı olursa dönen Access Token ve Refresh Token'ları belleğe ve localStorage'a işler.
   */
  const login = async (email: string, password: string) => {
    const data = await apiClient.post<AuthResponse>('/api/auth/login', { email, password });
    setRefreshToken(data.refreshToken);
    apiClient.setToken(data.accessToken);
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  /**
   * register - Belirlenen e-posta, şifre ve kullanıcı adı ile yeni bir üyelik oluşturur.
   * Başarılı olursa otomatik olarak sisteme giriş yaptırır.
   */
  const register = async (email: string, password: string, username: string) => {
    const data = await apiClient.post<AuthResponse>('/api/auth/register', { email, password, username });
    setRefreshToken(data.refreshToken);
    apiClient.setToken(data.accessToken);
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        accessToken,
        authError,
        login,
        register,
        logout,
        updateUser,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth - Kimlik doğrulama verilerine ve metotlarına (login, logout, register)
 * alt bileşenlerden kolayca erişmek için kullanılan özel React Hook'u.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}