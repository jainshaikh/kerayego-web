import { ProviderPortal } from '../../components/provider/ProviderPortal';

// The business portal (Business admin and Manager) plus a PROVIDER account's
// own carpool pages. Which of those a path shows depends on the active
// dashboard — see ProviderPortal. UX only; the backend enforces access.
export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return <ProviderPortal>{children}</ProviderPortal>;
}
