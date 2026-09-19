'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  useProviderProfile,
  useUpdateProvider,
  useSubmitForReview,
  useCreateShowroom,
  useUpdateShowroom,
  useDeleteShowroom,
  providerQueryKeys,
} from '../../../../hooks/useProviderProfile';
import { providersApi } from '../../../../lib/api/providers.api';
import {
  createProviderSchema,
  updateProviderSchema,
  showroomSchema,
  type CreateProviderFormValues,
  type UpdateProviderFormValues,
  type ShowroomFormValues,
} from '../../../../lib/validations/provider.schema';
import { ImageUpload } from '../../../../components/uploads/ImageUpload';
import { DocumentUpload } from '../../../../components/uploads/DocumentUpload';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { PersonalInformationSection } from '../../../../components/account/PersonalInformationSection';
import { MapLocationPicker } from '../../../../components/maps/MapLocationPicker';

type TabKey = 'profile' | 'logo' | 'showroom' | 'documents' | 'submit' | 'account';

const TABS: { key: TabKey; label: string; step: number }[] = [
  { key: 'profile', label: '1. Business Info', step: 1 },
  { key: 'logo', label: '2. Upload Logo', step: 2 },
  { key: 'showroom', label: '3. Showroom', step: 3 },
  { key: 'documents', label: '4. Documents', step: 4 },
  { key: 'submit', label: '5. Submit', step: 5 },
  { key: 'account', label: 'Personal Information', step: 0 },
];

