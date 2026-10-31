'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, FileText, MapPin, Phone } from 'lucide-react';
import {
  useAdminProviderDetail,
  useAdminProviderSummary,
  useApproveProvider,
  useRejectProvider,
} from '../../../../../hooks/useAdmin';
import { StatusBadge } from '../../../../../components/common/StatusBadge';
import { AdminPageHeader, ApproveDialog } from '../../../../../components/admin';
import { BusinessActivityCard } from '../../../../../components/admin/BusinessActivityCard';
import { Button, Card, ConfirmDialog, ErrorState } from '../../../../../components/ui';

const DOC_LABELS: Record<string, string> = {
  BUSINESS_LICENSE: 'Business license',
  TRADE_LICENSE: 'Trade license',
  OWNERSHIP_PROOF: 'Ownership proof',
  ID_DOCUMENT: 'CNIC / National ID',
  ID_DOCUMENT_FRONT: 'CNIC — front',
  ID_DOCUMENT_BACK: 'CNIC — back',
  OTHER: 'Other document',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11.5px] font-medium text-text-faint">{label}</p>
      <p className="mt-1 text-[13.5px] leading-relaxed text-ink">{children}</p>
    </div>
  );
}

// Provider docs are almost always camera/gallery photos, but a business
// license could be a PDF — fall back to a plain link if the image fails.
function DocumentPreview({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-full w-full flex-col items-center justify-center gap-2 text-text-faint transition-colors hover:text-brand-700"
      >
        <FileText className="h-6 w-6" />
        <span className="text-xs font-medium">View file</span>
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
        onError={() => setFailed(true)}
      />
    </a>
  );
}

