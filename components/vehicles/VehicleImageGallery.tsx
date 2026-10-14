'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import type { ListingVehicleDetail } from '../../lib/api/listings.api';
import { vehicleImageAlt } from '../../lib/utils/copy';

interface VehicleImageGalleryProps {
  images: ListingVehicleDetail['images'];
  title: string;
  /** Used in the fallback alt text ("… for rent in Multan, photo 2") when a photo has none. */
  city?: string | null;
}

/** Public-facing image slider + lightbox for the vehicle detail page.
 * (Not to be confused with VehicleImageManager, the provider-side upload/reorder grid.) */
export function VehicleImageGallery({ images, title, city }: VehicleImageGalleryProps) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [direction, setDirection] = useState(0);

  const count = images.length;

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setDirection(next > index ? 1 : -1);
      setIndex(((next % count) + count) % count);
    },
    [count, index],
  );

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

  if (count === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-card bg-surface-hover text-text-faint">
        <ImageIcon className="h-10 w-10" />
      </div>
    );
  }

  const active = images[index];

  return (
    <div className="space-y-2">
      {/* Main slide */}
      <div
        className="group relative aspect-[16/10] overflow-hidden rounded-card bg-surface-hover"
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') goPrev();
          if (e.key === 'ArrowRight') goNext();
        }}
        tabIndex={0}
      >
        <SwipeableSlide
          onSwipeLeft={goNext}
          onSwipeRight={goPrev}
          className="absolute inset-0"
        >
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.img
              key={active.id}
              src={active.url}
              alt={active.altText ?? vehicleImageAlt(title, city, index + 1)}
              className="h-full w-full cursor-zoom-in object-cover"
              custom={direction}
              initial={{ opacity: 0, x: direction >= 0 ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction >= 0 ? -40 : 40 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={() => setLightboxOpen(true)}
            />
          </AnimatePresence>
        </SwipeableSlide>

        {count > 1 && (
          <>
            <SlideArrow direction="left" onClick={goPrev} />
            <SlideArrow direction="right" onClick={goNext} />
            <div className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-chip bg-ink/60 px-2.5 py-1 text-xs font-medium text-white">
              {index + 1} / {count}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => goTo(idx)}
              aria-label={`View photo ${idx + 1}`}
              aria-current={idx === index}
              className={cn(
                'relative aspect-square w-16 flex-shrink-0 overflow-hidden rounded-media bg-surface-hover ring-2 ring-offset-1 transition',
                idx === index ? 'ring-brand-600' : 'ring-transparent hover:ring-border-strong',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.altText ?? vehicleImageAlt(title, city, idx + 1)}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen lightbox */}
      <Dialog.Root open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=open]:animate-fade-in" />
          <Dialog.Content
            className="fixed inset-0 z-50 flex flex-col outline-none"
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') goPrev();
              if (e.key === 'ArrowRight') goNext();
            }}
          >
            <Dialog.Title className="sr-only">{title} — photo gallery</Dialog.Title>
            <div className="flex items-center justify-between px-4 py-3 text-white">
              <span className="text-sm font-medium">
                {index + 1} / {count}
              </span>
              <Dialog.Close className="rounded-control p-1.5 hover:bg-white/10">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <SwipeableSlide onSwipeLeft={goNext} onSwipeRight={goPrev} className="relative flex-1">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.img
                  key={active.id}
                  src={active.url}
                  alt={active.altText ?? vehicleImageAlt(title, city, index + 1)}
                  className="absolute inset-0 h-full w-full object-contain"
                  custom={direction}
                  initial={{ opacity: 0, x: direction >= 0 ? 60 : -60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction >= 0 ? -60 : 60 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                />
              </AnimatePresence>

              {count > 1 && (
                <>
                  <SlideArrow direction="left" onClick={goPrev} large />
                  <SlideArrow direction="right" onClick={goNext} large />
                </>
              )}
            </SwipeableSlide>

            {count > 1 && (
              <div className="flex justify-center gap-2 overflow-x-auto px-4 py-3">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => goTo(idx)}
                    aria-label={`View photo ${idx + 1}`}
                    aria-current={idx === index}
                    className={cn(
                      'relative aspect-square w-12 flex-shrink-0 overflow-hidden rounded-media ring-2 transition',
                      idx === index ? 'ring-white' : 'ring-transparent opacity-60 hover:opacity-100',
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function SlideArrow({
  direction,
  onClick,
  large,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  large?: boolean;
}) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={direction === 'left' ? 'Previous photo' : 'Next photo'}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 rounded-full bg-ink/50 text-white transition hover:bg-ink/70',
        large ? 'p-2.5' : 'p-1.5 opacity-0 group-hover:opacity-100',
        direction === 'left' ? 'left-2.5' : 'right-2.5',
      )}
    >
      <Icon className={large ? 'h-6 w-6' : 'h-4 w-4'} />
    </button>
  );
}

/** Wraps children with touch-swipe navigation (mobile has no hover arrows). */
function SwipeableSlide({
  onSwipeLeft,
  onSwipeRight,
  className,
  children,
}: {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const startX = useRef<number | null>(null);

  return (
    <div
      className={className}
      onTouchStart={(e) => {
        startX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (startX.current === null) return;
        const delta = e.changedTouches[0].clientX - startX.current;
        const SWIPE_THRESHOLD = 40;
        if (delta > SWIPE_THRESHOLD) onSwipeRight();
        else if (delta < -SWIPE_THRESHOLD) onSwipeLeft();
        startX.current = null;
      }}
    >
      {children}
    </div>
  );
}
