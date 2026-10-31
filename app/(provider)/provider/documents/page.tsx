'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useIsMutating } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, EmptyState, ErrorState, Modal } from '../../../../components/ui';
import { DocumentUploadCard } from '../../../../components/business/documents/DocumentUploadCard';
import { DocumentListItem } from '../../../../components/business/documents/DocumentListItem';
import { useProviderProfile } from '../../../../hooks/useProviderProfile';
import {
  documentMutationKeys,
  useDeleteBusinessDocument,
  useOpenBusinessDocument,
  useReplaceBusinessDocument,
} from '../../../../hooks/useBusinessDocuments';
import { getApiErrorMessage } from '../../../../hooks/useAccountDeletion';
import type { UploadedDocument } from '../../../../lib/api/providers.api';
import {
  DOCUMENT_ACCEPT,
  documentFileProblem,
  documentRemovalMessage,
  documentReplaceMessage,
} from '../../../../lib/documents/businessDocuments';

// The business's verification documents — kerayego-partner
// app/(business)/business/documents.tsx. Business admin only
// (can('manageDocuments'), the layout guards it). The list is GET
// /providers/me's `documents` (newest first, each with a 10-minute signed
// link); uploads go through POST /media/upload?context=document&documentType=…,
// Replace and Remove through DELETE /media/:publicId.
export default function ProviderDocumentsPage() {
  const router = useRouter();
  const business = useProviderProfile();
  const opener = useOpenBusinessDocument();
  const replace = useReplaceBusinessDocument();
  const remove = useDeleteBusinessDocument();
  // One document change at a time: an upload, replace or remove in progress holds the others.
  const busy = useIsMutating({ mutationKey: documentMutationKeys.all }) > 0;

  const [replacing, setReplacing] = useState<UploadedDocument | null>(null);
  const [removing, setRemoving] = useState<UploadedDocument | null>(null);
  const [replaceProblem, setReplaceProblem] = useState<string | null>(null);
  const replaceInput = useRef<HTMLInputElement>(null);

  const onReplaceFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    const document = replacing;
    if (!file || !document) return;
    const problem = documentFileProblem(file);
    if (problem) {
      setReplaceProblem(problem);
      return;
    }
    setReplacing(null);
    replace.mutate(
      { document, file },
      {
        onSuccess: (result) => {
          if (result.status === 'replaced') toast.success('Document replaced');
        },
      },
    );
  };

  const confirmRemove = () => {
    const document = removing;
    if (!document) return;
    setRemoving(null);
    remove.mutate(document, { onSuccess: () => toast.success('Document removed') });
  };

  // The last failure on this document's row, if any.
  const rowMessage = (document: UploadedDocument): string | null => {
    if (replace.variables?.document.id === document.id) {
      if (replace.isError) return getApiErrorMessage(replace.error, 'Could not replace the document.');
      if (replace.data?.status === 'oldNotRemoved') {
        return `The new file was uploaded, but this file couldn't be removed: ${replace.data.message} Remove it to keep only the new one.`;
      }
    }
    if (remove.variables?.id === document.id && remove.isError) {
      return getApiErrorMessage(remove.error, 'Could not remove the document.');
    }
    return null;
  };

  let content: React.ReactNode;
  if (business.isPending) {
    content = (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-card bg-surface-hover" />
        ))}
      </div>
    );
  } else if (business.data === undefined) {
    content = (
      <ErrorState
        title="We couldn't load your documents"
        description={getApiErrorMessage(business.error, 'Something went wrong while fetching your business.')}
        onRetry={() => void business.refetch()}
      />
    );
  } else if (business.data === null) {
    content = (
      <EmptyState
        icon={FileText}
        title="Set up your business first"
        description="Documents belong to your business profile. Add your business details, then upload its documents here."
        action={{ label: 'Set up business', onClick: () => router.push('/provider/profile') }}
      />
    );
  } else {
    const { documents } = business.data;
    content = (
      <div className="space-y-5">
        {business.isError ? (
          <p className="text-xs text-red-700">
            Couldn&rsquo;t refresh: {getApiErrorMessage(business.error, 'Something went wrong.')}
          </p>
        ) : null}

        <DocumentUploadCard disabled={busy} onView={opener.open} openingId={opener.openingId} />

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-ink">
            Your documents{documents.length > 0 ? ` (${documents.length})` : ''}
          </h2>
          {opener.error ? <p className="text-xs text-red-700">{opener.error}</p> : null}
          {documents.length === 0 ? (
            <Card padding="sm">
              <p className="text-sm text-text-muted">No documents yet. Start with your business license.</p>
            </Card>
          ) : (
            documents.map((document) => (
              <DocumentListItem
                key={document.id}
                document={document}
                onView={() => opener.open(document.id)}
                onReplace={() => {
                  setReplaceProblem(null);
                  setReplacing(document);
                }}
                onRemove={() => setRemoving(document)}
                opening={opener.openingId === document.id}
                replacing={replace.isPending && replace.variables?.document.id === document.id}
                removing={remove.isPending && remove.variables?.id === document.id}
                busy={busy}
                message={rowMessage(document)}
              />
            ))
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Business documents</h1>
        <p className="mt-1 text-sm text-text-muted">
          Upload your business license and any supporting documents. Only you and KerayeGo&rsquo;s review team can
          open them; customers never see them.{' '}
          <Link href="/provider/profile" className="font-medium text-brand-700 hover:underline">
            Back to business profile
          </Link>
        </p>
      </div>

      {content}

      <input
        ref={replaceInput}
        type="file"
        accept={DOCUMENT_ACCEPT}
        onChange={onReplaceFile}
        className="sr-only"
        tabIndex={-1}
      />

      <Modal
        open={replacing !== null}
        onOpenChange={(open) => !open && setReplacing(null)}
        title="Replace document?"
        description={replacing ? documentReplaceMessage(replacing) : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReplacing(null)}>
              Cancel
            </Button>
            <Button onClick={() => replaceInput.current?.click()}>Choose file</Button>
          </>
        }
      >
        <p className="text-xs text-text-muted">PDF, JPEG or PNG, up to 10 MB.</p>
        {replaceProblem ? <p className="mt-2 text-sm text-red-700">{replaceProblem}</p> : null}
      </Modal>

      <Modal
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remove document?"
        description={removing ? documentRemovalMessage(removing) : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmRemove}>
              Remove
            </Button>
          </>
        }
      />
    </div>
  );
}
