'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { driverApi } from '../lib/api/driver.api';
import { invalidateWorkspaces, useWorkspace } from './useWorkspace';
import { getApiErrorMessage } from './useAccountDeletion';
import { BusinessRole, type DriverAgreementType, type DriverDocumentType } from '../types/enums';
import type { DriverProfile, UpdateDriverProfilePayload } from '../types/driver.types';
import {
  changedReverificationFields,
  isDocumentLinkFresh,
  reverificationWarning,
  savingNeedsReverification,
} from '../lib/driver/verification';
import { actionError, ME_QUERY_KEY } from '../lib/driver/errors';

// The driver's own profile and onboarding — the web twin of kerayego-partner's
// features/driver/queries.ts (profile part), useSaveDriverStep.ts and
// useOpenDriverDocument.ts.

export const driverKeys = {
  all: ['driver'] as const,
  profile: () => ['driver', 'profile'] as const,
  businesses: () => ['driver', 'businesses'] as const,
  jobs: () => ['driver', 'jobs'] as const,
  returnTripTemplate: (bookingId: string) => ['driver', 'return-trip-template', bookingId] as const,
  /** Shared with hooks/useReviews.ts useMyEligibleReviews (the same GET /reviews/my/eligible). */
  eligibleReviews: ['reviews', 'my', 'eligible'] as const,
};

export function useMyDriverProfile() {
  return useQuery({
    queryKey: driverKeys.profile(),
    queryFn: driverApi.getMyProfile,
  });
}

// GET /driver/profile carries the documents (with fresh signed links), steps,
// readiness and canSubmit — so every change refetches it. Returned, so a
// mutation stays pending until the fresh profile has arrived.
function refetchDriverProfile(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: driverKeys.profile() });
}

/**
 * A failed driver action as a toast. A 403 IDENTITY_ON_HOLD shows the
 * server's hold message under the hold title and re-reads the account, so the
 * hold banner (PortalFrame) appears; anything else, IDENTITY_BLOCKED included,
 * shows the server's message.
 */
export function useDriverActionError() {
  const queryClient = useQueryClient();
  return (error: unknown, title: string) => {
    const shown = actionError(error, title);
    toast.error(shown.title, { description: shown.message });
    if (shown.onHold) void queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
  };
}

/**
 * Saves one setup step with PATCH /driver/profile. Before a save that changes
 * name, date of birth, CNIC or licence details while PENDING_REVIEW or
 * VERIFIED it asks first (`confirm` — render it in a ConfirmDialog). A first
 * save creates the profile and makes the person a driver: the Driver
 * dashboard is selected, then the workspaces refetched (in that order, so the
 * portal switches to it as soon as it is listed). `onSaved` runs after the
 * fresh profile has arrived.
 */
export function useSaveDriverStep(profile: DriverProfile | null) {
  const queryClient = useQueryClient();
  const { workspaces, select } = useWorkspace();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ message: string; run: () => void } | null>(null);

  const update = useMutation({
    mutationFn: (payload: UpdateDriverProfilePayload) => driverApi.updateMyProfile(payload),
    onSuccess: () => refetchDriverProfile(queryClient),
  });

  const run = (payload: UpdateDriverProfilePayload, onSaved: () => void) => {
    const isFirstSave = profile === null || !workspaces.some((w) => w.role === BusinessRole.DRIVER);
    update.mutate(payload, {
      onSuccess: async () => {
        // A first save adds the Driver dashboard; the verification status may change on any save.
        if (isFirstSave) select(BusinessRole.DRIVER);
        await invalidateWorkspaces(queryClient);
        onSaved();
      },
      onError: (err) => setError(getApiErrorMessage(err, 'Could not save. Please try again.')),
    });
  };

  const save = (payload: UpdateDriverProfilePayload, onSaved: () => void) => {
    setError(null);
    const status = profile?.verificationStatus;
    const changed = changedReverificationFields(profile, payload);
    if (!status || !savingNeedsReverification(status, changed)) {
      run(payload, onSaved);
      return;
    }
    setConfirm({ message: reverificationWarning(status, changed), run: () => run(payload, onSaved) });
  };

  return {
    save,
    error,
    setError,
    isSaving: update.isPending,
    /** The "This needs checking again" question waiting for an answer, or null. */
    confirm,
    confirmSave: () => {
      confirm?.run();
      setConfirm(null);
    },
    cancelConfirm: () => setConfirm(null),
  };
}

