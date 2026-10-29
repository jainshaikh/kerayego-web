'use client';

import { useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import { Button } from './Button';
import { Textarea } from './Input';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** When set, a reason textarea is shown and required before confirming (e.g. reject/suspend). */
  requireReason?: boolean;
  reasonLabel?: string;
  /** Minimum trimmed reason length (default 1) — match the backend DTO. */
  minReasonLength?: number;
  /** Maximum reason length; also caps the textarea. */
  maxReasonLength?: number;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: (reason?: string) => void;
}

/** One confirm dialog for the whole app — cancel-inquiry, cancel-trip,
 * archive-vehicle, and every admin reject/suspend all use this. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  requireReason,
  reasonLabel = 'Reason',
  minReasonLength = 1,
  maxReasonLength,
  confirmLabel = 'Confirm',
  cancelLabel = 'Keep it',
  destructive = true,
  loading,
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const reasonLength = reason.trim().length;
  const reasonTooShort = reasonLength < minReasonLength;
  const reasonTooLong = maxReasonLength !== undefined && reasonLength > maxReasonLength;
  const canConfirm = !requireReason || (!reasonTooShort && !reasonTooLong);
  // Only nag once they've started typing; the disabled button covers the empty case.
  const reasonError =
    requireReason && reasonLength > 0 && reasonTooShort
      ? `At least ${minReasonLength} characters`
      : reasonTooLong
        ? `At most ${maxReasonLength} characters`
        : undefined;

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason('');
        onOpenChange(next);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-ink/40" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-sheet bg-surface shadow-lg focus:outline-none">
          <div className="p-6 pb-5">
            <div
              className={cn(
                'mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-[11px]',
                destructive ? 'bg-status-red-bg text-red-600' : 'bg-status-blue-bg text-brand-600',
              )}
            >
              <AlertTriangle className="h-[21px] w-[21px]" />
            </div>
            <AlertDialog.Title className="mb-2 text-[19px] font-semibold leading-snug tracking-tight text-ink">
              {title}
            </AlertDialog.Title>
            {description ? (
              <AlertDialog.Description className="text-sm leading-relaxed text-text-muted">
                {description}
              </AlertDialog.Description>
            ) : null}
            {requireReason ? (
              <div className="mt-[18px]">
                <Textarea
                  label={reasonLabel}
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={maxReasonLength}
                  error={reasonError}
                  helper={
                    minReasonLength > 1 || maxReasonLength
                      ? `${reasonLength}${maxReasonLength ? ` / ${maxReasonLength}` : ''} characters${minReasonLength > 1 ? ` (min ${minReasonLength})` : ''}`
                      : undefined
                  }
                  placeholder="Explain what needs to change…"
                />
              </div>
            ) : null}
          </div>
          <div className="flex justify-end gap-2.5 border-t border-border-subtle bg-page px-6 py-[18px]">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary">{cancelLabel}</Button>
            </AlertDialog.Cancel>
            <Button
              variant={destructive ? 'danger' : 'primary'}
              disabled={!canConfirm}
              loading={loading}
              onClick={() => onConfirm(requireReason ? reason.trim() : undefined)}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
