'use client';

import type { ReactNode } from 'react';
import { Button, Modal } from '../ui';

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}

// A yes/no question on the shared Modal (top-right × and a click outside both
// close it — the shared ConfirmDialog has neither), for the business
// operations pages.
export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  loading,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!loading) onOpenChange(next);
      }}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
