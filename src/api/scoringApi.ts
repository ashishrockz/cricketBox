import apiClient from './apiClient';
import type { ApiResponse, Innings, DeliveryOutcome, DismissalType } from '../types';

export interface RecordBallPayload {
  matchId: string;
  outcome: DeliveryOutcome;
  /** Runs scored off the bat (0–7) */
  runs: number;
  /** Extra runs on wides/no-balls */
  extraRuns?: number;
  /** Player subdocument _id from the batting team's roster */
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  isWicket?: boolean;
  dismissalType?: DismissalType;
  /** _id of the dismissed player (may differ from striker on run-out) */
  dismissedPlayerId?: string;
  /** _id of the fielder involved in a catch/run-out */
  fielderId?: string;
  commentary?: string;
}

export interface UndoBallPayload {
  matchId: string;
}

export interface RecordBallResponse {
  innings: Innings;
  event: {
    over: number;
    ball: number;
    outcome: DeliveryOutcome;
    runs: number;
  };
}

/** Record a single delivery */
export const recordBall = (payload: RecordBallPayload) =>
  apiClient.post<ApiResponse<RecordBallResponse>>('/scoring/ball', payload);

/** Undo the most recently recorded delivery */
export const undoBall = (payload: UndoBallPayload) =>
  apiClient.post<ApiResponse<{ innings: Innings }>>('/scoring/undo', payload);
