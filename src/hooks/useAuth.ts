/**
 * useAuth — authentication hook
 *
 * Provides: register, loginWithPassword, requestOTP, verifyOTP,
 *           resetPassword, changePassword, logout, refreshUser
 *
 * State: user, isLoading, error, isAuthenticated
 */
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveTokens, clearTokens, getTokens } from '../api/apiClient';
import { STORAGE_KEYS } from '../api/apiClient';
import * as authApi from '../api/authApi';
import type { User, ApiError } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: ApiError | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: false,
    error: null,
  });

  const setLoading = () => setState((s) => ({ ...s, isLoading: true, error: null }));
  const setError   = (error: ApiError) => setState((s) => ({ ...s, isLoading: false, error }));

  // ─── Register ────────────────────────────────────────────────────────────

  const register = useCallback(async (payload: authApi.RegisterPayload) => {
    setLoading();
    try {
      const { data } = await authApi.register(payload);
      const { user, accessToken, refreshToken } = data.data;
      await saveTokens(accessToken, refreshToken);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      setState({ user, isLoading: false, error: null });
      return { success: true, user };
    } catch (err: any) {
      setError(err);
      return { success: false, error: err };
    }
  }, []);

  // ─── Login with password ─────────────────────────────────────────────────

  const loginWithPassword = useCallback(async (payload: authApi.LoginPayload) => {
    setLoading();
    try {
      const { data } = await authApi.login(payload);
      const { user, accessToken, refreshToken } = data.data;
      await saveTokens(accessToken, refreshToken);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      setState({ user, isLoading: false, error: null });
      return { success: true, user };
    } catch (err: any) {
      setError(err);
      return { success: false, error: err };
    }
  }, []);

  // ─── OTP: request ────────────────────────────────────────────────────────

  const requestOTP = useCallback(async (payload: authApi.OTPRequestPayload) => {
    setLoading();
    try {
      const { data } = await authApi.requestOTP(payload);
      setState((s) => ({ ...s, isLoading: false, error: null }));
      return { success: true, cooldownSeconds: data.data.cooldownSeconds };
    } catch (err: any) {
      setError(err);
      return { success: false, error: err };
    }
  }, []);

  // ─── OTP: verify (login or register_verify) ───────────────────────────────

  const verifyOTP = useCallback(async (payload: authApi.OTPVerifyPayload) => {
    setLoading();
    try {
      const { data } = await authApi.verifyOTP(payload);
      const { user, accessToken, refreshToken, resetToken } = data.data;

      // If it's a password_reset purpose, we only get resetToken (no session)
      if (payload.purpose === 'password_reset') {
        setState((s) => ({ ...s, isLoading: false, error: null }));
        return { success: true, resetToken };
      }

      if (accessToken && refreshToken) {
        await saveTokens(accessToken, refreshToken);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        setState({ user: user ?? null, isLoading: false, error: null });
      }
      return { success: true, user };
    } catch (err: any) {
      setError(err);
      return { success: false, error: err };
    }
  }, []);

  // ─── Reset password ───────────────────────────────────────────────────────

  const resetPassword = useCallback(async (payload: authApi.ResetPasswordPayload) => {
    setLoading();
    try {
      const { data } = await authApi.resetPassword(payload);
      const { user, accessToken, refreshToken } = data.data;
      await saveTokens(accessToken, refreshToken);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      setState({ user, isLoading: false, error: null });
      return { success: true, user };
    } catch (err: any) {
      setError(err);
      return { success: false, error: err };
    }
  }, []);

  // ─── Change password ──────────────────────────────────────────────────────

  const changePassword = useCallback(async (payload: authApi.ChangePasswordPayload) => {
    setLoading();
    try {
      await authApi.changePassword(payload);
      setState((s) => ({ ...s, isLoading: false, error: null }));
      return { success: true };
    } catch (err: any) {
      setError(err);
      return { success: false, error: err };
    }
  }, []);

  // ─── Logout ───────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    try {
      const { refreshToken } = await getTokens();
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // silent — always clear local storage regardless
    } finally {
      await clearTokens();
      setState({ user: null, isLoading: false, error: null });
    }
  }, []);

  // ─── Refresh user from server ─────────────────────────────────────────────

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authApi.getMe();
      const user = data.data.user;
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      setState((s) => ({ ...s, user }));
      return user;
    } catch {
      return null;
    }
  }, []);

  // ─── Restore session from AsyncStorage on app start ──────────────────────

  const restoreSession = useCallback(async () => {
    setLoading();
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const { accessToken } = await getTokens();
      if (stored && accessToken) {
        const user = JSON.parse(stored) as User;
        setState({ user, isLoading: false, error: null });
        return user;
      }
      setState((s) => ({ ...s, isLoading: false }));
      return null;
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
      return null;
    }
  }, []);

  return {
    // State
    user:            state.user,
    isLoading:       state.isLoading,
    error:           state.error,
    isAuthenticated: state.user !== null,

    // Actions
    register,
    loginWithPassword,
    requestOTP,
    verifyOTP,
    resetPassword,
    changePassword,
    logout,
    refreshUser,
    restoreSession,
  };
};
