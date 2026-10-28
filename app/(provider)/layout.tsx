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
        <main className="min-w-0 flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <span className="font-semibold">Notice:</span> The provider portal is transitioning to the dedicated{' '}
            <span className="font-semibold">KerayeGo Partner</span> mobile app. Fleet management, team management, and
            live driver tracking are now in KerayeGo Partner.
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
