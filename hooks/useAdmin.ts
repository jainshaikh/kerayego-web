import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi, type ActivityLogQuery, type IdentityReviewStatus } from '../lib/api/admin.api';
import type { DriverVerificationStatus } from '../types/enums';
import { getApiErrorMessage } from './useAccountDeletion';

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

export function useAdminProviderSummary(id: string) {
  return useQuery({
    queryKey: ['admin', 'providers', 'summary', id],
    queryFn: () => adminApi.getProviderSummary(id),
    staleTime: 30_000,
    enabled: !!id,
  });
}

/** A business's own activity log (what its admins, managers and drivers did), paged. */
export function useAdminProviderActivityLogs(id: string, query: ActivityLogQuery, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'providers', 'activity-logs', id, query],
    queryFn: () => adminApi.getProviderActivityLogs(id, query),
    staleTime: 30_000,
    enabled: !!id && enabled,
    placeholderData: (previous) => previous,
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

/** PATCH /admin/vehicles/:id/plate — errors (plate blocked or taken) are shown inline by the caller. */
export function useCorrectVehiclePlate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, plateNumber, reason }: { id: string; plateNumber: string; reason: string }) =>
      adminApi.correctVehiclePlate(id, plateNumber, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'vehicles'] });
      toast.success('Plate number corrected');
    },
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

// ── Drivers (provider drivers' identity + licence verification) ──────────

/** The backend's error envelope is `{ error: { message, details? } }`; a DTO
 * validation failure has message "Validation failed" and the field errors in
 * `details`, so surface those instead. */
export function driverErrorMessage(error: unknown, fallback: string): string {
  const body = (error as { response?: { data?: { error?: { message?: string; details?: unknown } } } })
    ?.response?.data?.error;
  if (Array.isArray(body?.details) && body.details.length > 0) {
    return body.details.map(String).join(' · ');
  }
  return body?.message ?? fallback;
}

export function useAdminDrivers(page = 1, status: DriverVerificationStatus) {
  return useQuery({
    queryKey: ['admin', 'drivers', page, status],
    queryFn: () => adminApi.getDrivers(page, 20, status),
    staleTime: 30_000,
  });
}

/** Document `fileUrl`s are ~10-minute signed links, so this is never served
 * from cache: always refetched on mount/focus, dropped as soon as the page
 * unmounts, and refetched every 5 minutes so links stay openable. */
export function useAdminDriverDetail(userId: string) {
  return useQuery({
    queryKey: ['admin', 'drivers', 'detail', userId],
    queryFn: () => adminApi.getDriverDetail(userId),
    enabled: !!userId,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60_000,
  });
}

export function useApproveDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.approveDriver(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'drivers'] });
      toast.success('Driver verified');
    },
    onError: (error: unknown) => toast.error(driverErrorMessage(error, 'Failed to approve driver')),
  });
}

export function useRejectDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminApi.rejectDriver(userId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'drivers'] });
      toast.success('Driver verification rejected');
    },
    onError: (error: unknown) => toast.error(driverErrorMessage(error, 'Failed to reject driver')),
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

// ── Person blocks & identity reviews (A22, D18) ──────────────────────────
// Errors are shown inline by the calling modal (getApiErrorMessage), not toasted.

/** POST /admin/users/:id/block — suspends the account and blocks its CNIC(s), phone and email. */
export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.blockUser(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'blocks'] });
      qc.invalidateQueries({ queryKey: ['admin', 'identity-reviews'] });
      toast.success('Person blocked');
    },
  });
}

export function useAdminBlocks(page = 1, includeLifted = false) {
  return useQuery({
    queryKey: ['admin', 'blocks', page, includeLifted],
    queryFn: () => adminApi.getBlocks(page, 20, includeLifted),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

/** SUPER_ADMIN only. Lifting does not reactivate the blocked account. */
export function useLiftBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.liftBlock(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'blocks'] });
      qc.invalidateQueries({ queryKey: ['admin', 'identity-reviews'] });
      toast.success('Block lifted');
    },
  });
}

export function useAdminIdentityReviews(page = 1, status: IdentityReviewStatus = 'PENDING') {
  return useQuery({
    queryKey: ['admin', 'identity-reviews', page, status],
    queryFn: () => adminApi.getIdentityReviews(page, 20, status),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

export function useClearIdentityReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => adminApi.clearIdentityReview(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'identity-reviews'] });
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Account cleared');
    },
  });
}

export function useBlockIdentityReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.blockIdentityReview(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'identity-reviews'] });
      qc.invalidateQueries({ queryKey: ['admin', 'blocks'] });
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Person blocked');
    },
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

// ── Tracking lookup (Phase 5, A39) ────────────────────────────────────────

export function useAdminTrackingLookup(params: {
  vehicleId?: string;
  driverId?: string;
  bookingId?: string;
  query?: string;
}) {
  const hasParam = !!(params.vehicleId || params.driverId || params.bookingId || params.query);
  return useQuery({
    queryKey: ['admin', 'tracking', 'lookup', params],
    queryFn: () => adminApi.lookupTracking(params),
    enabled: hasParam,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

// ── Super Admin deletions (Phase 5, A33, A45) ──────────────────────────────
// The admin audit log itself is permanent — DELETE /admin/audit-logs/:id always
// returns 403 (A45), so there is deliberately no delete hook for it.

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.deleteReview(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Review deleted and recorded in permanent log');
    },
    onError: () => toast.error('Failed to delete review (requires Super Admin)'),
  });
}

/** SUPER_ADMIN only (A45): delete one business activity-log entry. The
 * backend records the deletion, with the reason, in the permanent AdminActionLog. */
export function useDeleteBusinessActivityLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.deleteBusinessActivityLog(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'providers', 'summary'] });
      qc.invalidateQueries({ queryKey: ['admin', 'providers', 'activity-logs'] });
      toast.success('Entry deleted and recorded in the permanent audit log');
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, 'Failed to delete the entry')),
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
