import { DriverPortal } from '../../components/driver/DriverPortal';
import { PhoneVerificationGate } from '../../components/account/PhoneVerificationGate';

// The driver portal (/driver): an independent driver's jobs, businesses and
// profile. Shown while the active dashboard is Driver, and on /driver/profile
// and /driver/setup/* for someone becoming a driver — see DriverPortal. The
// WhatsApp phone check blocks it all until done (PhoneVerificationGate). UX
// only; the backend enforces access.
export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <PhoneVerificationGate>
      <DriverPortal>{children}</DriverPortal>
    </PhoneVerificationGate>
  );
}
