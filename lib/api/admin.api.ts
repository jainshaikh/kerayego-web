import { apiClient } from './client';
import type {
  AdminDriverDetail,
  AdminDriverListItem,
  ApiResponse,
  Market,
} from '../../types/api.types';
import type { DriverVerificationStatus } from '../../types/enums';

// ── Types ──────────────────────────────────────────────────────────────────

export interface AdminOverview {
  totalUsers: number;
  totalProviders: number;
  totalVehicles: number;
  pendingProviders: number;
  pendingVehicles: number;
  activeBookings: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  providerProfile?: { businessName: string; verificationStatus: string } | null;
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { bookingRequests: number; savedVehicles: number };
  providerProfile: {
    id: string;
    businessName: string;
    businessDescription?: string | null;
    verificationStatus: string;
    rejectionReason?: string | null;
    isFeatured: boolean;
    createdAt: string;
    updatedAt: string;
    showrooms: Array<{ id: string; name: string; city: string; contactNumber?: string | null }>;
    documents: Array<{ id: string; documentType: string; fileUrl: string; status: string }>;
    _count: { vehicles: number; bookingRequests: number };
  } | null;
}

export interface AdminProviderSummary {
  id: string;
  businessName: string;
  businessType: string;
  verificationStatus: string;
  updatedAt: string;
  user: { id: string; name: string; email: string; phone?: string | null; createdAt: string };
  showrooms: Array<{ city: string; contactNumber?: string | null }>;
  documents: Array<{ id: string; documentType: string; fileUrl: string; status: string }>;
  _count: { vehicles: number };
}

export interface AdminProviderShowroom {
  id: string;
  name: string;
  address: string;
  city: string;
  area?: string | null;
  contactNumber: string;
  whatsappNumber?: string | null;
  operatingHours?: Record<string, string> | null;
  mapLat?: number | null;
  mapLng?: number | null;
}

// The real GET /admin/providers/:id payload — full showrooms (not the
// city/contactNumber-only projection the pending list gets), bookingRequests
// count, and documents guaranteed present (not optional like on AdminUserVehicle).
export interface AdminProviderDetail {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  businessDescription?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  verificationStatus: string;
  isFeatured: boolean;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string; phone?: string | null; createdAt: string };
  showrooms: AdminProviderShowroom[];
  documents: Array<{ id: string; documentType: string; fileUrl: string; status: string; rejectionReason?: string | null }>;
  _count: { vehicles: number; bookingRequests: number };
}

export interface AdminVehicleSummary {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  status: string;
  pricePerDay: string | number;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  providerProfile: { id: string; businessName: string; verificationStatus?: string };
  showroom?: { city: string; country: Market } | null;
  images: Array<{ url: string; altText?: string | null }>;
}

export interface AdminVehicleDetail {
  id: string;
  slug: string;
  title: string;
  make: string;
  model: string;
  year: number;
  transmission: string;
  fuelType: string;
  seatingCapacity: number;
  engineType?: string | null;
  pricePer6Hours?: string | number | null;
  pricePer12Hours?: string | number | null;
  pricePerDay: string | number;
  pricePerWeek?: string | number | null;
  pricePerMonth?: string | number | null;
  locationText?: string | null;
  availabilityNotes?: string | null;
  pricingNotes?: string | null;
  specialConditions?: string | null;
  status: string;
  rejectionReason?: string | null;
  viewCount: number;
  inquiryCount: number;
  createdAt: string;
  updatedAt: string;
  images: Array<{ id: string; url: string; altText?: string | null; sortOrder: number; width?: number | null; height?: number | null }>;
  features: Array<{ id: string; name: string; value?: string | null }>;
  showroom: { id: string; name: string; city: string; area?: string | null; contactNumber: string; country: Market } | null;
  providerProfile: {
    id: string;
    businessName: string;
    slug: string;
    verificationStatus: string;
    user: { id: string; name: string; email: string; phone?: string | null; createdAt: string };
  };
  _count: { bookingRequests: number };
}

export interface AdminTripDetail {
  id: string;
  originCity: string;
  destinationCity: string;
  pickupPoint: string;
  dropoffPoint?: string | null;
  departureAt: string;
  availableSeats: number;
  pricePerSeat: string | number;
  contactNumber: string;
  notes?: string | null;
  status: string;
  rejectionReason?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
  postedBy: { id: string; name: string; email: string; phone?: string | null };
  // Mirrors TripsService TRIP_DETAIL_SELECT: a return trip (A48) runs in a
  // business's fleet car, so userVehicle is null and fleetVehicle/providerProfile are set.
  userVehicle: { id: string; make: string; model: string; year?: number | null; color?: string | null; plateNumber: string; status: string; country: Market } | null;
  isReturnTrip?: boolean;
  fleetVehicle?: { id: string; title: string; make: string; model: string; year: number; seatingCapacity: number; status: string } | null;
  providerProfile?: { id: string; businessName: string; slug: string } | null;
}

