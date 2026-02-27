/**
 * useTools — cricket calculators hook
 * Requires Basic plan or above (canUseTools feature).
 */
import { useState, useCallback } from 'react';
import * as toolsApi from '../api/toolsApi';
import type { ToolInfo, ApiError } from '../types';

export const useTools = () => {
  const [tools,     setTools]     = useState<ToolInfo[]>([]);
  const [result,    setResult]    = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<ApiError | null>(null);

  const run = useCallback(async <T>(fn: () => Promise<T>) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fn();
      return { success: true, result: res };
    } catch (err: any) {
      setError(err);
      return { success: false, error: err as ApiError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Fetch list of tools with hasAccess flag */
  const fetchTools = useCallback(async () => {
    return run(async () => {
      const { data } = await toolsApi.listTools();
      setTools(data.data.tools);
      return data.data.tools;
    });
  }, [run]);

  const calcCRR = useCallback(async (body: Parameters<typeof toolsApi.calcCRR>[0]) => {
    return run(async () => {
      const { data } = await toolsApi.calcCRR(body);
      setResult(data.data);
      return data.data;
    });
  }, [run]);

  const calcRRR = useCallback(async (body: Parameters<typeof toolsApi.calcRRR>[0]) => {
    return run(async () => {
      const { data } = await toolsApi.calcRRR(body);
      setResult(data.data);
      return data.data;
    });
  }, [run]);

  const calcBattingAverage = useCallback(async (body: Parameters<typeof toolsApi.calcBattingAverage>[0]) => {
    return run(async () => {
      const { data } = await toolsApi.calcBattingAverage(body);
      setResult(data.data);
      return data.data;
    });
  }, [run]);

  const calcStrikeRate = useCallback(async (body: Parameters<typeof toolsApi.calcStrikeRate>[0]) => {
    return run(async () => {
      const { data } = await toolsApi.calcStrikeRate(body);
      setResult(data.data);
      return data.data;
    });
  }, [run]);

  const calcBowlingAverage = useCallback(async (body: Parameters<typeof toolsApi.calcBowlingAverage>[0]) => {
    return run(async () => {
      const { data } = await toolsApi.calcBowlingAverage(body);
      setResult(data.data);
      return data.data;
    });
  }, [run]);

  const calcEconomy = useCallback(async (body: Parameters<typeof toolsApi.calcEconomy>[0]) => {
    return run(async () => {
      const { data } = await toolsApi.calcEconomy(body);
      setResult(data.data);
      return data.data;
    });
  }, [run]);

  const calcBowlingStrikeRate = useCallback(async (body: Parameters<typeof toolsApi.calcBowlingStrikeRate>[0]) => {
    return run(async () => {
      const { data } = await toolsApi.calcBowlingStrikeRate(body);
      setResult(data.data);
      return data.data;
    });
  }, [run]);

  const calcNRR = useCallback(async (body: Parameters<typeof toolsApi.calcNRR>[0]) => {
    return run(async () => {
      const { data } = await toolsApi.calcNRR(body);
      setResult(data.data);
      return data.data;
    });
  }, [run]);

  const projectScore = useCallback(async (body: Parameters<typeof toolsApi.projectScore>[0]) => {
    return run(async () => {
      const { data } = await toolsApi.projectScore(body);
      setResult(data.data);
      return data.data;
    });
  }, [run]);

  const calcPartnership = useCallback(async (body: Parameters<typeof toolsApi.calcPartnership>[0]) => {
    return run(async () => {
      const { data } = await toolsApi.calcPartnership(body);
      setResult(data.data);
      return data.data;
    });
  }, [run]);

  const calcDLS = useCallback(async (body: Parameters<typeof toolsApi.calcDLS>[0]) => {
    return run(async () => {
      const { data } = await toolsApi.calcDLS(body);
      setResult(data.data);
      return data.data;
    });
  }, [run]);

  const estimateWinProbability = useCallback(async (body: Parameters<typeof toolsApi.estimateWinProbability>[0]) => {
    return run(async () => {
      const { data } = await toolsApi.estimateWinProbability(body);
      setResult(data.data);
      return data.data;
    });
  }, [run]);

  return {
    tools, result,
    isLoading, error,
    fetchTools,
    calcCRR, calcRRR,
    calcBattingAverage, calcStrikeRate,
    calcBowlingAverage, calcEconomy, calcBowlingStrikeRate,
    calcNRR, projectScore, calcPartnership, calcDLS,
    estimateWinProbability,
  };
};
