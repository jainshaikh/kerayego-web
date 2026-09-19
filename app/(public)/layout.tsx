import Link from 'next/link';
import { PublicNavbar } from '../../components/layout/PublicNavbar';

const FOOTER_LINKS = [
  { href: '/about', label: 'About Us' },
  { href: '/faq', label: 'FAQ' },
  { href: '/guides', label: 'Guides' },
  { href: '/safety', label: 'Safety' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-slate-400 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} KerayeGo. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            {FOOTER_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="transition-colors hover:text-brand-700">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
