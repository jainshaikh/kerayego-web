import { ProviderSidebar } from '../../components/provider/ProviderSidebar';
import { MobileSidebarBar } from '../../components/layout/MobileSidebarBar';
import { ActiveRideBanner } from '../../components/layout/ActiveRideBanner';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page">
      <ActiveRideBanner basePath="/provider" />
      <MobileSidebarBar brand="KerayeGo Provider">
        <ProviderSidebar />
      </MobileSidebarBar>

      <div className="flex">
        {/* Desktop sidebar — MobileSidebarBar covers the same content below md */}
        <div className="hidden md:flex md:flex-shrink-0">
          <ProviderSidebar />
        </div>

        {/* Main content */}
        <main className="min-w-0 flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
