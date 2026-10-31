'use client';

import { useState } from 'react';
import type {
  BlockPersonResult,
  PersonBlockIdentifierHint,
  PersonBlockIdentifierKind,
} from '../../lib/api/admin.api';
import { cn } from '../../lib/utils/cn';
import { Button, Modal, Textarea } from '../ui';

// Shared pieces for the person-block admin screens (user detail "Block
// person", Blocks, Possible blocked people). Built on the shared Modal
// (Radix Dialog): top-right × and closes on a click outside.

const KIND_LABEL: Record<PersonBlockIdentifierKind, string> = {
  CNIC: 'CNIC',
  PHONE: 'Phone',
  EMAIL: 'Email',
};

export function identifierKindLabel(kind: string): string {
  return KIND_LABEL[kind as PersonBlockIdentifierKind] ?? kind;
}

/** The short hints a block keeps (`•••• 4567`), one chip each. */
export function IdentifierHints({
  identifiers,
  className,
}: {
  identifiers: PersonBlockIdentifierHint[];
  className?: string;
}) {
  if (identifiers.length === 0) return <span className="text-xs text-text-faint">None</span>;
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {identifiers.map((idf, i) => (
        <span
          key={`${idf.kind}-${i}`}
          className="inline-flex items-center gap-1 rounded-chip border border-border-subtle bg-page px-2 py-0.5 text-xs"
        >
          <span className="font-semibold text-text-muted">{identifierKindLabel(idf.kind)}</span>
          <span className="font-mono text-ink">{idf.hint}</span>
        </span>
      ))}
    </div>
  );
}

/** What a block did: the identifiers it now covers and how many other accounts went on hold. */
export function BlockResultSummary({ result }: { result: BlockPersonResult }) {
  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="mb-1.5 text-[13px] font-semibold text-slate-700">Now blocked</p>
        <IdentifierHints identifiers={result.identifiers} />
      </div>
      <p className="text-text-muted">
        {result.heldAccounts === 0
          ? 'No other account matched these details.'
          : `${result.heldAccounts} other account${result.heldAccounts === 1 ? '' : 's'} matched and ${
              result.heldAccounts === 1 ? 'was' : 'were'
            } put on hold — see Possible blocked people.`}
      </p>
    </div>
  );
}

interface ReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Plain-language explanation shown above the text box. */
  children?: React.ReactNode;
  label: string;
  /** Required reason (5–500 chars) vs optional note (0–500 chars). */
  optional?: boolean;
  placeholder?: string;
  confirmLabel: string;
  destructive?: boolean;
  loading?: boolean;
  /** Server error to show inline (e.g. from getApiErrorMessage). */
  error?: string | null;
  onConfirm: (text: string) => void;
}

export const REASON_MIN = 5;
export const REASON_MAX = 500;

export function ReasonModal({
  open,
  onOpenChange,
  title,
  children,
  label,
  optional,
  placeholder,
  confirmLabel,
  destructive = true,
  loading,
  error,
  onConfirm,
}: ReasonModalProps) {
  const [text, setText] = useState('');
  const length = text.trim().length;
  const tooShort = !optional && length < REASON_MIN;
  const tooLong = length > REASON_MAX;
  const fieldError =
    !optional && length > 0 && tooShort
      ? `At least ${REASON_MIN} characters`
      : tooLong
        ? `At most ${REASON_MAX} characters`
        : undefined;

  const handleOpenChange = (next: boolean) => {
    if (!next) setText('');
    onOpenChange(next);
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            disabled={tooShort || tooLong}
            loading={loading}
            onClick={() => onConfirm(text.trim())}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {children ? <div className="text-sm leading-relaxed text-text-muted">{children}</div> : null}
        <Textarea
          label={label}
          required={!optional}
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={REASON_MAX}
          placeholder={placeholder}
          error={fieldError}
          helper={`${length} / ${REASON_MAX} characters${optional ? '' : ` (min ${REASON_MIN})`}`}
        />
        {error ? (
          <p className="rounded-control border border-status-red-border bg-status-red-bg px-3.5 py-2.5 text-[13px] text-status-red-fg">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
