import { ProviderPortal } from '../../components/provider/ProviderPortal';
import { PhoneVerificationGate } from '../../components/account/PhoneVerificationGate';

// The business portal (Business admin and Manager) plus a PROVIDER account's
// own carpool pages. Which of those a path shows depends on the active
// dashboard — see ProviderPortal. The WhatsApp phone check blocks it all until
// done (PhoneVerificationGate). UX only; the backend enforces access.
export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <PhoneVerificationGate>
      <ProviderPortal>{children}</ProviderPortal>
    </PhoneVerificationGate>
  );
}
