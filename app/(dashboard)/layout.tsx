import { DashboardSidebar } from '../../components/layout/DashboardSidebar';
import { MobileSidebarBar } from '../../components/layout/MobileSidebarBar';
import { ActiveRideBanner } from '../../components/layout/ActiveRideBanner';
import { IdentityHoldBanner } from '../../components/layout/IdentityHoldBanner';
import { PhoneVerificationGate } from '../../components/account/PhoneVerificationGate';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // The WhatsApp phone check blocks the whole portal until done (see PhoneVerificationGate).
  return (
    <PhoneVerificationGate>
      <div className="min-h-screen bg-page">
        <IdentityHoldBanner />
        <ActiveRideBanner basePath="/dashboard" />
        <MobileSidebarBar brand="KerayeGo">
          <DashboardSidebar />
        </MobileSidebarBar>

        <div className="flex">
          {/* Sidebar — desktop only, MobileSidebarBar covers the same content below md */}
          <div className="hidden md:flex">
            <DashboardSidebar />
          </div>

          {/* Main content */}
          <main className="min-w-0 flex-1 p-6 md:p-8">{children}</main>
        </div>
      </div>
    </PhoneVerificationGate>
  );
}
