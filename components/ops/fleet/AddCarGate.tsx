'use client';

import Link from 'next/link';
import { buttonVariants } from '../../ui';
import { ADD_CAR_BLOCKERS, type AddCarBlocker } from '../../../lib/ops/fleetRules';

// What stops the business adding a car yet (fleetRules addCarBlockers), each
// with the page that fixes it — ported from the KerayeGo Partner app's AddCarGate.
export function AddCarGate({ blockers }: { blockers: readonly AddCarBlocker[] }) {
  if (blockers.length === 0) return null;
  return (
    <div className="space-y-4 rounded-card border border-status-amber-border bg-status-amber-bg p-5 text-status-amber-fg">
      <p className="text-sm font-semibold">You can&apos;t add cars yet</p>
      {blockers.map((blocker) => {
        const info = ADD_CAR_BLOCKERS[blocker];
        return (
          <div key={blocker} className="space-y-1">
            <p className="font-semibold">{info.title}</p>
            <p className="text-sm">{info.description}</p>
            <Link href={info.href} className={buttonVariants({ variant: 'secondary', size: 'sm', className: 'mt-1' })}>
              {info.actionLabel}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
