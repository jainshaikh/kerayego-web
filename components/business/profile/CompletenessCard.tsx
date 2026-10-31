'use client';

import { ChevronRight } from 'lucide-react';
import { Card } from '../../ui';
import type { ProviderProfileWithMeta } from '../../../lib/api/providers.api';
import {
  OWNER_CNIC_ITEM,
  SUBMIT_MIN_COMPLETENESS,
  stillNeededItems,
} from '../../../lib/workspace/businessStatus';
import { cn } from '../../../lib/utils/cn';

/** Where each "still needed" item is fixed on this page. */
export type ProfileSection = 'details' | 'showroom' | 'documents';

// The backend's completeness labels (providers.service.ts computeCompleteness)
// → the section that fixes each — kerayego-partner businessStatus.ts
// MISSING_ITEM_HREFS. A label the backend adds later shows without a link.
const MISSING_ITEM_SECTIONS: Record<string, ProfileSection> = {
  'Business name': 'details',
  Description: 'details',
  Logo: 'details',
  'At least one showroom': 'showroom',
  'Showroom contact number': 'showroom',
  'At least one document': 'documents',
  [OWNER_CNIC_ITEM]: 'details',
};

/** The bar's colour, as the dashboard's: green from 80%, amber from 60%, else red. */
function barColour(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= SUBMIT_MIN_COMPLETENESS) return 'bg-amber-500';
  return 'bg-red-500';
}

// The profile completeness score as a bar, with what's still missing — each
// item opens the section that fixes it (kerayego-partner CompletenessCard).
export function CompletenessCard({
  business,
  onFix,
}: {
  business: ProviderProfileWithMeta;
  onFix: (section: ProfileSection) => void;
}) {
  const { score } = business.completenessScore;
  const missing = stillNeededItems(business);

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Profile completeness</p>
        <span className="text-sm font-bold text-ink">{score}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        className="h-2 overflow-hidden rounded-full bg-surface-hover"
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColour(score))}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      {missing.length > 0 ? (
        <div>
          <p className="mb-1 text-xs text-text-muted">Still needed</p>
          <ul className="divide-y divide-border-subtle">
            {missing.map((item) => {
              const section = MISSING_ITEM_SECTIONS[item];
              return (
                <li key={item}>
                  {section ? (
                    <button
                      type="button"
                      onClick={() => onFix(section)}
                      className="flex w-full items-center justify-between py-2.5 text-left text-sm text-ink hover:text-brand-700"
                    >
                      {item}
                      <ChevronRight className="h-4 w-4 text-text-faint" />
                    </button>
                  ) : (
                    <p className="py-2.5 text-sm text-ink">{item}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-text-muted">Everything needed for review is filled in.</p>
      )}
    </Card>
  );
}