export interface AdminUserVehicle {
  id: string;
  make: string;
  model: string;
  year?: number | null;
  color?: string | null;
  plateNumber: string;
  status: string;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string; email: string; phone?: string | null };
  // Only present on the single-vehicle detail fetch, not on list rows
  documents?: Array<{ id: string; documentType: string; fileUrl: string; status: string }>;
}

export interface AuditLog {
  id: string;
  actionType: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
  adminUser: { id: string; name: string; email: string; role: string };
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: unknown;
  description?: string | null;
  updatedAt: string;
  updatedById?: string | null;
}

export interface PagedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface AdminProviderBusinessSummary {
  business: {
    id: string;
    businessName: string;
    slug: string;
    verificationStatus: string;
    createdAt: string;
    owner: { id: string; name: string; email: string; phone?: string | null; createdAt: string };
    showrooms: Array<{ id: string; name: string; city: string; contactNumber?: string | null }>;
  };
  members: {
    businessAdmins: number;
    managers: number;
    drivers: number;
    verifiedDrivers: number;
    total: number;
  };
  fleet: {
    total: number;
    approved: number;
    pendingReview: number;
  };
  bookings: {
    total: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    rejected: number;
  };
  recentActivity: Array<{
    id: string;
    actionType: string;
    entityType: string;
    entityId: string;
    metadata?: any;
    createdAt: string;
    adminUser: { id: string; name: string; email: string };
  }>;
}

export interface AdminTrackingLookupResult {
  booking: {
    id: string;
    status: string;
    requestedFromDate: string;
    requestedToDate: string;
    startedAt: string | null;
    completedAt: string | null;
  };
  isCurrentlyActive: boolean;
  vehicle: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    slug: string;
  };
  driver: {
    id: string;
    name: string;
    phone: string | null;
    licenseCategory: string | null;
    licenseNumber: string | null;
    avatarUrl: string | null;
  } | null;
  business: {
    id: string;
    businessName: string;
    slug: string;
  };
  customer: {
    id: string;
    name: string;
    phone: string | null;
  };
  lastLocation: {
    lat: number;
    lng: number;
    headingDeg: number | null;
    speedKmh: number | null;
    timestamp: string;
  } | null;
  lastSeenText: string;
  recentRouteFixes: Array<{
    lat: number;
    lng: number;
    headingDeg: number | null;
    speedKmh: number | null;
    accuracyM: number | null;
    timestamp: string;
  }>;
}

// ── API client ─────────────────────────────────────────────────────────────

