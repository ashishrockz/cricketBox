import type { NavigatorScreenParams } from '@react-navigation/native';
import type { PlayerTeam } from '../types';

// ─── Auth Stack ────────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Splash:         undefined;
  Onboarding:     undefined;
  Login:          undefined;
  Register:       undefined;
  OTPVerify:      { email: string; purpose: 'login' | 'password_reset' };
  ForgotPassword: undefined;
  ResetPassword:  { resetToken: string; email: string };
};

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────

export type TabParamList = {
  Home:    undefined;
  Matches: undefined;
  Create:  undefined;
  Tools:   undefined;
  Profile: undefined;
};

// ─── Main Stack ───────────────────────────────────────────────────────────────

export type MainStackParamList = {
  Tabs:             NavigatorScreenParams<TabParamList>;
  JoinRoom:         undefined;
  RoomLobby:        { roomId: string };
  AddPlayers:       { roomId: string; team: PlayerTeam };
  Toss:             { matchId: string; roomId: string; teamAName: string; teamBName: string };
  Scoring:          { matchId: string; roomId: string };
  WicketModal:      { matchId: string; strikerId: string; strikerName: string; nonStrikerId: string; nonStrikerName: string; bowlerId: string; bowlerName: string; fieldingTeamPlayers: { id: string; name: string }[] };
  LiveViewer:       { matchId: string };
  MatchResult:      { matchId: string };
  MatchDetail:      { matchId: string };
  ToolDetail:       { toolId: string; toolName: string; toolDescription: string };
  Plans:            undefined;
  PlanDetail:       { planId: string };
  Enterprise:       undefined;
  CreateEnterprise: undefined;
  Members:          { enterpriseId: string };
  Friends:          undefined;
  UserSearch:       undefined;
  EditProfile:      undefined;
  ChangePassword:   undefined;
};

// ─── Root Navigator ───────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};
