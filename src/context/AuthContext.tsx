import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiClient, clearTokens, setRefreshToken } from '../api/client';
import type { User, AuthResponse } from '../types/api';

/**
 * Interface representing the volatile core authentication state.
 */
interface AuthState {
  user: User | null;          // Currently authenticated user object
  isAuthenticated: boolean;   // Quick boolean accessor for auth status
  isLoading: boolean;         // Initial loading state while restoring session from localStorage
  accessToken: string | null; // Volatile JWT access token in memory
  authError: string | null;   // Active authentication error messages
}

/**
 * Interface representing the exported context actions and states.
 */
interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  updateUser: (newUser: User) => void;
  clearAuthError: () => void;
}

// Instantiate React Context
const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * AuthProvider Component
 * The top-level global authentication state wrapper.
 * - Restores user session automatically on boot by querying `/api/auth/me`.
 * - Exposes callbacks for logging in, signing up new accounts, logging out, and updating profile settings.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Clears active authentication errors from state
  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Updates current user metadata (e.g. on XP rewards or username changes)
  const updateUser = useCallback((newUser: User) => {
    setUser(newUser);
  }, []);

  // Signs out the user, invalidating tokens and informing the backend service
  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('fretflow_refresh_token');
    setUser(null);
    setAccessToken(null);
    clearTokens();
    if (refreshToken) {
      apiClient.post('/api/auth/logout', { refreshToken }).catch(() => { });
    }
  }, []);

  // Auto-restore session from localStorage on application boot
  useEffect(() => {
    const refreshToken = localStorage.getItem('fretflow_refresh_token');
    if (refreshToken) {
      // apiClient automatically rotates the access token internally if expired
      apiClient.get<User>('/api/auth/me')
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          // Invalidate and sign out if the session is fully expired
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
   * Logs in a user.
   */
  const login = async (email: string, password: string) => {
    const data = await apiClient.post<AuthResponse>('/api/auth/login', { email, password });
    setRefreshToken(data.refreshToken);
    apiClient.setToken(data.accessToken);
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  /**
   * Registers a new user.
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
 * Custom hook to easily consume authentication contexts.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}