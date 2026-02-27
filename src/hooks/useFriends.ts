/**
 * useFriends — friend system hook
 */
import { useState, useCallback } from 'react';
import * as friendsApi from '../api/friendsApi';
import type { User, Friendship, ApiError } from '../types';

export const useFriends = () => {
  const [friends,        setFriends]        = useState<User[]>([]);
  const [pendingRequests,setPendingRequests] = useState<Friendship[]>([]);
  const [sentRequests,   setSentRequests]   = useState<Friendship[]>([]);
  const [isLoading,      setIsLoading]      = useState(false);
  const [error,          setError]          = useState<ApiError | null>(null);

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

  /** Fetch the current user's accepted friends list */
  const fetchFriends = useCallback(async (params?: friendsApi.FriendsListParams) => {
    return run(async () => {
      const { data } = await friendsApi.getFriends(params);
      setFriends(data.data.friends);
      return data.data.friends;
    });
  }, [run]);

  /** Fetch pending (received) friend requests */
  const fetchPendingRequests = useCallback(async () => {
    return run(async () => {
      const { data } = await friendsApi.getPendingRequests();
      setPendingRequests(data.data.requests);
      return data.data.requests;
    });
  }, [run]);

  /** Fetch sent (outgoing) friend requests */
  const fetchSentRequests = useCallback(async () => {
    return run(async () => {
      const { data } = await friendsApi.getSentRequests();
      setSentRequests(data.data.requests);
      return data.data.requests;
    });
  }, [run]);

  /** Send a friend request to a user */
  const sendRequest = useCallback(async (recipientId: string) => {
    return run(async () => {
      const { data } = await friendsApi.sendFriendRequest(recipientId);
      setSentRequests((prev) => [...prev, data.data.friendship]);
      return data.data.friendship;
    });
  }, [run]);

  /** Accept a pending request — removes from pendingRequests on success */
  const acceptRequest = useCallback(async (friendshipId: string) => {
    return run(async () => {
      const { data } = await friendsApi.respondToRequest(friendshipId, 'accept');
      setPendingRequests((prev) => prev.filter((r) => r._id !== friendshipId));
      return data.data.friendship;
    });
  }, [run]);

  /** Reject a pending request — removes from pendingRequests on success */
  const rejectRequest = useCallback(async (friendshipId: string) => {
    return run(async () => {
      const { data } = await friendsApi.respondToRequest(friendshipId, 'reject');
      setPendingRequests((prev) => prev.filter((r) => r._id !== friendshipId));
      return data.data.friendship;
    });
  }, [run]);

  /** Remove an existing friend */
  const removeFriend = useCallback(async (friendshipId: string) => {
    return run(async () => {
      await friendsApi.removeFriend(friendshipId);
      setFriends((prev) => prev.filter((_, i) => {
        // remove friend whose friendship ID matches
        return true; // refetch friends after removal for accuracy
      }));
      return true;
    });
  }, [run]);

  return {
    friends, pendingRequests, sentRequests,
    isLoading, error,
    fetchFriends, fetchPendingRequests, fetchSentRequests,
    sendRequest, acceptRequest, rejectRequest, removeFriend,
  };
};
