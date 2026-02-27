import apiClient from './apiClient';
import type { ApiResponse, Match, LiveScore, ScoreEvent, PlayerTeam, TossDecision, Pagination } from '../types';

export interface TossPayload {
  wonBy: PlayerTeam;
  decision: TossDecision;
}

export interface TimelineParams {
  innings?: number;
  page?: number;
  limit?: number;
}

/** Get full match details */
export const getMatch = (matchId: string) =>
  apiClient.get<ApiResponse<{ match: Match }>>(`/matches/${matchId}`);

/**
 * Get live scorecard — public endpoint, no auth required.
 * If the user is authenticated their personal stats are also included.
 */
export const getLiveScore = (matchId: string) =>
  apiClient.get<ApiResponse<LiveScore>>(`/matches/${matchId}/live`);

/** Get ball-by-ball timeline */
export const getTimeline = (matchId: string, params?: TimelineParams) =>
  apiClient.get<ApiResponse<ScoreEvent[]> & { pagination: Pagination }>(
    `/matches/${matchId}/timeline`,
    { params },
  );

/** Record the toss result */
export const recordToss = (matchId: string, payload: TossPayload) =>
  apiClient.post<ApiResponse<{ match: Match }>>(`/matches/${matchId}/toss`, payload);

/** Start the match (after toss is recorded) */
export const startMatch = (matchId: string) =>
  apiClient.post<ApiResponse<{ match: Match }>>(`/matches/${matchId}/start`);

/** End the current innings (triggers second innings or match completion) */
export const endInnings = (matchId: string) =>
  apiClient.post<ApiResponse<{ match: Match }>>(`/matches/${matchId}/end-innings`);
