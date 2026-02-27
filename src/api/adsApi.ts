import apiClient from './apiClient';
import type { ApiResponse, Ad, AdPlacement } from '../types';

/**
 * Get ads for a specific placement.
 * - Free / Basic users receive real ads.
 * - Pro / Enterprise users receive an empty array automatically.
 */
export const getAdsForPlacement = (placement: AdPlacement) =>
  apiClient.get<ApiResponse<{ ads: Ad[] }>>(`/ads/placement/${placement}`);

/** Record a click on an ad (fire-and-forget is fine) */
export const recordAdClick = (adId: string) =>
  apiClient.post<ApiResponse<null>>(`/ads/${adId}/click`);
