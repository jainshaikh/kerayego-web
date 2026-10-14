import { fetchVehicleBySlug } from '../../../lib/api/server';
import { getVehicleUrl } from '../../../lib/utils/vehicleUrl';

// Vehicle pages lived at /vehicles/[slug] until the 2026-08-28 URL overhaul
// (now /rent-a-car/[city]/[make-model]/[slug]). A static redirect couldn't map
// them because the new URL needs the vehicle's city/make/model, but some old
// URLs are still in Google's index (seen in Search Console), so look the
// vehicle up and send a permanent redirect to its current canonical URL.
// Note: the lookup goes through the detail endpoint, which counts a view.
export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const res = await fetchVehicleBySlug(params.slug);
  const vehicle = res?.data;
  if (!vehicle) return new Response('Not found', { status: 404 });

  const target = new URL(getVehicleUrl(vehicle, vehicle.showroom?.city), request.url);
  return Response.redirect(target, 301);
}
