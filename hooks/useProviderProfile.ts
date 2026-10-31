'use client';

import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  providersApi,
  type ProviderProfileWithMeta,
  type UpdateProviderPayload,
  type CreateShowroomPayload,
  type UpdateShowroomPayload,
} from '../lib/api/providers.api';
import type { ProviderProfile } from '../types/api.types';
import { getApiErrorMessage } from './useAccountDeletion';
import { invalidateWorkspaces } from './useWorkspace';
export type { CreateShowroomPayload, UpdateShowroomPayload };

// The business itself: GET /providers/me and its edits — the web twin of
// kerayego-partner features/business/queries.ts + features/showrooms/queries.ts.
// The edit hooks don't toast; the page shows what happened (inline or toast).
// useSubmitForReview keeps its toasts (the dashboard relies on them).

export const providerQueryKeys = {
  myProfile: ['provider', 'me'] as const,
  showrooms: ['provider', 'showrooms'] as const,
};

export function useProviderProfile() {
  return useQuery({
    queryKey: providerQueryKeys.myProfile,
    queryFn: () => providersApi.getMyProfile().then((r) => r.data),
  });
}

/**
 * A PATCH /providers/me result laid over the cached business so a new name or
 * logo shows straight away, then a refetch for what the PATCH response doesn't
 * carry (completeness, documents' signed links).
 */
function applySavedBusiness(queryClient: QueryClient, saved: ProviderProfile | undefined) {
  if (saved) {
    queryClient.setQueryData<ProviderProfileWithMeta | null>(providerQueryKeys.myProfile, (cached) =>
      cached && cached.id === saved.id
        ? {
            ...cached,
            businessName: saved.businessName,
            slug: saved.slug,
            businessDescription: saved.businessDescription,
            logoUrl: saved.logoUrl,
            bannerUrl: saved.bannerUrl,
            verificationStatus: saved.verificationStatus,
            rejectionReason: saved.rejectionReason,
            ownerCnicNumber: saved.ownerCnicNumber ?? cached.ownerCnicNumber,
            updatedAt: saved.updatedAt,
          }
        : cached,
    );
  }
  void queryClient.invalidateQueries({ queryKey: providerQueryKeys.myProfile });
}

/** PATCH /providers/me — the details form, or setting/removing the logo or banner. */
export function useUpdateProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProviderPayload) => providersApi.update(data).then((r) => r.data),
    onSuccess: (saved) => {
      applySavedBusiness(queryClient, saved);
      // The business name shows in the dashboard switcher.
      void invalidateWorkspaces(queryClient);
    },
  });
}

/** POST /providers/me/submit-for-review. Refetches the business and the dashboards (their status). */
export function useSubmitForReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => providersApi.submitForReview(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: providerQueryKeys.myProfile });
      void invalidateWorkspaces(queryClient);
      toast.success('Submitted for review. KerayeGo will review your business; the result will show here.');
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, 'Submission failed')),
  });
}

/** POST /providers/me/showrooms — 409 if the business already has its one showroom. */
export function useCreateShowroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateShowroomPayload) => providersApi.createShowroom(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: providerQueryKeys.myProfile }),
  });
}

/** PATCH /providers/me/showrooms/:id — send only what changed. */
export function useUpdateShowroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ showroomId, data }: { showroomId: string; data: UpdateShowroomPayload }) =>
      providersApi.updateShowroom(showroomId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: providerQueryKeys.myProfile }),
  });
}

/** DELETE /providers/me/showrooms/:id — never refused; its cars are unlinked. */
export function useDeleteShowroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (showroomId: string) => providersApi.deleteShowroom(showroomId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: providerQueryKeys.myProfile }),
  });
}
