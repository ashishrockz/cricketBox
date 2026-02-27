/**
 * useScoring — live ball-by-ball scoring hook
 *
 * Maintains: currentInnings, last ball summary, running total.
 * Call recordBall() on every delivery; call undoLast() to revert.
 * Call applySocketUpdate() to merge a lightweight summary from socket events.
 */
import { useState, useCallback } from 'react';
import * as scoringApi from '../api/scoringApi';
import type { Innings, ApiError } from '../types';

interface BallSummary {
  over: number;
  ball: number;
  outcome: string;
  runs: number;
}

/** Minimal innings summary received from socket events */
export interface SocketInningsSummary {
  totalRuns: number;
  totalWickets: number;
  overs: string; // "2.3" → 2 completed overs, 3 balls in current over
  extras: { wides: number; noBalls: number; byes: number; legByes: number; total: number };
}

export const useScoring = () => {
  const [innings,   setInnings]   = useState<Innings | null>(null);
  const [lastBall,  setLastBall]  = useState<BallSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<ApiError | null>(null);

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

  /**
   * Record a single delivery.
   * Returns the updated innings object so the UI can refresh immediately.
   */
  const recordBall = useCallback(async (payload: scoringApi.RecordBallPayload) => {
    return run(async () => {
      const { data } = await scoringApi.recordBall(payload);
      setInnings(data.data.innings);
      setLastBall(data.data.event);
      return data.data;
    });
  }, [run]);

  /**
   * Undo the last recorded delivery.
   * Rolls back innings totals on the server and returns the corrected state.
   */
  const undoLast = useCallback(async (matchId: string) => {
    return run(async () => {
      const { data } = await scoringApi.undoBall({ matchId });
      setInnings(data.data.innings);
      setLastBall(null);
      return data.data.innings;
    });
  }, [run]);

  /**
   * Apply a lightweight innings summary from a socket event.
   * Updates totals, overs, and extras without touching battingStats/bowlingStats.
   * Use this when receiving BALL_UPDATE or UNDO_BALL from the server.
   */
  const applySocketUpdate = useCallback((summary: SocketInningsSummary) => {
    setInnings(prev => {
      if (!prev) return null;
      const [osStr, bsStr] = summary.overs.split('.');
      const completedOvers = parseInt(osStr || '0', 10);
      const ballsInOver    = parseInt(bsStr  || '0', 10);
      return {
        ...prev,
        totalRuns:    summary.totalRuns,
        totalWickets: summary.totalWickets,
        totalOvers:   completedOvers,
        totalBalls:   completedOvers * 6 + ballsInOver,
        extras: {
          ...prev.extras,
          wides:   summary.extras.wides,
          noBalls: summary.extras.noBalls,
          byes:    summary.extras.byes,
          legByes: summary.extras.legByes,
          total:   summary.extras.total,
        },
      };
    });
  }, []);

  /** Reset local state (e.g. when navigating away from scoring screen) */
  const reset = useCallback(() => {
    setInnings(null);
    setLastBall(null);
    setError(null);
  }, []);

  return {
    innings, lastBall,
    isLoading, error,
    recordBall, undoLast, applySocketUpdate, reset,
  };
};
