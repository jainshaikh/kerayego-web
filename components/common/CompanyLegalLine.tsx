import { COMPANY } from '../../lib/config/company';
import { cn } from '../../lib/utils/cn';

interface CompanyLegalLineProps {
  className?: string;
  /** Leave out the registered office (e.g. the compact sign-in pages' footer). */
  withAddress?: boolean;
}

// The operating company in the public footers: who runs KerayeGo, where it's
// registered and its registered office. Plain server-rendered text, so it's
// in the initial HTML every crawler sees (Meta Business Verification needs
// the exact legal name on the site — lib/config/company.ts). No hooks: server
// pages and layouts render it as is. Each line is one string, so the raw HTML
// holds the whole sentence ("KerayeGo is operated by KERAYEGO (SMC-PRIVATE)
// LIMITED.") — JSX pieces like `{a} text {b}` get <!-- --> markers between
// them, which breaks a View Source search for the full sentence.
export function CompanyLegalLine({ className, withAddress = true }: CompanyLegalLineProps) {
  return (
    <div className={cn('space-y-0.5 text-center text-xs leading-relaxed', className)}>
      <p>{`${COMPANY.brandName} is operated by ${COMPANY.legalName}.`}</p>
      <p>{`Registered in Pakistan | CUIN: ${COMPANY.cuin}`}</p>
      {withAddress ? (
        <address className="not-italic">{`Registered office: ${COMPANY.registeredOffice}`}</address>
      ) : null}
    </div>
  );
}
