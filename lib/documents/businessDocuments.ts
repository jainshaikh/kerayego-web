import { DOCUMENT_TYPES } from '../api/media.api';
import type { UploadedDocument } from '../api/providers.api';

// Pure helpers for the business documents page (/provider/documents) —
// kerayego-partner features/documents/documents.ts. Contract notes
// (kerayego-backend):
// - GET /providers/me returns `documents` newest first, each fileUrl a fresh
//   signed link valid DOCUMENT_LINK_TTL_SECONDS = 10 minutes
//   (media/document-links.ts). POST /media/upload's previewUrl too.
// - Nothing in the backend reviews a business's own documents today, so their
//   status stays PENDING; status and rejectionReason are still shown.

/** How long a signed document link is valid (10 minutes). */
export const DOCUMENT_LINK_TTL_MS = 10 * 60 * 1000;
/** A link is treated as expired a minute early, so it can't run out between the click and the load. */
export const DOCUMENT_LINK_MARGIN_MS = 60 * 1000;

/** The types a business picks from (web's list, the same the Partner app sends). */
export const BUSINESS_DOCUMENT_TYPE_OPTIONS = DOCUMENT_TYPES;
export type BusinessDocumentType = (typeof DOCUMENT_TYPES)[number]['value'];

/** kerayego-backend media.service.ts ALLOWED_DOC_TYPES / MAX_DOC_BYTES. */
export const DOCUMENT_ACCEPT = 'image/jpeg,image/png,application/pdf';
const DOCUMENT_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

/** Why the backend would refuse this file, or null. */
export function documentFileProblem(file: Pick<File, 'type' | 'size'>): string | null {
  if (!DOCUMENT_MIME_TYPES.includes(file.type)) return 'Choose a JPEG, PNG or PDF file.';
  if (file.size > DOCUMENT_MAX_BYTES) return 'That file is larger than 10 MB. Choose a smaller one.';
  return null;
}

/** Whether a signed link handed out at `issuedAt` (epoch ms) can still be opened at `now`. */
export function isDocumentLinkFresh(issuedAt: number, now: number): boolean {
  if (!Number.isFinite(issuedAt) || issuedAt <= 0) return false;
  const age = now - issuedAt;
  return age >= 0 && age < DOCUMENT_LINK_TTL_MS - DOCUMENT_LINK_MARGIN_MS;
}

// "SOME_VALUE" → "Some Value", for a value without a label yet.
function humanize(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function documentTypeLabel(type: string): string {
  return DOCUMENT_TYPES.find((t) => t.value === type)?.label ?? humanize(type);
}

export type DocumentFileKind = 'image' | 'pdf' | 'other';

/** Photo or PDF, from the storage key's extension (the backend names files {uuid}.{jpg|png|webp|pdf}). */
export function documentFileKind(publicId: string): DocumentFileKind {
  const match = /\.([a-z0-9]+)$/i.exec(publicId.split(/[?#]/)[0]);
  const ext = match?.[1].toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp') return 'image';
  return 'other';
}

export const DOCUMENT_FILE_KIND_LABELS: Record<DocumentFileKind, string> = {
  image: 'Photo',
  pdf: 'PDF',
  other: 'File',
};

/** The line under a document KerayeGo didn't accept, or null for any other status. */
export function documentRejectionNote(
  document: Pick<UploadedDocument, 'status' | 'rejectionReason'>,
): string | null {
  if (document.status !== 'REJECTED') return null;
  const reason = document.rejectionReason?.trim();
  return reason ? `Not accepted: ${reason}` : 'Not accepted. Replace it with a clearer copy.';
}

export function documentRemovalMessage(document: Pick<UploadedDocument, 'documentType'>): string {
  return `Your ${documentTypeLabel(document.documentType)} file will be deleted for good, and KerayeGo's team won't see it any more.`;
}

export function documentReplaceMessage(document: Pick<UploadedDocument, 'documentType'>): string {
  return `Choose a new file of your ${documentTypeLabel(document.documentType)}. The current file is deleted once the new one has uploaded.`;
}
