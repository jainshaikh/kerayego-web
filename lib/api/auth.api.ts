import apiClient from './client';
import type {
  ApiResponse,
  LoginCodeRequestResponse,
  LoginResponse,
  PhoneRegisterRequest,
  PhoneSignInRequestResponse,
  PhoneSignInSession,
  PhoneVerifyResponse,
} from '../../types/api.types';

export const authApi = {
  // ── Phone-first sign-in / sign-up (WhatsApp code) ──────────────────────────
  // No X-Client-Type header: the web gets its refresh token as the backend's
  // httpOnly cookie, exactly like /auth/code/verify. The web no longer calls
  // POST /auth/register (it stays on the backend for installed apps).

  /** Sends a WhatsApp code. Always the same 200 answer, whether or not the number has an account. */
  requestPhoneCode: async (phone: string) => {
    const response = await apiClient.post<ApiResponse<PhoneSignInRequestResponse>>(
      '/auth/phone/request',
      { phone },
    );
    return response.data;
  },

  /** A session (needsSignup: false) or a signupToken for /auth/phone/register (needsSignup: true). */
  verifyPhoneCode: async (phone: string, code: string) => {
    const response = await apiClient.post<ApiResponse<PhoneVerifyResponse>>('/auth/phone/verify', {
      phone,
      code,
    });
    return response.data;
  },

  /** Creates the account for a verified number and signs it in. */
  registerWithPhone: async (data: PhoneRegisterRequest) => {
    const response = await apiClient.post<ApiResponse<PhoneSignInSession>>(
      '/auth/phone/register',
      data,
    );
    return response.data;
  },

  // ── Email code (the "Sign in with email instead" backup) ───────────────────

  /** Always the same 200 answer, whether or not the email has an account. */
  requestLoginCode: async (email: string) => {
    const response = await apiClient.post<ApiResponse<LoginCodeRequestResponse>>(
      '/auth/code/request',
      { email },
    );
    return response.data;
  },

  /** Same response as the old password login; the refresh token arrives as an httpOnly cookie. */
  verifyLoginCode: async (email: string, code: string) => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/code/verify', {
      email,
      code,
    });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post<ApiResponse<null>>('/auth/logout');
    return response.data;
  },

  refresh: async () => {
    const response = await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/verify-email', {
      token,
    });
    return response.data;
  },

  resendVerification: async () => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/resend-verification',
    );
    return response.data;
  },
};
