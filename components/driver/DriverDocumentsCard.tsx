'use client';

import { useRef, useState } from 'react';
import { Award, Camera, CreditCard, Eye, FileUp } from 'lucide-react';
import { Button, ConfirmDialog } from '../ui';
import { StatusBadge } from '../common/StatusBadge';
import { DriverDocumentType, type DriverVerificationStatus } from '../../types/enums';
import type { DriverDocument } from '../../types/driver.types';
import { useOpenDriverDocument, useUploadDriverDocument } from '../../hooks/useDriverProfile';
import { getApiErrorMessage } from '../../hooks/useAccountDeletion';
import { formatDate } from '../../lib/driver/fields';
import { fieldLabel } from '../../lib/driver/setupSteps';
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_STATUS_LABELS,
  documentFileProblem,
  documentRejectionNote,
  documentReverificationWarning,
  DRIVER_DOCUMENT_SLOTS,
  driverDocumentFor,
  uploadNeedsReverification,
  type DriverDocumentSlot,
} from '../../lib/driver/verification';
import { SelfieCaptureModal } from './SelfieCaptureModal';

interface DriverDocumentsCardProps {
  documents: readonly DriverDocument[] | undefined;
  verificationStatus: DriverVerificationStatus | undefined;
  /** A household service is chosen (A60): the police certificate is needed, not just recommended. */
  policeCertificateNeeded: boolean;
}

