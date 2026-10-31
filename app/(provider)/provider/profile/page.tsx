'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronRight, FileText } from 'lucide-react';
import { toast } from 'sonner';

import {
  useProviderProfile,
  useUpdateProvider,
  providerQueryKeys,
} from '../../../../hooks/useProviderProfile';
import { providersApi, type ProviderProfileWithMeta } from '../../../../lib/api/providers.api';
import { invalidateWorkspaces, useWorkspace } from '../../../../hooks/useWorkspace';
import { getApiErrorMessage } from '../../../../hooks/useAccountDeletion';
import { BusinessRole } from '../../../../types/enums';
import {
  businessDetailsSchema,
  cnicPayload,
  type BusinessDetailsFormValues,
} from '../../../../lib/validations/business.schema';
import { statusExplanation } from '../../../../lib/workspace/businessStatus';
import { Avatar, Button, Card, ErrorState, UnderlineTabs } from '../../../../components/ui';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { PersonalInformationSection } from '../../../../components/account/PersonalInformationSection';
import { BusinessDetailsFields } from '../../../../components/business/profile/BusinessDetailsFields';
import { BusinessImageField } from '../../../../components/business/profile/BusinessImageField';
import {
  CompletenessCard,
  type ProfileSection,
} from '../../../../components/business/profile/CompletenessCard';
import { SubmitForReviewCard } from '../../../../components/business/profile/SubmitForReviewCard';
import { ShowroomSection } from '../../../../components/business/profile/ShowroomSection';

// The business profile — kerayego-partner app/(business)/business (the hub's
// completeness + submit cards), business/profile (details and branding),
// business/setup (create) and business/showrooms. Business admin only
// (can('editBusinessProfile'), the layout guards it); also the create-a-business
// flow for someone who may create one. Documents have their own page
// (/provider/documents).

type TabKey = 'details' | 'showroom' | 'account';

export default function ProviderProfilePage() {
  const { data: profile, isLoading, isError, error, refetch } = useProviderProfile();
  const [tab, setTab] = useState<TabKey>('details');

  if (isLoading) {
    return (
      <div className="max-w-3xl animate-pulse space-y-4">
        <div className="h-8 w-48 rounded-control bg-surface-hover" />
        <div className="h-64 rounded-card bg-surface-hover" />
      </div>
    );
  }

  if (isError && profile === undefined) {
    return (
      <ErrorState
        title="We couldn't load your business"
        description={getApiErrorMessage(error, 'Something went wrong while fetching your business.')}
        onRetry={() => void refetch()}
      />
    );
  }

  if (!profile) return <CreateBusiness />;

  return <BusinessProfile business={profile} tab={tab} onTab={setTab} />;
}

// ─── Create (kerayego-partner business/setup) ───────────────────────────────

