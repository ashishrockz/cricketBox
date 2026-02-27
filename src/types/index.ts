// ─────────────────────────────────────────────────────────────────────────────
// Shared enums
// ─────────────────────────────────────────────────────────────────────────────

export type MatchFormat = 'T10' | 'T20' | 'ODI' | 'TEST' | 'CUSTOM';
export type MatchStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';
export type RoomStatus  = 'waiting' | 'ready' | 'live' | 'completed' | 'cancelled';
export type RoomRole    = 'team_a_manager' | 'team_b_manager' | 'scorer';
export type PlayerTeam  = 'team_a' | 'team_b';
export type PlayerType  = 'static' | 'registered';
export type PlayingRole = 'batsman' | 'bowler' | 'all_rounder' | 'wicket_keeper';
export type DismissalType =
  | 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped'
  | 'hit_wicket' | 'caught_and_bowled' | 'retired_hurt'
  | 'retired_out' | 'timed_out' | 'hit_the_ball_twice'
  | 'obstructing_the_field';
export type DeliveryOutcome = 'normal' | 'wide' | 'no_ball' | 'bye' | 'leg_bye' | 'wicket' | 'dead_ball';
export type TossDecision  = 'bat' | 'bowl';
export type BillingCycle  = 'monthly' | 'annual' | 'one_time';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';
export type PlanSlug    = 'free' | 'basic' | 'pro' | 'enterprise';
export type EnterpriseType = 'cricket_academy' | 'club' | 'school' | 'coaching_center' | 'association' | 'other';
export type EnterpriseRole = 'owner' | 'admin' | 'coach' | 'player' | 'support_staff' | 'viewer';
export type AdType      = 'banner' | 'interstitial' | 'native' | 'video' | 'popup';
export type AdPlacement =
  | 'home_banner' | 'home_interstitial' | 'match_list_banner'
  | 'match_detail_top' | 'match_detail_bottom' | 'scorecard_banner'
  | 'tools_banner' | 'profile_banner' | 'results_interstitial'
  | 'tournament_banner' | 'live_score_banner' | 'post_match_popup';
export type FriendStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';
export type UserRole = 'user' | 'admin' | 'super_admin';
export type BattingStyle = 'right_hand' | 'left_hand';

