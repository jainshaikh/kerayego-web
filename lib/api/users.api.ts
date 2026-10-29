import apiClient from './client';
import type { ApiResponse, User, PaginationMeta } from '../../types/api.types';
import type { ListingVehicleCard } from './listings.api';

export interface SavedVehicle {
  id: string;
  vehicleId: string;
  createdAt: string;
  // getSavedVehicles reuses the backend's shared CARD_SELECT, so this matches
  // ListingVehicleCard exactly except for the two fields only computed by the
  // listings endpoints themselves (a saved vehicle's own current booking
  // status isn't looked up here).
  vehicle: Omit<ListingVehicleCard, 'availability' | 'bookedUntil'>;
}

export const usersApi = {
  getMe: async () => {
    const response = await apiClient.get<ApiResponse<User>>('/users/me');
    return response.data;
  },

  updateMe: async (data: { name?: string; phone?: string }) => {
    const response = await apiClient.patch<ApiResponse<User>>('/users/me', data);
    return response.data;
  },

  getSavedVehicles: async (page = 1, limit = 20) => {
    const response = await apiClient.get<ApiResponse<SavedVehicle[]> & { meta: PaginationMeta }>(
      '/users/me/saved-vehicles',
      { params: { page, limit } },
    );
    return response.data;
  },

  saveVehicle: async (vehicleId: string) => {
    const response = await apiClient.post<ApiResponse<{ id: string; vehicleId: string }>>(
      '/users/me/saved-vehicles',
      { vehicleId },
    );
    return response.data;
  },

  removeSavedVehicle: async (vehicleId: string) => {
    await apiClient.delete(`/users/me/saved-vehicles/${vehicleId}`);
  },

  // Schedules deletion 72h out. On success the backend has already revoked every
  // refresh token (signed out everywhere) — the caller must clear the local session.
  // 400 carries a readable message listing whatever is still active.
  requestAccountDeletion: async (reason?: string) => {
    const response = await apiClient.post<ApiResponse<AccountDeletionRequestResult>>(
      '/users/me/delete-request',
      reason ? { reason } : {},
    );
    return response.data.data;
  },

  // Public (no auth): the "Cancel deletion" link from the confirmation email.
  // 400 'This link is invalid or has expired.' for an unknown/used/expired token.
  cancelAccountDeletionByToken: async (token: string) => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      '/users/cancel-delete-by-token',
      { token },
    );
    return response.data.data;
  },
};

export interface AccountDeletionRequestResult {
  message: string;
  /** ISO timestamp — when the account will be deleted. */
  scheduledFor: string;
  status: 'PENDING_DELETION';
}
