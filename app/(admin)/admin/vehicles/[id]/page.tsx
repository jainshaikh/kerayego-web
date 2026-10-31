'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  useAdminVehicleDetail,
  useApproveVehicle,
  useCorrectVehiclePlate,
  useRejectVehicle,
} from '../../../../../hooks/useAdmin';
import { StatusBadge } from '../../../../../components/common/StatusBadge';
import { cn } from '../../../../../lib/utils/cn';
import { getCurrencyCode } from '../../../../../lib/utils/currency';
import { getApiErrorMessage } from '../../../../../hooks/useAccountDeletion';

type ModalType = 'approve' | 'reject' | 'plate' | null;

export default function AdminVehicleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: vehicle, isLoading, isError } = useAdminVehicleDetail(id);
  const approve = useApproveVehicle();
  const reject = useRejectVehicle();
  const correctPlate = useCorrectVehiclePlate();

  const [modal, setModal] = useState<ModalType>(null);
  const [noteInput, setNoteInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [plateInput, setPlateInput] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  const isPending = approve.isPending || reject.isPending || correctPlate.isPending;

  const openModal = (type: Exclude<ModalType, null>) => {
    setNoteInput('');
    setReasonInput('');
    setPlateInput(type === 'plate' ? (vehicle?.plateNumber ?? '') : '');
    correctPlate.reset();
    setModal(type);
  };

  const handleConfirm = async () => {
    if (!modal || !vehicle) return;
    if (modal === 'approve') {
      await approve.mutateAsync({ id: vehicle.id, note: noteInput || undefined });
    } else if (modal === 'plate') {
      if (plateInput.trim().length < 2 || !reasonInput.trim()) return;
      try {
        await correctPlate.mutateAsync({ id: vehicle.id, plateNumber: plateInput.trim(), reason: reasonInput.trim() });
      } catch {
        return; // shown in the modal
      }
    } else {
      if (!reasonInput.trim()) return;
      await reject.mutateAsync({ id: vehicle.id, reason: reasonInput });
    }
    setModal(null);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="h-4 bg-slate-100 rounded w-24" />
        <div className="h-64 bg-white rounded-xl border border-slate-200" />
        <div className="h-40 bg-white rounded-xl border border-slate-200" />
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 font-medium">Vehicle not found</p>
        <Link href="/admin/vehicles" className="text-sm text-primary hover:underline mt-2 inline-block">
          Back to vehicles
        </Link>
      </div>
    );
  }

  const provider = vehicle.providerProfile;
  const owner = provider.user;
  const showroom = vehicle.showroom;
  const images = vehicle.images;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/admin/vehicles" className="hover:text-slate-600">Vehicles</Link>
        <span>/</span>
        <span className="truncate text-slate-700">{vehicle.title}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{vehicle.title}</h1>
              <StatusBadge status={vehicle.status} />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {vehicle.year} · {vehicle.make} {vehicle.model} · {vehicle.transmission} · {vehicle.fuelType}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Plate: <span className="font-medium text-slate-700">{vehicle.plateNumber || '—'}</span>{' '}
              <button
                onClick={() => openModal('plate')}
                className="ml-1 text-xs font-semibold text-primary hover:underline"
              >
                Correct plate
              </button>
            </p>
            {vehicle.rejectionReason && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3 inline-block">
                Rejection reason: {vehicle.rejectionReason}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {vehicle.status === 'PENDING_REVIEW' ? (
              <>
                <button
                  onClick={() => openModal('approve')}
                  className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => openModal('reject')}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Reject
                </button>
              </>
            ) : vehicle.status === 'DRAFT' || vehicle.status === 'REJECTED' ? (
              <button
                onClick={() => openModal('approve')}
                className="rounded-lg border border-green-200 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
              >
                Approve
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Price/day" value={`${getCurrencyCode(vehicle.showroom?.country)} ${Number(vehicle.pricePerDay).toLocaleString()}`} />
        <StatCard label="Views" value={vehicle.viewCount.toLocaleString()} />
        <StatCard label="Inquiries" value={vehicle.inquiryCount.toLocaleString()} />
        <StatCard label="Booking requests" value={vehicle._count.bookingRequests.toLocaleString()} />
      </div>

      {/* Images */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Photos</h2>
        {images.length === 0 ? (
          <p className="text-sm text-slate-400">No photos uploaded</p>
        ) : (
          <div className="space-y-3">
            <div className="aspect-video w-full max-w-2xl overflow-hidden rounded-lg bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[activeImage]?.url}
                alt={images[activeImage]?.altText ?? vehicle.title}
                className="h-full w-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      'h-16 w-20 overflow-hidden rounded-lg border-2',
                      i === activeImage ? 'border-primary' : 'border-transparent',
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.altText ?? ''} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vehicle details */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Vehicle details</h2>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <DetailRow label="Seating capacity" value={`${vehicle.seatingCapacity} seats`} />
          <DetailRow label="Engine" value={vehicle.engineType} />
          <DetailRow label="Price/6hrs" value={vehicle.pricePer6Hours ? `${getCurrencyCode(vehicle.showroom?.country)} ${Number(vehicle.pricePer6Hours).toLocaleString()}` : null} />
          <DetailRow label="Price/12hrs" value={vehicle.pricePer12Hours ? `${getCurrencyCode(vehicle.showroom?.country)} ${Number(vehicle.pricePer12Hours).toLocaleString()}` : null} />
          <DetailRow label="Price/week" value={vehicle.pricePerWeek ? `${getCurrencyCode(vehicle.showroom?.country)} ${Number(vehicle.pricePerWeek).toLocaleString()}` : null} />
          <DetailRow label="Price/month" value={vehicle.pricePerMonth ? `${getCurrencyCode(vehicle.showroom?.country)} ${Number(vehicle.pricePerMonth).toLocaleString()}` : null} />
          <DetailRow label="Location" value={vehicle.locationText} />
          <DetailRow label="Availability notes" value={vehicle.availabilityNotes} />
          <DetailRow label="Pricing notes" value={vehicle.pricingNotes} />
          <DetailRow label="Special conditions" value={vehicle.specialConditions} />
          <DetailRow label="Added" value={new Date(vehicle.createdAt).toLocaleDateString('en-AE', { dateStyle: 'medium' })} />
        </div>

        {vehicle.features.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Features</h3>
            <div className="flex flex-wrap gap-2">
              {vehicle.features.map((f) => (
                <span key={f.id} className="text-xs bg-slate-100 text-slate-700 rounded-full px-2.5 py-1">
                  {f.name}{f.value ? ` — ${f.value}` : ''}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Owner + garage */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Owner (provider) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Owner</h2>
            <StatusBadge status={provider.verificationStatus} size="sm" />
          </div>
          <p className="font-semibold text-slate-900">{provider.businessName}</p>
          <div className="mt-2 space-y-1 text-sm text-slate-500">
            <p>{owner.name}</p>
            <p>{owner.email}</p>
            {owner.phone && <p>{owner.phone}</p>}
          </div>
          <Link
            href={`/admin/users/${owner.id}`}
            className="inline-block mt-3 text-sm font-semibold text-primary hover:underline"
          >
            View owner profile →
          </Link>
        </div>

        {/* Garage (showroom) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Garage</h2>
          {showroom ? (
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-slate-900">{showroom.name}</p>
              <p className="text-slate-500">
                {showroom.city}{showroom.area ? `, ${showroom.area}` : ''}
              </p>
              <p className="text-slate-500">{showroom.contactNumber}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No garage assigned</p>
          )}
        </div>
      </div>

      {/* Approve / Reject / Correct plate modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setModal(null)}
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setModal(null)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              ×
            </button>
            <h2 className="mb-1 pr-8 text-lg font-semibold text-slate-900">
              {modal === 'approve' ? 'Approve listing' : modal === 'plate' ? 'Correct plate number' : 'Reject listing'}
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              <strong>{vehicle.title}</strong> by {provider.businessName}
            </p>

            {modal === 'plate' ? (
              <div className="mb-4 space-y-3">
                <p className="text-xs text-slate-500">
                  The business can&rsquo;t change a live car&rsquo;s plate. The car&rsquo;s reviews and history follow the
                  plate, so check the registration papers first.
                </p>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Plate number <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={plateInput}
                    onChange={(e) => setPlateInput(e.target.value.toUpperCase())}
                    maxLength={20}
                    placeholder="e.g. LEA-1234"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Reason <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    maxLength={500}
                    placeholder="e.g. Typo — checked against the registration card"
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                {correctPlate.isError && (
                  <p className="text-xs text-red-600">
                    {getApiErrorMessage(correctPlate.error, 'Could not correct the plate number')}
                  </p>
                )}
              </div>
            ) : modal === 'approve' ? (
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Note <span className="font-normal normal-case text-slate-400">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Any notes for the provider…"
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            ) : (
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="Describe what needs to be fixed…"
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {!reasonInput.trim() && (
                  <p className="mt-1 text-xs text-red-500">A reason is required</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModal(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={
                  isPending ||
                  (modal === 'reject' && !reasonInput.trim()) ||
                  (modal === 'plate' && (plateInput.trim().length < 2 || !reasonInput.trim()))
                }
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60',
                  modal === 'reject'
                    ? 'bg-red-500 hover:bg-red-600'
                    : modal === 'plate'
                      ? 'bg-primary hover:opacity-90'
                      : 'bg-green-500 hover:bg-green-600',
                )}
              >
                {isPending ? 'Saving…' : modal === 'approve' ? 'Approve' : modal === 'plate' ? 'Save plate' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-slate-700">{value || '—'}</p>
    </div>
  );
}
