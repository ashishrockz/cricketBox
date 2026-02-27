/**
 * AuthContext.tsx
 *
 * Wraps the entire app and provides authentication state to every component.
 * On app launch it restores the session from AsyncStorage automatically.
 *
 * Usage:
 *   // _layout.tsx (or App.tsx)
 *   import { AuthProvider } from '@/context/AuthContext';
 *   <AuthProvider><Stack /></AuthProvider>
 *
 *   // Any screen / hook
 *   import { useAuthContext } from '@/context/AuthContext';
 *   const { user, isAuthenticated, loginWithPassword, logout } = useAuthContext();
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveTokens, clearTokens, getTokens, STORAGE_KEYS } from '../api/apiClient';
import * as authApi from '../api/authApi';
import type { User, ApiError, AuthResponse } from '../types';

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user:            User | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  error:           ApiError | null;

  register:          (payload: authApi.RegisterPayload)       => Promise<{ success: boolean; user?: User; error?: ApiError }>;
  loginWithPassword: (payload: authApi.LoginPayload)          => Promise<{ success: boolean; user?: User; error?: ApiError }>;
  requestOTP:        (payload: authApi.OTPRequestPayload)     => Promise<{ success: boolean; cooldownSeconds?: number; error?: ApiError }>;
  verifyOTP:         (payload: authApi.OTPVerifyPayload)      => Promise<{ success: boolean; user?: User; resetToken?: string; error?: ApiError }>;
  resetPassword:     (payload: authApi.ResetPasswordPayload)  => Promise<{ success: boolean; user?: User; error?: ApiError }>;
  changePassword:    (payload: authApi.ChangePasswordPayload) => Promise<{ success: boolean; error?: ApiError }>;
  logout:            () => Promise<void>;
  refreshUser:       () => Promise<User | null>;
  clearError:        () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user,      setUser]      = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true while restoring session
  const [error,     setError]     = useState<ApiError | null>(null);

  // ─── Restore session on mount ───────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        const { accessToken } = await getTokens();
        if (stored && accessToken) {
          setUser(JSON.parse(stored) as User);
        }
      } catch {
        // If anything fails just start logged out
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ─── Helpers ────────────────────────────────────────────────────────────

  const persistSession = async (u: User, access: string, refresh: string) => {
    await saveTokens(access, refresh);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u));
    setUser(u);
  };

  const handleError = (err: ApiError) => {
    setError(err);
    return { success: false as const, error: err };
  };

  const withLoading = async <T,>(fn: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      return await fn();
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Actions ─────────────────────────────────────────────────────────────

  const register = useCallback(async (payload: authApi.RegisterPayload) =>
    withLoading(async () => {
      try {
        const { data } = await authApi.register(payload);
        const { user: u, tokens: { accessToken, refreshToken } } = data.data;
        await persistSession(u, accessToken, refreshToken);
        return { success: true as const, user: u };
      } catch (err: any) { return handleError(err); }
    }),
  []);

  const loginWithPassword = useCallback(async (payload: authApi.LoginPayload) =>
    withLoading(async () => {
      try {
        const { data } = await authApi.login(payload);
        const { user: u, tokens: { accessToken, refreshToken } } = data.data;
        await persistSession(u, accessToken, refreshToken);
        return { success: true as const, user: u };
      } catch (err: any) { return handleError(err); }
    }),
  []);

  const requestOTP = useCallback(async (payload: authApi.OTPRequestPayload) =>
    withLoading(async () => {
      try {
        const { data } = await authApi.requestOTP(payload);
        return { success: true as const, cooldownSeconds: data.data.cooldownSeconds };
      } catch (err: any) { return handleError(err); }
    }),
  []);

  const verifyOTP = useCallback(async (payload: authApi.OTPVerifyPayload) =>
    withLoading(async () => {
      try {
        const { data } = await authApi.verifyOTP(payload);
        const { user: u, tokens, resetToken } = data.data as AuthResponse & { tokens?: { accessToken: string; refreshToken: string }; resetToken?: string };
        const accessToken = tokens?.accessToken;
        const refreshToken = tokens?.refreshToken;

        if (payload.purpose === 'password_reset') {
          return { success: true as const, resetToken };
        }
        if (accessToken && refreshToken && u) {
          await persistSession(u, accessToken, refreshToken);
        }
        return { success: true as const, user: u };
      } catch (err: any) { return handleError(err); }
    }),
  []);

  const resetPassword = useCallback(async (payload: authApi.ResetPasswordPayload) =>
    withLoading(async () => {
      try {
        const { data } = await authApi.resetPassword(payload);
        const { user: u, tokens: { accessToken, refreshToken } } = data.data;
        await persistSession(u, accessToken, refreshToken);
        return { success: true as const, user: u };
      } catch (err: any) { return handleError(err); }
    }),
  []);

  const changePassword = useCallback(async (payload: authApi.ChangePasswordPayload) =>
    withLoading(async () => {
      try {
        await authApi.changePassword(payload);
        return { success: true as const };
      } catch (err: any) { return handleError(err); }
    }),
  []);

  const logout = useCallback(async () => {
    try {
      const { refreshToken } = await getTokens();
      if (refreshToken) await authApi.logout(refreshToken);
    } catch { /* silent */ } finally {
      await clearTokens();
      setUser(null);
      setError(null);
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const { data } = await authApi.getMe();
      const u = data.data.user;
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u));
      setUser(u);
      return u;
    } catch { return null; }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // ─── Memoised value ───────────────────────────────────────────────────────

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    register,
    loginWithPassword,
    requestOTP,
    verifyOTP,
    resetPassword,
    changePassword,
    logout,
    refreshUser,
    clearError,
  }), [
    user, isLoading, error,
    register, loginWithPassword, requestOTP, verifyOTP,
    resetPassword, changePassword, logout, refreshUser, clearError,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Consumer hook ────────────────────────────────────────────────────────────

export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>');
  return ctx;
};
