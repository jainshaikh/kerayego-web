import { DriverPortal } from '../../components/driver/DriverPortal';

// The driver portal (/driver): an independent driver's jobs, businesses and
// profile. Shown while the active dashboard is Driver, and on /driver/profile
// and /driver/setup/* for someone becoming a driver — see DriverPortal. UX
// only; the backend enforces access.
export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return <DriverPortal>{children}</DriverPortal>;
}
