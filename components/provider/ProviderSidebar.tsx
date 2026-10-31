'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Car,
  CarFront,
  ClipboardCheck,
  FileText,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  MapPinned,
  MessageSquare,
  Route,
  Search,
  Star,
  StarHalf,
  Store,
  Users,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspace } from '../../hooks/useWorkspace';
import { StatusBadge } from '../common/StatusBadge';
import { Logo } from '../common/Logo';
import { Avatar } from '../ui';
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher';
import { SidebarFooterLink, SidebarNavLink, type SidebarNavItem } from '../workspace/SidebarLinks';
import { cn } from '../../lib/utils/cn';
import { isBusinessWorkspace, type WorkspaceAction } from '../../lib/workspace/workspaceSelection';
import { isProviderPersonalPath } from '../../lib/workspace/workspaceRoutes';
import { Role } from '../../types/enums';

interface NavItem extends SidebarNavItem {
  /** Shown only when the active dashboard can() this. */
  action?: WorkspaceAction;
  /** Locked (shown greyed) until the business is approved. */
  requiresApproval?: boolean;
}

// The business portal, for Business admin and Manager. Each item is shown via
// can(), from the same table as the Partner app (lib/workspace/workspaceSelection.ts).
const BUSINESS_ITEMS: NavItem[] = [
  { href: '/provider/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    href: '/provider/inquiries',
    label: 'Bookings',
    icon: Inbox,
    action: 'manageBookings',
    requiresApproval: true,
  },
  {
    href: '/provider/vehicles',
    label: 'Fleet',
    icon: Car,
    action: 'viewFleet',
    requiresApproval: true,
  },
  { href: '/provider/live-map', label: 'Live map', icon: MapPinned, action: 'viewLiveMap' },
  { href: '/provider/team', label: 'Team', icon: Users, action: 'viewTeam' },
  { href: '/provider/ratings', label: 'Ratings', icon: StarHalf, action: 'viewRatings' },
  { href: '/provider/activity', label: 'Activity log', icon: Activity, action: 'viewActivityLogs' },
  {
    href: '/provider/profile',
    label: 'Business profile',
    icon: Store,
    action: 'editBusinessProfile',
  },
  { href: '/provider/documents', label: 'Documents', icon: FileText, action: 'manageDocuments' },
];

// A PROVIDER account's own carpool (shared with /dashboard for USER accounts).
// Not part of the business: shown for PROVIDER accounts whatever dashboard is active.
const PERSONAL_ITEMS: NavItem[] = [
  { href: '/provider/trips', label: 'Trips', icon: Route },
  { href: '/provider/my-vehicles', label: 'My Vehicles', icon: CarFront },
  { href: '/provider/incoming-requests', label: 'Incoming Requests', icon: ClipboardCheck },
  { href: '/provider/trip-inquiries', label: 'Trip Requests', icon: MessageSquare },
  { href: '/provider/reviews', label: 'Reviews', icon: Star },
];

export function ProviderSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { active, workspaces, can } = useWorkspace();
  const isProviderAccount = user?.role === Role.PROVIDER;

  const inBusiness = isBusinessWorkspace(active);
  const business = inBusiness ? workspaces.find((w) => w.role === active) : undefined;
  const isApproved = business?.verificationStatus === 'APPROVED';
  const businessItems = inBusiness
    ? BUSINESS_ITEMS.filter((item) => !item.action || can(item.action))
    : [];
  const current = inBusiness && active && !isProviderPersonalPath(pathname) ? active : 'personal';

  return (
    <aside className="flex min-h-screen w-64 flex-col bg-ink">
      {/* Brand */}
      <div className="border-b border-white/10 px-5 py-[18px]">
        <Link href="/" className="block">
          <Logo theme="dark" className="h-6" />
        </Link>
        <p className="mt-1.5 text-[11px] leading-tight text-slate-400">Business Portal</p>
      </div>

      {/* Dashboard switcher */}
      <div className="border-b border-white/10 px-4 py-4">
        <WorkspaceSwitcher current={current} />
      </div>

      {/* Business identity */}
      {business && (
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={business.businessName ?? 'Business'} tone="brand" shape="square" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{business.businessName}</p>
              {business.verificationStatus && (
                <StatusBadge status={business.verificationStatus} size="sm" />
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {businessItems.map((item) => (
          <SidebarNavLink
            key={item.href}
            item={item}
            pathname={pathname}
            locked={!!item.requiresApproval && !isApproved}
            lockedTitle="Available after the business is approved"
          />
        ))}

        {isProviderAccount && (
          <>
            <p
              className={cn(
                'px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500',
                businessItems.length > 0 && 'mt-4 border-t border-white/10 pt-4',
              )}
            >
              My carpool
            </p>
            {PERSONAL_ITEMS.map((item) => (
              <SidebarNavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </>
        )}
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
