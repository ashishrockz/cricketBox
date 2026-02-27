import apiClient from './apiClient';
import type { ApiResponse, Room, MatchFormat, RoomRole, PlayerTeam, PlayerType, PlayingRole, RoomStatus } from '../types';

// ─── Request types ────────────────────────────────────────────────────────────

export interface CreateRoomPayload {
  name: string;
  matchFormat: MatchFormat;
  totalOvers: number;
  teamAName: string;
  teamBName: string;
  creatorRole: RoomRole;
  venue?: string;
  matchDate?: string;
  maxPlayersPerTeam?: number;
  isPrivate?: boolean;
}

export interface JoinRoomPayload {
  role: RoomRole;
}

export interface AddPlayerPayload {
  team: PlayerTeam;
  playerType: PlayerType;
  /** Required when playerType = 'static' */
  name?: string;
  /** Required when playerType = 'registered' */
  userId?: string;
  playingRole?: PlayingRole;
  isCaptain?: boolean;
  isWicketKeeper?: boolean;
  jerseyNumber?: number;
}

export interface GetMyRoomsParams {
  status?: RoomStatus;
  page?: number;
  limit?: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** Create a new match room (consumes 1 monthly room from your plan) */
export const createRoom = (payload: CreateRoomPayload) =>
  apiClient.post<ApiResponse<{ room: Room }>>('/rooms', payload);

/** Get all rooms the current user is a member of */
export const getMyRooms = (params?: GetMyRoomsParams) =>
  apiClient.get<ApiResponse<{ rooms: Room[] }>>('/rooms/my-rooms', { params });

/** Look up a room by its short code (e.g. CRK-1234) */
export const getRoomByCode = (roomCode: string) =>
  apiClient.get<ApiResponse<{ room: Room }>>(`/rooms/code/${roomCode}`);

/** Get full room details by MongoDB ID */
export const getRoomById = (roomId: string) =>
  apiClient.get<ApiResponse<{ room: Room }>>(`/rooms/${roomId}`);

/** Join a room using its code */
export const joinRoom = (roomCode: string, payload: JoinRoomPayload) =>
  apiClient.post<ApiResponse<{ room: Room }>>(`/rooms/join/${roomCode}`, payload);

/** Leave a room */
export const leaveRoom = (roomId: string) =>
  apiClient.post<ApiResponse<{ room: Room }>>(`/rooms/${roomId}/leave`);

/** Add a player (static or registered) to a team */
export const addPlayer = (roomId: string, payload: AddPlayerPayload) =>
  apiClient.post<ApiResponse<{ room: Room }>>(`/rooms/${roomId}/players`, payload);

/** Remove a player from a team */
export const removePlayer = (roomId: string, playerId: string) =>
  apiClient.delete<ApiResponse<{ room: Room }>>(`/rooms/${roomId}/players/${playerId}`);
