// ─── Types ────────────────────────────────────────────────────────────────────
export * from './types';

// ─── API client ───────────────────────────────────────────────────────────────
export { default as apiClient, saveTokens, getTokens, clearTokens, toApiError, BASE_URL, API_URL } from './api/apiClient';

// ─── API modules ──────────────────────────────────────────────────────────────
export * as authApi          from './api/authApi';
export * as usersApi         from './api/usersApi';
export * as roomsApi         from './api/roomsApi';
export * as matchesApi       from './api/matchesApi';
export * as scoringApi       from './api/scoringApi';
export * as toolsApi         from './api/toolsApi';
export * as subscriptionsApi from './api/subscriptionsApi';
export * as enterprisesApi   from './api/enterprisesApi';
export * as adsApi           from './api/adsApi';
export * as friendsApi       from './api/friendsApi';

// ─── Hooks ────────────────────────────────────────────────────────────────────
export { useAuth }         from './hooks/useAuth';
export { useUser }         from './hooks/useUser';
export { useRooms }        from './hooks/useRooms';
export { useMatch }        from './hooks/useMatch';
export { useScoring }      from './hooks/useScoring';
export { useTools }        from './hooks/useTools';
export { useSubscription } from './hooks/useSubscription';
export { useEnterprise }   from './hooks/useEnterprise';
export { useAds }          from './hooks/useAds';
export { useFriends }      from './hooks/useFriends';

// ─── Context ──────────────────────────────────────────────────────────────────
export { AuthProvider, useAuthContext } from './context/AuthContext';
