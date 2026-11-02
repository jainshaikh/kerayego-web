import apiClient from './client';
import type {
  ApiResponse,
  User,
  PaginationMeta,
  PhoneSendCodeResponse,
} from '../../types/api.types';
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

  // The number is no longer changed here (that would clear its verification):
  // it goes through sendPhoneCode → verifyPhoneCode below.
  updateMe: async (data: { name?: string; whatsappUpdates?: boolean }) => {
    const response = await apiClient.patch<ApiResponse<User>>('/users/me', data);
    return response.data;
  },

  // WhatsApp code to verify (or change to) a mobile number. Any format the
  // backend's toE164Phone accepts (0300…, 300…, 92…, +92…). Errors carry
  // PhoneErrorCode codes — none of them is a 401, so none triggers a refresh.
  sendPhoneCode: async (phone: string) => {
    const response = await apiClient.post<ApiResponse<PhoneSendCodeResponse>>(
      '/users/me/phone/send-code',
      { phone },
    );
    return response.data.data;
  },

  /** 200 → the updated user (phoneVerified: true); 400 CODE_INVALID for a wrong/expired code. */
  verifyPhoneCode: async (code: string) => {
    const response = await apiClient.post<ApiResponse<User>>('/users/me/phone/verify', { code });
    return response.data.data;
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
