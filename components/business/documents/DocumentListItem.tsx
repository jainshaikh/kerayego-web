'use client';

import { FileText, Image as ImageIcon } from 'lucide-react';
import { Button, Card } from '../../ui';
import { StatusBadge } from '../../common/StatusBadge';
import type { UploadedDocument } from '../../../lib/api/providers.api';
import {
  DOCUMENT_FILE_KIND_LABELS,
  documentFileKind,
  documentRejectionNote,
  documentTypeLabel,
} from '../../../lib/documents/businessDocuments';
import { formatShortDate } from '../../../lib/team/teamGroups';

interface DocumentListItemProps {
  document: UploadedDocument;
  onView: () => void;
  onReplace: () => void;
  onRemove: () => void;
  opening: boolean;
  replacing: boolean;
  removing: boolean;
  /** Another document change is running — hold Replace/Remove. */
  busy: boolean;
  /** The last failure on this document, in words for the person. */
  message: string | null;
}

// One of the business's documents — kerayego-partner DocumentListItem: type,
// status badge (and the reason when not accepted), file kind and upload date,
// with View / Replace / Remove.
export function DocumentListItem({
  document,
  onView,
  onReplace,
  onRemove,
  opening,
  replacing,
  removing,
  busy,
  message,
}: DocumentListItemProps) {
  const kind = documentFileKind(document.publicId);
  const rejectionNote = documentRejectionNote(document);
  const Icon = kind === 'image' ? ImageIcon : FileText;

  return (
    <Card padding="sm" className="space-y-3">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-text-faint" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{documentTypeLabel(document.documentType)}</p>
          <p className="mt-0.5 text-xs text-text-muted">
            {DOCUMENT_FILE_KIND_LABELS[kind]} · Uploaded {formatShortDate(document.createdAt)}
          </p>
        </div>
        <StatusBadge status={document.status} size="sm" />
      </div>
      {rejectionNote ? <p className="text-xs text-red-700">{rejectionNote}</p> : null}
      {message ? <p className="text-xs text-red-700">{message}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" loading={opening} onClick={onView}>
          View
        </Button>
        <Button size="sm" variant="secondary" loading={replacing} disabled={busy} onClick={onReplace}>
          Replace
        </Button>
        <Button size="sm" variant="ghost" className="text-red-700" loading={removing} disabled={busy} onClick={onRemove}>
          Remove
        </Button>
      </div>
    </Card>
  );
}
