import { DocumentStatus, DriverDocumentType, DriverVerificationStatus } from '../../types/enums';
import type {
  DriverDocument,
  DriverProfileFields,
  DriverReadiness,
  UpdateDriverProfilePayload,
} from '../../types/driver.types';

// The driver's verification (A12, A58–A60) — a port of kerayego-partner's
// features/driver/driverVerification.ts plus the document-link and upload
// rules the web needs. Contract (kerayego-backend driver-profile.controller.ts):
// - GET /driver/profile returns `documents`, `steps`, `readiness`, `canSubmit`.
// - POST /driver/profile/submit → PENDING_REVIEW (needs rentalReady; 400
//   lists what's missing, 409 when the CNIC belongs to another driver).
// - PATCH /driver/profile while PENDING_REVIEW or VERIFIED: changing any of
//   REVERIFICATION_FIELDS sets the profile back to UNVERIFIED; so does a new
//   document of any type but the police certificate.

const STATUS_EXPLANATIONS: Record<DriverVerificationStatus, string> = {
  [DriverVerificationStatus.UNVERIFIED]:
    'KerayeGo hasn’t checked you yet. Finish the steps below until you are rental-ready, then submit them. Businesses can only give jobs to verified drivers.',
  [DriverVerificationStatus.PENDING_REVIEW]:
    'KerayeGo is checking your details and documents. Changing your name, date of birth, CNIC, licence details or documents now means submitting again.',
  [DriverVerificationStatus.VERIFIED]:
    'KerayeGo has checked your identity and licence. Businesses see that you are verified and when your licence expires — never your CNIC or documents.',
  [DriverVerificationStatus.REJECTED]: 'KerayeGo couldn’t verify you. Fix what’s wrong, then submit again.',
};

/** The Partner app's verification badge labels. */
export const DRIVER_VERIFICATION_LABELS: Record<DriverVerificationStatus, string> = {
  [DriverVerificationStatus.UNVERIFIED]: 'Unverified',
  [DriverVerificationStatus.PENDING_REVIEW]: 'Under Review',
  [DriverVerificationStatus.VERIFIED]: 'Verified',
  [DriverVerificationStatus.REJECTED]: 'Rejected',
};

export function verificationExplanation(status: DriverVerificationStatus): string {
  return STATUS_EXPLANATIONS[status] ?? STATUS_EXPLANATIONS[DriverVerificationStatus.UNVERIFIED];
}

/** Whether "Submit for verification" is shown at all (it's enabled only when canSubmit). */
export function showsSubmitButton(status: DriverVerificationStatus): boolean {
  return status === DriverVerificationStatus.UNVERIFIED || status === DriverVerificationStatus.REJECTED;
}

// ─── Documents ──────────────────────────────────────────────────────────────

export interface DriverDocumentSlot {
  type: DriverDocumentType;
  label: string;
  hint: string;
  /** 'camera' = taken now with the camera (the selfie, A59); 'file' = a photo or scan chosen. */
  capture: 'camera' | 'file';
  /** Not needed to be rental-ready (only the police certificate, A60). */
  optional?: boolean;
}

/** The documents a driver uploads in the Identity step, in display order. */
export const DRIVER_DOCUMENT_SLOTS: readonly DriverDocumentSlot[] = [
  { type: DriverDocumentType.ID_DOCUMENT_FRONT, label: 'CNIC front', hint: 'The side with your photo.', capture: 'file' },
  { type: DriverDocumentType.ID_DOCUMENT_BACK, label: 'CNIC back', hint: 'The side with your address.', capture: 'file' },
  {
    type: DriverDocumentType.DRIVING_LICENSE,
    label: 'Licence front',
    hint: 'The side with your licence number and expiry date.',
    capture: 'file',
  },
  {
    type: DriverDocumentType.DRIVING_LICENSE_BACK,
    label: 'Licence back',
    hint: 'The other side of your licence.',
    capture: 'file',
  },
  {
    type: DriverDocumentType.SELFIE,
    label: 'Live selfie',
    hint: 'Taken now with the camera. KerayeGo compares it with your CNIC photo.',
    capture: 'camera',
  },
  {
    type: DriverDocumentType.POLICE_CERTIFICATE,
    label: 'Police character certificate',
    hint: 'Needed for household services. Customers see it as a trust badge.',
    capture: 'file',
    optional: true,
  },
];

