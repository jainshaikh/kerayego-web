import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi } from '../lib/api/admin.api';

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: adminApi.getOverview,
    staleTime: 30_000,
  });
}

// ── Providers ─────────────────────────────────────────────────────────────

export function usePendingProviders(page = 1) {
  return useQuery({
    queryKey: ['admin', 'providers', 'pending', page],
    queryFn: () => adminApi.getPendingProviders(page),
    staleTime: 30_000,
  });
}

export function useAdminProviderDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'providers', 'detail', id],
    queryFn: () => adminApi.getProviderDetail(id),
    staleTime: 30_000,
    enabled: !!id,
  });
}

export function useApproveProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => adminApi.approveProvider(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'providers'] });
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
      toast.success('Provider approved');
    },
    onError: () => toast.error('Failed to approve provider'),
  });
}

export function useRejectProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.rejectProvider(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'providers'] });
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
      toast.success('Provider rejected');
    },
    onError: () => toast.error('Failed to reject provider'),
  });
}

// ── Vehicles ───────────────────────────────────────────────────────────────

export function useAdminAllVehicles(page = 1, status?: string, search?: string) {
  return useQuery({
    queryKey: ['admin', 'vehicles', 'all', page, status, search],
    queryFn: () => adminApi.getAllVehicles(page, 20, status, search),
    staleTime: 30_000,
  });
}


export function useAdminVehicleDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'vehicles', 'detail', id],
    queryFn: () => adminApi.getVehicleDetail(id),
    staleTime: 30_000,
    enabled: !!id,
  });
}

export function useApproveVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => adminApi.approveVehicle(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'vehicles'] });
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
      toast.success('Vehicle approved — now live');
    },
    onError: () => toast.error('Failed to approve vehicle'),
  });
}

export function useRejectVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.rejectVehicle(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'vehicles'] });
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
      toast.success('Vehicle rejected');
    },
    onError: () => toast.error('Failed to reject vehicle'),
  });
}

// ── Trips ─────────────────────────────────────────────────────────────────

export function useAdminTrips(page = 1, status?: string) {
  return useQuery({
    queryKey: ['admin', 'trips', page, status],
    queryFn: () => adminApi.getTrips(page, 20, status),
    staleTime: 30_000,
  });
}

export function useAdminTripDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'trips', 'detail', id],
    queryFn: () => adminApi.getTripDetail(id),
    staleTime: 30_000,
    enabled: !!id,
  });
}

export function useSuspendTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.suspendTrip(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'trips'] });
      toast.success('Trip suspended');
    },
    onError: () => toast.error('Failed to suspend trip'),
  });
}

export function useReactivateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.reactivateTrip(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'trips'] });
      toast.success('Trip reactivated');
    },
    onError: () => toast.error('Failed to reactivate trip'),
  });
}

// ── User Vehicles (personal vehicles used for trips) ─────────────────────

export function useAdminUserVehicles(page = 1, status?: string) {
  return useQuery({
    queryKey: ['admin', 'user-vehicles', page, status],
    queryFn: () => adminApi.getUserVehicles(page, 20, status),
    staleTime: 30_000,
  });
}

export function useAdminUserVehicleDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'user-vehicles', 'detail', id],
    queryFn: () => adminApi.getUserVehicleDetail(id),
    staleTime: 30_000,
    enabled: !!id,
  });
}

export function useApproveUserVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.approveUserVehicle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'user-vehicles'] });
      toast.success('Vehicle approved — owner can now use it to post trips');
    },
    onError: () => toast.error('Failed to approve vehicle'),
  });
}

export function useRejectUserVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.rejectUserVehicle(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'user-vehicles'] });
      toast.success('Vehicle rejected');
    },
    onError: () => toast.error('Failed to reject vehicle'),
  });
}

export function useSuspendUserVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.suspendUserVehicle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'user-vehicles'] });
      toast.success('Vehicle suspended');
    },
    onError: () => toast.error('Failed to suspend vehicle'),
  });
}

export function useReactivateUserVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.reactivateUserVehicle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'user-vehicles'] });
      toast.success('Vehicle reactivated');
    },
    onError: () => toast.error('Failed to reactivate vehicle'),
  });
}

// ── Users ─────────────────────────────────────────────────────────────────

export function useAdminUsers(page = 1, role?: string, status?: string) {
  return useQuery({
    queryKey: ['admin', 'users', page, role, status],
    queryFn: () => adminApi.getUsers(page, 20, role, status),
    staleTime: 30_000,
  });
}

export function useAdminUserDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'users', 'detail', id],
    queryFn: () => adminApi.getUserDetail(id),
    staleTime: 30_000,
    enabled: !!id,
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.suspendUser(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User suspended');
    },
    onError: () => toast.error('Failed to suspend user'),
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.activateUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User activated');
    },
    onError: () => toast.error('Failed to activate user'),
  });
}

// ── Audit logs ─────────────────────────────────────────────────────────────

export function useAuditLogs(params: {
  entityType?: string;
  entityId?: string;
  adminUserId?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: () => adminApi.getAuditLogs({ ...params, limit: 50 }),
    staleTime: 30_000,
  });
}

// ── Platform settings ──────────────────────────────────────────────────────

export function usePlatformSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: adminApi.getSettings,
    staleTime: 60_000,
  });
}

export function useUpsertSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      key,
      value,
      description,
    }: {
      key: string;
      value: unknown;
      description?: string;
    }) => adminApi.upsertSetting(key, value, description),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'settings'] }),
    onError: (error: Error) => toast.error(error?.message || 'Failed to save setting'),
  });
}
