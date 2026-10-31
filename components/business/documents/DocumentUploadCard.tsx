'use client';

import { useRef, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { Button, Card, PillToggle } from '../../ui';
import { getApiErrorMessage } from '../../../hooks/useAccountDeletion';
import { useUploadBusinessDocument } from '../../../hooks/useBusinessDocuments';
import {
  BUSINESS_DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_ACCEPT,
  documentFileProblem,
  documentTypeLabel,
} from '../../../lib/documents/businessDocuments';

interface DocumentUploadCardProps {
  /** Another document change is running — don't start an upload now. */
  disabled: boolean;
  /** Opens a document's file; `preferred` is a link to use while it's fresh. */
  onView: (documentId: string | undefined, preferred?: { url: string; issuedAt: number }) => void;
  openingId: string | null;
}

const CHOOSE_TYPE = 'Choose what this document is.';

// "Add a document" — kerayego-partner features/documents/components/
// DocumentUploadCard.tsx: choose its type first (none is chosen up front, so a
// file is never filed under the wrong one), pick a file, upload. Then shows a
// confirmation with the upload's signed previewUrl — the stored url doesn't
// open (private bucket). The web also takes PDFs (the backend allows them).
export function DocumentUploadCard({ disabled, onView, openingId }: DocumentUploadCardProps) {
  const upload = useUploadBusinessDocument();
  const inputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const chooseFile = () => {
    if (!documentType) {
      setProblem(CHOOSE_TYPE);
      return;
    }
    setProblem(null);
    inputRef.current?.click();
  };

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !documentType) return;
    const fileProblem = documentFileProblem(file);
    if (fileProblem) {
      setProblem(fileProblem);
      return;
    }
    upload.mutate({ file, documentType });
  };

  if (upload.isSuccess && upload.variables) {
    const result = upload.data;
    const label = documentTypeLabel(upload.variables.documentType);
    // submittedAt (when the upload started) is never later than when the
    // backend signed previewUrl, so the link is never thought fresher than it is.
    const view = () =>
      onView(
        result.id,
        result.previewUrl ? { url: result.previewUrl, issuedAt: upload.submittedAt } : undefined,
      );
    const isImage = upload.variables.file.type.startsWith('image/');
    return (
      <Card className="space-y-3">
        <p className="text-sm font-semibold text-ink">{label} uploaded</p>
        {isImage && result.previewUrl ? (
          <button type="button" onClick={view} className="block w-full" aria-label={`View your ${label}`}>
            {/* A signed, private link: next/image can't optimise it. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.previewUrl}
              alt={label}
              className="max-h-64 w-full rounded-control bg-surface-hover object-contain"
            />
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-control bg-surface-hover px-3 py-2.5 text-sm text-slate-700">
            <FileText className="h-4 w-4" />
            {upload.variables.file.name}
          </div>
        )}
        <p className="text-sm text-text-muted">
          KerayeGo&rsquo;s team will review it. It&rsquo;s now in your documents below.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={view} loading={openingId === (result.id ?? 'preview')}>
            View file
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              upload.reset();
              setDocumentType(null);
            }}
          >
            Upload another document
          </Button>
        </div>
      </Card>
    );
  }

  const error = problem ?? (upload.isError ? getApiErrorMessage(upload.error, 'Upload failed') : null);

  return (
    <Card className="space-y-4">
      <p className="text-sm font-semibold text-ink">Add a document</p>
      <div>
        <p className="mb-2 text-[13px] font-semibold text-slate-700">What is it?</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Document type">
          {BUSINESS_DOCUMENT_TYPE_OPTIONS.map((option) => (
            <PillToggle
              key={option.value}
              active={documentType === option.value}
              onClick={() => {
                if (upload.isPending) return;
                setDocumentType(option.value);
                setProblem(null);
              }}
            >
              {option.label}
            </PillToggle>
          ))}
        </div>
      </div>
      <p className="text-xs text-text-muted">A clear copy of the whole document: PDF, JPEG or PNG, up to 10 MB.</p>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button onClick={chooseFile} loading={upload.isPending} disabled={disabled}>
        <Upload className="h-4 w-4" />
        {upload.isPending ? 'Uploading…' : 'Choose file'}
      </Button>
      <input ref={inputRef} type="file" accept={DOCUMENT_ACCEPT} onChange={onFile} className="sr-only" tabIndex={-1} />
    </Card>
  );
}