/** Whether a new file of this type sends a PENDING_REVIEW or VERIFIED driver back to UNVERIFIED. */
export function uploadNeedsReverification(
  status: DriverVerificationStatus | undefined,
  type: DriverDocumentType,
): boolean {
  return (
    type !== DriverDocumentType.POLICE_CERTIFICATE &&
    (status === DriverVerificationStatus.PENDING_REVIEW || status === DriverVerificationStatus.VERIFIED)
  );
}

/** The driver's document of this type — the newest, should the list ever hold more than one. */
export function driverDocumentFor(
  documents: readonly DriverDocument[] | null | undefined,
  type: DriverDocumentType,
): DriverDocument | undefined {
  let newest: DriverDocument | undefined;
  for (const document of documents ?? []) {
    if (document.documentType !== type) continue;
    if (!newest || Date.parse(document.createdAt) > Date.parse(newest.createdAt)) newest = document;
  }
  return newest;
}

/** The Partner app's document status labels. */
export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  [DocumentStatus.PENDING]: 'Pending',
  [DocumentStatus.APPROVED]: 'Approved',
  [DocumentStatus.REJECTED]: 'Rejected',
};

/** The line under a document KerayeGo didn't accept, or null for any other status. */
export function documentRejectionNote(document: Pick<DriverDocument, 'status' | 'rejectionReason'>): string | null {
  if (document.status !== DocumentStatus.REJECTED) return null;
  const reason = document.rejectionReason?.trim();
  return reason ? `Not accepted: ${reason}` : 'Not accepted. Replace it with a clearer copy.';
}

// The backend's upload rules (kerayego-backend media.service.ts): documents
// JPEG/PNG/PDF ≤ 10 MB; the selfie an image (JPEG/PNG — documents take no
// WebP); the profile photo JPEG/PNG/WebP ≤ 5 MB. Checked here first so a
// wrong file says why instead of failing with a 400.
const MB = 1024 * 1024;
export const DOCUMENT_ACCEPT = 'image/jpeg,image/png,application/pdf';
export const SELFIE_ACCEPT = 'image/jpeg,image/png';
export const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';

/** Why this file can't be uploaded as this document, or null. */
export function documentFileProblem(file: File, type: DriverDocumentType): string | null {
  const isSelfie = type === DriverDocumentType.SELFIE;
  const allowed = (isSelfie ? SELFIE_ACCEPT : DOCUMENT_ACCEPT).split(',');
  if (!allowed.includes(file.type.toLowerCase())) {
    return isSelfie ? 'The selfie must be a JPEG or PNG photo.' : 'Choose a JPEG, PNG or PDF file.';
  }
  if (file.size > 10 * MB) return 'This file is larger than 10 MB. Choose a smaller one.';
  return null;
}

/** Why this file can't be the profile photo, or null. */
export function photoFileProblem(file: File): string | null {
  if (!PHOTO_ACCEPT.split(',').includes(file.type.toLowerCase())) return 'Choose a JPEG, PNG or WebP photo.';
  if (file.size > 5 * MB) return 'This photo is larger than 5 MB. Choose a smaller one.';
  return null;
}

// A signed document link lasts 10 minutes (kerayego-backend
// DOCUMENT_LINK_TTL_SECONDS); one is treated as expired a minute early.
const DOCUMENT_LINK_USABLE_MS = 9 * 60 * 1000;

/** Whether a signed link handed out at `issuedAt` (epoch ms) can still be opened at `now`. */
export function isDocumentLinkFresh(issuedAt: number, now: number): boolean {
  if (!Number.isFinite(issuedAt) || issuedAt <= 0) return false;
  const age = now - issuedAt;
  return age >= 0 && age < DOCUMENT_LINK_USABLE_MS;
}

// ─── Re-verification ────────────────────────────────────────────────────────

