'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useAdminIdentityReviews,
  useBlockIdentityReview,
  useClearIdentityReview,
} from '../../../../hooks/useAdmin';
import { getApiErrorMessage } from '../../../../hooks/useAccountDeletion';
import type {
  BlockPersonResult,
  IdentityReviewStatus,
  IdentityReviewView,
} from '../../../../lib/api/admin.api';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import {
  AdminEmptyRow,
  AdminPageHeader,
  AdminRow,
  AdminSkeletonRows,
  AdminTable,
  AdminTableFooter,
  BlockResultSummary,
  IdentifierHints,
  ReasonModal,
  StatusTabs,
  identifierKindLabel,
} from '../../../../components/admin';
import { Button, Modal } from '../../../../components/ui';

const TABS: { label: string; value: IdentityReviewStatus }[] = [
  { label: 'Waiting', value: 'PENDING' },
  { label: 'Cleared', value: 'CLEARED' },
  { label: 'Blocked', value: 'BLOCKED' },
];

type ActionState = { type: 'clear' | 'block'; review: IdentityReviewView } | null;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { dateStyle: 'medium' });
}

/** Accounts put on hold because their phone or CNIC matched a block (A22, D18).
 * Clear releases the hold; Block blocks that person too. */
export default function AdminIdentityReviewsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<IdentityReviewStatus>('PENDING');
  const [action, setAction] = useState<ActionState>(null);
  const [blockResult, setBlockResult] = useState<{ name: string; result: BlockPersonResult } | null>(
    null,
  );

  const { data, isFetching } = useAdminIdentityReviews(page, status);
  const clear = useClearIdentityReview();
  const block = useBlockIdentityReview();

  const reviews = data?.data ?? [];
  const meta = data?.meta;
  const activeMutation = action?.type === 'block' ? block : clear;

  const openAction = (type: 'clear' | 'block', review: IdentityReviewView) => {
    clear.reset();
    block.reset();
    setAction({ type, review });
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Possible blocked people"
        subtitle={
          meta && status === 'PENDING'
            ? `${meta.total.toLocaleString()} waiting for a check`
            : 'Accounts whose phone or CNIC matched a block'
        }
      />

      <p className="max-w-[72ch] text-sm leading-relaxed text-text-muted">
        These accounts can sign in and browse, but can&rsquo;t book, post trips, request seats or drive
        until you clear or block them. A match means the same phone or CNIC as a blocked person — it
        may be a different person (e.g. a reused phone number).
      </p>

      <StatusTabs
        tabs={TABS}
        value={status}
        onChange={(v) => {
          setStatus(v as IdentityReviewStatus);
          setPage(1);
        }}
      />

      <AdminTable
        busy={isFetching}
        columns={[
          'Account on hold',
          'Matched',
          'Block it matched',
          'Found',
          { label: 'Actions', align: 'right' },
        ]}
      >
        {isFetching && reviews.length === 0 ? (
          <AdminSkeletonRows colSpan={5} />
        ) : reviews.length === 0 ? (
          <AdminEmptyRow colSpan={5}>
            {status === 'PENDING' ? 'No accounts waiting for a check' : 'Nothing here yet'}
          </AdminEmptyRow>
        ) : (
          reviews.map((r) => (
            <AdminRow key={r.id}>
              <td className="px-4 py-3 align-top">
                <Link
                  href={`/admin/users/${r.user.id}`}
                  className="font-medium text-ink transition-colors hover:text-brand-700"
                >
                  {r.user.name}
                </Link>
                <p className="text-xs text-text-faint">{r.user.email}</p>
                {r.user.phone && <p className="font-mono text-xs text-text-faint">{r.user.phone}</p>}
                <StatusBadge status={r.user.status} size="sm" className="mt-1" />
              </td>
              <td className="px-4 py-3 align-top">
                <span className="inline-flex items-center rounded-full border border-status-amber-border bg-status-amber-bg px-[9px] py-[3px] text-[11px] font-semibold text-status-amber-fg">
                  {identifierKindLabel(r.matchedKind)}
                </span>
              </td>
              <td className="max-w-[320px] px-4 py-3 align-top">
                <p className="font-medium text-ink">
                  {r.block.blockedUserLabel ?? 'Unknown person'}
                </p>
                <p className="mt-0.5 break-words text-xs text-text-muted">{r.block.reason}</p>
                <p className="mt-0.5 font-mono text-xs text-text-faint">
                  Blocked {formatDate(r.block.createdAt)}
                </p>
                <IdentifierHints identifiers={r.block.identifiers} className="mt-1.5" />
              </td>
              <td className="whitespace-nowrap px-4 py-3 align-top font-mono text-xs text-text-faint">
                {formatDate(r.createdAt)}
              </td>
              <td className="px-4 py-3 text-right align-top">
                {r.status === 'PENDING' ? (
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openAction('clear', r)}>
                      Clear
                    </Button>
                    <Button size="sm" variant="danger-outline" onClick={() => openAction('block', r)}>
                      Block
                    </Button>
                  </div>
                ) : (
                  <StatusBadge status={r.status} size="sm" />
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
        // Remount per action so the text box starts empty when switching Clear ↔ Block.
        key={action ? `${action.type}-${action.review.id}` : 'none'}
        open={!!action}
        onOpenChange={(open) => !open && setAction(null)}
        title={
          action?.type === 'block'
            ? `Block ${action.review.user.name}?`
            : `Clear ${action?.review.user.name ?? 'this account'}?`
        }
        label={action?.type === 'block' ? 'Reason' : 'Note'}
        optional={action?.type === 'clear'}
        placeholder={
          action?.type === 'block'
            ? 'e.g. Same person — confirmed by the CNIC photo'
            : 'e.g. Different person — the phone number was reissued'
        }
        confirmLabel={action?.type === 'block' ? 'Block person' : 'Clear'}
        destructive={action?.type === 'block'}
        loading={activeMutation.isPending}
        error={
          activeMutation.isError
            ? getApiErrorMessage(
                activeMutation.error,
                action?.type === 'block' ? 'Could not block this person' : 'Could not clear this account',
              )
            : null
        }
        onConfirm={async (text) => {
          if (!action) return;
          try {
            if (action.type === 'clear') {
              await clear.mutateAsync({ id: action.review.id, note: text || undefined });
              setAction(null);
            } else {
              const result = await block.mutateAsync({ id: action.review.id, reason: text });
              setAction(null);
              setBlockResult({ name: action.review.user.name, result });
            }
          } catch {
            // shown in the modal
          }
        }}
      >
        {action?.type === 'block' ? (
          <p>
            {action.review.user.name}&rsquo;s account is suspended, and their CNIC, phone and email
            are added to the block list: refused (CNIC, email) or held (phone) on any future
            account.
          </p>
        ) : (
          <p>
            {action?.review.user.name ?? 'This account'} is marked as not the blocked person and,
            unless another check on them is still waiting, the hold is released so they can book,
            post trips and drive again. The block itself stays in place.
          </p>
        )}
      </ReasonModal>

      <Modal
        open={!!blockResult}
        onOpenChange={(open) => !open && setBlockResult(null)}
        title={`${blockResult?.name ?? 'Person'} is blocked`}
        footer={<Button onClick={() => setBlockResult(null)}>Done</Button>}
      >
        {blockResult && <BlockResultSummary result={blockResult.result} />}
      </Modal>
    </div>
  );
}
