'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaApi, type UploadResult } from '../lib/api/media.api';
import type { UploadedDocument } from '../lib/api/providers.api';
import { getApiErrorMessage } from './useAccountDeletion';
import { providerQueryKeys, useProviderProfile } from './useProviderProfile';
import { isDocumentLinkFresh } from '../lib/documents/businessDocuments';

// The business's documents — kerayego-partner features/documents/queries.ts,
// replaceDocument.ts and useOpenDocument.ts, on the web's upload pipeline
// (mediaApi.upload, POST /media/upload?context=document&documentType=…). The
// list itself is GET /providers/me's `documents` (useProviderProfile), so every
// change refetches it; the invalidation is awaited, so a mutation stays pending
// until the refreshed list is on screen.

export const documentMutationKeys = {
  all: ['business-documents'] as const,
  upload: ['business-documents', 'upload'] as const,
  replace: ['business-documents', 'replace'] as const,
  remove: ['business-documents', 'remove'] as const,
};

/** POST /media/upload's result for a document: `previewUrl` is a 10-minute signed link to the new file. */
export type DocumentUploadResult = UploadResult & { previewUrl?: string };

export interface UploadDocumentVariables {
  file: File;
  documentType: string;
}

/** Uploads a new business document (the backend creates its row, status PENDING). */
export function useUploadBusinessDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: documentMutationKeys.upload,
    mutationFn: ({ file, documentType }: UploadDocumentVariables) =>
      mediaApi.upload(file, 'document', documentType) as Promise<DocumentUploadResult>,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: providerQueryKeys.myProfile }),
  });
}

export type ReplaceDocumentResult =
  | { status: 'replaced' }
  /** The new file is on the profile, but deleting the old one failed. */
  | { status: 'oldNotRemoved'; message: string };

/**
 * Replaces a document with a new file of the same type. The backend has no
 * replace call, so it's two: upload the new file, then DELETE /media/:publicId
 * of the old one. The old file is only deleted once the new one is safely
 * uploaded, so a failed upload changes nothing. Rejects with the upload's
 * error; a failed delete after a good upload is `oldNotRemoved`.
 */
export function useReplaceBusinessDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: documentMutationKeys.replace,
    mutationFn: async ({
      document,
      file,
    }: {
      document: UploadedDocument;
      file: File;
    }): Promise<ReplaceDocumentResult> => {
      await mediaApi.upload(file, 'document', document.documentType);
      try {
        await mediaApi.delete(document.publicId);
        return { status: 'replaced' };
      } catch (error) {
        return {
          status: 'oldNotRemoved',
          message: getApiErrorMessage(error, "The old file couldn't be removed."),
        };
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: providerQueryKeys.myProfile }),
  });
}

/**
 * Deletes a document: DELETE /media/:publicId removes the file and its row.
 * Refetches even on failure — a 403/404 usually means the list is out of date.
 */
export function useDeleteBusinessDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: documentMutationKeys.remove,
    mutationFn: (document: UploadedDocument) => mediaApi.delete(document.publicId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: providerQueryKeys.myProfile }),
  });
}

const OPEN_FAILED = "Couldn't open the file. Please try again.";
const POPUP_BLOCKED = 'Your browser blocked the new tab. Allow pop-ups for KerayeGo and try again.';
const DOCUMENT_GONE = 'This document is no longer on your business profile.';

/**
 * Opens a document's file in a new tab. Files are private and only reachable
 * by a signed link that expires 10 minutes after GET /providers/me (or the
 * upload) handed it out, so a link that may have run out is replaced first by
 * refetching. The tab is opened straight away (so the browser doesn't treat it
 * as an unrequested pop-up) and pointed at the link once it's known.
 *
 * `preferred` is a link from elsewhere (an upload's previewUrl) with when it
 * was issued, used while it is fresh.
 */
export function useOpenBusinessDocument() {
  const business = useProviderProfile();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data, dataUpdatedAt, refetch } = business;

  const open = useCallback(
    (documentId: string | undefined, preferred?: { url: string; issuedAt: number }) => {
      if (openingId) return;
      setError(null);
      const now = Date.now();
      let link: string | null = null;
      if (preferred && isDocumentLinkFresh(preferred.issuedAt, now)) link = preferred.url;
      else if (documentId && isDocumentLinkFresh(dataUpdatedAt, now)) {
        link = data?.documents.find((d) => d.id === documentId)?.fileUrl ?? null;
      }

      if (link) {
        const tab = window.open(link, '_blank', 'noopener,noreferrer');
        // With noopener, window.open returns null even when it worked — nothing to check.
        void tab;
        return;
      }

      const tab = window.open('', '_blank');
      if (!tab) {
        setError(POPUP_BLOCKED);
        return;
      }
      tab.opener = null;
      setOpeningId(documentId ?? 'preview');
      refetch()
        .then((result) => {
          if (result.isError) {
            tab.close();
            setError(getApiErrorMessage(result.error, OPEN_FAILED));
            return;
          }
          const document = result.data?.documents.find((d) => d.id === documentId);
          if (!document) {
            tab.close();
            setError(DOCUMENT_GONE);
            return;
          }
          tab.location.href = document.fileUrl;
        })
        .catch(() => {
          tab.close();
          setError(OPEN_FAILED);
        })
        .finally(() => setOpeningId(null));
    },
    [openingId, data, dataUpdatedAt, refetch],
  );

  return { open, openingId, error };
}
