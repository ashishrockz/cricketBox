/**
 * useEnterprise — academy / club management hook
 * Requires enterprise subscription plan to create.
 */
import { useState, useCallback } from 'react';
import * as enterprisesApi from '../api/enterprisesApi';
import type { Enterprise, ApiError } from '../types';

export const useEnterprise = () => {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [enterprise,  setEnterprise]  = useState<Enterprise | null>(null);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState<ApiError | null>(null);

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

  /** List public enterprises */
  const fetchEnterprises = useCallback(async (params?: enterprisesApi.ListEnterprisesParams) => {
    return run(async () => {
      const { data } = await enterprisesApi.listEnterprises(params);
      setEnterprises(data.data.enterprises);
      return data.data.enterprises;
    });
  }, [run]);

  /** Get a single enterprise by ID or slug */
  const fetchEnterprise = useCallback(async (idOrSlug: string) => {
    return run(async () => {
      const { data } = await enterprisesApi.getEnterprise(idOrSlug);
      setEnterprise(data.data.enterprise);
      return data.data.enterprise;
    });
  }, [run]);

  /** Get the current user's own enterprise */
  const fetchMyEnterprise = useCallback(async () => {
    return run(async () => {
      const { data } = await enterprisesApi.getMyEnterprise();
      setEnterprise(data.data.enterprise);
      return data.data.enterprise;
    });
  }, [run]);

  /** Create a new enterprise (requires enterprise plan) */
  const createEnterprise = useCallback(async (payload: enterprisesApi.CreateEnterprisePayload) => {
    return run(async () => {
      const { data } = await enterprisesApi.createEnterprise(payload);
      setEnterprise(data.data.enterprise);
      return data.data.enterprise;
    });
  }, [run]);

  /** Update enterprise details */
  const updateEnterprise = useCallback(async (id: string, payload: enterprisesApi.UpdateEnterprisePayload) => {
    return run(async () => {
      const { data } = await enterprisesApi.updateEnterprise(id, payload);
      setEnterprise(data.data.enterprise);
      return data.data.enterprise;
    });
  }, [run]);

  /** Add a member */
  const addMember = useCallback(async (id: string, payload: enterprisesApi.AddMemberPayload) => {
    return run(async () => {
      const { data } = await enterprisesApi.addMember(id, payload);
      setEnterprise(data.data.enterprise);
      return data.data.enterprise;
    });
  }, [run]);

  /** Remove a member */
  const removeMember = useCallback(async (id: string, userId: string) => {
    return run(async () => {
      const { data } = await enterprisesApi.removeMember(id, userId);
      setEnterprise(data.data.enterprise);
      return data.data.enterprise;
    });
  }, [run]);

  /** Change a member's role */
  const updateMemberRole = useCallback(async (
    id: string,
    userId: string,
    role: Parameters<typeof enterprisesApi.updateMemberRole>[2],
  ) => {
    return run(async () => {
      const { data } = await enterprisesApi.updateMemberRole(id, userId, role);
      setEnterprise(data.data.enterprise);
      return data.data.enterprise;
    });
  }, [run]);

  return {
    enterprises, enterprise,
    isLoading, error,
    fetchEnterprises, fetchEnterprise, fetchMyEnterprise,
    createEnterprise, updateEnterprise,
    addMember, removeMember, updateMemberRole,
  };
};