/** The fields whose change sends a PENDING_REVIEW or VERIFIED driver back to UNVERIFIED, with their labels. */
export const REVERIFICATION_FIELDS = {
  fullName: 'Full name',
  dateOfBirth: 'Date of birth',
  cnicNumber: 'CNIC number',
  cnicExpiry: 'CNIC expiry date',
  licenseNumber: 'Licence number',
  licenseCategory: 'Licence category',
  licenseIssueDate: 'Licence issue date',
  licenseExpiry: 'Licence expiry date',
  licenseIssuingAuthority: 'Licence issuing authority',
} as const satisfies Partial<Record<keyof UpdateDriverProfilePayload, string>>;

type ReverificationField = keyof typeof REVERIFICATION_FIELDS;

const DATE_FIELDS: ReadonlySet<ReverificationField> = new Set<ReverificationField>([
  'dateOfBirth',
  'cnicExpiry',
  'licenseIssueDate',
  'licenseExpiry',
]);

function comparable(field: ReverificationField, value: string | null | undefined): string {
  const text = (value ?? '').trim();
  return DATE_FIELDS.has(field) ? text.slice(0, 10) : text;
}

/** The labels of the re-verification fields this save would change. */
export function changedReverificationFields(
  before: Pick<DriverProfileFields, ReverificationField> | null,
  after: Pick<UpdateDriverProfilePayload, ReverificationField>,
): string[] {
  if (!before) return [];
  return (Object.keys(REVERIFICATION_FIELDS) as ReverificationField[])
    .filter((field) => after[field] !== undefined && comparable(field, before[field]) !== comparable(field, after[field]))
    .map((field) => REVERIFICATION_FIELDS[field]);
}

export function savingNeedsReverification(
  status: DriverVerificationStatus | undefined,
  changedFields: readonly string[],
): boolean {
  return (
    changedFields.length > 0 &&
    (status === DriverVerificationStatus.PENDING_REVIEW || status === DriverVerificationStatus.VERIFIED)
  );
}

function whatHappensNow(status: DriverVerificationStatus): string {
  return status === DriverVerificationStatus.VERIFIED
    ? 'You will no longer show as verified, and businesses can’t give you jobs until KerayeGo checks you again.'
    : 'KerayeGo will stop checking your current submission.';
}

/** The text of the "This needs checking again" warning before such a save. */
export function reverificationWarning(status: DriverVerificationStatus, changedFields: readonly string[]): string {
  const what = changedFields.join(', ').toLowerCase();
  return `You changed your ${what}. ${whatHappensNow(status)} You’ll need to submit for verification again.`;
}

/** The warning before uploading a new document (not the police certificate) while under review or verified. */
export function documentReverificationWarning(status: DriverVerificationStatus, label: string): string {
  return `A new ${label.toLowerCase()} needs checking again. ${whatHappensNow(status)} You’ll need to submit for verification again.`;
}

// ─── Readiness (A58) ────────────────────────────────────────────────────────

export interface ReadinessLevelRow {
  key: 'rentalReady' | 'hireReady' | 'payoutReady';
  title: string;
  description: string;
  complete: boolean;
  missing: string[];
}

const READINESS_LEVELS: readonly Omit<ReadinessLevelRow, 'complete' | 'missing'>[] = [
  {
    key: 'rentalReady',
    title: 'Rental-ready',
    description: 'Needed to submit for verification. Once verified, rental businesses can give you jobs.',
  },
  { key: 'hireReady', title: 'Hire-ready', description: 'Needed for customers to hire you as their driver (coming soon).' },
  { key: 'payoutReady', title: 'Payout-ready', description: 'Needed only before KerayeGo starts paying drivers.' },
];

export function readinessRows(readiness: DriverReadiness | null | undefined): ReadinessLevelRow[] {
  return READINESS_LEVELS.map((level) => ({
    ...level,
    complete: readiness?.[level.key]?.complete === true,
    missing: readiness?.[level.key]?.missing ?? [],
  }));
}

/** "Complete", "1 missing", "4 missing". */
export function missingCountLabel(row: { complete: boolean; missing: readonly string[] }): string {
  if (row.complete) return 'Complete';
  return row.missing.length > 0 ? `${row.missing.length} missing` : 'Not complete';
}
