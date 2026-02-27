/**
 * useAds — ad delivery hook
 * Pro/Enterprise users automatically receive an empty array from the server.
 */
import { useState, useCallback } from 'react';
import * as adsApi from '../api/adsApi';
import type { Ad, AdPlacement, ApiError } from '../types';

export const useAds = () => {
  const [ads,       setAds]       = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<ApiError | null>(null);

  /** Fetch ads for a given placement slot */
  const fetchAds = useCallback(async (placement: AdPlacement) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await adsApi.getAdsForPlacement(placement);
      setAds(data.data.ads);
      return data.data.ads;
    } catch (err: any) {
      setError(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Record an ad click — fire and forget.
   * Does NOT set loading state to avoid flickering the UI.
   */
  const recordClick = useCallback((adId: string) => {
    adsApi.recordAdClick(adId).catch(() => {
      // Silently ignore click tracking errors
    });
  }, []);

  return { ads, isLoading, error, fetchAds, recordClick };
};
