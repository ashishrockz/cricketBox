import apiClient from './apiClient';
import type { ApiResponse, Friendship, User } from '../types';

export interface FriendsListParams {
  page?: number;
  limit?: number;
}

/** Get the current user's accepted friends list */
export const getFriends = (params?: FriendsListParams) =>
  apiClient.get<ApiResponse<{ friends: User[] }>>('/friends', { params });

/** Get pending friend requests received by the current user */
export const getPendingRequests = () =>
  apiClient.get<ApiResponse<{ requests: Friendship[] }>>('/friends/requests/pending');

/** Get friend requests sent by the current user */
export const getSentRequests = () =>
  apiClient.get<ApiResponse<{ requests: Friendship[] }>>('/friends/requests/sent');

/** Send a friend request to another user */
export const sendFriendRequest = (recipientId: string) =>
  apiClient.post<ApiResponse<{ friendship: Friendship }>>('/friends/request', { recipientId });

/** Accept or reject a received friend request */
export const respondToRequest = (friendshipId: string, action: 'accept' | 'reject') =>
  apiClient.put<ApiResponse<{ friendship: Friendship }>>(`/friends/request/${friendshipId}`, { action });

/** Remove an existing friend */
export const removeFriend = (friendshipId: string) =>
  apiClient.delete<ApiResponse<null>>(`/friends/${friendshipId}`);
