import type { FuelType, Market, PaginationMeta, Transmission } from './api.types';

// The business's own cars — kerayego-backend src/modules/vehicles/
// (vehicles.controller.ts, vehicles.service.ts, dto/*.ts), ported from the
// KerayeGo Partner app's types/fleet.types.ts. Listing, editing and photos are
// open to the business admin and a manager; adding, submitting and archiving
// to the business admin only. 403 "No provider profile found" before the
// business exists.

/** Every VehicleStatus (types/enums.ts's VehicleStatus has no SUSPENDED yet). */
export type FleetVehicleStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED' | 'SUSPENDED';

export interface FleetVehicleImage {
  id: string;
  url: string;
  /** Storage key. Removing the photo removes the stored file too. */
  publicId: string;
  altText: string | null;
  sortOrder: number;
  width: number | null;
  height: number | null;
}

export interface FleetVehicleFeature {
  id: string;
  name: string;
  value: string | null;
}

export interface FleetVehicleShowroom {
  id: string;
  name: string;
  city: string;
  area: string | null;
  contactNumber: string;
  country: Market;
}

/** Every Vehicle column. Prisma Decimal prices arrive as strings. */
export interface FleetVehicleBase {
  id: string;
  slug: string;
  providerProfileId: string;
  showroomId: string | null;
  plateNumber?: string | null;
  title: string;
  /** Stored lowercase ("toyota"). */
  make: string;
  model: string;
  year: number;
  transmission: Transmission;
  fuelType: FuelType;
  seatingCapacity: number;
  engineType: string | null;
  pricePer6Hours: string | null;
  pricePer12Hours: string | null;
  pricePerDay: string;
  pricePerWeek: string | null;
  pricePerMonth: string | null;
  locationText: string | null;
  availabilityNotes: string | null;
  pricingNotes: string | null;
  specialConditions: string | null;
  status: FleetVehicleStatus;
  /** Set by KerayeGo admin when it rejects (or suspends) the car. */
  rejectionReason: string | null;
  viewCount: number;
  inquiryCount: number;
  createdAt: string;
  updatedAt: string;
}

/** One row of GET /vehicles: the cover photo only, and its booking-request count. No showroom (look it up by showroomId). */
export interface FleetVehicleListItem extends FleetVehicleBase {
  images: FleetVehicleImage[];
  _count?: { bookingRequests: number };
}

/**
 * The car's whole-plate history (plan A17): rides and public reviews across
 * every listing of its plate, any owner. Never says who listed it before.
 */
export interface PlateHistory {
  rideCount: number;
  reviewCount: number;
  averageRating: number | null;
}

/** GET /vehicles/:id and what create / update / submit return: every photo, features, showroom. */
export interface FleetVehicle extends FleetVehicleBase {
  images: FleetVehicleImage[];
  features: FleetVehicleFeature[];
  showroom: FleetVehicleShowroom | null;
  /**
   * GET /vehicles/:id only: set when OTHER listings of this car's plate have
   * rides or reviews, otherwise null. Absent from create / update / submit.
   */
  plateHistory?: PlateHistory | null;
}

export interface FleetListFilters {
  status?: FleetVehicleStatus;
  search?: string;
}

export interface FleetPage {
  data: FleetVehicleListItem[];
  meta: PaginationMeta;
}

/** POST /vehicles body (CreateVehicleDto; no other key may be sent). */
export interface CreateVehiclePayload {
  title: string;
  make: string;
  model: string;
  plateNumber?: string;
  year: number;
  transmission: Transmission;
  fuelType: FuelType;
  seatingCapacity: number;
  engineType?: string;
  pricePer6Hours?: number;
  pricePer12Hours?: number;
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  locationText?: string;
  availabilityNotes?: string;
  pricingNotes?: string;
  specialConditions?: string;
  showroomId?: string;
  features?: string[];
}

/** The optional columns a PATCH clears by sending null. */
export type ClearableVehicleField =
  | 'plateNumber'
  | 'engineType'
  | 'pricePer6Hours'
  | 'pricePer12Hours'
  | 'pricePerWeek'
  | 'pricePerMonth'
  | 'locationText'
  | 'availabilityNotes'
  | 'pricingNotes'
  | 'specialConditions';

/**
 * PATCH /vehicles/:id body. Any status but ARCHIVED or SUSPENDED (403
 * otherwise); a live car stays live; a REJECTED car becomes DRAFT. A live
 * car's plate is locked (403 PLATE_LOCKED) unless it has none.
 */
export type UpdateVehiclePayload = Partial<Omit<CreateVehiclePayload, ClearableVehicleField>> & {
  [K in ClearableVehicleField]?: CreateVehiclePayload[K] | null;
};

/** POST /vehicles/:id/images body: what POST /media/upload returned. */
export interface AddVehicleImagePayload {
  url: string;
  publicId: string;
  altText?: string;
  width?: number;
  height?: number;
}
