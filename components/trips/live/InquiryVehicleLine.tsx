import { inquiryTripVehicle, type TripInquiryTrip } from '../../../lib/api/trip-inquiries.api';

// The car a rider's trip runs in. A normal trip shows the driver's own car
// (with plate); a return trip (A48) runs in a business's fleet car, so it shows
// that car and the business it belongs to — userVehicle is null there.
export function InquiryVehicleLine({ trip }: { trip: TripInquiryTrip }) {
  const vehicle = inquiryTripVehicle(trip);
  if (!vehicle) return null;
  return (
    <>
      <p className="text-text-muted">
        {vehicle.make} {vehicle.model}
        {vehicle.year ? ` (${vehicle.year})` : ''}
        {vehicle.plateNumber ? ` · ${vehicle.plateNumber}` : ''}
      </p>
      {vehicle.businessName && (
        <p className="text-xs text-text-faint">Business car · {vehicle.businessName}</p>
      )}
    </>
  );
}
