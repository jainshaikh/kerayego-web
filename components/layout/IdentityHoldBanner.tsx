'use client';

import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { usersApi } from '../../lib/api/users.api';
import { useAuthStore } from '../../store/auth.store';

/** The contract's hold message (person blocks, A22/D18). Shown verbatim. */
export const IDENTITY_HOLD_MESSAGE =
  'Your account is being checked by KerayeGo. You can browse, but booking, posting trips and driving are paused until the check is done — usually within a day.';

// A phone that matches a blocked person puts the account on hold. The login
// payload carries `identityHold`, but a hold can start later (phone change) or
// end while signed in (admin clears it), so this reads the shared
// ['users','me'] query and only falls back to the stored login user.
export function IdentityHoldBanner() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const storedHold = useAuthStore((s) => s.user?.identityHold);
  const { data: me } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersApi.getMe().then((r) => r.data),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const onHold = me ? !!me.identityHold : !!storedHold;
  if (!onHold) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-2.5 border-b border-status-amber-border bg-status-amber-bg px-6 py-3 text-sm text-status-amber-fg md:px-8"
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <p>{IDENTITY_HOLD_MESSAGE}</p>
    </div>
  );
}