// The driver's identity documents (A12, step 2) — the web twin of
// kerayego-partner's DriverDocumentsCard: CNIC front and back, licence front
// and back, a live selfie and the police certificate, uploaded to the private
// context=driver_document. Only the driver and KerayeGo ever see these. Each
// shows its status with View (a fresh signed link in a new tab) and
// Upload/Replace — a photo or scan from the computer (JPEG, PNG or PDF), or
// for the selfie the camera (SelfieCaptureModal, never a stored file, A59). A
// new file (not the police certificate) while under review or verified needs
// checking again, so that asks first.
export function DriverDocumentsCard({ documents, verificationStatus, policeCertificateNeeded }: DriverDocumentsCardProps) {
  const upload = useUploadDriverDocument();
  const viewer = useOpenDriverDocument();
  const fileInputs = useRef<Partial<Record<DriverDocumentType, HTMLInputElement | null>>>({});
  const [askFor, setAskFor] = useState<DriverDocumentSlot | null>(null);
  const [selfieOpen, setSelfieOpen] = useState(false);
  // A file the browser-side check refused, by document type.
  const [problems, setProblems] = useState<Partial<Record<DriverDocumentType, string>>>({});
  const uploadingType = upload.isPending ? upload.variables?.type : undefined;
  const result = upload.isSuccess ? upload.data : undefined;

  const send = (type: DriverDocumentType, file: File) => {
    const problem = documentFileProblem(file, type);
    setProblems((current) => ({ ...current, [type]: problem ?? undefined }));
    if (problem) return;
    upload.mutate({ type, file }, { onSuccess: () => setSelfieOpen(false) });
  };

  const choose = (slot: DriverDocumentSlot) => {
    if (slot.capture === 'camera') {
      // A fresh start: no error from an earlier attempt in the camera window.
      if (upload.isError) upload.reset();
      setProblems((current) => ({ ...current, [slot.type]: undefined }));
      setSelfieOpen(true);
    } else fileInputs.current[slot.type]?.click();
  };

  const startUpload = (slot: DriverDocumentSlot) => {
    if (verificationStatus && uploadNeedsReverification(verificationStatus, slot.type)) setAskFor(slot);
    else choose(slot);
  };

  const rowMessage = (type: DriverDocumentType): string | null => {
    if (problems[type]) return problems[type] ?? null;
    if (upload.variables?.type !== type || upload.isPending || !upload.isError) return null;
    return getApiErrorMessage(upload.error, 'Upload failed. Please try again.');
  };

  return (
    <section className="rounded-card border border-border-subtle bg-surface p-5 shadow-xs md:p-6">
      <h2 className="text-base font-semibold text-ink">Documents</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-text-muted">
        Clear photos or scans of the whole card — JPEG, PNG or PDF, up to 10 MB. Only you and KerayeGo see them — never a
        business or customer.
      </p>

      <ul className="mt-4 divide-y divide-border-subtle">
        {DRIVER_DOCUMENT_SLOTS.map((slot) => {
          const document = driverDocumentFor(documents, slot.type);
          const rejection = document ? documentRejectionNote(document) : null;
          const message = rowMessage(slot.type);
          const isSelfie = slot.capture === 'camera';
          const level = !slot.optional ? 'required' : policeCertificateNeeded ? 'hire' : 'recommended';
          const Icon = isSelfie ? Camera : slot.optional ? Award : CreditCard;
          // Right after an upload, its signed previewUrl opens without waiting for a refetch.
          const justUploaded =
            result?.previewUrl && upload.variables?.type === slot.type && result.id === document?.id
              ? { url: result.previewUrl, issuedAt: upload.submittedAt }
              : undefined;

          return (
            <li key={slot.type} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-text-faint" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{fieldLabel(slot.label, level)}</p>
                  <p className="mt-0.5 text-[13px] text-text-muted">
                    {document ? `Uploaded ${formatDate(document.createdAt)}` : slot.hint}
                  </p>
                  {slot.optional && policeCertificateNeeded && !document ? (
                    <p className="mt-0.5 text-[13px] text-status-amber-fg">Needed for the household services you offer.</p>
                  ) : null}
                </div>
                {document ? (
                  <StatusBadge
                    status={document.status}
                    label={DOCUMENT_STATUS_LABELS[document.status] ?? document.status}
                    size="sm"
                  />
                ) : (
                  <StatusBadge status="NOT_UPLOADED" label="Not uploaded" size="sm" />
                )}
              </div>

              {rejection ? <p className="mt-2 pl-8 text-[13px] text-red-700">{rejection}</p> : null}
              {message ? <p className="mt-2 pl-8 text-[13px] text-red-700">{message}</p> : null}

              <div className="mt-3 flex flex-wrap gap-2 pl-8">
                {document ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={viewer.openingId === document.id}
                    onClick={() => viewer.open(document.id, justUploaded)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant={document ? 'secondary' : 'primary'}
                  size="sm"
                  loading={uploadingType === slot.type}
                  disabled={upload.isPending}
                  onClick={() => startUpload(slot)}
                >
                  {isSelfie ? <Camera className="h-3.5 w-3.5" /> : <FileUp className="h-3.5 w-3.5" />}
                  {isSelfie ? (document ? 'Retake selfie' : 'Take selfie') : document ? 'Replace' : 'Upload'}
                </Button>
                {!isSelfie ? (
                  <input
                    ref={(element) => {
                      fileInputs.current[slot.type] = element;
                    }}
                    type="file"
                    accept={DOCUMENT_ACCEPT}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) send(slot.type, file);
                    }}
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {viewer.error ? <p className="mt-3 text-[13px] text-red-700">{viewer.error}</p> : null}

      <SelfieCaptureModal
        open={selfieOpen}
        onOpenChange={(open) => {
          if (!upload.isPending) setSelfieOpen(open);
        }}
        onCapture={(file) => send(DriverDocumentType.SELFIE, file)}
        busy={uploadingType === DriverDocumentType.SELFIE}
        error={rowMessage(DriverDocumentType.SELFIE)}
      />

      <ConfirmDialog
        open={askFor !== null}
        onOpenChange={(open) => {
          if (!open) setAskFor(null);
        }}
        title="This needs checking again"
        description={
          askFor && verificationStatus ? documentReverificationWarning(verificationStatus, askFor.label) : undefined
        }
        confirmLabel="Continue"
        cancelLabel="Cancel"
        onConfirm={() => {
          const slot = askFor;
          setAskFor(null);
          if (slot) choose(slot);
        }}
      />
    </section>
  );
}
