import { Smartphone } from 'lucide-react';
import { APP_STORE_URL, PLAY_STORE_URL } from '../../lib/config/apps';
import { cn } from '../../lib/utils/cn';

interface AppDownloadButtonsProps {
  /** `buttons` for CTA blocks, `links` for a compact inline row (e.g. footers). */
  variant?: 'buttons' | 'links';
  className?: string;
}

// Renders nothing until at least one store URL is configured (see
// lib/config/apps.ts), so it's safe to place anywhere ahead of launch.
export function AppDownloadButtons({ variant = 'buttons', className }: AppDownloadButtonsProps) {
  const stores = [
    APP_STORE_URL && { href: APP_STORE_URL, label: 'Download on the App Store', short: 'App Store' },
    PLAY_STORE_URL && { href: PLAY_STORE_URL, label: 'Get it on Google Play', short: 'Google Play' },
  ].filter((s): s is { href: string; label: string; short: string } => Boolean(s));

  if (stores.length === 0) return null;

  if (variant === 'links') {
    return (
      <div className={cn('flex flex-wrap items-center justify-center gap-x-3 gap-y-1', className)}>
        <span className="inline-flex items-center gap-1.5">
          <Smartphone className="h-3.5 w-3.5" />
          Get the KerayeGo app:
        </span>
        {stores.map((s) => (
          <a
            key={s.href}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold transition-colors hover:text-brand-700"
          >
            {s.short}
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-wrap justify-center gap-3', className)}>
      {stores.map((s) => (
        <a
          key={s.href}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-[38px] items-center gap-2 rounded-control bg-ink px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Smartphone className="h-4 w-4" />
          {s.label}
        </a>
      ))}
    </div>
  );
}
