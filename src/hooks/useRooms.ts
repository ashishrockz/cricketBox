/**
 * useRooms — room creation, joining, player management
 */
import { useState, useCallback } from 'react';
import * as roomsApi from '../api/roomsApi';
import type { Room, ApiError } from '../types';

export const useRooms = () => {
  const [rooms,     setRooms]     = useState<Room[]>([]);
  const [room,      setRoom]      = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<ApiError | null>(null);

  const run = useCallback(async <T>(fn: () => Promise<T>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fn();
      return { success: true, result };
    } catch (err: any) {
      setError(err);
      return { success: false, error: err as ApiError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Create a new room (1 room = 1 match, counts against monthly limit) */
  const createRoom = useCallback(async (payload: roomsApi.CreateRoomPayload) => {
    return run(async () => {
      const { data } = await roomsApi.createRoom(payload);
      setRoom(data.data.room);
      setRooms((prev) => [data.data.room, ...prev]);
      return data.data.room;
    });
  }, [run]);

  /** Load the list of rooms the current user belongs to */
  const fetchMyRooms = useCallback(async (params?: roomsApi.GetMyRoomsParams) => {
    return run(async () => {
      const { data } = await roomsApi.getMyRooms(params);
      // Handle both { rooms: [...] } and direct array response shapes
      const list: Room[] = Array.isArray(data.data)
        ? data.data
        : (data.data as any).rooms ?? [];
      setRooms(list);
      return list;
    });
  }, [run]);

  /** Look up a room by short code */
  const fetchRoomByCode = useCallback(async (roomCode: string) => {
    return run(async () => {
      const { data } = await roomsApi.getRoomByCode(roomCode);
      setRoom(data.data.room);
      return data.data.room;
    });
  }, [run]);

  /** Get full room details by ID */
  const fetchRoomById = useCallback(async (roomId: string) => {
    return run(async () => {
      const { data } = await roomsApi.getRoomById(roomId);
      setRoom(data.data.room);
      return data.data.room;
    });
  }, [run]);

  /** Join a room by its code */
  const joinRoom = useCallback(async (roomCode: string, payload: roomsApi.JoinRoomPayload) => {
    return run(async () => {
      const { data } = await roomsApi.joinRoom(roomCode, payload);
      setRoom(data.data.room);
      return data.data.room;
    });
  }, [run]);

  /** Leave the current room */
  const leaveRoom = useCallback(async (roomId: string) => {
    return run(async () => {
      const { data } = await roomsApi.leaveRoom(roomId);
      setRoom(null);
      setRooms((prev) => prev.filter((r) => r._id !== roomId));
      return data.data.room;
    });
  }, [run]);

  /** Add a player to a team */
  const addPlayer = useCallback(async (roomId: string, payload: roomsApi.AddPlayerPayload) => {
    return run(async () => {
      const { data } = await roomsApi.addPlayer(roomId, payload);
      setRoom(data.data.room);
      return data.data.room;
    });
  }, [run]);

  /** Remove a player from a team */
  const removePlayer = useCallback(async (roomId: string, playerId: string) => {
    return run(async () => {
      const { data } = await roomsApi.removePlayer(roomId, playerId);
      setRoom(data.data.room);
      return data.data.room;
    });
  }, [run]);

  return {
    rooms, room,
    isLoading, error,
    createRoom, fetchMyRooms, fetchRoomByCode, fetchRoomById,
    joinRoom, leaveRoom, addPlayer, removePlayer,
  };
};
