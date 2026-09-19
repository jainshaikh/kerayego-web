'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, MapPin, Users } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import type { ListingVehicleCard } from '../../lib/api/listings.api';
import { getCurrencyCode } from '../../lib/utils/currency';
import { getVehicleUrl } from '../../lib/utils/vehicleUrl';
import { Avatar } from '../ui';
import { SaveButton } from './SaveButton';

interface VehicleCardProps {
  vehicle: ListingVehicleCard;
  className?: string;
}

export function VehicleCard({ vehicle, className }: VehicleCardProps) {
  const router = useRouter();
  const cover = vehicle.images?.[0];
  const price = Number(vehicle.pricePerDay).toLocaleString();
  const currency = getCurrencyCode(vehicle.showroom?.country);
  const location = vehicle.showroom?.city ?? vehicle.locationText ?? null;
  const providerSlug = vehicle.providerProfile?.slug;

  const goToProvider = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (providerSlug) router.push(`/providers/${providerSlug}`);
  };

  return (
    <Link
      href={getVehicleUrl(vehicle, location)}
      className={cn(
        // text-ink on the root: the card is an <a>, so without it every child
        // inherits the link colour and the title hover below becomes a no-op.
        'group block overflow-hidden rounded-card border border-border-subtle bg-surface text-ink shadow-xs',
        'ease-spring transition-all duration-200',
        'hover:-translate-y-1.5 hover:border-brand-100 hover:shadow-md',
        className,
      )}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-hover">
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.altText ?? vehicle.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="ease-smooth object-cover transition-transform duration-500 group-hover:scale-[1.07]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-faint">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}

        {/* Price badge — fills with the brand gradient on hover */}
        <div className="group-hover:bg-brand absolute bottom-2.5 left-2.5 rounded-control bg-ink/80 px-3 py-1.5 font-mono text-[13px] font-semibold text-white backdrop-blur-md transition-colors duration-200">
          {currency} {price}
          <span className="font-sans font-normal opacity-75">/day</span>
        </div>

        <SaveButton vehicleId={vehicle.id} size="sm" className="absolute right-2.5 top-2.5" />
      </div>

      {/* Info */}
      <div className="p-[15px] pb-[17px]">
        <h3 className="truncate text-base font-semibold leading-tight tracking-tight text-ink transition-colors group-hover:text-brand-700">
          {vehicle.title}
        </h3>

        {/* Specs row — flex-wrap is required; three chips plus an icon overflow at card width */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="rounded-chip bg-surface-hover px-2.5 py-1 text-xs font-medium text-text-muted">
            {vehicle.year}
          </span>
          <span className="rounded-chip bg-surface-hover px-2.5 py-1 text-xs font-medium text-text-muted">
            {vehicle.transmission === 'AUTOMATIC'
              ? 'Automatic'
              : vehicle.transmission === 'CVT'
                ? 'CVT'
                : 'Manual'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-chip bg-surface-hover px-2.5 py-1 text-xs font-medium text-text-muted">
            <Users className="h-3 w-3" />
            {vehicle.seatingCapacity}
          </span>
        </div>

        {/* Provider + location */}
        <div className="mt-3.5 flex items-center justify-between border-t border-border-subtle pt-3.5">
          <div
            role="link"
            tabIndex={providerSlug ? 0 : -1}
            onClick={goToProvider}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') goToProvider(e);
            }}
            className="flex min-w-0 cursor-pointer items-center gap-1.5 text-xs font-medium text-text-muted hover:text-brand-700"
          >
            <Avatar
              name={vehicle.providerProfile?.businessName || '?'}
              shape="square"
              size="sm"
              tone="ink"
            />
            <span className="truncate">
              {vehicle.providerProfile?.businessName ?? 'Unknown provider'}
            </span>
          </div>
          {vehicle.distanceKm !== undefined ? (
            <span className="ml-2 flex flex-shrink-0 items-center gap-1 text-xs font-medium text-brand-700">
              <MapPin className="h-3 w-3" />
              {vehicle.distanceKm < 1
                ? `${Math.round(vehicle.distanceKm * 1000)} m away`
                : `${vehicle.distanceKm.toFixed(1)} km away`}
            </span>
          ) : (
            location && (
              <span className="ml-2 flex flex-shrink-0 items-center gap-1 text-xs text-text-muted">
                <MapPin className="h-3 w-3" />
                {location.charAt(0).toUpperCase() + location.slice(1)}
              </span>
            )
          )}
        </div>
      </div>
    </Link>
  );
}

// Skeleton loader matching VehicleCard layout
export function VehicleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-border-subtle bg-surface">
      <div className="aspect-[16/10] animate-shimmer bg-[linear-gradient(90deg,#FFF1EA_0px,#FFE4D9_120px,#FFF1EA_240px)] bg-[length:480px_100%]" />
      <div className="space-y-3 p-[15px] pb-[17px]">
        <div className="h-3.5 w-3/4 rounded-chip bg-surface-hover" />
        <div className="h-3 w-1/2 rounded-chip bg-surface-hover" />
        <div className="flex justify-between border-t border-border-subtle pt-3.5">
          <div className="h-3 w-1/3 rounded-chip bg-surface-hover" />
          <div className="h-3 w-1/4 rounded-chip bg-surface-hover" />
        </div>
      </div>
    </div>
  );
}
