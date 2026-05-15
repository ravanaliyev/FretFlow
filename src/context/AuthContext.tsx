import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiClient, clearTokens, setRefreshToken } from '../api/client';
import type { User, AuthResponse } from '../types/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  authError: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  updateUser: (newUser: User) => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const updateUser = useCallback((newUser: User) => {
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('fretflow_refresh_token');
    setUser(null);
    setAccessToken(null);
    clearTokens();
    if (refreshToken) {
      apiClient.post('/api/auth/logout', { refreshToken }).catch(() => { });
    }
  }, []);

  useEffect(() => {
    const refreshToken = localStorage.getItem('fretflow_refresh_token');
    if (refreshToken) {
      // Use /api/auth/me instead of /api/auth/refresh manually.
      // apiClient will automatically handle the refresh if needed.
      apiClient.get<User>('/api/auth/me')
        .then(userData => {
          setUser(userData);
          // Access token is handled internally by apiClient's closure/localStorage
        })
        .catch(() => {
          // If even the refresh fails, logout
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

  const login = async (email: string, password: string) => {
    const data = await apiClient.post<AuthResponse>('/api/auth/login', { email, password });
    setRefreshToken(data.refreshToken);
    apiClient.setToken(data.accessToken);
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

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

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}