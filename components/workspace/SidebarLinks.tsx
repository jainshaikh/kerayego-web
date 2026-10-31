'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

// The nav links shared by the business (ProviderSidebar) and driver
// (DriverSidebar) sidebars, styled for their dark bg-ink background.

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function SidebarNavLink({
  item,
  pathname,
  locked = false,
  lockedTitle,
}: {
  item: SidebarNavItem;
  pathname: string;
  locked?: boolean;
  lockedTitle?: string;
}) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon;

  if (locked) {
    return (
      <span
        title={lockedTitle}
        className="flex cursor-not-allowed select-none items-center gap-[11px] rounded-control px-3 py-2.5 text-[13px] text-slate-600"
      >
        <Icon className="h-[17px] w-[17px]" />
        {item.label}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-[11px] rounded-control px-3 py-2.5 text-[13px] transition-colors',
        isActive
          ? 'bg-white/10 font-semibold text-white'
          : 'text-slate-400 hover:bg-white/5 hover:text-white',
      )}
    >
      <Icon className="h-[17px] w-[17px]" />
      {item.label}
    </Link>
  );
}

export function SidebarFooterLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-[11px] rounded-control px-3 py-2.5 text-[13px] text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
    >
      <Icon className="h-[17px] w-[17px]" />
      {label}
    </Link>
  );
}
