'use client';

import type { ReactNode } from 'react';
import { Car } from 'lucide-react';
import { Avatar, Card } from '../../ui';
import { cn } from '../../../lib/utils/cn';
import type { BookingVehicle } from '../../../types/booking-requests.types';

// Small building blocks shared by the business's booking pages.

/** The requested car's cover photo, or a car icon. */
export function CarThumbnail({ vehicle, className }: { vehicle: BookingVehicle; className?: string }) {
  const cover = vehicle.images[0];
  return (
    <div
      className={cn(
        'flex h-16 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-media bg-surface-hover text-text-faint',
        className,
      )}
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover.url} alt={cover.altText ?? vehicle.title} className="h-full w-full object-cover" />
      ) : (
        <Car className="h-6 w-6" />
      )}
    </div>
  );
}

/** A driver's photo in a circle, or their initials. */
export function DriverAvatar({ uri, name, size = 'md' }: { uri: string | null | undefined; name: string; size?: 'sm' | 'md' }) {
  if (!uri) return <Avatar name={name} size={size} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={uri}
      alt={`${name}’s photo`}
      className={cn('flex-shrink-0 rounded-full object-cover', size === 'sm' ? 'h-7 w-7' : 'h-10 w-10')}
    />
  );
}

/** A titled card section. */
export function SectionCard({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <Card className={cn('space-y-3', className)}>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {children}
    </Card>
  );
}

/** A label/value row. */
export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}

/** A coloured notice box. */
export function Notice({
  tone,
  title,
  children,
}: {
  tone: 'warning' | 'info' | 'danger' | 'success';
  title?: string;
  children: ReactNode;
}) {
  const cls = {
    warning: 'border-status-amber-border bg-status-amber-bg text-status-amber-fg',
    info: 'border-status-blue-border bg-status-blue-bg text-status-blue-fg',
    danger: 'border-status-red-border bg-status-red-bg text-status-red-fg',
    success: 'border-status-emerald-border bg-status-emerald-bg text-status-emerald-fg',
  }[tone];
  return (
    <div role={tone === 'warning' || tone === 'danger' ? 'alert' : undefined} className={cn('rounded-control border px-4 py-3 text-sm', cls)}>
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? 'mt-0.5' : undefined}>{children}</div>
    </div>
  );
}
