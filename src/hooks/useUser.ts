/**
 * useUser — user profile and search hook
 */
import { useState, useCallback } from 'react';
import * as usersApi from '../api/usersApi';
import type { User, UserStats, Match, ApiError, Pagination } from '../types';

export const useUser = () => {
  const [profile,     setProfile]     = useState<User | null>(null);
  const [stats,       setStats]       = useState<UserStats | null>(null);
  const [history,     setHistory]     = useState<Match[]>([]);
  const [searchResults, setResults]   = useState<User[]>([]);
  const [pagination,  setPagination]  = useState<Pagination | null>(null);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState<ApiError | null>(null);

  const run = useCallback(async <T>(fn: () => Promise<T>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fn();
      return { success: true, result };
    } catch (err: any) {
      setError(err);
      return { success: false, error: err as ApiError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Fetch any user's public profile by ID */
  const fetchUser = useCallback(async (userId: string) => {
    return run(async () => {
      const { data } = await usersApi.getUserById(userId);
      setProfile(data.data.user);
      return data.data.user;
    });
  }, [run]);

  /** Fetch career stats for a user */
  const fetchStats = useCallback(async (userId: string) => {
    return run(async () => {
      const { data } = await usersApi.getUserStats(userId);
      setStats(data.data.stats);
      return data.data.stats;
    });
  }, [run]);

  /** Update the current authenticated user's profile */
  const updateProfile = useCallback(async (payload: usersApi.UpdateProfilePayload) => {
    return run(async () => {
      const { data } = await usersApi.updateProfile(payload);
      setProfile(data.data.user);
      return data.data.user;
    });
  }, [run]);

  /** Search users by username or name */
  const searchUsers = useCallback(async (params: usersApi.SearchUsersParams) => {
    return run(async () => {
      const { data } = await usersApi.searchUsers(params);
      setResults(data.data.users);
      if ((data as any).pagination) setPagination((data as any).pagination);
      return data.data.users;
    });
  }, [run]);

  /** Get the current user's match history */
  const fetchMatchHistory = useCallback(async (params?: usersApi.MatchHistoryParams) => {
    return run(async () => {
      const { data } = await usersApi.getMatchHistory(params);
      setHistory(data.data.matches);
      return data.data.matches;
    });
  }, [run]);

  return {
    profile, stats, history, searchResults, pagination,
    isLoading, error,
    fetchUser, fetchStats, updateProfile, searchUsers, fetchMatchHistory,
  };
};
