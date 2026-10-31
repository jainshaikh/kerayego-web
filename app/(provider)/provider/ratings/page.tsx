'use client';

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { UnderlineTabs } from '../../../../components/ui';
import { CarRatingsList } from '../../../../components/ops/ratings/CarRatingsList';
import { CustomersToRateList } from '../../../../components/ops/ratings/CustomersToRateList';
import { useCustomersToRate } from '../../../../hooks/useBusinessRatings';
import { useWorkspace } from '../../../../hooks/useWorkspace';
import { parseRatingsTab } from '../../../../lib/ops/ratings';

// Ratings (/provider/ratings — can('viewRatings'), business admin and
// manager), ported from the KerayeGo Partner app's
// app/(business)/business/ratings.tsx: "Car ratings" — what customers said
// about each car (public) — and, for the business admin only
// (can('rateCustomers')), "Rate customers" — private ratings of customers
// after completed rentals. ?tab=customers opens the second. No business
// (PROVIDER) reviews are shown (plan A18).
export default function ProviderRatingsPage() {
  return (
    <Suspense>
      <ProviderRatings />
    </Suspense>
  );
}

function ProviderRatings() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can } = useWorkspace();
  const ratesCustomers = can('rateCustomers');
  const tab = ratesCustomers ? parseRatingsTab(searchParams.get('tab')) : 'cars';
  const customers = useCustomersToRate({ enabled: ratesCustomers });
  const waiting = customers.data?.length;

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Ratings</h1>
        <p className="mt-1 text-sm text-text-muted">How customers rated your cars{ratesCustomers ? ', and your ratings of customers' : ''}.</p>
      </div>

      {ratesCustomers ? (
        <UnderlineTabs
          options={[
            { value: 'cars', label: 'Car ratings' },
            { value: 'customers', label: waiting ? `Rate customers (${waiting})` : 'Rate customers' },
          ]}
          value={tab}
          onChange={(value) => router.replace(value === 'customers' ? `${pathname}?tab=customers` : pathname, { scroll: false })}
        />
      ) : null}

      {tab === 'cars' ? <CarRatingsList /> : <CustomersToRateList />}
    </div>
  );
}
