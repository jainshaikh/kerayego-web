import { Smartphone } from 'lucide-react';
import { HAS_MOBILE_APP } from '../../lib/config/apps';
import { AppDownloadButtons } from '../common/AppDownloadButtons';
import { WhatsAppButton } from '../ui';

interface AppRequestCtaProps {
  vehicleTitle: string;
  whatsappNumber?: string | null;
  /** The car is offered for weekly & monthly rental (plan A84). */
  offersWeeklyMonthly?: boolean;
}

/**
 * The car page's call to action since the website stopped taking rental
 * booking requests (owner decision 2026-11-11, plan A82): the customer sends
 * the request in the KerayeGo app, where they pick the package, the pickup
 * and drop-off points and see whether the route fits before sending (plan
 * §3c). The store buttons appear once a store URL is set (lib/config/apps.ts);
 * WhatsApp stays for questions. Replaced InquiryCta, which opened the web form.
 */
export function AppRequestCta({ vehicleTitle, whatsappNumber, offersWeeklyMonthly }: AppRequestCtaProps) {
  const whatsappMessage = `Hi, I'm interested in renting the ${vehicleTitle}. Could you please share more details?`;

  return (
    <div className="space-y-3">
      <div className="rounded-card border border-border-subtle bg-surface-hover p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Smartphone className="h-4 w-4 text-brand-700" />
          Book this car in the KerayeGo app
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">
          Send your booking request in the app: choose 6 hours, 12 hours or a number of days, add
          your pickup and drop-off points, and see how long the trip takes before you send it.
          {offersWeeklyMonthly
            ? ' For a week or a month, ask for a price in the app — the business agrees it with you.'
            : null}
        </p>
        {HAS_MOBILE_APP ? (
          <AppDownloadButtons className="mt-3 !justify-start" />
        ) : (
          <p className="mt-2 text-[13px] font-medium text-ink">
            The KerayeGo app is coming soon to Google Play and the App Store.
          </p>
        )}
      </div>

      {whatsappNumber ? (
        <WhatsAppButton phone={whatsappNumber} message={whatsappMessage} label="Questions? Chat on WhatsApp" />
      ) : null}
    </div>
  );
}
