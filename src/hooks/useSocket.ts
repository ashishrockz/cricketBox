import { useEffect, useRef, useState, useCallback } from 'react';
import socketService, {
  SOCKET_EVENTS,
  type JoinRoomPayload,
  type ScoreUpdatePayload,
  type MatchChatPayload,
  type MatchReactionPayload,
  type RoomUserPayload,
  type SocketError,
  type BallUpdatePayload,
  type StrikeRotatePayload,
  type OverCompletePayload,
  type WicketFallenPayload,
  type InningsCompletePayload,
  type UndoBallPayload,
  type RecordBallPayload,
  type RecordBallAck,
} from '../api/socketService';

// ============================================
// BASE SOCKET HOOK
// ============================================
export interface UseSocketOptions {
  token?: string;
  autoConnect?: boolean;
}

export interface UseSocketReturn {
  isConnected: boolean;
  socketId: string | null;
  joinRoom: (payload: JoinRoomPayload) => void;
  leaveRoom: (payload: JoinRoomPayload) => void;
  requestLiveScore: (matchId: string) => void;
  sendChat: (roomId: string, message: string) => void;
  sendReaction: (roomId: string, reaction: MatchReactionPayload['reaction']) => void;
  connect: (token?: string) => void;
  disconnect: () => void;
}

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { token, autoConnect = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId]       = useState<string | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(
    (overrideToken?: string) => {
      const sock = socketService.connect(overrideToken ?? token);
      sock.on('connect', () => {
        if (mountedRef.current) {
          setIsConnected(true);
          setSocketId(sock.id ?? null);
        }
      });
      sock.on('disconnect', () => {
        if (mountedRef.current) {
          setIsConnected(false);
          setSocketId(null);
        }
      });
    },
    [token],
  );

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
    setSocketId(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (autoConnect) {
      connect(token);
      if (socketService.isConnected()) {
        setIsConnected(true);
        setSocketId(socketService.getSocket()?.id ?? null);
      }
    }
    return () => { mountedRef.current = false; };
  }, [autoConnect, connect, token]);

  const joinRoom         = useCallback((p: JoinRoomPayload) => socketService.joinRoom(p), []);
  const leaveRoom        = useCallback((p: JoinRoomPayload) => socketService.leaveRoom(p), []);
  const requestLiveScore = useCallback((id: string) => socketService.requestLiveScore(id), []);
  const sendChat         = useCallback((r: string, m: string) => socketService.sendChat(r, m), []);
  const sendReaction     = useCallback(
    (r: string, rx: MatchReactionPayload['reaction']) => socketService.sendReaction(r, rx),
    [],
  );

  return { isConnected, socketId, joinRoom, leaveRoom, requestLiveScore, sendChat, sendReaction, connect, disconnect };
}

// ============================================
// MATCH-SPECIFIC HOOK
// ============================================
export interface UseMatchSocketOptions {
  token?:     string;
  roomId?:    string;
  matchId?:   string;

  // Scoring events
  onBallUpdate?:      (payload: BallUpdatePayload)      => void;
  onStrikeRotate?:    (payload: StrikeRotatePayload)    => void;
  onOverComplete?:    (payload: OverCompletePayload)    => void;
  onWicketFallen?:    (payload: WicketFallenPayload)    => void;
  onInningsComplete?: (payload: InningsCompletePayload) => void;
  onUndoBall?:        (payload: UndoBallPayload)        => void;
  onMatchComplete?:   (payload: Record<string, unknown>) => void;

  // Room presence
  onRoomUserJoined?: (payload: RoomUserPayload) => void;
  onRoomUserLeft?:   (payload: RoomUserPayload) => void;

  // General
  onScoreUpdate?: (payload: ScoreUpdatePayload)  => void;
  onChat?:        (payload: MatchChatPayload)    => void;
  onReaction?:    (payload: MatchReactionPayload) => void;
  onError?:       (payload: SocketError)         => void;
}

export interface UseMatchSocketReturn extends UseSocketReturn {
  /** Record a ball delivery via socket. Pass an ack callback to get confirmation. */
  recordBall: (payload: RecordBallPayload, ack?: (result: RecordBallAck) => void) => void;
}

export function useMatchSocket(options: UseMatchSocketOptions = {}): UseMatchSocketReturn {
  const {
    token, roomId, matchId,
    onBallUpdate, onStrikeRotate, onOverComplete,
    onWicketFallen, onInningsComplete, onUndoBall, onMatchComplete,
    onRoomUserJoined, onRoomUserLeft,
    onScoreUpdate, onChat, onReaction, onError,
  } = options;

  const socket = useSocket({ token, autoConnect: true });

  // Join room/match on connect, leave on unmount
  useEffect(() => {
    if (!socket.isConnected) return;
    if (!roomId && !matchId) return;
    socket.joinRoom({ roomId, matchId });
    return () => { socket.leaveRoom({ roomId, matchId }); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket.isConnected, roomId, matchId]);

  // Register all event listeners
  useEffect(() => {
    const handlers: Array<{ event: string; fn: (d: unknown) => void }> = [];

    const register = <T>(event: string, cb?: (d: T) => void) => {
      if (!cb) return;
      const fn = (d: unknown) => cb(d as T);
      socketService.on(event, fn);
      handlers.push({ event, fn });
    };

    // Scoring
    register<BallUpdatePayload>(SOCKET_EVENTS.BALL_UPDATE,           onBallUpdate);
    register<StrikeRotatePayload>(SOCKET_EVENTS.STRIKE_ROTATE,       onStrikeRotate);
    register<OverCompletePayload>(SOCKET_EVENTS.OVER_COMPLETE,        onOverComplete);
    register<WicketFallenPayload>(SOCKET_EVENTS.WICKET_FALLEN,        onWicketFallen);
    register<InningsCompletePayload>(SOCKET_EVENTS.INNINGS_COMPLETE,  onInningsComplete);
    register<UndoBallPayload>(SOCKET_EVENTS.UNDO_BALL,               onUndoBall);
    register<Record<string, unknown>>(SOCKET_EVENTS.MATCH_COMPLETE,  onMatchComplete);

    // Room presence
    register<RoomUserPayload>(SOCKET_EVENTS.ROOM_USER_JOINED, onRoomUserJoined);
    register<RoomUserPayload>(SOCKET_EVENTS.ROOM_USER_LEFT,   onRoomUserLeft);

    // General
    register<ScoreUpdatePayload>(SOCKET_EVENTS.SCORE_UPDATE,     onScoreUpdate);
    register<MatchChatPayload>(SOCKET_EVENTS.MATCH_CHAT,         onChat);
    register<MatchReactionPayload>(SOCKET_EVENTS.MATCH_REACTION, onReaction);
    register<SocketError>(SOCKET_EVENTS.ERROR,                   onError);

    return () => { handlers.forEach(({ event, fn }) => socketService.off(event, fn)); };
  }, [
    onBallUpdate, onStrikeRotate, onOverComplete,
    onWicketFallen, onInningsComplete, onUndoBall, onMatchComplete,
    onRoomUserJoined, onRoomUserLeft,
    onScoreUpdate, onChat, onReaction, onError,
  ]);

  const recordBall = useCallback(
    (payload: RecordBallPayload, ack?: (result: RecordBallAck) => void) => {
      socketService.recordBall(payload, ack);
    },
    [],
  );

  return { ...socket, recordBall };
}
