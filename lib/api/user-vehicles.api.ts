import apiClient from './client';
import type { ApiResponse, Market } from '../../types/api.types';

export type UserVehicleStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface UserVehicleImage {
  id: string;
  url: string;
  publicId: string;
  altText: string | null;
  sortOrder: number;
  width: number | null;
  height: number | null;
}

export interface UserVehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  plateNumber: string;
  country: Market;
  status: UserVehicleStatus;
  rejectionReason: string | null;
  /** The owner's CNIC as given on the car form; null on older cars. */
  cnicNumber?: string | null;
  createdAt: string;
  updatedAt: string;
  // sortOrder 0 is the poster/cover shown as the card thumbnail
  images: UserVehicleImage[];
}

export interface UserVehicleDocument {
  id: string;
  documentType: 'ID_DOCUMENT' | 'ID_DOCUMENT_FRONT' | 'ID_DOCUMENT_BACK' | 'DRIVING_LICENSE' | 'VEHICLE_REGISTRATION';
  fileUrl: string;
  status: string;
}

export interface UserVehicleDetail extends UserVehicle {
  documents: UserVehicleDocument[];
}

export interface UserVehicleImageInput {
  url: string;
  publicId: string;
  altText?: string;
  width?: number;
  height?: number;
}

export interface CreateUserVehiclePayload {
  // Client-generated id — lets photo/document uploads land in a per-vehicle S3
  // folder before this record exists. See MediaModule's entityId support.
  id?: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  plateNumber: string;
  /** `12345-1234567-1`. A CNIC on the block list is refused (403 IDENTITY_BLOCKED). */
  cnicNumber?: string;
  images?: UserVehicleImageInput[];
  cnicFrontUrl: string;
  cnicFrontPublicId: string;
  cnicBackUrl: string;
  cnicBackPublicId: string;
  drivingLicenseUrl: string;
  drivingLicensePublicId: string;
  vehicleRegistrationUrl: string;
  vehicleRegistrationPublicId: string;
}

export const userVehiclesApi = {
  create: async (data: CreateUserVehiclePayload): Promise<UserVehicleDetail> => {
    const res = await apiClient.post<ApiResponse<UserVehicleDetail>>('/my/vehicles', data);
    return res.data.data;
  },

  getMine: async (): Promise<UserVehicle[]> => {
    const res = await apiClient.get<ApiResponse<UserVehicle[]>>('/my/vehicles');
    return res.data.data;
  },

  getMyApproved: async (): Promise<UserVehicle[]> => {
    const res = await apiClient.get<ApiResponse<UserVehicle[]>>('/my/vehicles/approved');
    return res.data.data;
  },

  getMyOne: async (id: string): Promise<UserVehicleDetail> => {
    const res = await apiClient.get<ApiResponse<UserVehicleDetail>>(`/my/vehicles/${id}`);
    return res.data.data;
  },
};
