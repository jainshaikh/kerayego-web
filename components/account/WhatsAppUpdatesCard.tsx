'use client';

import { useUpdateWhatsAppUpdates } from '../../hooks/usePhoneVerification';
import type { User } from '../../types/api.types';
import { Card, Switch } from '../ui';

/**
 * Settings toggle "WhatsApp updates" (contract §7.3): PATCH /users/me
 * { whatsappUpdates }, optimistic with rollback. Only a verified number gets
 * WhatsApp messages, so it's disabled until the phone is verified. The
 * verification code itself always goes out, whatever this says.
 */
export function WhatsAppUpdatesCard({ me }: { me: User }) {
  const update = useUpdateWhatsAppUpdates();

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p id="whatsapp-updates-label" className="text-sm font-semibold text-ink">
            WhatsApp updates
          </p>
          <p className="mt-1 text-sm text-text-muted">Booking and trip updates on WhatsApp</p>
          {!me.phoneVerified ? (
            <p className="mt-1 text-xs text-text-faint">Verify your number first</p>
          ) : null}
        </div>
        <Switch
          label="WhatsApp updates"
          checked={me.whatsappUpdates}
          disabled={!me.phoneVerified || update.isPending}
          onChange={(value) => update.mutate(value)}
        />
      </div>
    </Card>
  );
}
