'use client';

import { Loader2 } from 'lucide-react';
import { ErrorState } from '../../../../components/ui';
import {
  DriverReadinessCard,
  DriverSetupStepsCard,
  DriverVerificationCard,
} from '../../../../components/driver/DriverProfileOverview';
import { useMyDriverProfile } from '../../../../hooks/useDriverProfile';
import { getApiErrorMessage } from '../../../../hooks/useAccountDeletion';

// The driver's own profile and verification (kerayego-partner
// app/(driver)/(tabs)/driver/profile.tsx, A12, A13, A58): verification status
// + "Submit for verification", the three readiness levels with what's
// missing, and the six setup steps. Also where someone becomes a driver:
// saving Personal information creates the profile, adds the Driver dashboard
// and switches to it. (The app's dashboard switcher sits in the sidebar here.)
export default function DriverProfilePage() {
  const profileQuery = useMyDriverProfile();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Driver profile</h1>
        <p className="mt-1 text-sm text-text-muted">
          Your details and documents for KerayeGo&apos;s check. Businesses can only give jobs to verified drivers.
        </p>
      </div>

      {profileQuery.isPending ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-text-faint" />
        </div>
      ) : profileQuery.isError ? (
        <ErrorState
          title="We couldn't load your driver profile"
          description={getApiErrorMessage(profileQuery.error, 'Something went wrong while loading this page.')}
          onRetry={() => void profileQuery.refetch()}
        />
      ) : (
        <div className="space-y-5">
          <DriverVerificationCard profile={profileQuery.data} />
          {profileQuery.data ? <DriverReadinessCard readiness={profileQuery.data.readiness} /> : null}
          <DriverSetupStepsCard profile={profileQuery.data} />
        </div>
      )}
    </div>
  );
}
