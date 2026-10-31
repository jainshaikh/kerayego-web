'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, Building2, Home, LogOut, Search, UserRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspace } from '../../hooks/useWorkspace';
import { Logo } from '../common/Logo';
import { StatusBadge } from '../common/StatusBadge';
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher';
import { SidebarFooterLink, SidebarNavLink, type SidebarNavItem } from '../workspace/SidebarLinks';
import { BusinessRole } from '../../types/enums';
import type { WorkspaceAction } from '../../lib/workspace/workspaceSelection';

// The driver portal (/driver), for the Driver dashboard. Each item is shown
// via can(). A driver's on-trip session (Start/End job, live location) is in
// the KerayeGo Partner app only; the web shows jobs as information.
const DRIVER_ITEMS: (SidebarNavItem & { action: WorkspaceAction })[] = [
  { href: '/driver/jobs', label: 'Jobs', icon: Briefcase, action: 'driverJobs' },
  { href: '/driver/businesses', label: 'Businesses', icon: Building2, action: 'driverBusinesses' },
  { href: '/driver/profile', label: 'Profile', icon: UserRound, action: 'driverProfile' },
];

export function DriverSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { can, data } = useWorkspace();
  const driverStatus = data?.driver?.verificationStatus;

  return (
    <aside className="flex min-h-screen w-64 flex-col bg-ink">
      {/* Brand */}
      <div className="border-b border-white/10 px-5 py-[18px]">
        <Link href="/" className="block">
          <Logo theme="dark" className="h-6" />
        </Link>
        <p className="mt-1.5 text-[11px] leading-tight text-slate-400">Driver Portal</p>
      </div>

      {/* Dashboard switcher */}
      <div className="border-b border-white/10 px-4 py-4">
        <WorkspaceSwitcher current={BusinessRole.DRIVER} />
        {driverStatus && (
          <div className="mt-3 flex items-center gap-2 px-1 text-[11px] text-slate-400">
            Driver profile <StatusBadge status={driverStatus} size="sm" />
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {DRIVER_ITEMS.filter((item) => can(item.action)).map((item) => (
          <SidebarNavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-0.5 border-t border-white/10 px-3 py-4">
        <div className="px-3 py-1.5">
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
        </div>
        <SidebarFooterLink href="/" icon={Home} label="Home" />
        <SidebarFooterLink href="/rent-a-car" icon={Search} label="Browse vehicles" />
        <button
          onClick={logout}
          className="flex w-full items-center gap-[11px] rounded-control px-3 py-2.5 text-[13px] text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-[17px] w-[17px]" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
