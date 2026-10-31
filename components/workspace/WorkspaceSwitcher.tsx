'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Check,
  ChevronsUpDown,
  Route,
  CarTaxiFront,
  Store,
  User,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useAuthStore } from '../../store/auth.store';
import { BusinessRole, Role } from '../../types/enums';
import type { WorkspaceRole } from '../../types/workspace.types';
import { cn } from '../../lib/utils/cn';

/**
 * Which part of the account the sidebar is showing:
 * - a WorkspaceRole: the business (Business admin / Manager) or driver dashboard;
 * - 'personal': the person's own account — /dashboard for a USER account, or a
 *   PROVIDER account's own carpool pages under /provider (middleware.ts keeps
 *   PROVIDER accounts out of /dashboard).
 */
export type SwitcherCurrent = WorkspaceRole | 'personal';

interface Option {
  key: string;
  href: string;
  label: string;
  sub: string;
  icon: LucideIcon;
  current: boolean;
  onPick?: () => void;
}

const ROLE_ICONS: Record<WorkspaceRole, LucideIcon> = {
  [BusinessRole.BUSINESS_ADMIN]: Building2,
  [BusinessRole.MANAGER]: Store,
  [BusinessRole.DRIVER]: CarTaxiFront,
};

// The dashboard switcher at the top of the business and driver sidebars (and
// the customer sidebar): every dashboard the person has, named with its
// business and role ("Business admin", "Manager", "Driver" — never a bare
// "Admin", which means KerayeGo admin on this site), plus the way back to the
// person's own account, since the same account books as a customer. Picking a
// dashboard selects it and navigates to its home. Options are links, so the
// mobile sidebar drawer (MobileSidebarBar) closes on pick.
export function WorkspaceSwitcher({ current }: { current: SwitcherCurrent }) {
  const { workspaces, data, select, status } = useWorkspace();
  const accountRole = useAuthStore((s) => s.user?.role);
  const isProviderAccount = accountRole === Role.PROVIDER;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const options: Option[] = workspaces.map((ws) => ({
    key: ws.role,
    href: ws.home,
    label: ws.label,
    sub: ws.businessName ?? 'My driver work',
    icon: ROLE_ICONS[ws.role],
    current: current === ws.role,
    onPick: () => select(ws.role),
  }));

  options.push(
    isProviderAccount
      ? {
          key: 'personal',
          href: '/provider/trips',
          label: 'My carpool',
          sub: 'Your own trips and cars',
          icon: Route,
          current: current === 'personal',
        }
      : {
          key: 'personal',
          href: '/dashboard',
          label: 'My customer dashboard',
          sub: 'Your bookings and carpool',
          icon: User,
          current: current === 'personal',
        },
  );

  const extras: Option[] = [];
  if (status === 'ready' && !workspaces.some((ws) => ws.role === BusinessRole.DRIVER)) {
    extras.push({
      key: 'become-driver',
      href: '/driver/profile',
      label: 'Become a driver',
      sub: 'Drive for rental businesses',
      icon: UserPlus,
      current: false,
    });
  }
  if (status === 'ready' && data?.canCreateBusiness) {
    extras.push({
      key: 'create-business',
      href: '/provider/profile',
      label: 'Set up my rental business',
      sub: 'List your cars on KerayeGo',
      icon: Building2,
      current: false,
    });
  }

  const selected = options.find((o) => o.current) ?? options[options.length - 1];
  const SelectedIcon = selected.icon;

  return (
    <div ref={rootRef} className="relative">
      <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Working as
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="true"
        className="flex w-full items-center gap-2.5 rounded-control border border-white/10 bg-white/5 px-3 py-2 text-left transition-colors hover:bg-white/10"
      >
        <SelectedIcon className="h-4 w-4 flex-shrink-0 text-slate-300" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-white">
            {selected.label}
          </span>
          <span className="block truncate text-[11px] text-slate-400">
            {status === 'loading' && selected.key !== 'personal' ? 'Loading…' : selected.sub}
          </span>
        </span>
        <ChevronsUpDown className="h-4 w-4 flex-shrink-0 text-slate-400" />
      </button>

      {open && (
        <div
          id={menuId}
          className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-control border border-white/10 bg-[#2a1d23] py-1 shadow-xl"
        >
          {status === 'error' && (
            <p className="px-3 py-2 text-[12px] text-red-300">
              Couldn&apos;t load your dashboards.
            </p>
          )}
          {options.map((o) => (
            <SwitcherLink key={o.key} option={o} onDone={() => setOpen(false)} />
          ))}
          {extras.length > 0 && <div className="my-1 border-t border-white/10" />}
          {extras.map((o) => (
            <SwitcherLink key={o.key} option={o} onDone={() => setOpen(false)} />
          ))}
        </div>
      )}
    </div>
  );
}

function SwitcherLink({ option, onDone }: { option: Option; onDone: () => void }) {
  const Icon = option.icon;
  return (
    <Link
      href={option.href}
      onClick={() => {
        option.onPick?.();
        onDone();
      }}
      aria-current={option.current ? 'true' : undefined}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-white/10',
        option.current && 'bg-white/5',
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0 text-slate-300" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-white">{option.label}</span>
        <span className="block truncate text-[11px] text-slate-400">{option.sub}</span>
      </span>
      {option.current && <Check className="h-4 w-4 flex-shrink-0 text-brand-600" />}
    </Link>
  );
}
