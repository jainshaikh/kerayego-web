'use client';

import { useId, useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { Button, Input, PillToggle } from '../ui';
import { cn } from '../../lib/utils/cn';
import { addListItem, DRIVER_LIMITS, toggleValue } from '../../lib/driver/fields';

// Small form pieces the driver setup steps share — web versions of
// kerayego-partner's ChipGroup, YesNoField, CheckboxRow and ChipListInput.

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-[7px] text-[13px] text-red-700">{message}</p>;
}

/** A card section of a setup step. */
export function StepSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-card border border-border-subtle bg-surface p-5 shadow-xs md:p-6', className)}>
      {title ? <h2 className="text-base font-semibold text-ink">{title}</h2> : null}
      {description ? <p className="mt-1 text-[13px] leading-relaxed text-text-muted">{description}</p> : null}
      <div className={cn('space-y-5', title || description ? 'mt-5' : '')}>{children}</div>
    </section>
  );
}

interface ChipOption<T extends string> {
  value: T;
  label: string;
}

/** A row of choice chips: single choice, or several with `multiple`. */
export function ChipGroup<T extends string>({
  label,
  options,
  isSelected,
  onPress,
  error,
}: {
  label?: string;
  options: readonly ChipOption<T>[];
  isSelected: (value: T) => boolean;
  onPress: (value: T) => void;
  error?: string;
}) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={label ? labelId : undefined}>
      {label ? (
        <p id={labelId} className="mb-2 text-[13px] font-semibold text-slate-700">
          {label}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <PillToggle key={option.value} active={isSelected(option.value)} onClick={() => onPress(option.value)}>
            {option.label}
          </PillToggle>
        ))}
      </div>
      <FieldError message={error} />
    </div>
  );
}

const YES_NO = [
  { value: 'yes' as const, label: 'Yes' },
  { value: 'no' as const, label: 'No' },
];

/** A yes/no question as two chips. Clicking the chosen answer again clears it (null = not answered). */
export function YesNoField({
  label,
  value,
  onChange,
  helper,
  error,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  helper?: string;
  error?: string;
}) {
  const selected = value === null ? null : value ? 'yes' : 'no';
  return (
    <div>
      <ChipGroup
        label={label}
        options={YES_NO}
        isSelected={(option) => option === selected}
        onPress={(option) => onChange(option === selected ? null : option === 'yes')}
        error={error}
      />
      {helper && !error ? <p className="mt-[7px] text-[13px] text-text-faint">{helper}</p> : null}
    </div>
  );
}

/** A checkbox with a label, an optional line under it and an optional control on the right. */
export function CheckboxRow({
  label,
  description,
  checked,
  onToggle,
  disabled,
  accessory,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  accessory?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <label className={cn('flex flex-1 items-start gap-[11px]', disabled ? 'cursor-default' : 'cursor-pointer')}>
        <input type="checkbox" checked={checked} disabled={disabled} onChange={onToggle} className="peer sr-only" />
        <span
          aria-hidden
          className={cn(
            'mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border transition-colors',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600 peer-focus-visible:ring-offset-2',
            checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-border-strong bg-surface',
            disabled && 'opacity-60',
          )}
        >
          {checked ? <Check className="h-[13px] w-[13px]" /> : null}
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] text-ink">{label}</span>
          {description ? <span className="mt-0.5 block text-[13px] leading-relaxed text-text-muted">{description}</span> : null}
        </span>
      </label>
      {accessory}
    </div>
  );
}

/**
 * A multi-select of short text items (languages, coverage areas): the
 * suggestions as chips, anything else typed in and added as its own chip.
 * Clicking a chosen chip removes it. Contract: ≤ 20 items, each ≤ 50 characters.
 */
export function ChipListInput({
  label,
  value,
  onChange,
  suggestions = [],
  addLabel,
  addPlaceholder,
  helper,
  error,
}: {
  label: string;
  value: string[];
  onChange: (items: string[]) => void;
  suggestions?: readonly string[];
  addLabel: string;
  addPlaceholder: string;
  helper?: string;
  error?: string;
}) {
  const [draft, setDraft] = useState('');
  const isFull = value.length >= DRIVER_LIMITS.listItems;
  const extras = value.filter((item) => !suggestions.some((s) => s.toLowerCase() === item.toLowerCase()));
  const options = [...suggestions, ...extras].map((item) => ({ value: item, label: item }));
  const isChosen = (item: string) => value.some((chosen) => chosen.toLowerCase() === item.toLowerCase());

  const add = () => {
    if (isFull) return;
    onChange(addListItem(value, draft));
    setDraft('');
  };

  return (
    <div className="space-y-3">
      {options.length > 0 ? (
        <ChipGroup
          label={label}
          options={options}
          isSelected={isChosen}
          onPress={(item) => {
            const existing = value.find((chosen) => chosen.toLowerCase() === item.toLowerCase());
            if (existing) onChange(toggleValue(value, existing));
            else if (!isFull) onChange([...value, item]);
          }}
        />
      ) : (
        <p className="text-[13px] font-semibold text-slate-700">{label}</p>
      )}
      <div className="flex items-start gap-2">
        <Input
          wrapperClassName="flex-1"
          aria-label={addLabel}
          placeholder={addPlaceholder}
          value={draft}
          maxLength={DRIVER_LIMITS.listItem}
          disabled={isFull}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          error={error}
          helper={isFull ? `You can add up to ${DRIVER_LIMITS.listItems}.` : helper}
        />
        <Button type="button" variant="secondary" disabled={draft.trim() === '' || isFull} onClick={add}>
          Add
        </Button>
      </div>
    </div>
  );
}
