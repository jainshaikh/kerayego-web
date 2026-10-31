import { apiClient } from './client';
import type { ApiResponse } from '../../types/api.types';
import type { DriverRouteFix, LiveDriverBooking } from '../../types/live-map.types';

// The business's live map (business admin or manager, A27/A30), ported from
// the KerayeGo Partner app's api/location.api.ts.
export const liveMapApi = {
  /** GET /providers/me/live-drivers — every in-progress rental and its driver's last position. */
  getLiveDrivers: async (): Promise<LiveDriverBooking[]> => {
    const res = await apiClient.get<ApiResponse<LiveDriverBooking[]>>('/providers/me/live-drivers');
    return res.data.data;
  },

  /** GET /providers/me/live-drivers/:bookingId/route — the job's recent GPS trail. */
  getDriverRoute: async (bookingId: string): Promise<DriverRouteFix[]> => {
    const res = await apiClient.get<ApiResponse<DriverRouteFix[]>>(`/providers/me/live-drivers/${bookingId}/route`);
    return res.data.data;
  },
};
