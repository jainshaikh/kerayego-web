import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication — any matching prefix triggers auth check
const PROTECTED_ROUTES = ['/dashboard', '/provider/', '/admin'];

// Routes only accessible to unauthenticated users — redirect logged-in users away
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

// Role-to-route mapping — wrong role gets redirected to their correct dashboard
const ROLE_ROUTES: Record<string, string[]> = {
  USER: ['/dashboard'],
  PROVIDER: ['/provider/'],
  ADMIN: ['/admin'],
  SUPER_ADMIN: ['/admin'],
};

// Sections that exist under both /dashboard and /provider and render the same
// shared component (carpool is open to both roles). A link to one role's copy
// — e.g. the public "Post your trip" CTA pointing at /dashboard/trips/new —
// lands the other role on its own copy instead of bouncing to its dashboard.
// `inquiries` is deliberately absent: the two pages share a name, not content.
const SHARED_ROLE_SECTIONS = ['trips', 'trip-inquiries', 'my-vehicles', 'incoming-requests', 'reviews'];

function sharedSectionTarget(pathname: string, userRole: string): string | null {
  const [from, to] =
    userRole === 'PROVIDER' ? ['/dashboard/', '/provider/'] : userRole === 'USER' ? ['/provider/', '/dashboard/'] : [];
  if (!from || !to || !pathname.startsWith(from)) return null;
  const rest = pathname.slice(from.length);
  const section = rest.split('/')[0];
  return SHARED_ROLE_SECTIONS.includes(section) ? `${to}${rest}` : null;
}

const ROLE_DASHBOARDS: Record<string, string> = {
  USER: '/dashboard',
  PROVIDER: '/provider/dashboard',
  ADMIN: '/admin/dashboard',
  SUPER_ADMIN: '/admin/dashboard',
};

/**
 * Middleware runs at the edge before any page renders.
 * It reads the user role from sessionStorage via a custom header set by the client,
 * OR relies on the presence of the refreshToken cookie as the auth signal.
 *
 * Strategy:
 * - We cannot verify JWTs in edge middleware without the full crypto stack
 * - Instead: presence of 'refreshToken' cookie = treat as authenticated
 * - Role information is stored in a client-readable cookie (not HTTP-only) set at login
 * - JwtAuthGuard on the API server validates all actual API calls
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session signals.
  // refreshToken is an HTTP-only cookie from the backend (localhost:3001) — it is NOT
  // visible here because middleware runs on localhost:3000. We rely on userRole, which
  // is a non-HTTP-only cookie set by the client at login time on this origin.
  const userRoleCookie = request.cookies.get('userRole');
  const emailVerifiedCookie = request.cookies.get('emailVerified');

  const isAuthenticated = !!userRoleCookie;
  const userRole = userRoleCookie?.value || null;
  // Set alongside userRole at login (see hooks/useAuth.ts) — 'false' until the
  // user clicks the link in their verification email.
  const isEmailVerified = emailVerifiedCookie?.value === 'true';

  // ── Redirect authenticated users away from auth pages ─────────────────────
  if (isAuthenticated && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    const dashboardUrl = userRole ? ROLE_DASHBOARDS[userRole] : '/dashboard';
    return NextResponse.redirect(new URL(dashboardUrl, request.url));
  }

  // ── Protect dashboard/provider/admin routes ───────────────────────────────
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated but hasn't clicked the verification link yet — hold them on
    // the verify-email flow instead of letting them into the dashboard.
    if (!isEmailVerified) {
      const verifyUrl = new URL('/verify-email', request.url);
      verifyUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(verifyUrl);
    }

    // Role-based access control
    if (userRole) {
      const allowedPrefixes = ROLE_ROUTES[userRole] || [];
      const isAllowed = allowedPrefixes.some((prefix) => pathname.startsWith(prefix));

      if (!isAllowed) {
        const sharedTarget = sharedSectionTarget(pathname, userRole);
        if (sharedTarget) {
          const url = new URL(sharedTarget, request.url);
          url.search = request.nextUrl.search;
          return NextResponse.redirect(url);
        }
        // User is authenticated but accessing wrong role's area → redirect to their dashboard
        const correctDashboard = ROLE_DASHBOARDS[userRole] || '/dashboard';
        return NextResponse.redirect(new URL(correctDashboard, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on these paths only — skip static files, API routes, Next.js internals
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|icons|fonts).*)',
  ],
};
