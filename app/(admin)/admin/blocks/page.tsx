'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAdminBlocks, useLiftBlock } from '../../../../hooks/useAdmin';
import { useAuth } from '../../../../hooks/useAuth';
import { getApiErrorMessage } from '../../../../hooks/useAccountDeletion';
import type { PersonBlockView } from '../../../../lib/api/admin.api';
import {
  AdminEmptyRow,
  AdminPageHeader,
  AdminRow,
  AdminSkeletonRows,
  AdminTable,
  AdminTableFooter,
  IdentifierHints,
  ReasonModal,
} from '../../../../components/admin';
import { Button, Checkbox } from '../../../../components/ui';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { dateStyle: 'medium' });
}

/** People KerayeGo admin blocked (A22, D18). Lift is SUPER_ADMIN only. */
export default function AdminBlocksPage() {
  const { isSuperAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const [includeLifted, setIncludeLifted] = useState(false);
  const [lifting, setLifting] = useState<PersonBlockView | null>(null);

  const { data, isFetching } = useAdminBlocks(page, includeLifted);
  const lift = useLiftBlock();

  const blocks = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Blocks"
        subtitle={
          meta
            ? `${meta.total.toLocaleString()} ${includeLifted ? 'blocks' : 'active blocks'}`
            : 'People blocked from KerayeGo'
        }
      />

      <p className="max-w-[72ch] text-sm leading-relaxed text-text-muted">
        A block keeps a person&rsquo;s CNIC, phone and email as one-way codes. A matching CNIC or email
        is refused on any account; a matching phone puts the account on hold for review. Only the
        short hints below are readable.
      </p>

      <Checkbox
        checked={includeLifted}
        onChange={(checked) => {
          setIncludeLifted(checked);
          setPage(1);
        }}
        label="Include lifted"
      />

      <AdminTable
        busy={isFetching}
        columns={[
          'Person',
          'Reason',
          'Blocked by',
          'Identifiers',
          'Status',
          { label: 'Actions', align: 'right' },
        ]}
      >
        {isFetching && blocks.length === 0 ? (
          <AdminSkeletonRows colSpan={6} />
        ) : blocks.length === 0 ? (
          <AdminEmptyRow colSpan={6}>
            {includeLifted ? 'No blocks yet' : 'No active blocks'}
          </AdminEmptyRow>
        ) : (
          blocks.map((b) => (
            <AdminRow key={b.id}>
              <td className="px-4 py-3 align-top">
                <p className="font-medium text-ink">{b.blockedUserLabel ?? 'Unknown person'}</p>
                {b.blockedUserId && (
                  <Link
                    href={`/admin/users/${b.blockedUserId}`}
                    className="text-xs text-brand-700 hover:underline"
                  >
                    View account
                  </Link>
                )}
              </td>
              <td className="max-w-[280px] px-4 py-3 align-top text-text-muted">
                <p className="whitespace-pre-line break-words">{b.reason}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-3 align-top">
                <p className="text-ink">{b.createdBy?.name ?? '—'}</p>
                <p className="font-mono text-xs text-text-faint">{formatDate(b.createdAt)}</p>
              </td>
              <td className="px-4 py-3 align-top">
                <IdentifierHints identifiers={b.identifiers} />
              </td>
              <td className="px-4 py-3 align-top">
                {b.liftedAt ? (
                  <div>
                    <span className="inline-flex items-center rounded-full border border-status-slate-border bg-status-slate-bg px-[9px] py-[3px] text-[11px] font-semibold text-status-slate-fg">
                      Lifted {formatDate(b.liftedAt)}
                    </span>
                    {b.liftReason && (
                      <p className="mt-1 max-w-[220px] break-words text-xs text-text-faint">
                        {b.liftReason}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-status-red-border bg-status-red-bg px-[9px] py-[3px] text-[11px] font-semibold text-status-red-fg">
                    Active
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right align-top">
                {!b.liftedAt && isSuperAdmin ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      lift.reset();
                      setLifting(b);
                    }}
                  >
                    Lift
                  </Button>
                ) : (
                  <span className="text-xs text-text-faint">—</span>
                )}
              </td>
            </AdminRow>
          ))
        )}
      </AdminTable>

      {meta && (
        <AdminTableFooter
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          onPageChange={setPage}
        />
      )}

      <ReasonModal
        open={!!lifting}
        onOpenChange={(open) => !open && setLifting(null)}
        title={`Lift the block on ${lifting?.blockedUserLabel ?? 'this person'}?`}
        label="Reason"
        placeholder="e.g. Identity confirmed — the block was a mistake"
        confirmLabel="Lift block"
        destructive={false}
        loading={lift.isPending}
        error={lift.isError ? getApiErrorMessage(lift.error, 'Could not lift the block') : null}
        onConfirm={async (reason) => {
          if (!lifting) return;
          try {
            await lift.mutateAsync({ id: lifting.id, reason });
            setLifting(null);
          } catch {
            // shown in the modal
          }
        }}
      >
        <p>
          This person&rsquo;s CNIC, phone and email will no longer be refused or held. Accounts on hold
          because of this block are released.
        </p>
        <p className="mt-2 font-semibold text-ink">
          Lifting does not reactivate the blocked account — it stays suspended until you activate it
          from the user page.
        </p>
      </ReasonModal>
    </div>
  );
}
