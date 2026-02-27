import apiClient from './apiClient';
import type { ApiResponse, AuthResponse, User } from '../types';

// ─── Request types ────────────────────────────────────────────────────────────

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface OTPRequestPayload {
  email: string;
  purpose: 'login' | 'register_verify' | 'password_reset';
}

export interface OTPVerifyPayload {
  email: string;
  otp: string;
  purpose: 'login' | 'register_verify' | 'password_reset';
}

export interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** Register a new user account */
export const register = (payload: RegisterPayload) =>
  apiClient.post<ApiResponse<AuthResponse>>('/auth/register', payload);

/** Login with email + password */
export const login = (payload: LoginPayload) =>
  apiClient.post<ApiResponse<AuthResponse>>('/auth/login', payload);

/** Request a 6-digit OTP to be sent to the user's email */
export const requestOTP = (payload: OTPRequestPayload) =>
  apiClient.post<ApiResponse<{ cooldownSeconds: number }>>('/auth/otp/request', payload);

/** Verify the OTP — returns tokens for login/register, or a short-lived resetToken for password_reset */
export const verifyOTP = (payload: OTPVerifyPayload) =>
  apiClient.post<ApiResponse<AuthResponse & { resetToken?: string }>>('/auth/otp/verify', payload);

/** Reset password using the resetToken received from verifyOTP */
export const resetPassword = (payload: ResetPasswordPayload) =>
  apiClient.post<ApiResponse<AuthResponse>>('/auth/reset-password', payload);

/** Get current authenticated user's profile */
export const getMe = () =>
  apiClient.get<ApiResponse<{ user: User }>>('/auth/me');

/** Refresh access token using the stored refresh token */
export const refreshToken = (payload: RefreshTokenPayload) =>
  apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh-token', payload);

/** Change password (requires current password) */
export const changePassword = (payload: ChangePasswordPayload) =>
  apiClient.put<ApiResponse<{ message: string }>>('/auth/change-password', payload);

/** Logout — invalidates the refresh token on the server */
export const logout = (refreshTokenValue: string) =>
  apiClient.post<ApiResponse<null>>('/auth/logout', { refreshToken: refreshTokenValue });