export const adminApi = {
  getOverview: () =>
    apiClient.get<ApiResponse<AdminOverview>>('/admin/overview').then((r) => r.data.data),

  // Providers
  getAllProviders: (page = 1, limit = 20, status?: string, search?: string) =>
    apiClient
      .get<PagedResponse<AdminProviderSummary>>('/admin/providers', {
        params: { page, limit, ...(status && { status }), ...(search && { search }) },
      })
      .then((r) => r.data),
  getPendingProviders: (page = 1, limit = 20) =>
    apiClient
      .get<PagedResponse<AdminProviderSummary>>('/admin/providers/pending', { params: { page, limit } })
      .then((r) => r.data),
  getProviderDetail: (id: string) =>
    apiClient.get<ApiResponse<AdminProviderDetail>>(`/admin/providers/${id}`).then((r) => r.data.data),
  getProviderSummary: (id: string) =>
    apiClient.get<ApiResponse<AdminProviderBusinessSummary>>(`/admin/providers/${id}/summary`).then((r) => r.data.data),
  approveProvider: (id: string, note?: string) =>
    apiClient.patch<ApiResponse<AdminProviderSummary>>(`/admin/providers/${id}/approve`, { note }).then((r) => r.data.data),
  rejectProvider: (id: string, reason: string) =>
    apiClient.patch<ApiResponse<AdminProviderSummary>>(`/admin/providers/${id}/reject`, { reason }).then((r) => r.data.data),

  // Vehicles
  getAllVehicles: (page = 1, limit = 20, status?: string, search?: string) =>
    apiClient
      .get<PagedResponse<AdminVehicleSummary>>('/admin/vehicles', {
        params: { page, limit, ...(status && { status }), ...(search && { search }) },
      })
      .then((r) => r.data),
  getVehicleDetail: (id: string) =>
    apiClient.get<ApiResponse<AdminVehicleDetail>>(`/admin/vehicles/${id}`).then((r) => r.data.data),
  approveVehicle: (id: string, note?: string) =>
    apiClient.patch<ApiResponse<AdminVehicleSummary>>(`/admin/vehicles/${id}/approve`, { note }).then((r) => r.data.data),
  rejectVehicle: (id: string, reason: string) =>
    apiClient.patch<ApiResponse<AdminVehicleSummary>>(`/admin/vehicles/${id}/reject`, { reason }).then((r) => r.data.data),

  // Users
  getUsers: (page = 1, limit = 20, role?: string, status?: string) =>
    apiClient
      .get<PagedResponse<AdminUser>>('/admin/users', { params: { page, limit, role, status } })
      .then((r) => r.data),
  getUserDetail: (id: string) =>
    apiClient.get<ApiResponse<AdminUserDetail>>(`/admin/users/${id}`).then((r) => r.data.data),
  suspendUser: (id: string, reason: string) =>
    apiClient
      .patch<ApiResponse<{ id: string; name: string; email: string; status: string }>>(`/admin/users/${id}/suspend`, { reason })
      .then((r) => r.data.data),
  activateUser: (id: string) =>
    apiClient
      .patch<ApiResponse<{ id: string; name: string; email: string; status: string }>>(`/admin/users/${id}/activate`)
      .then((r) => r.data.data),

  // Trips
  getTrips: (page = 1, limit = 20, status?: string) =>
    apiClient
      .get<PagedResponse<AdminTripDetail>>('/admin/trips', { params: { page, limit, ...(status && { status }) } })
      .then((r) => r.data),
  getTripDetail: (id: string) =>
    apiClient.get<ApiResponse<AdminTripDetail>>(`/admin/trips/${id}`).then((r) => r.data.data),
  suspendTrip: (id: string) =>
    apiClient.patch<ApiResponse<AdminTripDetail>>(`/admin/trips/${id}/suspend`).then((r) => r.data.data),
  reactivateTrip: (id: string) =>
    apiClient.patch<ApiResponse<AdminTripDetail>>(`/admin/trips/${id}/reactivate`).then((r) => r.data.data),

  // User vehicles (personal vehicles used for trips)
  getUserVehicles: (page = 1, limit = 20, status?: string) =>
    apiClient
      .get<PagedResponse<AdminUserVehicle>>('/admin/user-vehicles', { params: { page, limit, ...(status && { status }) } })
      .then((r) => r.data),
  getUserVehicleDetail: (id: string) =>
    apiClient.get<ApiResponse<AdminUserVehicle>>(`/admin/user-vehicles/${id}`).then((r) => r.data.data),
  approveUserVehicle: (id: string) =>
    apiClient.patch<ApiResponse<AdminUserVehicle>>(`/admin/user-vehicles/${id}/approve`).then((r) => r.data.data),
  rejectUserVehicle: (id: string, reason: string) =>
    apiClient.patch<ApiResponse<AdminUserVehicle>>(`/admin/user-vehicles/${id}/reject`, { reason }).then((r) => r.data.data),
  suspendUserVehicle: (id: string) =>
    apiClient.patch<ApiResponse<AdminUserVehicle>>(`/admin/user-vehicles/${id}/suspend`).then((r) => r.data.data),
  reactivateUserVehicle: (id: string) =>
    apiClient.patch<ApiResponse<AdminUserVehicle>>(`/admin/user-vehicles/${id}/reactivate`).then((r) => r.data.data),

  // Driver verification (provider drivers' identity + licence). Backend defaults
  // `status` to PENDING_REVIEW, oldest submission first. The detail's document
  // `fileUrl`s are short-lived signed links — see useAdminDriverDetail.
  getDrivers: (page = 1, limit = 20, status?: DriverVerificationStatus) =>
    apiClient
      .get<PagedResponse<AdminDriverListItem>>('/admin/drivers', {
        params: { page, limit, ...(status && { status }) },
      })
      .then((r) => r.data),
  getDriverDetail: (userId: string) =>
    apiClient.get<ApiResponse<AdminDriverDetail>>(`/admin/drivers/${userId}`).then((r) => r.data.data),
  approveDriver: (userId: string) =>
    apiClient.patch<ApiResponse<unknown>>(`/admin/drivers/${userId}/approve`).then((r) => r.data.data),
  rejectDriver: (userId: string, reason: string) =>
    apiClient.patch<ApiResponse<unknown>>(`/admin/drivers/${userId}/reject`, { reason }).then((r) => r.data.data),

  // Audit logs & Reviews (Super Admin deletion, A45)
  getAuditLogs: (params: {
    entityType?: string;
    entityId?: string;
    adminUserId?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get<PagedResponse<AuditLog>>('/admin/audit-logs', { params }).then((r) => r.data),
  deleteReview: (id: string, reason: string) =>
    apiClient
      .delete<ApiResponse<{ success: boolean; deletedReviewId: string }>>(`/admin/reviews/${id}`, {
        data: { reason },
      })
      .then((r) => r.data.data),

  // Tracking lookup (Single vehicle/driver lookup, A39)
  lookupTracking: (params: { vehicleId?: string; driverId?: string; bookingId?: string; query?: string }) =>
    apiClient
      .get<ApiResponse<AdminTrackingLookupResult>>('/admin/tracking/lookup', { params })
      .then((r) => r.data.data),

  // Settings
  getSettings: () =>
    apiClient.get<ApiResponse<PlatformSetting[]>>('/admin/settings').then((r) => r.data.data),
  upsertSetting: (key: string, value: unknown, description?: string) =>
    apiClient
      .patch<ApiResponse<PlatformSetting>>(`/admin/settings/${key}`, { value, description })
      .then((r) => r.data.data),
};
