/**
 * apiClient.ts
 * Base Axios instance — automatic token injection + silent refresh on 401
 *
 * Install deps:
 *   npm install axios @react-native-async-storage/async-storage
 */

import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { ApiError } from '../types';

// ─── Config ───────────────────────────────────────────────────────────────────

const DEV_IOS     = 'https://cricket-backend-orkc.onrender.com';
const DEV_ANDROID = 'https://cricket-backend-orkc.onrender.com';
const PROD        = 'https://cricket-backend-orkc.onrender.com'; // ← change for production

export const BASE_URL = __DEV__
  ? Platform.OS === 'android' ? DEV_ANDROID : DEV_IOS
  : PROD;

export const API_URL = `${BASE_URL}/api/v1`;

export const STORAGE_KEYS = {
  ACCESS_TOKEN:  '@cricket:access_token',
  REFRESH_TOKEN: '@cricket:refresh_token',
  USER:          '@cricket:user',
} as const;

// ─── Token helpers ────────────────────────────────────────────────────────────

export const getTokens = async (): Promise<{ accessToken: string | null; refreshToken: string | null }> => {
  const results = await AsyncStorage.multiGet([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
  ]);
  return {
    accessToken:  results[0][1],
    refreshToken: results[1][1],
  };
};

export const saveTokens = async (accessToken: string, refreshToken?: string): Promise<void> => {
  const pairs: [string, string][] = [[STORAGE_KEYS.ACCESS_TOKEN, accessToken]];
  if (refreshToken) pairs.push([STORAGE_KEYS.REFRESH_TOKEN, refreshToken]);
  await AsyncStorage.multiSet(pairs);
};

export const clearTokens = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER,
  ]);
};

// ─── Axios instance ───────────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// ─── Request interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { accessToken } = await getTokens();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (err) => Promise.reject(err),
);

// ─── Response interceptor — auto-refresh on 401 ───────────────────────────────

let isRefreshing = false;
type QueueItem = { resolve: (token: string) => void; reject: (err: unknown) => void };
let failedQueue: QueueItem[] = [];

const flushQueue = (err: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (err ? p.reject(err) : p.resolve(token!)));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      // Avoid infinite loop on the refresh endpoint itself
      if (original.url?.includes('auth/refresh-token')) {
        await clearTokens();
        return Promise.reject(toApiError(error));
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (original.headers) original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        });
      }

      original._retry  = true;
      isRefreshing = true;

      try {
        const { refreshToken } = await getTokens();
        if (!refreshToken) throw new Error('No refresh token stored');

        const { data } = await axios.post<{
          data: { accessToken: string; refreshToken: string };
        }>(`${API_URL}/auth/refresh-token`, { refreshToken });

        const { accessToken: newAccess, refreshToken: newRefresh } = data.data;
        await saveTokens(newAccess, newRefresh);
        flushQueue(null, newAccess);

        if (original.headers) original.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(original);
      } catch (refreshErr) {
        flushQueue(refreshErr, null);
        await clearTokens();
        return Promise.reject(toApiError(refreshErr as AxiosError));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(toApiError(error));
  },
);

// ─── Error normaliser ─────────────────────────────────────────────────────────

type RawErrors =
  | Record<string, string>
  | Array<{ field: string; message: string }>
  | null
  | undefined;

/** Normalise backend errors to a flat Record<field, message> regardless of format */
const normaliseErrors = (raw: RawErrors): Record<string, string> | null => {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const record: Record<string, string> = {};
    raw.forEach(({ field, message }) => { record[field] = message; });
    return Object.keys(record).length ? record : null;
  }
  return Object.keys(raw).length ? raw : null;
};

export const toApiError = (err: AxiosError | Error | unknown): ApiError => {
  const axiosErr = err as AxiosError<{ message?: string; errors?: RawErrors }>;
  if (axiosErr.response) {
    return {
      status: axiosErr.response.status,
      message: axiosErr.response.data?.message ?? 'Something went wrong',
      errors:  normaliseErrors(axiosErr.response.data?.errors),
      isNetworkError: false,
    };
  }
  if ((axiosErr as AxiosError).request) {
    return { status: 0, message: 'No internet connection', errors: null, isNetworkError: true };
  }
  return { status: 0, message: (err as Error).message ?? 'Unexpected error', errors: null, isNetworkError: false };
};

export default apiClient;