/** POST /driver/profile/submit → PENDING_REVIEW. Show a 400 (what's missing) or 409 (CNIC taken) as given. */
export function useSubmitDriverVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: driverApi.submitForVerification,
    onSuccess: (profile) => {
      queryClient.setQueryData<DriverProfile>(driverKeys.profile(), profile);
      return invalidateWorkspaces(queryClient);
    },
  });
}

/** POST /driver/profile/agreements — the whole profile comes back and replaces the cached one. */
export function useAcceptDriverAgreements() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (types: DriverAgreementType[]) => driverApi.acceptAgreements(types),
    onSuccess: (profile) => {
      queryClient.setQueryData<DriverProfile>(driverKeys.profile(), profile);
    },
  });
}

/**
 * Uploads one of the driver's documents (context=driver_document; replaces
 * the old one of that type) — a chosen file, or for the selfie a photo taken
 * with the camera there and then (A59). Refetches the profile and the
 * workspaces (a new document can send the driver back to UNVERIFIED).
 */
export function useUploadDriverDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, file }: { type: DriverDocumentType; file: File }) =>
      driverApi.upload(file, { context: 'driver_document', documentType: type }),
    onSuccess: () => Promise.all([refetchDriverProfile(queryClient), invalidateWorkspaces(queryClient)]),
  });
}

/** The driver's profile photo (context=driver_photo; the backend saves it as avatarUrl). */
export function useUploadDriverPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => driverApi.upload(file, { context: 'driver_photo' }),
    onSuccess: () => Promise.all([refetchDriverProfile(queryClient), invalidateWorkspaces(queryClient)]),
  });
}

const OPEN_FAILED = "Couldn't open the file. Please try again.";
const DOCUMENT_GONE = 'This document is no longer on your profile. Upload it again.';
const POPUP_BLOCKED = 'Your browser blocked the new tab. Allow pop-ups for KerayeGo and try again.';

/**
 * Opens one of the driver's own documents in a new tab. The file is private:
 * GET /driver/profile hands out a signed fileUrl that expires after 10
 * minutes, so a link that may have run out is never reused — the profile is
 * refetched for a new one first. The tab is opened straight away (inside the
 * click, so pop-up blockers allow it) and pointed at the link once known.
 */
export function useOpenDriverDocument() {
  const profile = useMyDriverProfile();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = (documentId: string, preferred?: { url: string; issuedAt: number }) => {
    if (openingId) return;
    setError(null);
    const tab = window.open('', '_blank');
    if (!tab) {
      setError(POPUP_BLOCKED);
      return;
    }
    tab.opener = null;
    const go = (url: string) => {
      tab.location.href = url;
    };
    const fail = (message: string) => {
      tab.close();
      setError(message);
    };

    const now = Date.now();
    if (preferred && isDocumentLinkFresh(preferred.issuedAt, now)) {
      go(preferred.url);
      return;
    }
    const cached = profile.data?.documents?.find((d) => d.id === documentId);
    if (cached && isDocumentLinkFresh(profile.dataUpdatedAt, now)) {
      go(cached.fileUrl);
      return;
    }

    setOpeningId(documentId);
    profile
      .refetch()
      .then((result) => {
        if (result.isError) {
          fail(getApiErrorMessage(result.error, OPEN_FAILED));
          return;
        }
        const document = result.data?.documents?.find((d) => d.id === documentId);
        if (!document) fail(DOCUMENT_GONE);
        else go(document.fileUrl);
      })
      .catch(() => fail(OPEN_FAILED))
      .finally(() => setOpeningId(null));
  };

  return { open, openingId, error };
}
