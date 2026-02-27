import { io, Socket } from 'socket.io-client';

// ============================================
// SOCKET EVENTS (mirrors backend constants)
// ============================================
export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',

  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_UPDATED: 'room_updated',
  ROOM_USER_JOINED: 'room_user_joined',
  ROOM_USER_LEFT: 'room_user_left',

  BALL_UPDATE: 'ball_update',
  OVER_COMPLETE: 'over_complete',
  WICKET_FALLEN: 'wicket_fallen',
  INNINGS_COMPLETE: 'innings_complete',
  MATCH_COMPLETE: 'match_complete',
  SCORE_UPDATE: 'score_update',
  UNDO_BALL: 'undo_ball',
  STRIKE_ROTATE: 'strike_rotate',   // NEW
  RECORD_BALL: 'record_ball',       // NEW — send ball via socket

  REQUEST_LIVE_SCORE: 'request_live_score',
  LIVE_SCORE_DATA: 'live_score_data',

  MATCH_CHAT: 'match_chat',
  MATCH_REACTION: 'match_reaction',

  ERROR: 'error',
} as const;

export type SocketEventKey   = keyof typeof SOCKET_EVENTS;
export type SocketEventValue = (typeof SOCKET_EVENTS)[SocketEventKey];

// ============================================
// PAYLOAD TYPES
// ============================================
export interface JoinRoomPayload  { roomId?: string; matchId?: string; }
export interface LeaveRoomPayload { roomId?: string; matchId?: string; }

export interface ScoreUpdatePayload {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface MatchChatPayload {
  userId: string;
  message: string;
  timestamp: string;
}

export interface MatchReactionPayload {
  userId: string;
  reaction: 'six' | 'four' | 'wicket' | 'appeal' | 'cheer' | 'clap';
  timestamp: string;
}

export interface RoomUserPayload {
  userId: string;
  socketId: string;
  isSpectator: boolean;
  timestamp: string;
}

export interface SocketError { message: string; }

// --- Scoring payloads ---

export interface InningsSummary {
  totalRuns: number;
  totalWickets: number;
  overs: string;       // "2.3"
  runRate: string;
  extras: { wides: number; noBalls: number; byes: number; legByes: number; total: number };
  target: number | null;
  isCompleted?: boolean;
}

export interface NextBatsmen {
  striker:    string | null;  // player _id
  nonStriker: string | null;
}

export interface BallUpdatePayload {
  event:            Record<string, unknown>; // ScoreEvent document
  innings:          InningsSummary;
  strikeRotated:    boolean;
  nextBatsmen:      NextBatsmen;
  overJustCompleted: boolean;
  inningsCompleted: boolean;
}

export interface StrikeRotatePayload {
  newStriker:    string | null;
  newNonStriker: string | null;
  reason: 'odd_runs' | 'over_end';
}

export interface OverCompletePayload {
  completedOver:  number;   // how many overs done (1-indexed)
  bowler:         { id: string; name: string };
  nextStriker:    string | null;
  nextNonStriker: string | null;
}

export interface WicketFallenPayload {
  wicketNumber:    number;
  dismissedPlayer: { player: string | null; playerName: string | null };
  dismissalType:   string;
  score:           number;
  nextBatsmen:     NextBatsmen;
}

export interface InningsCompletePayload {
  inningsNumber: number;
  totalRuns:     number;
  totalWickets:  number;
  overs:         string;
  target:        number | null;
}

export interface UndoBallPayload {
  undoneEvent: string;
  innings:     Pick<InningsSummary, 'totalRuns' | 'totalWickets' | 'overs' | 'extras'>;
  nextBatsmen: NextBatsmen;
}

/** Payload to emit when recording a ball via socket */
export interface RecordBallPayload {
  matchId:           string;
  outcome:           'normal' | 'wide' | 'no_ball' | 'bye' | 'leg_bye' | 'wicket' | 'dead_ball';
  runs:              number;
  extraRuns?:        number;
  strikerId:         string;
  nonStrikerId:      string;
  bowlerId:          string;
  isWicket?:         boolean;
  dismissalType?:    string;
  dismissedPlayerId?: string;
  fielderId?:        string;
  commentary?:       string;
}

export interface RecordBallAck {
  success: boolean;
  data?:   { innings: InningsSummary; strikeRotated: boolean; nextBatsmen: NextBatsmen; overJustCompleted: boolean };
  error?:  string;
}

// ============================================
// SOCKET SERVICE
// ============================================
const SERVER_URL = 'https://cricket-backend-orkc.onrender.com';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token?: string): Socket {
    // Return existing socket if already connected OR still connecting.
    // Checking only `.connected` caused duplicate sockets during handshake.
    if (this.socket) return this.socket;

    this.token = token ?? null;

    this.socket = io(SERVER_URL, {
      auth:      token ? { token } : {},
      // Start with polling (more reliable on Render.com / behind proxies),
      // then upgrade to WebSocket once the HTTP handshake succeeds.
      transports:           ['polling', 'websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay:    2000,
      timeout:              10000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
    });
    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });
    this.socket.on('connect_error', (err) => {
      // Use warn (not error) so the React Native dev overlay doesn't show a red screen.
      // The client will automatically retry / fall back as configured above.
      console.warn('[Socket] Connection error:', err.message);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null { return this.socket; }
  isConnected(): boolean { return this.socket?.connected ?? false; }

  // ---- Room ----
  joinRoom(payload: JoinRoomPayload):  void { this.socket?.emit(SOCKET_EVENTS.JOIN_ROOM,  payload); }
  leaveRoom(payload: LeaveRoomPayload): void { this.socket?.emit(SOCKET_EVENTS.LEAVE_ROOM, payload); }

  // ---- Live Score ----
  requestLiveScore(matchId: string): void {
    this.socket?.emit(SOCKET_EVENTS.REQUEST_LIVE_SCORE, { matchId });
  }

  // ---- Scoring ----
  /**
   * Record a ball delivery via socket (any room member can call this).
   * The server broadcasts BALL_UPDATE to all room members automatically.
   * @param payload  Ball data
   * @param ack      Optional acknowledgement callback — receives { success, data?, error? }
   */
  recordBall(payload: RecordBallPayload, ack?: (result: RecordBallAck) => void): void {
    if (ack) {
      this.socket?.emit(SOCKET_EVENTS.RECORD_BALL, payload, ack);
    } else {
      this.socket?.emit(SOCKET_EVENTS.RECORD_BALL, payload);
    }
  }

  // ---- Chat & Reactions ----
  sendChat(roomId: string, message: string): void {
    this.socket?.emit(SOCKET_EVENTS.MATCH_CHAT, { roomId, message });
  }
  sendReaction(roomId: string, reaction: MatchReactionPayload['reaction']): void {
    this.socket?.emit(SOCKET_EVENTS.MATCH_REACTION, { roomId, reaction });
  }

  // ---- Generic listeners ----
  on<T = unknown>(event: SocketEventValue | string, callback: (data: T) => void): void {
    this.socket?.on(event, callback);
  }
  off<T = unknown>(event: SocketEventValue | string, callback?: (data: T) => void): void {
    if (callback) { this.socket?.off(event, callback); }
    else          { this.socket?.removeAllListeners(event); }
  }
}

export const socketService = new SocketService();
export default socketService;
