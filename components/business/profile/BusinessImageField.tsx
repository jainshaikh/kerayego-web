'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button, Modal } from '../../ui';
import { mediaApi } from '../../../lib/api/media.api';
import { useUpdateProvider } from '../../../hooks/useProviderProfile';
import { getApiErrorMessage } from '../../../hooks/useAccountDeletion';
import { cn } from '../../../lib/utils/cn';

export type BusinessImageKind = 'logo' | 'banner';

const CONFIG: Record<BusinessImageKind, { label: string; context: 'provider_logo' | 'provider_banner'; hint: string }> = {
  logo: {
    label: 'Logo',
    context: 'provider_logo',
    hint: 'Shown next to your business name. A square image works best.',
  },
  banner: {
    label: 'Banner',
    context: 'provider_banner',
    hint: 'A wide photo across the top of your business page.',
  },
};

// kerayego-backend media.service.ts ALLOWED_IMAGE_TYPES / MAX_IMAGE_BYTES.
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

function imageProblem(file: File): string | null {
  if (!IMAGE_ACCEPT.split(',').includes(file.type)) return 'Choose a JPEG, PNG or WebP image.';
  if (file.size > IMAGE_MAX_BYTES) return 'That image is larger than 5 MB. Choose a smaller one.';
  return null;
}

interface BusinessImageFieldProps {
  kind: BusinessImageKind;
  business: { businessName: string; logoUrl: string | null; bannerUrl: string | null };
}

// Upload, change or remove the business's logo or banner — kerayego-partner
// features/business/components/BusinessImageField.tsx. Each change is saved
// straight away: upload (POST /media/upload, context provider_logo /
// provider_banner), then PATCH /providers/me with its URL (null removes it).
// If the save fails after the upload, the uploaded file is left in storage.
export function BusinessImageField({ kind, business }: BusinessImageFieldProps) {
  const { label, context, hint } = CONFIG[kind];
  const inputRef = useRef<HTMLInputElement>(null);
  const update = useUpdateProvider();
  const [problem, setProblem] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const url = kind === 'logo' ? business.logoUrl : business.bannerUrl;
  const lower = label.toLowerCase();

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const uploaded = await mediaApi.upload(file, context);
      return update.mutateAsync(kind === 'logo' ? { logoUrl: uploaded.url } : { bannerUrl: uploaded.url });
    },
    onSuccess: () => toast.success(`${label} saved`),
    onError: (err) => setProblem(getApiErrorMessage(err, `Could not save the ${lower}`)),
  });

  const busy = upload.isPending || update.isPending;

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const fileProblem = imageProblem(file);
    setProblem(fileProblem);
    if (!fileProblem) upload.mutate(file);
  };

  const remove = () => {
    setProblem(null);
    update.mutate(kind === 'logo' ? { logoUrl: null } : { bannerUrl: null }, {
      onSuccess: () => {
        toast.success(`${label} removed`);
        setConfirmRemove(false);
      },
      onError: (err) => {
        setProblem(getApiErrorMessage(err, `Could not remove the ${lower}`));
        setConfirmRemove(false);
      },
    });
  };

  return (
    <div className="space-y-2.5">
      <div>
        <p className="text-[13px] font-semibold text-slate-700">{label}</p>
        <p className="mt-0.5 text-xs text-text-muted">{hint} JPEG, PNG or WebP, up to 5 MB.</p>
      </div>

      <div
        className={cn(
          'relative overflow-hidden bg-surface-hover',
          kind === 'logo' ? 'h-24 w-24 rounded-control' : 'aspect-[21/9] w-full max-w-xl rounded-card',
          !url && 'flex items-center justify-center border border-dashed border-border-strong',
        )}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={`${business.businessName} ${lower}`} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-text-muted">No {lower}</span>
        )}
        {upload.isPending ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white">
            Uploading…
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={upload.isPending}
          disabled={busy}
          onClick={() => {
            setProblem(null);
            inputRef.current?.click();
          }}
        >
          {url ? `Change ${lower}` : `Upload ${lower}`}
        </Button>
        {url ? (
          <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmRemove(true)}>
            Remove
          </Button>
        ) : null}
      </div>

      {problem ? <p className="text-xs text-red-700">{problem}</p> : null}

      <input ref={inputRef} type="file" accept={IMAGE_ACCEPT} onChange={onFile} className="sr-only" tabIndex={-1} />

      <Modal
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title={`Remove ${lower}?`}
        description={`Customers will no longer see your ${lower}.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmRemove(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={update.isPending} onClick={remove}>
              Remove
            </Button>
          </>
        }
      />
    </div>
  );
}
