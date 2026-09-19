'use client';

import { Modal } from '../../ui';
import { ChatPanel } from './ChatPanel';

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripInquiryId: string | null;
  otherPartyName: string;
}

// Wraps ChatPanel in the existing Modal primitive rather than adding a second
// modal component — just a taller max-width, since a message list needs more
// room than Modal's default form-dialog sizing.
export function ChatModal({ open, onOpenChange, tripInquiryId, otherPartyName }: ChatModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={otherPartyName} className="max-w-lg">
      {tripInquiryId ? <ChatPanel tripInquiryId={tripInquiryId} otherPartyName={otherPartyName} /> : null}
    </Modal>
  );
}
