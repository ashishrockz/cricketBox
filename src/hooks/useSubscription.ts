/**
 * useSubscription — subscription plan hook
 */
import { useState, useCallback, useEffect } from 'react';
import * as subscriptionsApi from '../api/subscriptionsApi';
import type { SubscriptionPlan, Subscription, ApiError } from '../types';

export const useSubscription = () => {
  const [plans,        setPlans]        = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [history,      setHistory]      = useState<Subscription[]>([]);
  const [isLoading,    setIsLoading]    = useState(false);
  const [error,        setError]        = useState<ApiError | null>(null);

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

  /** Fetch all available plans (auto-loads on mount) */
  const fetchPlans = useCallback(async () => {
    return run(async () => {
      const { data } = await subscriptionsApi.getPlans();
      setPlans(data.data.plans);
      return data.data.plans;
    });
  }, [run]);

  /** Fetch the current user's active subscription */
  const fetchMySubscription = useCallback(async () => {
    return run(async () => {
      const { data } = await subscriptionsApi.getMySubscription();
      setSubscription(data.data.subscription);
      return data.data.subscription;
    });
  }, [run]);

  /** Fetch the full subscription history for the current user */
  const fetchHistory = useCallback(async () => {
    return run(async () => {
      const { data } = await subscriptionsApi.getSubscriptionHistory();
      setHistory(data.data.subscriptions);
      return data.data.subscriptions;
    });
  }, [run]);

  // Load plans on mount (public, no auth needed)
  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  return {
    plans, subscription, history,
    isLoading, error,
    fetchPlans, fetchMySubscription, fetchHistory,
  };
};
