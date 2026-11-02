import apiClient from './client';
import type {
  ApiResponse,
  LoginCodeRequestResponse,
  LoginResponse,
  RegisterResponse,
} from '../../types/api.types';
import type { RegisterFormValues } from '../validations/auth.schema';

export const authApi = {
  /** No password: the backend emails a 6-digit code (codeSent: true). */
  register: async (data: RegisterFormValues) => {
    const response = await apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', data);
    return response.data;
  },

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
