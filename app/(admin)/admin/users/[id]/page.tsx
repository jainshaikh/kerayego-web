'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, ExternalLink } from 'lucide-react';
import {
  useAdminUserDetail,
  useSuspendUser,
  useActivateUser,
  useBlockUser,
} from '../../../../../hooks/useAdmin';
import { useAuth } from '../../../../../hooks/useAuth';
import { getApiErrorMessage } from '../../../../../hooks/useAccountDeletion';
import type { BlockPersonResult } from '../../../../../lib/api/admin.api';
import { StatusBadge } from '../../../../../components/common/StatusBadge';
import {
  AdminStat,
  BlockResultSummary,
  ReasonModal,
  RoleBadge,
} from '../../../../../components/admin';
import { Avatar, Button, Card, ConfirmDialog, ErrorState, Modal } from '../../../../../components/ui';

type ModalType = 'suspend' | 'activate' | null;

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: user, isLoading, isError } = useAdminUserDetail(id);
  const suspend = useSuspendUser();
  const activate = useActivateUser();
  const [modal, setModal] = useState<ModalType>(null);
  const { isAdmin } = useAuth();
  const blockUser = useBlockUser();
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockResult, setBlockResult] = useState<BlockPersonResult | null>(null);

  const isPending = suspend.isPending || activate.isPending;

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-4 w-32 animate-pulse rounded-chip bg-surface-hover" />
        <div className="h-[168px] animate-pulse rounded-card border border-border-subtle bg-surface" />
        <div className="h-[104px] animate-pulse rounded-card border border-border-subtle bg-surface" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <ErrorState
        title="User not found"
        description="This account may have been removed, or the link is wrong."
        onBack={() => router.push('/admin/users')}
      />
    );
  }

  const provider = user.providerProfile;
  // Blocking is for customer/business accounts; a DELETED account has nothing left to block (409).
  const canBlock =
    isAdmin && (user.role === 'USER' || user.role === 'PROVIDER') && user.status !== 'DELETED';

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-text-faint">
        <Link href="/admin/users" className="transition-colors hover:text-brand-700">
          Users
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate font-medium text-ink">{user.name}</span>
      </nav>

      {/* Header */}
      <Card padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar name={user.name} size="lg" tone="ink" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-[-0.035em] text-ink">{user.name}</h1>
                <RoleBadge role={user.role} />
                <StatusBadge status={user.status} size="sm" />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
                <span>{user.email}</span>
                {user.phone && <span className="font-mono">{user.phone}</span>}
                <span
                  className={user.emailVerified ? 'text-status-emerald-fg' : 'text-status-amber-fg'}
                >
                  {user.emailVerified ? 'Email verified' : 'Email not verified'}
                </span>
                <span>
                  Joined{' '}
                  {new Date(user.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 flex-wrap gap-2.5">
            {user.status === 'SUSPENDED' ? (
              <Button onClick={() => setModal('activate')}>Activate user</Button>
            ) : user.role === 'USER' || user.role === 'PROVIDER' ? (
              <Button variant="danger-outline" onClick={() => setModal('suspend')}>
                Suspend user
              </Button>
            ) : null}
            {canBlock && (
              <Button
                variant="danger"
                onClick={() => {
                  blockUser.reset();
                  setBlockOpen(true);
                }}
              >
                Block person
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {provider ? (
          <>
            <AdminStat label="Vehicles" value={provider._count.vehicles} />
            <AdminStat label="Booking requests" value={provider._count.bookingRequests} />
            <AdminStat label="Showrooms" value={provider.showrooms.length} />
            <AdminStat label="Documents" value={provider.documents.length} />
          </>
        ) : (
          <>
            <AdminStat label="Booking requests" value={user._count.bookingRequests} />
            <AdminStat label="Saved vehicles" value={user._count.savedVehicles} />
          </>
        )}
      </div>

      {/* Provider profile */}
      {provider && (
        <Card padding="lg">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-ink">
                {provider.businessName}
              </h2>
              {provider.businessDescription && (
                <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-text-muted">
                  {provider.businessDescription}
                </p>
              )}
            </div>
            <StatusBadge status={provider.verificationStatus} size="sm" />
          </div>

          {provider.rejectionReason && (
            <p className="mb-5 rounded-control border border-status-red-border bg-status-red-bg px-3.5 py-2.5 text-xs text-status-red-fg">
              <b className="font-semibold">Rejection reason:</b> {provider.rejectionReason}
            </p>
          )}

          <div className="grid gap-7 border-t border-border-subtle pt-5 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.07em] text-text-faint">
                Showrooms
              </h3>
              {provider.showrooms.length === 0 ? (
                <p className="text-sm text-text-faint">None added</p>
              ) : (
                <ul className="space-y-2.5">
                  {provider.showrooms.map((s) => (
                    <li key={s.id} className="text-sm text-text-muted">
                      <span className="font-medium text-ink">{s.name}</span>
                      <span className="capitalize"> — {s.city}</span>
                      {s.contactNumber && (
                        <span className="font-mono text-xs text-text-faint">
                          {' '}
                          · {s.contactNumber}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.07em] text-text-faint">
                Documents
              </h3>
              {provider.documents.length === 0 ? (
                <p className="text-sm text-text-faint">None uploaded</p>
              ) : (
                <ul className="space-y-2">
                  {provider.documents.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3">
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink-soft group inline-flex items-center gap-1.5 text-sm capitalize transition-colors hover:text-brand-700"
                      >
                        {d.documentType.replace(/_/g, ' ').toLowerCase()}
                        <ExternalLink className="h-3 w-3 flex-shrink-0 text-text-faint transition-colors group-hover:text-brand-600" />
                      </a>
                      <StatusBadge status={d.status} size="sm" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      )}

      <ReasonModal
        open={blockOpen}
        onOpenChange={setBlockOpen}
        title={`Block ${user.name}?`}
        label="Reason"
        placeholder="e.g. Fraud on several bookings — confirmed with the business"
        confirmLabel="Block person"
        loading={blockUser.isPending}
        error={blockUser.isError ? getApiErrorMessage(blockUser.error, 'Could not block this person') : null}
        onConfirm={async (reason) => {
          try {
            const result = await blockUser.mutateAsync({ id: user.id, reason });
            setBlockOpen(false);
            setBlockResult(result);
          } catch {
            // shown in the modal
          }
        }}
      >
        <p>
          This account is suspended, and this person&rsquo;s CNIC, phone and email are kept on a
          block list (as one-way codes, not readable). On any future account, a matching CNIC or
          email is refused, and a matching phone puts the account on hold until KerayeGo checks it.
        </p>
        <p className="mt-2">
          Any other account that already uses the same CNIC or phone is put on hold for review.
        </p>
      </ReasonModal>

      <Modal
        open={!!blockResult}
        onOpenChange={(open) => !open && setBlockResult(null)}
        title={`${user.name} is blocked`}
        footer={<Button onClick={() => setBlockResult(null)}>Done</Button>}
      >
        {blockResult && <BlockResultSummary result={blockResult} />}
      </Modal>

      <ConfirmDialog
        open={!!modal}
        onOpenChange={(open) => !open && setModal(null)}
        title={modal === 'suspend' ? 'Suspend user?' : 'Activate user?'}
        description={`${user.name} (${user.email})`}
        requireReason={modal === 'suspend'}
        reasonLabel="Reason for suspension"
        confirmLabel={modal === 'suspend' ? 'Suspend user' : 'Activate user'}
        cancelLabel="Cancel"
        destructive={modal === 'suspend'}
        loading={isPending}
        onConfirm={async (reason) => {
          if (modal === 'suspend') {
            if (!reason) return;
            await suspend.mutateAsync({ id: user.id, reason });
          } else {
            await activate.mutateAsync(user.id);
          }
          setModal(null);
        }}
      />
    </div>
  );
}
