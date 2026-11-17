import { Building2 } from 'lucide-react';
import { COMPANY } from '../../lib/config/company';
import { cn } from '../../lib/utils/cn';

// "Company information" for /about and /contact: the operating company's legal
// name, registrations and registered office (lib/config/company.ts).
// Server-rendered text, so the exact legal name is in the page's HTML (Meta
// Business Verification).
export function CompanyInformation({ className }: { className?: string }) {
  const rows: { label: string; value: string }[] = [
    { label: 'Legal name', value: COMPANY.legalName },
    { label: 'Brand', value: COMPANY.brandName },
    { label: 'Registered in', value: 'Pakistan' },
    { label: 'CUIN (SECP)', value: COMPANY.cuin },
    { label: 'FBR registration (NTN)', value: COMPANY.ntn },
    { label: 'Registered office', value: COMPANY.registeredOffice },
  ];

  return (
    <section className={cn('rounded-xl border border-border-subtle bg-surface p-5', className)}>
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-brand-700" />
        <h2 className="text-base font-semibold text-ink">Company information</h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">
        {`${COMPANY.brandName} is operated by ${COMPANY.legalName}, a company registered in Pakistan.`}
      </p>
      <dl className="mt-3 space-y-2 text-sm">
        {rows.map(({ label, value }) => (
          <div key={label} className="grid gap-0.5 sm:grid-cols-[180px_1fr] sm:gap-3">
            <dt className="text-text-faint">{label}</dt>
            <dd className="font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
