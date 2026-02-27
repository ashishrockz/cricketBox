import apiClient from './apiClient';
import type { ApiResponse, User, UserStats, Match, Pagination } from '../types';

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  playingRole?: 'batsman' | 'bowler' | 'all_rounder' | 'wicket_keeper';
  battingStyle?: 'right_hand' | 'left_hand';
  bowlingStyle?: string;
  city?: string;
  bio?: string;
}

export interface SearchUsersParams {
  q: string;
  page?: number;
  limit?: number;
}

export interface MatchHistoryParams {
  page?: number;
  limit?: number;
}

/** Get a user's public profile by ID */
export const getUserById = (userId: string) =>
  apiClient.get<ApiResponse<{ user: User }>>(`/users/${userId}`);

/** Get a user's career statistics */
export const getUserStats = (userId: string) =>
  apiClient.get<ApiResponse<{ stats: UserStats }>>(`/users/${userId}/stats`);

/** Update the current user's profile */
export const updateProfile = (payload: UpdateProfilePayload) =>
  apiClient.put<ApiResponse<{ user: User }>>('/users/profile', payload);

/** Search users by username or full name */
export const searchUsers = (params: SearchUsersParams) =>
  apiClient.get<ApiResponse<{ users: User[] }> & { pagination: Pagination }>('/users/search', { params });

/** Get the current user's match history */
export const getMatchHistory = (params?: MatchHistoryParams) =>
  apiClient.get<ApiResponse<{ matches: Match[] }>>('/users/match-history', { params });
