'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { Button, Modal } from '../ui';
import { SELFIE_ACCEPT } from '../../lib/driver/verification';

// The live identity selfie (A59) on the web. The Partner app takes it with the
// front camera there and then — never from the gallery — and KerayeGo compares
// it with the CNIC photo. Here: the camera through getUserMedia with a
// Capture button, a preview, and "Use this photo"; when the browser has no
// camera access (none attached, refused, or an old browser), a file input
// with capture="user", which opens the front camera on a phone. The photo is
// uploaded the same way as the app's (context=driver_document,
// documentType=SELFIE, JPEG).

type CameraState = 'starting' | 'live' | 'unavailable';

const NO_CAMERA_MESSAGE =
  'We couldn’t use a camera here. Allow camera access for KerayeGo in your browser, or take the photo now with your phone’s front camera below.';

export function SelfieCaptureModal({
  open,
  onOpenChange,
  onCapture,
  busy = false,
  error = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The photo to upload. */
  onCapture: (file: File) => void;
  /** The photo is uploading. */
  busy?: boolean;
  /** Why the last upload failed. */
  error?: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Bumped on every stop, so a camera that starts after the modal closed is stopped at once.
  const sessionRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [camera, setCamera] = useState<CameraState>('starting');
  const [shot, setShot] = useState<{ file: File; url: string } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    sessionRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    const session = sessionRef.current;
    setCamera('starting');
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCamera('unavailable');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      if (session !== sessionRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCamera('live');
    } catch {
      if (session === sessionRef.current) setCamera('unavailable');
    }
  }, [stopCamera]);

  // Camera on while the modal is open and no photo is being previewed.
  useEffect(() => {
    if (open && !shot) void startCamera();
    else stopCamera();
    return stopCamera;
  }, [open, shot, startCamera, stopCamera]);

  // Forget the preview when the modal closes.
  useEffect(() => {
    if (!open) {
      setShot((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return null;
      });
      setProblem(null);
    }
  }, [open]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setProblem('The photo couldn’t be taken. Try again.');
          return;
        }
        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setShot({ file, url: URL.createObjectURL(blob) });
      },
      'image/jpeg',
      0.9,
    );
  };

  const retake = () => {
    if (shot) URL.revokeObjectURL(shot.url);
    setShot(null);
  };

  const takeFile = (file: File | undefined) => {
    if (!file) return;
    if (!SELFIE_ACCEPT.split(',').includes(file.type.toLowerCase())) {
      setProblem('The selfie must be a JPEG or PNG photo. Take it again.');
      return;
    }
    setProblem(null);
    onCapture(file);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Take your live selfie"
      description="Look straight at the camera, in good light, without sunglasses or a cap. KerayeGo compares it with your CNIC photo."
      className="max-w-lg"
    >
      <div className="space-y-4">
        {camera !== 'unavailable' || shot ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-ink">
            {shot ? (
              // eslint-disable-next-line @next/next/no-img-element -- a local blob preview.
              <img src={shot.url} alt="Your selfie" className="h-full w-full object-cover" />
            ) : (
              <video
                ref={videoRef}
                playsInline
                muted
                className="h-full w-full -scale-x-100 object-cover"
                aria-label="Camera preview"
              />
            )}
            {camera === 'starting' && !shot ? (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-white/80">Starting the camera…</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3 rounded-card border border-status-amber-border bg-status-amber-bg p-4 text-sm text-status-amber-fg">
            <p>{NO_CAMERA_MESSAGE}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => void startCamera()}>
                <RefreshCw className="h-3.5 w-3.5" />
                Try the camera again
              </Button>
              <Button type="button" size="sm" onClick={() => fileRef.current?.click()}>
                <Camera className="h-3.5 w-3.5" />
                Take photo
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={SELFIE_ACCEPT}
              capture="user"
              className="hidden"
              onChange={(e) => {
                takeFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>
        )}

        {problem || error ? <p className="text-[13px] text-red-700">{problem ?? error}</p> : null}

        <div className="flex justify-end gap-2.5">
          {shot ? (
            <>
              <Button type="button" variant="secondary" disabled={busy} onClick={retake}>
                Retake
              </Button>
              <Button type="button" loading={busy} onClick={() => onCapture(shot.file)}>
                Use this photo
              </Button>
            </>
          ) : camera === 'live' ? (
            <Button type="button" onClick={capture}>
              <Camera className="h-4 w-4" />
              Capture
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
