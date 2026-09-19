'use client';

import { Ban, CheckCircle2, MessageCircle } from 'lucide-react';
import type { ManifestRider } from '../../../lib/api/trips.api';
import { Button, Card, WhatsAppButton } from '../../ui';

interface DriverRiderCardProps {
  rider: ManifestRider;
  isNoShow: boolean;
  actioningKey: string | null;
  onEvent: (tripInquiryId: string, type: 'PICKUP' | 'DROPOFF' | 'NO_SHOW') => void;
  onOpenChat: (tripInquiryId: string) => void;
}

export function DriverRiderCard({ rider, isNoShow, actioningKey, onEvent, onOpenChat }: DriverRiderCardProps) {
  const pickedUp = !!rider.pickupConfirmedAt;
  const droppedOff = !!rider.droppedOffAt;
  const autoResolved = rider.pickupSource === 'AUTO_ON_TRIP_END';

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">
            {rider.user.name} · {rider.requestedSeats} seat{rider.requestedSeats !== 1 ? 's' : ''}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            {rider.pickupStop?.label ?? 'Pickup TBD'} → {rider.dropoffStop?.label ?? 'Drop-off TBD'}
          </p>
          {rider.pickupNote && <p className="mt-1 text-xs text-text-faint">{rider.pickupNote}</p>}
        </div>
        <button
          type="button"
          onClick={() => onOpenChat(rider.id)}
          className="flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-brand-700 transition-colors hover:text-brand-800"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Chat
        </button>
      </div>

      {isNoShow ? (
        <p className="rounded-control bg-page px-3 py-2 text-xs font-medium text-text-muted">No-show recorded</p>
      ) : droppedOff ? (
        <p className="rounded-control border border-status-teal-border bg-status-teal-bg px-3 py-2 text-xs font-medium text-status-teal-fg">
          {autoResolved ? 'Auto-resolved at trip end' : 'Dropped off'}
        </p>
      ) : pickedUp ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            disabled={actioningKey === `${rider.id}:DROPOFF`}
            loading={actioningKey === `${rider.id}:DROPOFF`}
            onClick={() => onEvent(rider.id, 'DROPOFF')}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Dropped off
          </Button>
          {rider.user.phone && <WhatsAppButton phone={rider.user.phone} variant="text" />}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            disabled={actioningKey === `${rider.id}:PICKUP`}
            loading={actioningKey === `${rider.id}:PICKUP`}
            onClick={() => onEvent(rider.id, 'PICKUP')}
          >
            Picked up
          </Button>
          <Button
            size="sm"
            variant="danger-outline"
            disabled={actioningKey === `${rider.id}:NO_SHOW`}
            loading={actioningKey === `${rider.id}:NO_SHOW`}
            onClick={() => onEvent(rider.id, 'NO_SHOW')}
          >
            <Ban className="h-3.5 w-3.5" />
            No-show
          </Button>
          {rider.user.phone && <WhatsAppButton phone={rider.user.phone} variant="text" />}
        </div>
      )}
    </Card>
  );
}
