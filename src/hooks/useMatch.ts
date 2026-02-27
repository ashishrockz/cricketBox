/**
 * useMatch — match lifecycle hook
 * Covers: toss, start, end-innings, live score, timeline, full details
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import * as matchesApi from '../api/matchesApi';
import type { Match, LiveScore, ScoreEvent, ApiError } from '../types';

interface UseMatchOptions {
  /** Pass a matchId to auto-poll live score every N ms (default 5000) */
  autoPollingMs?: number;
}

export const useMatch = (options: UseMatchOptions = {}) => {
  const { autoPollingMs = 5000 } = options;

  const [match,      setMatch]     = useState<Match | null>(null);
  const [liveScore,  setLiveScore] = useState<LiveScore | null>(null);
  const [timeline,   setTimeline]  = useState<ScoreEvent[]>([]);
  const [isLoading,  setIsLoading] = useState(false);
  const [error,      setError]     = useState<ApiError | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  /** Fetch full match details */
  const fetchMatch = useCallback(async (matchId: string) => {
    return run(async () => {
      const { data } = await matchesApi.getMatch(matchId);
      setMatch(data.data.match);
      return data.data.match;
    });
  }, [run]);

  /** Fetch live scorecard (no auth required, safe to call from any screen) */
  const fetchLiveScore = useCallback(async (matchId: string) => {
    try {
      const { data } = await matchesApi.getLiveScore(matchId);
      setLiveScore(data.data);
      return data.data;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  /** Fetch ball-by-ball timeline */
  const fetchTimeline = useCallback(async (
    matchId: string,
    params?: matchesApi.TimelineParams,
  ) => {
    return run(async () => {
      const { data } = await matchesApi.getTimeline(matchId, params);
      setTimeline(data.data);
      return data.data;
    });
  }, [run]);

  /** Record toss */
  const recordToss = useCallback(async (matchId: string, payload: matchesApi.TossPayload) => {
    return run(async () => {
      const { data } = await matchesApi.recordToss(matchId, payload);
      setMatch(data.data.match);
      return data.data.match;
    });
  }, [run]);

  /** Start the match after toss */
  const startMatch = useCallback(async (matchId: string) => {
    return run(async () => {
      const { data } = await matchesApi.startMatch(matchId);
      setMatch(data.data.match);
      return data.data.match;
    });
  }, [run]);

  /** End the current innings */
  const endInnings = useCallback(async (matchId: string) => {
    return run(async () => {
      const { data } = await matchesApi.endInnings(matchId);
      setMatch(data.data.match);
      return data.data.match;
    });
  }, [run]);

  // ─── Auto-polling for live score ──────────────────────────────────────────

  const startPolling = useCallback((matchId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    fetchLiveScore(matchId); // immediate first fetch
    pollingRef.current = setInterval(() => {
      fetchLiveScore(matchId);
    }, autoPollingMs);
  }, [fetchLiveScore, autoPollingMs]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Clean up interval on unmount
  useEffect(() => () => { stopPolling(); }, [stopPolling]);

  return {
    match, liveScore, timeline,
    isLoading, error,
    fetchMatch, fetchLiveScore, fetchTimeline,
    recordToss, startMatch, endInnings,
    startPolling, stopPolling,
  };
};
