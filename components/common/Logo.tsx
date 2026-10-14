import { cn } from '../../lib/utils/cn';

interface LogoProps {
  /** 'full' = horizontal wordmark (icon + "KerayeGo" name). 'symbol' = icon only, for tight spaces. */
  variant?: 'full' | 'symbol';
  /** The source SVGs are ink-colored for light backgrounds — 'dark' flips them
   * to white via a CSS filter for use on dark surfaces (e.g. bg-ink sidebars),
   * since we only have one color treatment of each asset. */
  theme?: 'light' | 'dark';
  className?: string;
}

export function Logo({ variant = 'full', theme = 'light', className }: LogoProps) {
  const src = variant === 'full' ? '/logo-horizontal.svg' : '/logo-symbol.svg';
  // Intrinsic size from each SVG's viewBox, so the browser reserves the right
  // aspect ratio before it loads (Lighthouse: explicit width and height).
  const [width, height] = variant === 'full' ? [416, 98] : [94, 76];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      width={width}
      height={height}
      alt="KerayeGo"
      className={cn('w-auto', theme === 'dark' && 'brightness-0 invert', className)}
    />
  );
}
