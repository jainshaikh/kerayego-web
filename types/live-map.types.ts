// The business's live map (kerayego-backend providers.service.ts
// getLiveDrivers / getDriverRoute), ported from the KerayeGo Partner app's
// types/location.types.ts.

export interface LiveDriverVehicle {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  imageUrl: string | null;
}

export interface LiveDriverInfo {
  id: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  licenseCategory: string | null;
  emergencyContactPhone?: string | null;
}

export interface LiveCustomerInfo {
  id: string;
  name: string;
  phone: string | null;
}

export interface DriverLastLocation {
  lat: number;
  lng: number;
  headingDeg: number | null;
  speedKmh: number | null;
  timestamp: string;
}

/** One IN_PROGRESS rental with an assigned driver (GET /providers/me/live-drivers). */
export interface LiveDriverBooking {
  bookingId: string;
  status: string;
  requestedFromDate: string;
  requestedToDate: string;
  startedAt: string | null;
  vehicle: LiveDriverVehicle;
  driver: LiveDriverInfo;
  customer: LiveCustomerInfo;
  /** Null until the driver's phone sends its first fix. */
  lastLocation: DriverLastLocation | null;
}

/** One fix of GET /providers/me/live-drivers/:bookingId/route. */
export interface DriverRouteFix {
  lat: number;
  lng: number;
  headingDeg: number | null;
  speedKmh: number | null;
  accuracyM: number | null;
  timestamp: string;
}
