'use client';

import { useState } from 'react';
import { cn } from '../../lib/utils/cn';
import { Avatar } from '../ui';

/** Admin driver-verification helpers (/admin/drivers only). */

const PHOTO_SIZE = { sm: 'h-7 w-7', md: 'h-10 w-10', lg: 'h-16 w-16' } as const;

/** The driver's profile photo, falling back to initials when missing or broken. */
export function DriverPhoto({
  url,
  name,
  size = 'md',
}: {
  url: string | null | undefined;
  name: string;
  size?: keyof typeof PHOTO_SIZE;
}) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) {
    return <Avatar name={name} size={size === 'lg' ? 'lg' : size} className={size === 'lg' ? 'h-16 w-16 text-lg' : undefined} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      onError={() => setBroken(true)}
      className={cn('flex-shrink-0 rounded-full border border-border-subtle object-cover', PHOTO_SIZE[size])}
    />
  );
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PK', { dateStyle: 'medium' });
}

/** A licence is expired once its expiry date is before today (local day). */
export function isExpired(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(iso).getTime() < today.getTime();
}