export default function AdminProviderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: provider, isLoading, isError, refetch } = useAdminProviderDetail(id);
  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useAdminProviderSummary(id);
  const approve = useApproveProvider();
  const reject = useRejectProvider();
  const [modal, setModal] = useState<'approve' | 'reject' | null>(null);
  const isPending = approve.isPending || reject.isPending;

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-4 w-32 animate-pulse rounded-control bg-surface-hover" />
        <div className="h-40 animate-pulse rounded-card border border-border-subtle bg-surface" />
        <div className="h-48 animate-pulse rounded-card border border-border-subtle bg-surface" />
      </div>
    );
  }

  if (isError || !provider) {
    return <ErrorState title="Provider not found" description="This application may have been removed." onRetry={refetch} />;
  }

  const canModerate = provider.verificationStatus === 'PENDING_REVIEW';

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-text-faint">
        <Link href="/admin/providers" className="transition-colors hover:text-brand-700">
          Providers
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate font-medium text-ink">{provider.businessName}</span>
      </nav>

      <AdminPageHeader
        eyebrow="Provider application"
        title={provider.businessName}
        subtitle={`Submitted ${new Date(provider.updatedAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}`}
        actions={
          <>
            <StatusBadge status={provider.verificationStatus} />
            {canModerate && (
              <>
                <Button size="sm" onClick={() => setModal('approve')}>
                  Approve
                </Button>
                <Button size="sm" variant="danger-outline" onClick={() => setModal('reject')}>
                  Reject
                </Button>
              </>
            )}
          </>
        }
      />

      {provider.verificationStatus === 'REJECTED' && provider.rejectionReason && (
        <div className="rounded-control border border-status-red-border bg-status-red-bg px-4 py-3 text-sm text-status-red-fg">
          <strong className="font-semibold">Rejection reason:</strong> {provider.rejectionReason}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <Card className="!p-4">
          <p className="truncate font-mono text-lg font-semibold text-ink">{provider._count.vehicles}</p>
          <p className="mt-0.5 text-xs text-text-muted">Vehicles listed</p>
        </Card>
        <Card className="!p-4">
          <p className="truncate font-mono text-lg font-semibold text-ink">{provider._count.bookingRequests}</p>
          <p className="mt-0.5 text-xs text-text-muted">Booking requests</p>
        </Card>
        <Card className="!p-4">
          <p className="truncate font-mono text-lg font-semibold text-ink">{provider.showrooms.length}</p>
          <p className="mt-0.5 text-xs text-text-muted">Showrooms</p>
        </Card>
        <Card className="!p-4">
          <p className="truncate font-mono text-lg font-semibold text-ink">{provider.documents.length}</p>
          <p className="mt-0.5 text-xs text-text-muted">Documents</p>
        </Card>
      </div>

      {/* Business Summary (A31) */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-faint">Team Breakdown (A31)</h2>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="rounded-lg border border-border-subtle p-2.5 bg-page">
                <p className="text-lg font-semibold text-ink font-mono">{summary.members.businessAdmins}</p>
                <p className="text-[11px] text-text-muted">Admins</p>
              </div>
              <div className="rounded-lg border border-border-subtle p-2.5 bg-page">
                <p className="text-lg font-semibold text-ink font-mono">{summary.members.managers}</p>
                <p className="text-[11px] text-text-muted">Managers</p>
              </div>
              <div className="rounded-lg border border-border-subtle p-2.5 bg-page">
                <p className="text-lg font-semibold text-ink font-mono">{summary.members.drivers}</p>
                <p className="text-[11px] text-text-muted">{summary.members.verifiedDrivers} Verified Drivers</p>
              </div>
            </div>
            <p className="text-xs text-text-muted text-center pt-1">Total team roster: {summary.members.total} members</p>
          </Card>

          <Card className="p-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-faint">Bookings & Rides Breakdown (A31)</h2>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="rounded-lg border border-border-subtle p-2.5 bg-page">
                <p className="text-lg font-semibold text-emerald-600 font-mono">{summary.bookings.inProgress}</p>
                <p className="text-[11px] text-text-muted">In Progress</p>
              </div>
              <div className="rounded-lg border border-border-subtle p-2.5 bg-page">
                <p className="text-lg font-semibold text-ink font-mono">{summary.bookings.completed}</p>
                <p className="text-[11px] text-text-muted">Completed</p>
              </div>
              <div className="rounded-lg border border-border-subtle p-2.5 bg-page">
                <p className="text-lg font-semibold text-rose-600 font-mono">
                  {summary.bookings.cancelled + summary.bookings.rejected}
                </p>
                <p className="text-[11px] text-text-muted">Cancelled/Rejected</p>
              </div>
            </div>
            <p className="text-xs text-text-muted text-center pt-1">Total bookings requested: {summary.bookings.total}</p>
          </Card>
        </div>
      )}

      <BusinessActivityCard
        providerId={id}
        recentActivity={summary?.recentActivity}
        recentLoading={summaryLoading}
        recentError={summaryError}
      />

      {/* Business info + owner */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold text-ink">Business details</h2>
          <div className="grid gap-4">
            <Field label="Business name">{provider.businessName}</Field>
            <Field label="Slug">{provider.slug}</Field>
            {provider.businessDescription && <Field label="Description">{provider.businessDescription}</Field>}
            <Field label="Featured">{provider.isFeatured ? 'Yes' : 'No'}</Field>
          </div>
          {provider.logoUrl && (
            <div className="mt-5 flex gap-3 border-t border-border-subtle pt-5">
              <a href={provider.logoUrl} target="_blank" rel="noopener noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={provider.logoUrl} alt="Logo" className="h-16 w-16 rounded-media border border-border-subtle object-cover" />
              </a>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold text-ink">Account owner</h2>
          <div className="grid gap-4">
            <Field label="Name">{provider.user.name}</Field>
            <Field label="Email">{provider.user.email}</Field>
            {provider.user.phone && (
              <Field label="Phone">
                <span className="flex items-center gap-1.5 font-mono">
                  <Phone className="h-3.5 w-3.5 text-text-faint" />
                  {provider.user.phone}
                </span>
              </Field>
            )}
            <Field label="Joined">
              {new Date(provider.user.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
            </Field>
            <Field label="Owner's CNIC number">
              {provider.ownerCnicNumber ? (
                <span className="font-mono">{provider.ownerCnicNumber}</span>
              ) : (
                <span className="text-text-faint">Not given</span>
              )}
            </Field>
          </div>
          <Link
            href={`/admin/users/${provider.user.id}`}
            className="mt-5 inline-block border-t border-border-subtle pt-5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
          >
            View user profile →
          </Link>
        </Card>
      </div>

      {/* Showrooms */}
      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Showrooms</h2>
        {provider.showrooms.length === 0 ? (
          <p className="text-sm text-text-muted">No showrooms added yet.</p>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2">
            {provider.showrooms.map((s) => (
              <div key={s.id} className="rounded-control border border-border-subtle p-4">
                <p className="flex items-center gap-1.5 font-semibold text-ink">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-text-faint" />
                  {s.name}
                </p>
                <p className="mt-1.5 text-xs text-text-muted">
                  {s.address}, {s.area ? `${s.area}, ` : ''}
                  {s.city.charAt(0).toUpperCase() + s.city.slice(1)}
                </p>
                <p className="mt-1.5 font-mono text-xs text-text-muted">
                  {s.contactNumber}
                  {s.whatsappNumber && s.whatsappNumber !== s.contactNumber ? ` · WhatsApp ${s.whatsappNumber}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Documents */}
      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Verification documents</h2>
        {provider.documents.length === 0 ? (
          <p className="text-sm text-text-muted">No documents uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {provider.documents.map((doc) => (
              <div key={doc.id}>
                <div className="aspect-[4/3] overflow-hidden rounded-media border border-border-subtle bg-page">
                  <DocumentPreview url={doc.fileUrl} />
                </div>
                <p className="mt-2 text-xs font-medium text-ink">{DOC_LABELS[doc.documentType] ?? doc.documentType}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ApproveDialog
        open={modal === 'approve'}
        onOpenChange={(open) => !open && setModal(null)}
        title="Approve provider?"
        subject={`${provider.businessName} (${provider.user.email})`}
        confirmLabel="Approve provider"
        placeholder="Welcome message or any notes for the provider…"
        loading={isPending}
        onConfirm={async (note) => {
          await approve.mutateAsync({ id: provider.id, note });
          setModal(null);
        }}
      />

      <ConfirmDialog
        open={modal === 'reject'}
        onOpenChange={(open) => !open && setModal(null)}
        title="Reject application?"
        description={`${provider.businessName} (${provider.user.email})`}
        requireReason
        reasonLabel="Reason for rejection"
        confirmLabel="Reject application"
        cancelLabel="Cancel"
        loading={isPending}
        onConfirm={async (reason) => {
          if (!reason) return;
          await reject.mutateAsync({ id: provider.id, reason });
          setModal(null);
        }}
      />
    </div>
  );
}
