'use client';

import { Heart } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useIsVehicleSaved, useSaveVehicle, useRemoveSavedVehicle } from '../../hooks/useSavedVehicles';
import { cn } from '../../lib/utils/cn';

interface SaveButtonProps {
  vehicleId: string;
  size?: 'sm' | 'md';
  className?: string;
}

// Always visible/clickable regardless of auth state — tapping while logged
// out sends the visitor to log in instead of hiding the button entirely.
export function SaveButton({ vehicleId, size = 'md', className }: SaveButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const isSaved = useIsVehicleSaved(vehicleId);
  const save = useSaveVehicle();
  const remove = useRemoveSavedVehicle();
  const pending = save.isPending || remove.isPending;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    if (isSaved) remove.mutate(vehicleId);
    else save.mutate(vehicleId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={isSaved ? 'Remove from saved vehicles' : 'Save vehicle'}
      aria-pressed={isSaved}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-surface/90 shadow-sm backdrop-blur-md transition-transform hover:scale-105 disabled:opacity-60',
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
        className,
      )}
    >
      <Heart
        className={cn(size === 'sm' ? 'h-4 w-4' : 'h-5 w-5', isSaved ? 'fill-brand-600 text-brand-600' : 'text-ink')}
      />
    </button>
  );
}
