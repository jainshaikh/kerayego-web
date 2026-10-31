'use client';

import { useRef, useState } from 'react';
import { UserRound } from 'lucide-react';
import { Button } from '../ui';
import { useUploadDriverPhoto } from '../../hooks/useDriverProfile';
import { getApiErrorMessage } from '../../hooks/useAccountDeletion';
import { PHOTO_ACCEPT, photoFileProblem } from '../../lib/driver/verification';

// The driver's profile photo: the face businesses and customers see next to
// the driver's name. Uploaded with context=driver_photo — the backend saves it
// as the profile's avatarUrl itself — then GET /driver/profile is refetched.
export function DriverPhotoField({ avatarUrl, fullName }: { avatarUrl: string | null; fullName: string }) {
  const upload = useUploadDriverPhoto();
  const inputRef = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const message = problem ?? (upload.isError ? getApiErrorMessage(upload.error, 'Upload failed. Please try again.') : null);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const why = photoFileProblem(file);
    setProblem(why);
    if (!why) upload.mutate(file);
  };

  return (
    <div className="flex items-center gap-4">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- an S3 URL; next/image needs every host configured.
        <img
          src={avatarUrl}
          alt={`${fullName}'s profile photo`}
          className="h-20 w-20 flex-shrink-0 rounded-full bg-surface-hover object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-surface-hover text-text-faint">
          <UserRound className="h-9 w-9" />
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-[13px] text-text-muted">A clear photo of your face. JPEG, PNG or WebP, up to 5 MB.</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          {avatarUrl ? 'Change photo' : 'Add photo'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={PHOTO_ACCEPT}
          className="hidden"
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {message ? <p className="text-[13px] text-red-700">{message}</p> : null}
      </div>
    </div>
  );
}
