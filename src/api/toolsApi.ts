import apiClient from './apiClient';
import type {
  ApiResponse, ToolInfo,
  CRRResult, RRRResult, BattingAvgResult, StrikeRateResult,
  BowlingAvgResult, EconomyResult, BowlingStrikeRateResult,
  NRRResult, DLSResult, ProjectScoreResult, PartnershipResult,
  WinProbabilityResult,
} from '../types';

// ─── List ─────────────────────────────────────────────────────────────────────

/** List all available tools with hasAccess flag for the current user */
export const listTools = () =>
  apiClient.get<ApiResponse<{ tools: ToolInfo[] }>>('/tools');

// ─── Calculators ─────────────────────────────────────────────────────────────

/** Current Run Rate: { runs, overs } */
export const calcCRR = (body: { runs: number; overs: number }) =>
  apiClient.post<ApiResponse<CRRResult>>('/tools/crr', body);

/** Required Run Rate: { target, runsScored, oversCompleted, totalOvers } */
export const calcRRR = (body: {
  target: number; runsScored: number; oversCompleted: number; totalOvers: number;
}) => apiClient.post<ApiResponse<RRRResult>>('/tools/rrr', body);

/** Batting average: { totalRuns, innings, notOuts } */
export const calcBattingAverage = (body: { totalRuns: number; innings: number; notOuts: number }) =>
  apiClient.post<ApiResponse<BattingAvgResult>>('/tools/batting-average', body);

/** Batting strike rate: { runs, ballsFaced } */
export const calcStrikeRate = (body: { runs: number; ballsFaced: number }) =>
  apiClient.post<ApiResponse<StrikeRateResult>>('/tools/strike-rate', body);

/** Bowling average: { runsConceded, wickets } */
export const calcBowlingAverage = (body: { runsConceded: number; wickets: number }) =>
  apiClient.post<ApiResponse<BowlingAvgResult>>('/tools/bowling-average', body);

/** Economy rate: { runsConceded, oversBowled } */
export const calcEconomy = (body: { runsConceded: number; oversBowled: number }) =>
  apiClient.post<ApiResponse<EconomyResult>>('/tools/economy', body);

/** Bowling strike rate: { ballsBowled, wickets } */
export const calcBowlingStrikeRate = (body: { ballsBowled: number; wickets: number }) =>
  apiClient.post<ApiResponse<BowlingStrikeRateResult>>('/tools/bowling-strike-rate', body);

/** Net Run Rate: { runsScored, oversFaced, runsConceded, oversBowled } */
export const calcNRR = (body: {
  runsScored: number; oversFaced: number; runsConceded: number; oversBowled: number;
}) => apiClient.post<ApiResponse<NRRResult>>('/tools/nrr', body);

/** Project final score: { currentRuns, currentOvers, totalOvers } */
export const projectScore = (body: { currentRuns: number; currentOvers: number; totalOvers: number }) =>
  apiClient.post<ApiResponse<ProjectScoreResult>>('/tools/project-score', body);

/** Partnership run rate: { runs, balls } */
export const calcPartnership = (body: { runs: number; balls: number }) =>
  apiClient.post<ApiResponse<PartnershipResult>>('/tools/partnership', body);

/** DLS revised target: { team1Score, team1Overs, team2OversAllowed, wicketsLost } */
export const calcDLS = (body: {
  team1Score: number; team1Overs: number; team2OversAllowed: number; wicketsLost: number;
}) => apiClient.post<ApiResponse<DLSResult>>('/tools/dls', body);

/** Win probability: { target, currentRuns, wicketsLost, oversCompleted, totalOvers } */
export const estimateWinProbability = (body: {
  target: number; currentRuns: number; wicketsLost: number;
  oversCompleted: number; totalOvers: number;
}) => apiClient.post<ApiResponse<WinProbabilityResult>>('/tools/win-probability', body);
