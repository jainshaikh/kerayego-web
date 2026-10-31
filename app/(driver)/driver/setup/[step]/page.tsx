import { notFound } from 'next/navigation';
import { isDriverSetupRoute, type DriverSetupRoute } from '../../../../../lib/driver/setupSteps';
import { PersonalStep } from '../../../../../components/driver/setup/PersonalStep';
import { IdentityStep } from '../../../../../components/driver/setup/IdentityStep';
import { ExperienceStep } from '../../../../../components/driver/setup/ExperienceStep';
import { ServicesStep } from '../../../../../components/driver/setup/ServicesStep';
import { AvailabilityStep } from '../../../../../components/driver/setup/AvailabilityStep';
import { PayoutsStep } from '../../../../../components/driver/setup/PayoutsStep';

// The six driver setup steps (same as the KerayeGo Partner app: personal,
// identity, experience, services, availability, payouts), each saved with
// PATCH /driver/profile. Open to someone becoming a driver too (see
// components/driver/DriverPortal.tsx) — the first save of Personal
// information creates the profile and the Driver dashboard.
const STEPS: Record<DriverSetupRoute, () => React.JSX.Element> = {
  personal: PersonalStep,
  identity: IdentityStep,
  experience: ExperienceStep,
  services: ServicesStep,
  availability: AvailabilityStep,
  payouts: PayoutsStep,
};

export default function DriverSetupStepPage({ params }: { params: { step: string } }) {
  if (!isDriverSetupRoute(params.step)) notFound();
  const Step = STEPS[params.step];
  // Keyed by step, so moving between steps starts each form from the saved profile.
  return <Step key={params.step} />;
}