export default function ProviderProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [isCreating, setIsCreating] = useState(false);

  const { data: profile, isLoading } = useProviderProfile();
  const updateProvider = useUpdateProvider();
  const submitForReview = useSubmitForReview();
  const createShowroom = useCreateShowroom();
  const updateShowroom = useUpdateShowroom();
  const deleteShowroom = useDeleteShowroom();
  const [editingShowroom, setEditingShowroom] = useState(false);

  // ── Profile form ────────────────────────────────────────────────────────

  const profileForm = useForm<UpdateProviderFormValues>({
    resolver: zodResolver(profile ? updateProviderSchema : createProviderSchema),
    values: profile
      ? {
          businessName: profile.businessName,
          businessDescription: profile.businessDescription ?? '',
        }
      : undefined,
  });

  const createForm = useForm<CreateProviderFormValues>({
    resolver: zodResolver(createProviderSchema),
  });

  // ── Showroom form ────────────────────────────────────────────────────────

  const showroomForm = useForm<ShowroomFormValues>({
    resolver: zodResolver(showroomSchema),
  });

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleCreateProfile = async (data: CreateProviderFormValues) => {
    setIsCreating(true);
    try {
      await providersApi.create(data);
      toast.success('Business profile created!');
      router.refresh();
      setActiveTab('logo');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to create profile';
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateProfile = async (data: UpdateProviderFormValues) => {
    await updateProvider.mutateAsync(data);
    setActiveTab('logo');
  };

  const handleLogoUpload = async (url: string) => {
    if (!url) return;
    await updateProvider.mutateAsync({ logoUrl: url });
  };

  const handleAddShowroom = async (data: ShowroomFormValues) => {
    await createShowroom.mutateAsync(data);
    showroomForm.reset();
    setActiveTab('documents');
  };

  const handleUpdateShowroom = async (data: ShowroomFormValues) => {
    const showroom = profile?.showrooms?.[0];
    if (!showroom) return;
    await updateShowroom.mutateAsync({ showroomId: showroom.id, data });
    setEditingShowroom(false);
  };

  const handleDocumentUploaded = () => {
    queryClient.invalidateQueries({ queryKey: providerQueryKeys.myProfile });
    toast.success('Document uploaded');
  };

  const handleSubmitForReview = async () => {
    await submitForReview.mutateAsync();
  };

  // ── Loading state ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="h-64 rounded-xl bg-slate-100" />
      </div>
    );
  }

  const completeness = profile?.completenessScore;
  // A showroom is non-negotiable — score alone isn't enough, since a high
  // score can still be reached without one.
  const canSubmit =
    (completeness?.score ?? 0) >= 60 && (profile?.showrooms?.length ?? 0) > 0;
  const isAlreadySubmitted = ['PENDING_REVIEW', 'APPROVED'].includes(
    profile?.verificationStatus ?? '',
  );

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Provider Profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            Complete your profile to start listing vehicles.
          </p>
        </div>
        {profile && <StatusBadge status={profile.verificationStatus} />}
      </div>

      {/* Rejection notice */}
      {profile?.verificationStatus === 'REJECTED' && profile.rejectionReason && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="mb-1 text-sm font-semibold text-red-800">Profile rejected</p>
          <p className="text-sm text-red-700">{profile.rejectionReason}</p>
          <p className="mt-2 text-xs text-red-500">
            Please update your details and resubmit for review.
          </p>
        </div>
      )}

      {/* Progress bar */}
      {profile && completeness && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">Profile completeness</p>
            <span className="text-sm font-bold text-slate-900">{completeness.score}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${completeness.score}%` }}
            />
          </div>
          {completeness.missing.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Still needed: {completeness.missing.join(' · ')}
            </p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            disabled={!profile && tab.key !== 'profile' && tab.key !== 'account'}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Profile ─────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
          {!profile ? (
            // First-time creation form
            <form onSubmit={createForm.handleSubmit(handleCreateProfile)} className="space-y-5">
              <h2 className="font-semibold text-slate-900">Create your business profile</h2>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Business name <span className="text-red-500">*</span>
                </label>
                <input
                  {...createForm.register('businessName')}
                  placeholder="Al Rashid Auto Rentals"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {createForm.formState.errors.businessName && (
                  <p className="mt-1 text-xs text-destructive">
                    {createForm.formState.errors.businessName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  {...createForm.register('businessDescription')}
                  placeholder="Tell customers about your fleet and services..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {isCreating ? 'Creating...' : 'Create profile & continue'}
              </button>
            </form>
          ) : (
            // Edit existing profile
            <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-5">
              <h2 className="font-semibold text-slate-900">Business information</h2>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Business name <span className="text-red-500">*</span>
                </label>
                <input
                  {...profileForm.register('businessName')}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {profileForm.formState.errors.businessName && (
                  <p className="mt-1 text-xs text-destructive">
                    {profileForm.formState.errors.businessName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  {...profileForm.register('businessDescription')}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={updateProvider.isPending}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {updateProvider.isPending ? 'Saving...' : 'Save & continue'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── Tab: Logo ────────────────────────────────────────────────────── */}
      {activeTab === 'logo' && profile && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-1 font-semibold text-slate-900">Upload your logo</h2>
          <p className="mb-5 text-sm text-slate-500">
            Add a logo so customers recognize your business. You can always change it later from
            this tab.
          </p>

          <div className="max-w-xs">
            <ImageUpload
              context="provider_logo"
              currentUrl={profile.logoUrl}
              onUploaded={(url) => handleLogoUpload(url)}
              label="Logo"
              aspectRatio="square"
            />
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('showroom')}
            className="mt-5 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Continue to showroom →
          </button>
        </div>
      )}

      {/* ── Tab: Showroom ────────────────────────────────────────────────── */}
      {activeTab === 'showroom' &&
        (() => {
          const existingShowroom = profile?.showrooms?.[0];

          if (existingShowroom && !editingShowroom) {
            return (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="mb-4 flex items-start justify-between">
                    <h2 className="font-semibold text-slate-900">Your showroom</h2>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          showroomForm.reset({
                            name: existingShowroom.name,
                            address: existingShowroom.address,
                            city: existingShowroom.city,
                            area: existingShowroom.area ?? '',
                            contactNumber: existingShowroom.contactNumber,
                            whatsappNumber: existingShowroom.whatsappNumber ?? '',
                            mapLat: existingShowroom.mapLat ?? undefined,
                            mapLng: existingShowroom.mapLng ?? undefined,
                          });
                          setEditingShowroom(true);
                        }}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteShowroom.mutate(existingShowroom.id)}
                        disabled={deleteShowroom.isPending}
                        className="text-sm text-slate-400 transition hover:text-destructive"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Name
                      </dt>
                      <dd className="mt-0.5 text-slate-900">{existingShowroom.name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        City
                      </dt>
                      <dd className="mt-0.5 capitalize text-slate-900">
                        {existingShowroom.city}
                        {existingShowroom.area ? `, ${existingShowroom.area}` : ''}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Address
                      </dt>
                      <dd className="mt-0.5 text-slate-900">{existingShowroom.address}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Contact
                      </dt>
                      <dd className="mt-0.5 text-slate-900">{existingShowroom.contactNumber}</dd>
                    </div>
                    {existingShowroom.whatsappNumber && (
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          WhatsApp
                        </dt>
                        <dd className="mt-0.5 text-slate-900">{existingShowroom.whatsappNumber}</dd>
                      </div>
                    )}
                  </dl>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('documents')}
                  className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  Continue to documents →
                </button>
              </div>
            );
          }

          const isEditing = !!existingShowroom && editingShowroom;
          return (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">
                  {isEditing ? 'Edit showroom' : 'Add your showroom'}
                </h2>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setEditingShowroom(false)}
                    className="text-sm text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <form
                onSubmit={showroomForm.handleSubmit(
                  isEditing ? handleUpdateShowroom : handleAddShowroom,
                )}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Showroom name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...showroomForm.register('name')}
                      placeholder="Capital Auto — Lahore"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {showroomForm.formState.errors.name && (
                      <p className="mt-1 text-xs text-destructive">
                        {showroomForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...showroomForm.register('city')}
                      placeholder="Lahore"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {showroomForm.formState.errors.city && (
                      <p className="mt-1 text-xs text-destructive">
                        {showroomForm.formState.errors.city.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <MapLocationPicker
                    addressValue={showroomForm.watch('address') ?? ''}
                    onAddressChange={(text) =>
                      showroomForm.setValue('address', text, { shouldValidate: true, shouldDirty: true })
                    }
                    lat={showroomForm.watch('mapLat')}
                    lng={showroomForm.watch('mapLng')}
                    onLocationChange={(lat, lng) => {
                      showroomForm.setValue('mapLat', lat, { shouldDirty: true });
                      showroomForm.setValue('mapLng', lng, { shouldDirty: true });
                    }}
                    placeholder="Shop 12, Main Boulevard, Gulberg"
                    inputClassName="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {showroomForm.formState.errors.address && (
                    <p className="mt-1 text-xs text-destructive">
                      {showroomForm.formState.errors.address.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Area / neighbourhood
                  </label>
                  <input
                    {...showroomForm.register('area')}
                    placeholder="Gulberg III"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Contact number <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...showroomForm.register('contactNumber')}
                      placeholder="+92 300 1234567"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {showroomForm.formState.errors.contactNumber && (
                      <p className="mt-1 text-xs text-destructive">
                        {showroomForm.formState.errors.contactNumber.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      WhatsApp number
                    </label>
                    <input
                      {...showroomForm.register('whatsappNumber')}
                      placeholder="+92 300 1234567"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createShowroom.isPending || updateShowroom.isPending}
                  className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {createShowroom.isPending || updateShowroom.isPending
                    ? 'Saving...'
                    : isEditing
                      ? 'Save changes'
                      : 'Add showroom'}
                </button>
              </form>
            </div>
          );
        })()}

      {/* ── Tab: Documents ───────────────────────────────────────────────── */}
      {activeTab === 'documents' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-1 font-semibold text-slate-900">Verification documents</h2>
          <p className="mb-5 text-sm text-slate-500">
            Upload your business license and any supporting documents. All documents are reviewed
            privately by our admin team.
          </p>

          <DocumentUpload
            existingDocuments={profile?.documents ?? []}
            onUploaded={handleDocumentUploaded}
          />

          <button
            type="button"
            onClick={() => setActiveTab('submit')}
            className="mt-5 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Continue to submit →
          </button>
        </div>
      )}

      {/* ── Tab: Submit ──────────────────────────────────────────────────── */}
      {activeTab === 'submit' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-1 font-semibold text-slate-900">Submit for review</h2>
          <p className="mb-6 text-sm text-slate-500">
            Once submitted, our admin team will review your profile within 1–2 business days. You&apos;ll
            be notified by email when approved.
          </p>

          {/* Checklist */}
          <div className="mb-6 space-y-2.5">
            {[
              { label: 'Business name', pass: !!profile?.businessName },
              { label: 'Description', pass: !!profile?.businessDescription },
              { label: 'Logo uploaded', pass: !!profile?.logoUrl },
              { label: 'At least one showroom', pass: (profile?.showrooms ?? []).length > 0 },
              { label: 'At least one document', pass: (profile?.documents ?? []).length > 0 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5">
                <div
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                    item.pass ? 'bg-emerald-100' : 'bg-slate-100'
                  }`}
                >
                  {item.pass ? (
                    <svg
                      className="h-3 w-3 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  )}
                </div>
                <span className={`text-sm ${item.pass ? 'text-slate-800' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {isAlreadySubmitted ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
              {profile?.verificationStatus === 'APPROVED'
                ? '🎉 Your profile is approved! You can now list vehicles.'
                : "⏳ Your profile is currently under review. We'll email you when complete."}
            </div>
          ) : (
            <button
              onClick={handleSubmitForReview}
              disabled={!canSubmit || submitForReview.isPending}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitForReview.isPending
                ? 'Submitting...'
                : canSubmit
                  ? 'Submit for review'
                  : (profile?.showrooms?.length ?? 0) === 0
                    ? 'Add a showroom first'
                    : `Complete profile first (${completeness?.score ?? 0}% / 60% required)`}
            </button>
          )}
        </div>
      )}

      {/* ── Tab: Personal Information ────────────────────────────────────── */}
      {activeTab === 'account' && <PersonalInformationSection />}
    </div>
  );
}
