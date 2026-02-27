import apiClient from './apiClient';
import type { ApiResponse, SubscriptionPlan, Subscription } from '../types';

/** Get all active subscription plans (public — no auth needed) */
export const getPlans = () =>
  apiClient.get<ApiResponse<{ plans: SubscriptionPlan[] }>>('/subscriptions/plans');

/** Get the current user's active subscription */
export const getMySubscription = () =>
  apiClient.get<ApiResponse<{ subscription: Subscription | null }>>('/subscriptions/my');

/** Get the current user's full subscription history */
export const getSubscriptionHistory = () =>
  apiClient.get<ApiResponse<{ subscriptions: Subscription[] }>>('/subscriptions/history');
