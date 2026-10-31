'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MobileSidebarBar } from '../layout/MobileSidebarBar';
import { ActiveRideBanner } from '../layout/ActiveRideBanner';
import { IdentityHoldBanner } from '../layout/IdentityHoldBanner';
import { Logo } from '../common/Logo';
import { useAuthStore } from '../../store/auth.store';
import { Role } from '../../types/enums';
import { cn } from '../../lib/utils/cn';

/**
 * The page frame of the business (/provider) and driver (/driver) portals:
 * the account banners, then the sidebar (desktop aside + mobile drawer) when
 * there is one, or a plain top bar when the page is shown without a sidebar
 * (setting up a business, becoming a driver, or a "no dashboard" screen).
 */
export function PortalFrame({
  brand,
  sidebar,
  children,
}: {
  brand: string;
  sidebar: ReactNode | null;
  children: ReactNode;
}) {
  const isProviderAccount = useAuthStore((s) => s.user?.role === Role.PROVIDER);
  // A PROVIDER account's own carpool pages live under /provider, a USER's under /dashboard.
  const ridesBasePath = isProviderAccount ? '/provider' : '/dashboard';

  // One tree for both variants, so a page keeps its state when the sidebar
  // appears (e.g. right after someone creates their business on /provider/profile).
  return (
    <div className="min-h-screen bg-page">
      <IdentityHoldBanner />
      <ActiveRideBanner basePath={ridesBasePath} />
      {sidebar ? (
        <MobileSidebarBar brand={brand}>{sidebar}</MobileSidebarBar>
      ) : (
        <header className="flex items-center justify-between gap-3 border-b border-border-subtle bg-surface px-4 py-3 md:px-8">
          <Link href="/" className="block">
            <Logo className="h-6" />
          </Link>
          <Link
            href={isProviderAccount ? '/provider/trips' : '/dashboard'}
            className="flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            {isProviderAccount ? 'My carpool' : 'My dashboard'}
          </Link>
        </header>
      )}

      <div className="flex">
        {/* Desktop sidebar — MobileSidebarBar covers the same content below md */}
        {sidebar ? <div className="hidden md:flex md:flex-shrink-0">{sidebar}</div> : null}

        <main
          className={cn(
            'min-w-0 flex-1 overflow-y-auto p-6 md:p-8',
            !sidebar && 'mx-auto max-w-5xl',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
