import apiClient from './client';
import type { ApiResponse } from '../../types/api.types';

export interface ReverseGeocodeResult {
  label: string;
  city: string | null;
  formattedAddress: string;
}

export interface RouteDirectionStep {
  instruction: string;
  distanceMeters: number;
}

export interface RouteDirections {
  polyline: { lat: number; lng: number }[];
  distanceKm: number;
  durationMinutes: number;
  steps: RouteDirectionStep[];
}

export const geoApi = {
  reverseGeocode: async (lat: number, lng: number): Promise<ReverseGeocodeResult> => {
    const res = await apiClient.get<ApiResponse<ReverseGeocodeResult>>('/geo/reverse', {
      params: { lat, lng },
    });
    return res.data.data;
  },

  // Route polyline for the live-trip map. Callers should treat a thrown error
  // (including the backend's 404 when no route is found) as "no overlay to
  // show" — this is a map nicety, never something that blocks day-of actions.
  getRouteDirections: async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<RouteDirections> => {
    const res = await apiClient.get<ApiResponse<RouteDirections>>('/geo/route-directions', {
      params: {
        originLat: origin.lat,
        originLng: origin.lng,
        destLat: destination.lat,
        destLng: destination.lng,
      },
    });
    return res.data.data;
  },
};
