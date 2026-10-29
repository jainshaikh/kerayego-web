import type { Metadata } from 'next';
import { CancelDeletionByToken } from '../../../../components/account/CancelDeletionByToken';

// Target of the "Cancel deletion" link in the account-deletion confirmation email
// (`${FRONTEND_URL}/account/cancel-deletion?token=…`). Public: the person was signed out
// everywhere when they asked for deletion. /account is not a protected prefix in middleware.ts.
export const metadata: Metadata = {
  title: 'Cancel account deletion',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CancelDeletionPage({
  searchParams,
}: {
  searchParams: { token?: string | string[] };
}) {
  const token = typeof searchParams.token === 'string' && searchParams.token ? searchParams.token : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-5 text-[26px] font-bold tracking-tight text-ink">Cancel account deletion</h1>
      <CancelDeletionByToken token={token} />
    </div>
  );
}