function CreateBusiness() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { select: selectWorkspace } = useWorkspace();
  const [tab, setTab] = useState<'business' | 'account'>('business');
  const [isCreating, setIsCreating] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<BusinessDetailsFormValues>({
    resolver: zodResolver(businessDetailsSchema),
    defaultValues: { businessName: '', businessDescription: '', ownerCnicNumber: '' },
  });

  const handleCreate = async (values: BusinessDetailsFormValues) => {
    setIsCreating(true);
    setSubmitError(null);
    try {
      const description = values.businessDescription.trim();
      await providersApi.create({
        businessName: values.businessName.trim(),
        ...(description ? { businessDescription: description } : {}),
        ownerCnicNumber: cnicPayload(values.ownerCnicNumber),
      });
      toast.success('Business registered. Next, add your showroom and documents.');
      // The new business is a Business admin dashboard: work in it from now on
      // (selected before the refetch, so this page stays put as the business
      // sidebar appears), then reload the dashboards and the profile.
      selectWorkspace(BusinessRole.BUSINESS_ADMIN);
      await Promise.all([
        invalidateWorkspaces(queryClient),
        queryClient.invalidateQueries({ queryKey: providerQueryKeys.myProfile }),
      ]);
      router.refresh();
    } catch (err: unknown) {
      setSubmitError(getApiErrorMessage(err, 'Failed to create business'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Set up your business</h1>
        <p className="mt-1 text-sm text-text-muted">
          Let&apos;s create your rental business profile. You can upload your logo and banner right after
          registration.
        </p>
      </div>

      <UnderlineTabs
        options={[
          { value: 'business', label: 'Business' },
          { value: 'account', label: 'Personal information' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as 'business' | 'account')}
      />

      {tab === 'business' ? (
        <Card>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-5" noValidate>
            <BusinessDetailsFields form={form} />
            {submitError ? <p className="text-sm text-red-700">{submitError}</p> : null}
            <Button type="submit" loading={isCreating} className="w-full">
              Create business
            </Button>
          </form>
        </Card>
      ) : (
        <PersonalInformationSection />
      )}
    </div>
  );
}

// ─── Edit (kerayego-partner business hub + profile + showrooms) ─────────────

function BusinessProfile({
  business,
  tab,
  onTab,
}: {
  business: ProviderProfileWithMeta;
  tab: TabKey;
  onTab: (tab: TabKey) => void;
}) {
  const router = useRouter();
  const { can } = useWorkspace();
  const documentsCount = business.documents?.length ?? 0;

  const openSection = (section: ProfileSection) => {
    if (section === 'documents') {
      router.push('/provider/documents');
      return;
    }
    onTab(section);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tabs: { value: TabKey; label: string }[] = [
    { value: 'details', label: 'Business details' },
    ...(can('manageShowrooms')
      ? [{ value: 'showroom' as const, label: `Showroom${business.showrooms.length ? ` (${business.showrooms.length})` : ''}` }]
      : []),
    { value: 'account', label: 'Personal information' },
  ];

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header (kerayego-partner BusinessHeader) */}
      <div className="flex flex-wrap items-start gap-4">
        {business.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logoUrl}
            alt={`${business.businessName} logo`}
            className="h-14 w-14 flex-shrink-0 rounded-control border border-border-subtle object-cover"
          />
        ) : (
          <Avatar name={business.businessName} shape="square" size="lg" tone="brand" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink">{business.businessName}</h1>
            <StatusBadge status={business.verificationStatus} />
          </div>
          <p className="mt-1 text-sm text-text-muted">{statusExplanation(business, 'admin')}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CompletenessCard business={business} onFix={openSection} />
        <div className="space-y-4">
          {can('submitBusinessForReview') ? <SubmitForReviewCard business={business} /> : null}
          {can('manageDocuments') ? (
            <Link href="/provider/documents" className="block">
              <Card hover padding="sm" className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-text-faint" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">Business documents</p>
                  <p className="text-xs text-text-muted">Licenses and registration for verification</p>
                </div>
                <span className="text-sm text-text-muted">{documentsCount > 0 ? documentsCount : 'None'}</span>
                <ChevronRight className="h-4 w-4 text-text-faint" />
              </Card>
            </Link>
          ) : null}
        </div>
      </div>

      <UnderlineTabs options={tabs} value={tab} onChange={(v) => onTab(v as TabKey)} />

      {tab === 'details' ? (
        <div className="space-y-5">
          <Card className="space-y-6">
            <h2 className="text-base font-semibold text-ink">Branding</h2>
            <BusinessImageField kind="logo" business={business} />
            <BusinessImageField kind="banner" business={business} />
          </Card>
          <BusinessDetailsForm key={business.id} business={business} />
        </div>
      ) : null}

      {tab === 'showroom' && can('manageShowrooms') ? <ShowroomSection showrooms={business.showrooms} /> : null}

      {tab === 'account' ? <PersonalInformationSection /> : null}
    </div>
  );
}

function BusinessDetailsForm({ business }: { business: ProviderProfileWithMeta }) {
  const update = useUpdateProvider();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<BusinessDetailsFormValues>({
    resolver: zodResolver(businessDetailsSchema),
    defaultValues: {
      businessName: business.businessName,
      businessDescription: business.businessDescription ?? '',
      ownerCnicNumber: business.ownerCnicNumber ?? '',
    },
  });

  const onSubmit = (values: BusinessDetailsFormValues) => {
    setSubmitError(null);
    // The description is always sent ('' clears it); so is the CNIC (the form requires it).
    const payload = {
      businessName: values.businessName.trim(),
      businessDescription: values.businessDescription.trim(),
      ownerCnicNumber: cnicPayload(values.ownerCnicNumber),
    };
    update.mutate(payload, {
      onSuccess: () => {
        toast.success('Saved. Your business details have been updated.');
        form.reset(payload);
      },
      // e.g. a refused CNIC (403 IDENTITY_BLOCKED).
      onError: (err) => setSubmitError(getApiErrorMessage(err, 'Failed to update the business')),
    });
  };

  return (
    <Card>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <h2 className="text-base font-semibold text-ink">Business information</h2>
        <BusinessDetailsFields form={form} />
        {submitError ? <p className="text-sm text-red-700">{submitError}</p> : null}
        <Button type="submit" loading={update.isPending} disabled={!form.formState.isDirty}>
          Save changes
        </Button>
      </form>
    </Card>
  );
}
