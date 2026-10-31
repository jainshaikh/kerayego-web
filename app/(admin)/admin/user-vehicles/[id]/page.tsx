'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  useAdminUserVehicleDetail,
  useApproveUserVehicle,
  useRejectUserVehicle,
  useSuspendUserVehicle,
  useReactivateUserVehicle,
} from '../../../../../hooks/useAdmin';
import { StatusBadge } from '../../../../../components/common/StatusBadge';

const DOC_LABELS: Record<string, string> = {
  ID_DOCUMENT: 'CNIC (National ID)',
  DRIVING_LICENSE: 'Driving license',
  VEHICLE_REGISTRATION: 'Vehicle registration',
};

export default function AdminUserVehicleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: vehicle, isLoading, isError } = useAdminUserVehicleDetail(id);
  const approve = useApproveUserVehicle();
  const reject = useRejectUserVehicle();
  const suspend = useSuspendUserVehicle();
  const reactivate = useReactivateUserVehicle();
  const [showReject, setShowReject] = useState(false);
  const [reasonInput, setReasonInput] = useState('');
  const [documentsReviewed, setDocumentsReviewed] = useState(false);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="h-4 bg-slate-100 rounded w-24" />
        <div className="h-40 bg-white rounded-xl border border-slate-200" />
        <div className="h-48 bg-white rounded-xl border border-slate-200" />
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 font-medium">Vehicle not found</p>
        <Link href="/admin/user-vehicles" className="text-sm text-primary hover:underline mt-2 inline-block">
          Back to vehicles
        </Link>
      </div>
    );
  }

  const handleReject = async () => {
    if (!reasonInput.trim()) return;
    await reject.mutateAsync({ id: vehicle.id, reason: reasonInput });
    setShowReject(false);
  };

  const hasDocuments = !!vehicle.documents && vehicle.documents.length > 0;
  const canApprove = vehicle.status === 'PENDING_REVIEW' && (!hasDocuments || documentsReviewed);

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/admin/user-vehicles" className="hover:text-slate-600">Vehicle Verifications</Link>
        <span>/</span>
        <span className="truncate text-slate-700">{vehicle.make} {vehicle.model}</span>
      </nav>

      {/* Title / owner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">
            {vehicle.make} {vehicle.model}{vehicle.year ? ` (${vehicle.year})` : ''}
          </h1>
          <StatusBadge status={vehicle.status} />
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Plate {vehicle.plateNumber}{vehicle.color ? ` · ${vehicle.color}` : ''}
        </p>
        {vehicle.rejectionReason && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3 inline-block">
            Rejected: {vehicle.rejectionReason}
          </p>
        )}

        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="font-semibold text-slate-900 text-sm">{vehicle.owner.name}</p>
          <div className="mt-1 text-sm text-slate-500 space-x-3">
            <span>{vehicle.owner.email}</span>
            {vehicle.owner.phone && <span>{vehicle.owner.phone}</span>}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            CNIC number:{' '}
            {vehicle.cnicNumber ? (
              <span className="font-mono font-medium text-slate-700">{vehicle.cnicNumber}</span>
            ) : (
              <span className="text-slate-400">Not given</span>
            )}
          </p>
          <Link
            href={`/admin/users/${vehicle.owner.id}`}
            className="inline-block mt-2 text-sm font-semibold text-primary hover:underline"
          >
            View user profile →
          </Link>
        </div>
      </div>

      {/* Documents — moved above the approve/reject action so it can't be
          skipped by scrolling past it, and previews render inline instead of
          bare links an admin could ignore. */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Verification documents</h2>
        {!hasDocuments ? (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            No documents on file — there is nothing here to verify this person&apos;s identity against.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {vehicle.documents?.map((doc) => (
              <div key={doc.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="block bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={doc.fileUrl}
                    alt={DOC_LABELS[doc.documentType] ?? doc.documentType}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </a>
                <div className="flex items-center justify-between px-2.5 py-2 text-xs">
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="font-medium text-slate-600 hover:text-primary hover:underline">
                    {DOC_LABELS[doc.documentType] ?? doc.documentType}
                  </a>
                  <span className="font-semibold text-slate-400">{doc.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {vehicle.status === 'PENDING_REVIEW' && hasDocuments && (
          <label className="flex items-start gap-2 mt-4 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={documentsReviewed}
              onChange={(e) => setDocumentsReviewed(e.target.checked)}
              className="mt-0.5"
            />
            I have opened and reviewed the identity documents above against the owner&apos;s details.
          </label>
        )}
      </div>

      {/* Actions */}
      {vehicle.status === 'PENDING_REVIEW' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex gap-2">
          <button
            onClick={() => approve.mutate(vehicle.id)}
            disabled={approve.isPending || !canApprove}
            title={!canApprove ? 'Review the documents above first' : undefined}
            className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {approve.isPending ? 'Approving…' : 'Approve'}
          </button>
          <button
            onClick={() => { setShowReject(true); setReasonInput(''); }}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Reject
          </button>
        </div>
      )}
      {vehicle.status === 'APPROVED' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <button
            onClick={() => suspend.mutate(vehicle.id)}
            disabled={suspend.isPending}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {suspend.isPending ? 'Suspending…' : 'Suspend'}
          </button>
        </div>
      )}
      {vehicle.status === 'SUSPENDED' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <button
            onClick={() => reactivate.mutate(vehicle.id)}
            disabled={reactivate.isPending}
            className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
          >
            {reactivate.isPending ? 'Reactivating…' : 'Reactivate'}
          </button>
        </div>
      )}

      {/* Reject modal */}
      {showReject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Reject vehicle</h2>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="e.g. CNIC photo is unreadable"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowReject(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={reject.isPending || !reasonInput.trim()}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-red-500 hover:bg-red-600 disabled:opacity-60"
              >
                {reject.isPending ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
