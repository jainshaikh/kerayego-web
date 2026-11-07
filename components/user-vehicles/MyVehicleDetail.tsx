'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useDeleteUserVehicle, useMyUserVehicle } from '../../hooks/useUserVehicles';
import { apiErrorMessage } from '../../lib/ops/apiError';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmModal } from '../ops/ConfirmModal';
import { Button } from '../ui';

const DOC_LABELS: Record<string, string> = {
  ID_DOCUMENT: 'CNIC (National ID)',
  ID_DOCUMENT_FRONT: 'CNIC (National ID) — front',
  ID_DOCUMENT_BACK: 'CNIC (National ID) — back',
  DRIVING_LICENSE: 'Driving license',
  VEHICLE_REGISTRATION: 'Vehicle registration',
};

interface MyVehicleDetailProps {
  backHref: string; // e.g. '/dashboard/my-vehicles'
}

export function MyVehicleDetail({ backHref }: MyVehicleDetailProps) {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: vehicle, isLoading, isError } = useMyUserVehicle(id);
  const deleteVehicle = useDeleteUserVehicle();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const onConfirmDelete = () => {
    setDeleteError(null);
    deleteVehicle.mutate(id, {
      onSuccess: () => {
        setConfirmDelete(false);
        router.push(backHref);
      },
      // e.g. the backend's 409 "has an upcoming or ongoing trip" — shown in the dialog.
      onError: (error) => setDeleteError(apiErrorMessage(error)),
    });
  };

  if (isLoading) {
    return <div className="max-w-2xl animate-pulse h-64 bg-white rounded-xl border border-slate-200" />;
  }

  if (isError || !vehicle) {
    return (
      <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="font-semibold text-slate-800">Vehicle not found</p>
        <Link href={backHref} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
          Back to vehicles
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link href={backHref} className="hover:text-slate-600">My Vehicles</Link>
        <span>/</span>
        <span className="truncate text-slate-700">{vehicle.make} {vehicle.model}</span>
      </nav>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold text-slate-900">
            {vehicle.make} {vehicle.model}{vehicle.year ? ` (${vehicle.year})` : ''}
          </h1>
          <StatusBadge status={vehicle.status} />
        </div>

        {vehicle.status === 'PENDING_REVIEW' && (
          <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 inline-block">
            Awaiting document verification — you can&apos;t post trips with this vehicle yet.
          </p>
        )}
        {vehicle.status === 'REJECTED' && vehicle.rejectionReason && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 inline-block">
            Rejected: {vehicle.rejectionReason}
          </p>
        )}
        {vehicle.status === 'SUSPENDED' && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 inline-block">
            This vehicle was suspended and can&apos;t be used for new trips.
          </p>
        )}

        <div className="mt-5 grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400">Plate number</p>
            <p className="text-slate-700">{vehicle.plateNumber}</p>
          </div>
          {vehicle.color && (
            <div>
              <p className="text-xs text-slate-400">Color</p>
              <p className="text-slate-700">{vehicle.color}</p>
            </div>
          )}
        </div>
      </div>

      {vehicle.images.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Photos</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {vehicle.images.map((image, index) => (
              <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200">
                <Image src={image.url} alt="" fill className="object-cover" sizes="150px" />
                {index === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Poster
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Verification documents</h2>
        <ul className="space-y-2">
          {vehicle.documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between text-sm">
              <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-primary hover:underline">
                {DOC_LABELS[doc.documentType] ?? doc.documentType}
              </a>
              <span className="text-xs font-semibold text-slate-400">{doc.status}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-red-200 bg-white p-6">
        <h2 className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">Delete vehicle</h2>
        {vehicle.status === 'SUSPENDED' ? (
          <p className="text-sm text-slate-500">
            This vehicle was suspended by KerayeGo, so it can&apos;t be deleted — contact support.
          </p>
        ) : (
          <p className="text-sm text-slate-500">
            Permanently removes this vehicle with all its photos and documents. Past trips keep their history.
          </p>
        )}
        <Button
          variant="danger-outline"
          size="sm"
          className="mt-3"
          disabled={vehicle.status === 'SUSPENDED'}
          onClick={() => {
            setDeleteError(null);
            setConfirmDelete(true);
          }}
        >
          Delete vehicle
        </Button>
      </div>

      <ConfirmModal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this vehicle?"
        description={`This permanently deletes ${vehicle.make} ${vehicle.model} (${vehicle.plateNumber}) with all its photos and documents. This can't be undone.`}
        confirmLabel="Delete vehicle"
        cancelLabel="Keep it"
        destructive
        loading={deleteVehicle.isPending}
        onConfirm={onConfirmDelete}
      >
        {deleteError ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {deleteError}
          </p>
        ) : null}
      </ConfirmModal>
    </div>
  );
}
