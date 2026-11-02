import type { Metadata } from 'next';
import Link from 'next/link';
import { BackButton } from '../../components/ui';
import { Logo } from '../../components/common/Logo';

export const metadata: Metadata = {
  title: {
    default: 'Account',
    template: '%s | KerayeGo',
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      {/* Minimal header */}
      <header className="flex items-center justify-between px-6 py-6">
        <Link href="/" className="flex w-fit items-center">
          <Logo className="h-7" />
        </Link>
        <BackButton />
      </header>

      {/* Content area — width is controlled per-page (login/verify
          stay a narrow centered card; register spans wider for its split panel) */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">{children}</main>

      <footer className="py-6 text-center text-sm text-text-muted">
        <p>
          &copy; {new Date().getFullYear()} KerayeGo.{' '}
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>{' '}
          &middot;{' '}
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
        </p>
      </footer>
    </div>
  );
}