// ─────────────────────────────────────────────────────────────────────────────
// API Response wrapper
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiError {
  status: number;
  message: string;
  errors: Record<string, string> | null;
  isNetworkError: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// User
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  city?: string;
  role: UserRole;
  playingRole?: PlayingRole;
  battingStyle?: BattingStyle;
  bowlingStyle?: string;
  isActive: boolean;
  isBanned: boolean;
  isEmailVerified: boolean;
  preferOTPLogin: boolean;
  subscriptionPlan: PlanSlug;
  subscription?: string;
  enterprise?: string;
  enterpriseRole?: EnterpriseRole | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  batting: {
    matches: number;
    innings: number;
    runs: number;
    notOuts: number;
    highScore: number;
    average: number;
    strikeRate: number;
    fours: number;
    sixes: number;
    fifties: number;
    hundreds: number;
  };
  bowling: {
    matches: number;
    innings: number;
    overs: number;
    wickets: number;
    runsConceded: number;
    average: number;
    economy: number;
    strikeRate: number;
    fiveWickets: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscription
// ─────────────────────────────────────────────────────────────────────────────

export interface PlanFeatures {
  maxRooms: number;             // -1 = unlimited
  maxPlayersPerRoom: number;
  maxTournaments: number;
  canUseTools: boolean;
  canUploadLogo: boolean;
  adsEnabled: boolean;
  canManageAcademy: boolean;
  maxAcademyMembers: number;
  analyticsAccess: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
}

export interface SubscriptionPlan {
  _id: string;
  name: string;
  slug: PlanSlug;
  description: string;
  price: { monthly: number; annual: number; currency: string };
  features: PlanFeatures;
  isActive: boolean;
  displayOrder: number;
}

export interface Subscription {
  _id: string;
  user: string;
  plan: string | SubscriptionPlan;
  planSlug: PlanSlug;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Room / Match
// ─────────────────────────────────────────────────────────────────────────────

export interface RoomMember {
  user: string | User;
  role: RoomRole;
  joinedAt: string;
  isPlaying: boolean;
  playingInTeam: PlayerTeam | null;
}

export interface Player {
  _id: string;
  name: string;
  user?: string | User;
  playerType: PlayerType;
  playingRole: PlayingRole;
  isCaptain: boolean;
  isWicketKeeper: boolean;
  jerseyNumber?: number;
}

export interface Team {
  name: string;
  players: Player[];
  logoUrl?: string;
}

export interface Room {
  _id: string;
  roomCode: string;
  name: string;
  creator: string | User;
  members: RoomMember[];
  status: RoomStatus;
  matchFormat: MatchFormat;
  totalOvers: number;
  teamAName: string;
  teamBName: string;
  teamA?: Team;
  teamB?: Team;
  venue?: string;
  matchDate: string;
  maxPlayersPerTeam: number;
  isPrivate: boolean;
  inviteLink: string;
  match?: string | Match;
  createdAt: string;
}

export interface Toss {
  wonBy: PlayerTeam;
  decision: TossDecision;
  battingFirst: PlayerTeam;
}

export interface Extras {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  penalty?: number;
  total: number;
}

export interface BattingEntry {
  player?: string;        // populated player ID (live response)
  playerId?: string;      // legacy field name
  playerName: string;
  runs: number;
  balls?: number;         // balls faced
  ballsFaced?: number;    // alternative field name
  fours?: number;
  sixes?: number;
  isOut?: boolean;
  dismissalType?: DismissalType;
  strikeRate?: number;
  sr?: number;            // alternative field name
}

export interface BowlingEntry {
  player?: string;        // populated player ID (live response)
  playerId?: string;      // legacy field name
  playerName: string;
  overs: number;
  balls?: number;
  maidens?: number;
  runs?: number;          // runs conceded
  runsConceded?: number;  // alternative field name
  wickets: number;
  economy?: number;
  economyRate?: number;   // alternative field name
}

export interface Innings {
  inningsNumber: number;
  battingTeam: PlayerTeam;
  bowlingTeam: PlayerTeam;
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  totalBalls: number;
  extras: Extras;
  battingStats: BattingEntry[];
  bowlingStats: BowlingEntry[];
  isCompleted: boolean;
  target?: number;
}

export interface MatchResult {
  winner?: PlayerTeam;
  winnerName?: string;
  winBy?: string;
  isDraw: boolean;
  isTie: boolean;
  isNoResult: boolean;
}

export interface Match {
  _id: string;
  room: string | Room;
  status: MatchStatus;
  matchFormat: MatchFormat;
  totalOvers: number;
  teamA: Team;
  teamB: Team;
  toss?: Toss;
  innings: Innings[];
  currentInnings: number;
  result?: MatchResult;
  venue?: string;
  matchDate: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

// Live innings shape returned by /matches/:id/live
export interface LiveInnings {
  inningsNumber: number;
  battingTeam: PlayerTeam;
  bowlingTeam: PlayerTeam;
  totalRuns: number;
  totalWickets: number;
  overs: string;           // e.g. "2.3"
  runRate: string;         // e.g. "12.00"
  target: number | null;
  extras: Extras;
  battingStats: BattingEntry[];
  bowlingStats: BowlingEntry[];
  fallOfWickets: unknown[];
  partnerships: unknown[];
}

export interface LiveResult {
  winner: PlayerTeam | null;
  winMargin: string | null;
  winType: string | null;
  summary: string | null;
}

export interface LiveScore {
  matchId: string;
  status: MatchStatus;
  format: MatchFormat;
  totalOvers: number;
  currentInnings: LiveInnings;
  allInnings: LiveInnings[];
  teamA: { name: string; players: Player[] };
  teamB: { name: string; players: Player[] };
  toss?: Toss;
  result: LiveResult;
  personalStats?: { batting: unknown; bowling: unknown };
}

export interface ScoreEvent {
  _id: string;
  match: string;
  innings: number;
  over: number;
  ball: number;
  outcome: DeliveryOutcome;
  runs: number;
  extraRuns: number;
  isLegal: boolean;
  isWicket: boolean;
  dismissalType?: DismissalType;
  striker: { id: string; name: string };
  nonStriker: { id: string; name: string };
  bowler: { id: string; name: string };
  commentary?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Enterprise
// ─────────────────────────────────────────────────────────────────────────────

export interface EnterpriseMember {
  user: string | User;
  role: EnterpriseRole;
  joinedAt: string;
}

export interface Enterprise {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  type: EnterpriseType;
  owner: string | User;
  admins: string[];
  members: EnterpriseMember[];
  contact?: { email?: string; phone?: string; website?: string };
  address?: { street?: string; city?: string; state?: string; country?: string; pincode?: string };
  logoUrl?: string;
  isVerified: boolean;
  isSuspended: boolean;
  settings: {
    maxMembers: number;
    isPublic: boolean;
    allowMemberInvites: boolean;
    joinRequiresApproval: boolean;
  };
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ad
// ─────────────────────────────────────────────────────────────────────────────

export interface Ad {
  _id: string;
  title: string;
  description?: string;
  type: AdType;
  placement: AdPlacement;
  media: { imageUrl?: string; videoUrl?: string; altText?: string };
  ctaUrl?: string;
  status: 'draft' | 'pending_review' | 'active' | 'paused' | 'rejected' | 'expired';
  targeting?: { planTypes?: PlanSlug[]; cities?: string[] };
  stats: { impressions: number; clicks: number; ctr: number };
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Friends
// ─────────────────────────────────────────────────────────────────────────────

export interface Friendship {
  _id: string;
  requester: string | User;
  recipient: string | User;
  status: FriendStatus;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cricket Tools
// ─────────────────────────────────────────────────────────────────────────────

export interface ToolInfo {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  requiredPlan: PlanSlug;
  hasAccess: boolean;
}

export interface CRRResult {
  runs: number; overs: number; currentRunRate: number; runsPerBall: number;
}
export interface RRRResult {
  runsNeeded: number; ballsRemaining: number; oversRemaining: number; requiredRunRate: number;
}
export interface BattingAvgResult {
  totalRuns: number; innings: number; notOuts: number;
  dismissals: number; battingAverage: number | string;
}
export interface StrikeRateResult {
  runs: number; ballsFaced: number; strikeRate: number;
}
export interface BowlingAvgResult {
  runsConceded: number; wickets: number; bowlingAverage: number;
}
export interface EconomyResult {
  runsConceded: number; oversBowled: number; economyRate: number;
}
export interface BowlingStrikeRateResult {
  ballsBowled: number; wickets: number; bowlingStrikeRate: number;
}
export interface NRRResult {
  runsScored: number; oversFaced: number; runsConceded: number; oversBowled: number; nrr: number;
}
export interface DLSResult {
  team1Score: number; team1Overs: number; team2OversAllowed: number; revisedTarget: number; resourcePercentage: number;
}
export interface ProjectScoreResult {
  currentRuns: number; currentOvers: number; totalOvers: number; projectedScore: number; currentRunRate: number;
}
export interface PartnershipResult {
  runs: number; balls: number; partnershipRunRate: number;
}
export interface WinProbabilityResult {
  chasingTeamWinProbability: number; battingTeamWinProbability: number; factors: Record<string, number>;
}
