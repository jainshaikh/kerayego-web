# KerayeGo Web — Architecture Reference

Full technical reference for `kerayego-web`. Rebuilt on 2026-11-10 by reading every source file in the
repo and cross-checking each claim against the code (and, where a claim depends on it, the backend and
the Partner app). **Source code wins**: if this document and the code disagree, the code is right — fix
this document and add a line to the changelog (§33). `file:line` references are as of 2026-11-10.

Short agent-facing guide: [`../CLAUDE.md`](../CLAUDE.md). Platform-wide docs: [`../../docs/`](../../docs/)
(start with `SYSTEM_OVERVIEW.md`). Plan decisions (A-numbers) live in
[`../../PROVIDER_APP_PLAN.md`](../../PROVIDER_APP_PLAN.md).

**Keeping this current.** Every web change, in the same task: update §0 if a switch, count, known issue
or open item changed; fix the affected section; add a dated line to §33. Re-count from source rather than
copying old numbers.

---

## 0. Current state (2026-11-12)

| | |
|---|---|
| Framework | Next.js **14.2.35** installed (`package.json` says `^14.2.5`), App Router, React 18.3.1, TypeScript strict |
| Hosting | **Vercel**, production at `https://www.kerayego.com` — evidence: the `rentalmarket.vercel.app` → `www.kerayego.com` 301 in `next.config.mjs:62-67`, `.vercel` in `.gitignore`, the backend comment at `kerayego-backend/src/modules/auth/auth.controller.ts:25`. No Dockerfile; build settings live in Vercel, not in this repo. |
| Backend | `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/v1`) — REST + the `/ride` Socket.IO namespace |
| Size | **91 pages** — `(auth)` 4, `(dashboard)` 13, `(provider)` 22, `(driver)` 4, `(admin)` 18, `(public)` 29, homepage 1 — plus 2 route handlers; 26 hook files, 21 `lib/api` files, 150 component files, 11 Zod schema files |
| Checks | `npx tsc --noEmit` → 0 errors; `npm run lint` → clean (both 2026-11-12). **No test suite** (§31). |
| Env switches | Google Analytics loads only with `NEXT_PUBLIC_GA_ID`; app-store buttons stay hidden until `NEXT_PUBLIC_APP_STORE_URL`/`NEXT_PUBLIC_PLAY_STORE_URL` is set; maps need `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` |

**Open items** (full list with references in §32):

- **Rental booking redesign built on the web 2026-11-12 (plan §3c/§3d, A74–A88) — waits for the
  backend.** The customer booking form is off (A82: the car page sends customers to the app); the
  business portal and driver jobs show the route, passengers, "price to agree" and the double-booking
  warning like the Partner app; the fleet form has the weekly & monthly switch; public pages show no week
  or month prices, show "This exact car" with the car's rating; each city has a weekly & monthly page.
  The backend changes it reads (2026-11-11) are **not on production yet** — every new field is optional,
  so until they are, the web runs on the old backend: weekly & monthly pages 404 and their links stay
  hidden, ratings come from `/reviews/summary`, requests show no route.
- **Waiting on the backend:** it still lets a `PROVIDER` move a booking to IN_PROGRESS/COMPLETED through
  `PATCH /booking-requests/:id/status` (the web no longer offers it, plan A71); "Remind driver" has no
  endpoint yet; "Plate checked by KerayeGo" (A87) needs the listing to say so.
- **Still-open bugs worth doing next:** backend error messages are lost in several carpool/review/chat
  paths; chat history shows only the oldest 50 messages; the rider live view's arrived/no-show state is
  lost on reload; the phone gate can't show in a fresh tab (§32.1).
- **Partner-app parity gaps:** manager-only invitees can't reach their invitation on the web; job-answer
  rules differ (§21.8).

---

## 1. Overview

`kerayego-web` is the Next.js site for KerayeGo's two marketplaces — vehicle rental (businesses list
cars, customers send booking requests; always with the business's driver) and intercity carpooling (any
account posts a trip in its own car; others request seats). It talks only to `kerayego-backend`.

What the web does:

| Area | Where | Section |
|---|---|---|
| Public browsing + SEO (rental listings, providers, carpool routes, guides, price index) | `(public)`, `app/page.tsx` | §23 |
| Sign-in / sign-up (phone + WhatsApp code; email code as backup), phone verification, account deletion | `(auth)`, `components/auth`, `components/account` | §6, §7 |
| Customer dashboard (own rental requests — sent in the app since A82 —, carpool trips/requests, personal vehicles, reviews, settings) | `(dashboard)` | §11–§16 |
| **Carpool day-of layer** — driver cockpit, rider live view, live location over Socket.IO, chat | `components/trips/live`, `lib/realtime` | §14 |
| **Business portal** for business admin, managers and drivers (plan A69) | `(provider)`, `(driver)` | §17–§21 |
| KerayeGo admin console | `(admin)` | §22 |

What the web does **not** do: push notifications (toasts only, §30); a rental driver's on-trip session
(Start/End job, sharing the driver's location — Partner app only; the web explains it, §21.6); an
offline action queue or GPS geofencing (§14.6); customer or rider location sharing; the rental customer's
live view of their driver (`bookingsApi.getLiveDriver`/`getLiveRoute` exist but nothing calls them).

---

## 2. Folder structure

```
kerayego-web/
  middleware.ts            Edge routing by cookies (UX only — the backend is the real gate)          §5
  next.config.mjs          Images, security headers, redirects                                        §3
  app/
    layout.tsx             Root: fonts, metadata, JSON-LD, GA, QueryProvider, AuthBootstrap,
                           PhoneGateListener, Toaster                                                §6.7
    page.tsx               Homepage — NOT inside (public); own navbar + footer                        §23.1
    error.tsx, global-error.tsx, not-found.tsx
    sitemap.ts, robots.ts, opengraph-image.tsx                                                         §23.4
    vehicles/[slug]/route.ts   301 from old /vehicles/<slug> URLs
    (auth)/                login, register, verify-email, verify-phone                                §6
    (dashboard)/           customer portal /dashboard/*                                               §11–§16
    (provider)/            business portal /provider/* (+ a PROVIDER account's own carpool pages)    §17–§20
    (driver)/              driver portal /driver/*                                                    §21
    (admin)/               KerayeGo admin /admin/*                                                    §22
    (public)/              public pages, incl. /delete-account, /account/cancel-deletion              §23
  components/
    ui/                    Hand-rolled design-system primitives (barrel index.ts)                     §26
    common/                Logo, StatusBadge, ReviewsList, RatingSummaryBadge, Reveal, TrackEvent,
                           AppDownloadButtons, GuideByline
    layout/                DashboardSidebar, AdminSidebar (live), MobileSidebarBar, PublicNavbar,
                           IdentityHoldBanner, ActiveRideBanner
    auth/                  PhoneAuthFlow, SignInCodeStep
    account/               phone gate/listener/card/flow, PersonalInformationSection,
                           WhatsAppUpdatesCard, DeleteAccountForm, CancelDeletionByToken
    workspace/             PortalFrame, SidebarLinks, WorkspaceScreens, WorkspaceSwitcher             §17.2
    provider/              ProviderPortal, ProviderSidebar
    business/              profile/*, documents/*, team/*                                             §17
    ops/                   ConfirmModal, bookings/* (incl. RouteCard, CarClashWarning), fleet/*,
                           live-map/*, ratings/*                                                      §18–§20
    driver/                DriverPortal, DriverSidebar, setup/* steps, JobPlaces, modals              §21
    admin/                 shared admin table/header/badges/dialogs, BusinessActivityCard, DriverPhoto,
                           PersonBlockParts; AdminSidebar.tsx is an empty `export {}` stub            §22
    trips/                 carpool forms/lists/inbox/cards; live/* = cockpit, rider view, chat, map   §13–§14
    user-vehicles/         personal-vehicle wizard, list, detail                                      §15
    reviews/               EligibleReviewsList                                                        §16
    home/, listings/ (incl. CarRatingLine), vehicles/ (incl. AppRequestCta), providers/, maps/,
    analytics/                                                                                         §23–§24
    uploads/               ImageUpload, DocumentUpload — both DEAD (zero importers)                  §25
  hooks/                   26 files, mostly React Query wrappers per domain                           §10
  lib/
    api/                   client.ts (axios), server.ts (SSR fetch), 19 *.api.ts                      §9
    realtime/ride-socket.ts  Socket.IO singleton for /ride                                            §14.1
    workspace/             workspaceSelection (permission table), workspaceRoutes, businessStatus     §17.1
    ops/                   bookings (bookingDisplay, bookingRoute), fleet/photo/live-map/rating rules
                           (Partner-app ports)                                                        §18–§20
    driver/                driver setup steps, verification, jobs, jobPlaces, working hours, errors   §21
    business/, documents/, team/, activity/    business-portal helpers                                §17
    config/                markets (backend mirror), cityProfiles, apps (store links)                 §23.7
    providers/             query-provider, auth-bootstrap
    utils/                 cn, auth-cookies, analytics, copy, currency, datetime, geo-distance,
                           geolocation, pagination, phone, rentalDuration, safeRedirect, userLocation,
                           vehicleUrl
    validations/           11 Zod schema files                                                        §27
  store/                   auth (persisted), phone-gate, workspace, ui (dead)                         §8
  types/                   enums.ts, api.types.ts + booking-requests, driver, fleet, live-map, team,
                           workspace types                                                            §28
```

---

## 3. Next.js configuration & code conventions

- **`next.config.mjs`**
  - `reactStrictMode: true`.
  - `images.remotePatterns`: `storage.googleapis.com` (Google Cloud Storage, the backend's `GcsAdapter`)
    and `*.s3.*.amazonaws.com` (legacy S3 test uploads, "remove once old rows are cleared");
    `formats: ['image/avif','image/webp']`. If the backend's `GCS_PUBLIC_BASE_URL` points at a CDN, add
    that host here.
  - `experimental.optimizePackageImports`: `lucide-react`, `framer-motion`, `@radix-ui/react-dialog`,
    `@radix-ui/react-dropdown-menu` (dropdown-menu is unused; `react-alert-dialog`, which is used, is
    missing).
  - Headers on every path: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
    `Referrer-Policy: strict-origin-when-cross-origin`,
    `Permissions-Policy: camera=(self), microphone=(), geolocation=(self)` (camera = the driver's live
    selfie, §21.3; geolocation = "Use my location" and the carpool driver's location sharing).
  - Redirects: host `rentalmarket.vercel.app` → `https://www.kerayego.com/:path*` (301, exact host only;
    preview deployments keep working); `/provider` → `/provider/dashboard` and `/admin` →
    `/admin/dashboard` (temporary); 2026-08-28 URL renames `/car-rental/:path*` → `/rent-a-car/:path*`,
    `/trips` → `/carpool`, `/vehicles` → `/rent-a-car` (permanent). Old `/vehicles/<slug>` links are
    resolved by `app/vehicles/[slug]/route.ts` (§23.2). There is no `/driver` redirect — bare `/driver`
    is a 404.
- **`tsconfig.json`**: strict, `noEmit`, `moduleResolution: bundler`, `incremental: true` (so
  `npm run type-check` writes `tsconfig.tsbuildinfo`). Path aliases (`@/*`, `@components/*`, `@lib/*`,
  `@hooks/*`, `@store/*`, `@types/*`, `@config/*`) are declared, but **no file uses any of them — every
  import in the repo is relative** (`'../../../hooks/useAuth'`). Follow that convention. `@config/*`
  points at `./config/*`, which doesn't exist (config lives in `lib/config`).
- **Prettier** (`.prettierrc`): single quotes, trailing commas everywhere, print width 100,
  `prettier-plugin-tailwindcss`. `npm run format` rewrites `**/*.{ts,tsx,md}` — Markdown included.
- **ESLint** (`.eslintrc.json`): only `next/core-web-vitals`; the installed `@typescript-eslint/*`
  packages are not configured.
- `postcss.config.js` is CommonJS (tailwindcss + autoprefixer).
- Rendering: dashboard, business, driver and admin pages are all client components (`'use client'`);
  public browse pages are server components that hand interactive parts to client components.

---

## 4. Route groups & layouts

Six route groups plus the root homepage:

| Group | URLs | Layout | Access (middleware, §5) |
|---|---|---|---|
| `(auth)` | `/login`, `/register`, `/verify-email`, `/verify-phone` | Server layout: Logo, BackButton, footer (Privacy, Terms); metadata title default `'Account'` | Signed-in users are sent away from `/login` and `/register` only |
| `(dashboard)` | `/dashboard/*` | `PhoneVerificationGate` → `IdentityHoldBanner`, `ActiveRideBanner basePath="/dashboard"`, `MobileSidebarBar brand="KerayeGo"` + `DashboardSidebar` | `USER` (a `PROVIDER` is sent to `/provider/dashboard`, except shared carpool sections, which are remapped) |
| `(provider)` | `/provider/*` | `PhoneVerificationGate` → `ProviderPortal` (guards each route by `can()`) → `PortalFrame` | `USER` and `PROVIDER` — business access is by membership (§17) |
| `(driver)` | `/driver/*` | `PhoneVerificationGate` → `DriverPortal` → `PortalFrame brand="KerayeGo Driver"` | `USER` and `PROVIDER` |
| `(admin)` | `/admin/*` | `MobileSidebarBar brand="KerayeGo Admin"` + `components/layout/AdminSidebar` (rendered twice: drawer + desktop). **No phone gate, no role check of its own.** | `ADMIN`, `SUPER_ADMIN` |
| `(public)` | everything else public | `PublicNavbar` + footer (©, About Us, FAQ, Guides, Safety, Contact, Privacy Policy, Terms & Conditions, Delete account, `AppDownloadButtons variant="links"`) | none |
| root | `/` | `app/page.tsx` sits outside `(public)`, so it renders its own `PublicNavbar` and a richer footer (§23.1) | none |

`PortalFrame` (`components/workspace/PortalFrame.tsx`, shared by `/provider` and `/driver`) renders
`IdentityHoldBanner`, `ActiveRideBanner` (base path `/provider` for a `PROVIDER` account, otherwise
`/dashboard`), then either the sidebar (desktop aside + `MobileSidebarBar`) or a plain top bar, and a
`<main>` with `overflow-y-auto`, `mx-auto max-w-5xl`.

**Error boundaries** (`error.tsx`): `app/`, `(admin)`, `(dashboard)`, `(driver)`, `(provider)`,
`(public)` — each styled separately; `(auth)` has none. Only `(public)`'s offers an escape link
("Browse vehicles"). `app/global-error.tsx` renders its own `<html>/<body>` and says "Our team has been
notified" although there is no error reporting. `app/not-found.tsx` links "Back to home".

**`loading.tsx`** (8 files): `(admin)/admin/providers`, `users`, `users/[id]`, `vehicles`,
`vehicles/[id]`; `(dashboard)/dashboard` and `dashboard/inquiries`; `(provider)/provider/vehicles` (it
also covers `vehicles/new` and `[id]/edit`, and uses legacy `slate-*` colours). The admin vehicles
skeleton draws cards while the page is a table. `(public)`, `(driver)`, `(auth)` have none.

---

## 5. Middleware & the access model

`middleware.ts` runs at the edge and can't verify a JWT. It reads two plain, client-set cookies —
`userRole` and `emailVerified` (§6.1). **It is UX routing only; the backend's guards are the real
security boundary.**

- Matcher skips `api`, `_next/static`, `_next/image`, `favicon.ico`, `images`, `icons`, `fonts`.
- `AUTH_ROUTES = ['/login','/register']` — a signed-in visitor goes to their role's dashboard
  (`ROLE_DASHBOARDS`: USER `/dashboard`, PROVIDER `/provider/dashboard`, ADMIN/SUPER_ADMIN
  `/admin/dashboard`); any `callbackUrl` is ignored.
- `PROTECTED_ROUTES = ['/dashboard','/provider/','/driver/','/admin']` (prefix match; note the trailing
  slashes):
  1. No `userRole` cookie → `/login?callbackUrl=<pathname>`.
  2. `emailVerified` cookie not `'true'` → `/verify-email?redirect=<pathname>` (query string dropped).
  3. **Shared carpool sections** — `trips`, `trip-inquiries`, `my-vehicles`, `incoming-requests`,
     `reviews` — are remapped between `/dashboard/` and `/provider/` to the role's own copy, keeping the
     query string (a PROVIDER following `/dashboard/trips/new` lands on `/provider/trips/new`, and the
     reverse for a USER). `inquiries` is deliberately not shared (§13.3).
  4. `ROLE_ROUTES`: USER → `/dashboard`, `/provider/`, `/driver/`; PROVIDER → `/provider/`, `/driver/`;
     ADMIN/SUPER_ADMIN → `/admin`. Anything else → the role's dashboard.
- Not handled: `/verify-email`, `/verify-phone`, `/delete-account`, `/account/*`.
- Role keys are hardcoded strings, not the `Role` enum. An unknown `userRole` value would redirect to
  `/undefined`.
- The header comment (`middleware.ts:57-67`) is wrong — it describes reading sessionStorage via a header
  and a `refreshToken` cookie; the inline comment at `:72-74` describes what actually happens.

What a person sees **inside** `/provider/*` and `/driver/*` is decided client-side by the active business
dashboard (§17.1). The phone gate (§6.6) is also client-side.

---

## 6. Authentication & session

There are **no passwords** on the web (removed 2026-11-01, plan A11/A21). Sign-in and sign-up are one
phone-first flow; an emailed code is the backup sign-in.

### 6.1 Where session state lives (four places, loosely synced)

1. **Access token** — a module variable in `lib/api/client.ts`, memory only, wiped on reload.
2. **Zustand store** `store/auth.store.ts` — persisted to **sessionStorage** key `auth-user`
   (`partialize` → `{user, isAuthenticated}` only); `isLoading` stays true until rehydrated.
3. **Cookies** `userRole`, `emailVerified` (`lib/utils/auth-cookies.ts`): 7-day expiry,
   `sameSite: strict`, `secure` on https. The only signal middleware can read. They're set at sign-in
   and **never re-set on token refresh**, so they expire 7 days after sign-in even if the session lives
   on.
4. **`['users','me']` React Query cache** (`hooks/usePhoneVerification.ts`) — drives the phone gate,
   the identity-hold banner and the account page.

The backend's refresh token is an httpOnly cookie on the API origin (path `/v1/auth`); web JS never sees
it and never sends `X-Client-Type`.

**Fresh-tab state:** sessionStorage is per tab but cookies are shared, so a new tab passes middleware
with an empty store. Requests then succeed only via 401 → cookie refresh, the store is never filled
(sidebar identity hidden, "Welcome back, there"), and the phone gate can't show (§32.1).

### 6.2 Phone-first sign-in / sign-up (`components/auth/PhoneAuthFlow.tsx`)

`/login` and `/register` both render it (`intent` only changes wording). The backend decides sign-in
vs sign-up.

1. **Number** — free-form phone (`sendPhoneCodeSchema`: non-empty, ≤ 20 chars; the backend normalises
   `0300…`/`+92…`/`+966…`/`+971…` to E.164) → `POST /auth/phone/request` → cooldown from
   `resendInSeconds`. A 429 `CODE_RESEND_TOO_SOON` starts the cooldown and shows "A code was sent a moment
   ago. Enter that code".
2. **Code** — "We sent a 6-digit code to your WhatsApp.", the number with "Change", "Send again" after
   the cooldown (`hooks/useCountdown.ts`) → `POST /auth/phone/verify`. If `needsSignup` is false:
   token in memory, user in the store, `setAuthCookies(role, true)`, toast "Welcome back!" (or the
   deletion-cancelled message), then `routeAfterSignIn`.
3. **Profile** (new numbers only) — "I want to" `RadioCard` ("Rent a vehicle" = USER, "List my fleet" =
   PROVIDER; `/register?role=PROVIDER`, case-insensitive, preselects business), full name, email
   (`phoneProfileSchema`) → `POST /auth/phone/register {signupToken, name, email, role}` →
   `trackEvent('sign_up', {role, method:'phone'})` (+ `provider_signup` for a business) → "Welcome to
   KerayeGo!" → `routeAfterSignIn`. The email is confirmed later by the emailed link.

Errors (wording in `phoneErrorInfo()`, `hooks/usePhoneVerification.ts`): 401 `CODE_INVALID` and 403
suspended under the code field; 429 `CODE_RESEND_TOO_SOON` / `CODE_LIMIT_REACHED`; 502
`WHATSAPP_SEND_FAILED`; 503 `WHATSAPP_UNAVAILABLE`; 400 invalid number. On the profile step
`SIGNUP_TOKEN_INVALID` (or any 401) and 409 `PHONE_TAKEN` return to the number step with a notice; 409
`EMAIL_TAKEN` shows under the email field with a "Sign in with email instead" link
(`/login?method=email&email=…`); anything else (e.g. 403 `IDENTITY_BLOCKED`) shows the server message.

While WhatsApp codes are switched off (testing code instead, see `docs/WHATSAPP_ACTIVATION.md` at the
root), the web still says "We sent a 6-digit code to your WhatsApp" — it ignores the backend's
`codeSent`, `messageUsUrl` and envelope `message` (§32.1). The web no longer calls `POST /auth/register`.

### 6.3 Email sign-in (backup)

`/login?method=email` (keeps `callbackUrl`; `?email=` prefills): `POST /auth/code/request` (always the
same 200 `{message, resendAfterSeconds}`) → `SignInCodeStep` → `POST /auth/code/verify` →
`setAuthCookies(role, isIdentityVerified(user))`. If the account has neither a verified email nor a
verified phone it goes to `/verify-email[?redirect=]`; otherwise `routeAfterSignIn`. "Use a different
email" goes back; "Use your mobile number instead" returns to the phone flow. Sign-up is phone-only.

`isIdentityVerified()` (`hooks/useAuth.ts`) = `emailVerified || phoneVerified === true`.

### 6.4 After sign-in — `useAuth().routeAfterSignIn` (`hooks/useAuth.ts:109-120`)

Destination = `callbackUrl` (or `redirect`) if it passes `safeRedirect`, else the role's dashboard
(`roleToRoute`). An account with `mustVerifyPhone` goes to `/verify-phone?redirect=<destination>` first.
Then `router.refresh()`. `deletionCancelled: true` → toast "Welcome back. Your account deletion has been
cancelled."

**Redirect params are same-site only** (`lib/utils/safeRedirect.ts`, 2026-11-10): a value must start with
`/`, not `//`, and contain no backslash or control character (browsers read `/\host` as `//host`);
anything else is dropped. Applied where the param is read (`/login`, `/register`, `/verify-email`,
`/verify-phone`) and again in `routeAfterSignIn`. Before this, `/login?callbackUrl=https://other.site`
left the site after a real sign-in.

### 6.5 `/verify-email` and `/verify-phone`

- **`/verify-email`** — the target of the backend's live verification emails (and of middleware step 2).
  `?token=` → `POST /auth/verify-email` → cookie + `user.emailVerified` patched. Signed in and
  `isIdentityVerified` → self-heals: sets the cookie and goes to the (sanitised) `redirect`, else the
  user's own role's dashboard. Pending state offers "Resend verification email"
  (`POST /auth/resend-verification`, 60 s local cooldown) only when signed in and the email isn't
  verified — so a phone-verified person never reaches it.
- **`/verify-phone`** — signed out → `/login`; waits for `/users/me`; `!mustVerifyPhone` → target;
  otherwise `PhoneVerificationCard` as a page; on success toast "Your mobile number is verified." and go
  to `safeRedirect(redirect)` or the dashboard.

### 6.6 WhatsApp phone verification gate (2026-11-01)

The client never decides whether verification is required — it follows `user.mustVerifyPhone` from the
backend (with `phoneVerified`, `whatsappUpdates`, mirrored in `types/api.types.ts` with `PhoneErrorCode`).

- **Gate** — `components/account/PhoneVerificationGate.tsx` wraps the `(dashboard)`, `(provider)` and
  `(driver)` layouts. While the store says signed in, the user isn't an admin and
  `account.mustVerifyPhone` is true, it replaces the whole portal with the Logo + verify card (only exits:
  verify, or Sign out). `account` = `/users/me` when its id matches the stored user, else the stored user.
  `(admin)` and public pages are not gated.
- **Card/flow** (`PhoneVerificationCard` + `PhoneVerificationFlow`) — prefilled number → "Send code on
  WhatsApp" (disabled during cooldown) → `POST /users/me/phone/send-code` (an `alreadyVerified` answer
  short-circuits: refetch, done) → 6-digit code → `POST /users/me/phone/verify` → the returned user
  replaces both the `['users','me']` cache and the stored user.
- **403 `PHONE_NOT_VERIFIED`** from any request: `client.ts:83-90` raises a flag
  (`store/phone-gate.store.ts`) and rejects (no refresh). `PhoneGateListener` (root layout) refetches
  `/users/me` (staleTime 0), updates the store if the ids match, and — unless the path is under
  `/dashboard`, `/provider`, `/driver`, `/admin` or `/verify-phone` — pushes
  `/verify-phone?redirect=<path+search>`; then lowers the flag.

### 6.7 Root layout, session restore and 401 handling

- `app/layout.tsx`: fonts Outfit (300–700, exposed as the CSS variable `--font-inter`) and IBM Plex
  Mono; metadata (title template `'%s | KerayeGo'`, OG locale `en_PK`, twitter `@Kerayego`, robots
  index/follow, **root `alternates.canonical: siteUrl`** — inherited by any page that doesn't set its
  own); `themeColor #1A0F14`; JSON-LD Organization (`areaServed` PK) + WebSite SearchAction
  (`/rent-a-car?search=`). Renders `<GoogleAnalytics/>` (outside providers), then `QueryProvider` →
  `AuthBootstrap`, `PhoneGateListener`, children, `<Toaster position="top-right" richColors closeButton/>`.
  `siteUrl` = `NEXT_PUBLIC_SITE_URL` or `https://www.kerayego.com`.
- `AuthBootstrap` (`lib/providers/auth-bootstrap.tsx`): if the store says signed in, calls
  `refreshAccessToken()` once on mount (failures swallowed).
- `client.ts`: axios, `withCredentials: true`, timeout 30 000 ms, exports `API_BASE_URL` (used by the
  socket). Request interceptor adds `Authorization: Bearer <token>`. On a 401 it runs **one shared
  in-flight** `POST /auth/refresh` (reads `data.data.accessToken`; shared with `AuthBootstrap` so a
  rotated refresh token is never presented twice) and retries once — except for URLs containing
  `/auth/refresh`, `/auth/code/` or `/auth/phone/`, whose 401s are answers.
- **Refresh failure**: `setAccessToken(null)`, remove the `userRole` cookie, `window.location.href =
  '/login'` — from any page, public ones included. It does not clear the store (still
  `isAuthenticated: true`) or the `emailVerified` cookie.

### 6.8 Logout and other cleanup paths

`useAuth().logout()`: `POST /auth/logout`, then `clearAuth()`, `clearAuthCookies()`, `router.push('/')`.
Two other paths clear differently: the refresh-failure path above and `DeleteAccountForm` (store +
cookies, no logout call). **None clears the React Query cache** or disconnects the ride socket; the
remembered dashboard (`kerayego.workspace.<userId>`) is never removed (the Partner app clears its copy).

### 6.9 Identity hold

`components/layout/IdentityHoldBanner.tsx` shows an amber `role="status"` bar ("Your account is being
checked by KerayeGo. You can browse, but booking, posting trips and driving are paused…") while
`['users','me'].identityHold` (inline `useQuery`, falling back to the stored user) is true. Mounted in
`(dashboard)/layout.tsx` and `PortalFrame` — not in admin. Driver actions refused with
`IDENTITY_ON_HOLD` show "Your account is being checked" and refetch `/users/me` (`lib/driver/errors.ts`).
Background: plan A66 (phone/CNIC match → hold until an admin checks, §22.10).

---

## 7. Account

- **`/dashboard/settings`** ("Account Settings") renders `PersonalInformationSection`, also used on
  `/provider/profile` (Personal information tab and the create-business flow):
  1. "Email verification" card — verified, or "not verified yet" + "Resend verification email" (60 s).
  2. "Personal information" form — full name (PATCH `/users/me {name}`), mobile number row (formatted
     number or "No number yet"; "Verified" badge + "Change number", or "Not verified · Verify" — both open
     a `Modal` running the send-code → verify flow; there is no plain phone PATCH), read-only email.
  3. `WhatsAppUpdatesCard` — "WhatsApp updates" switch → `PATCH /users/me {whatsappUpdates}`, optimistic
     with rollback (toast "Could not update your WhatsApp setting. Try again."), disabled with "Verify
     your number first" until `phoneVerified`.
- A `PROVIDER` account can't open `/dashboard/settings` (middleware). Its personal information is only on
  `/provider/profile`, which a PROVIDER working only as Manager or Driver can't open — likely no route to
  their personal details (§32.2).
- **Account deletion** (plan A16/A20/A51):
  - `/delete-account` (public, canonical + Breadcrumb JSON-LD; the page Google Play links to). Signed
    out → "Sign in to delete your account" (`/login?callbackUrl=/delete-account`). Signed in → email,
    optional reason (≤ 500), "Delete my account" → `ConfirmDialog` → `POST /users/me/delete-request` →
    store and cookies cleared, "Deletion requested. You have been signed out." with the scheduled date
    (72 h window on the backend).
  - Cancel: sign in again (both flows toast the deletion-cancelled message) or the emailed link
    `/account/cancel-deletion?token=` (noindex) → `POST /users/cancel-delete-by-token`, once.
  - `/delete-account` is linked from the homepage footer, the `(public)` footer and the privacy page —
    not from `/dashboard/settings`. Its support address is a personal Gmail.

---

## 8. State management

- **Server state**: TanStack React Query v5. One `QueryClient` (`lib/providers/query-provider.tsx`):
  staleTime 60 s, gcTime 5 min, no retry on 4xx (otherwise 2 retries), `refetchOnWindowFocus: false`,
  mutations never retried; Devtools in development only. Not everything goes through it: `useAuth`,
  `PhoneAuthFlow`, `/verify-email`, the name save/resend in `PersonalInformationSection`,
  `CreateBusiness` (`providersApi.create`) and `hooks/useUpload.ts` call the API directly with local
  state. Several components run inline `useQuery`s instead of named hooks: `TripsView`, `VehiclesView`,
  `ProvidersView`, `ProviderVehiclesSection`, `IdentityHoldBanner`, both `inquire` pages,
  `useRiderLiveRoute`.
- **Client state** (Zustand): `auth.store.ts` (persisted, §6.1); `phone-gate.store.ts` (the
  `PHONE_NOT_VERIFIED` flag); `workspace.store.ts` (active business dashboard per user, written to
  localStorage `kerayego.workspace.<userId>` by hand, every access in try/catch; user id `''` → memory
  only); `ui.store.ts` (`sidebarOpen`) is **dead** — zero importers.
- **URL state**: `/rent-a-car`, `/carpool/[route]`, `/providers` and the business bookings inbox keep
  filters/page in the URL. `ProviderVehiclesSection` (public provider page), the favourites toggle and all
  admin filters use local state (lost on navigation).
- **Cookies**: `userRole`, `emailVerified` (§6.1); `userLocation` (§24.4).

---

## 9. API layer

### 9.1 `lib/api/client.ts` and the response envelope

The backend wraps every success as `{success: true, data, message?, meta?}` (its `TransformInterceptor`);
errors are `{error: {code, message, details?}}`. **Wrappers are inconsistent about unwrapping** — check
the file before using a result:

| File | Returns |
|---|---|
| `activity-logs.api.ts` | `list` → `{data, meta}`; `actors` → unwrapped (imports its types from `admin.api.ts`) |
| `admin.api.ts` | single items unwrapped (`res.data.data`); paged lists `{data, meta}` |
| `auth.api.ts` | **envelope** (`res.data`) for every call; `useAuth` unwraps |
| `booking-requests.api.ts`, `bookings.api.ts`, `vehicles.api.ts`, `live-map.api.ts`, `driver.api.ts`, `team.api.ts`, `workspaces.api.ts`, `trips.api.ts`, `trip-inquiries.api.ts`, `user-vehicles.api.ts`, `reviews.api.ts`, `media.api.ts`, `geo.api.ts` | unwrapped; paged lists `{data, meta}` (`bookings.api.ts` until 2026-11-10 returned the envelope — the dashboard-counters bug, §11) |
| `providers.api.ts` | **envelope** for `create`, `getMyProfile`, `update`, `submitForReview`, `createShowroom`, `updateShowroom` (hooks unwrap); `getAllPublic` → `{data, meta}` |
| `users.api.ts` | mixed: `getMe`, `updateMe`, saved-vehicles → envelope; phone send/verify, deletion → unwrapped |

**Error helpers.** The app-wide `getApiErrorMessage`/`getApiErrorCode` live, oddly, in
`hooks/useAccountDeletion.ts` (read `response.data.error.*`; ~37 importers). Others:
`lib/ops/apiError.ts` (`apiErrorInfo`/`apiErrorMessage`, status-kinded, Partner-app twin),
`lib/driver/errors.ts` (a second `getApiErrorCode` returning a string), `phoneErrorInfo`. Some code reads
`response.data.message` instead, which the backend never sends (§32.1).

### 9.2 `lib/api/server.ts` — public SSR data

Native `fetch` from Server Components, **never** with auth headers. `serverFetch` takes `revalidate`
(seconds, default 60) and `tags`, or `noStore: true` for `cache: 'no-store'`, and returns `null` on any
error or non-OK response — callers treat `null` as "no data". Don't pass `revalidate: undefined` to
mean "no cache": with no `cache` option Next 14 then auto-caches with no expiry.

| Function | Path | Revalidate (tags) |
|---|---|---|
| `fetchListings` | `/listings?…` | 60 |
| `fetchVehicleBySlug` | `/listings/:slug` | never cached (`noStore`, see below) |
| `fetchFeaturedListings` | `/listings/featured` | 300 (`featured-listings`) |
| `fetchDistinctMakes` / `fetchDistinctCities` | `/listings/meta/makes` / `cities` | 3600 |
| `fetchPriceIndex` / `fetchPriceIndexHistory` | `/listings/meta/price-index` (`/history`, ≤ 24 monthly snapshots) | 3600 |
| `fetchAllProviders` | `/providers` | 120 (`providers`) |
| `fetchProviderBySlug` | `/providers/:slug` | 60 (`provider-<slug>`) |
| `fetchTrips` / `fetchTripById` | `/trips`, `/trips/:id` | 30 / 30 |
| `fetchTripMetaCities` / `fetchTripRouteGroups` | `/trips/meta/cities` / `routes` | 300 / 60 |
| `fetchRatingSummary` | `/reviews/summary` | 300 |
| `fetchWeeklyMonthlyListings` / `fetchWeeklyMonthlyCount` | `/listings?city&weeklyMonthly=true` (plan A84) | 60 — null / 0 when the backend rejects the filter (before 2026-11-11) or a car without `offersWeeklyMonthly` comes back |

`revalidateTag`/`revalidatePath` are never called, so the tags do nothing. **`fetchVehicleBySlug` is
never cached** (`cache: 'no-store'`): each render increments the view counter, and price, status and
booked-until must be current. `generateMetadata` and the page make the same GET in one render, which
React de-duplicates, so a view is one request. (Until 2026-11-10 it passed `revalidate: false`, which
`serverFetch` turned into `revalidate: undefined`; with no `cache` option Next 14.2.35 then took its
"auto cache" path — `node_modules/next/dist/server/lib/patch-fetch.js:356-369` — so vehicle pages and the
`/vehicles/[slug]` redirect were served from the Data Cache with no expiry.)

### 9.3 Endpoint index (what each wrapper calls)

- **auth**: `POST /auth/phone/request|verify|register`, `/auth/code/request|verify`, `/auth/logout`,
  `/auth/refresh` (`authApi.refresh` is dead; the live refresh is `client.ts`), `/auth/verify-email`,
  `/auth/resend-verification`.
- **users**: `GET|PATCH /users/me`, `POST /users/me/phone/send-code|verify`,
  `GET|POST /users/me/saved-vehicles`, `DELETE /users/me/saved-vehicles/:id`,
  `POST /users/me/delete-request`, `POST /users/cancel-delete-by-token`, `GET /users/me/workspaces`.
- **listings/providers/geo/media**: `GET /listings`, `/listings/:slug`; `GET /providers`, `POST /providers`,
  `GET|PATCH /providers/me`, `POST /providers/me/submit-for-review`,
  `POST|PATCH|DELETE /providers/me/showrooms[/:id]`; `GET /geo/reverse`, `GET /geo/route-directions`;
  `POST /media/upload`, `DELETE /media/:publicId`.
- **business portal**: `GET /providers/me/team`, `POST /providers/me/team/invites`,
  `POST /providers/me/team/:id/reinvite`, `DELETE /providers/me/team/:id`;
  `GET /providers/me/activity-logs[/actors]`; `GET /vehicles`, `POST /vehicles`, `GET|PATCH|DELETE
  /vehicles/:id`, `POST /vehicles/:id/submit-for-review`, `POST /vehicles/:id/images`,
  `DELETE /vehicles/:id/images/:imageId`, `PATCH /vehicles/:id/images/reorder`;
  `GET /provider/inquiries[/counts]`, `GET /booking-requests/:id`, `PATCH /booking-requests/:id/status`,
  `GET /booking-requests/:id/eligible-drivers`, `PATCH /booking-requests/:id/driver`;
  `GET /providers/me/live-drivers[/:bookingId/route]`.
- **driver**: `GET|PATCH /driver/profile`, `POST /driver/profile/agreements`, `POST /driver/profile/submit`,
  `GET /driver/businesses`, `POST /driver/businesses/:id/accept|leave`, `GET /driver/jobs`,
  `POST /driver/jobs/:id/respond`, `GET /driver/jobs/:id/return-trip-template`, `POST /trips` (return trip).
- **customer rental**: `GET /booking-requests`, `GET /booking-requests/counts`,
  `PATCH /booking-requests/:id/status` (`getOne`, `getLiveDriver`, `getLiveRoute` unused). No
  `POST /booking-requests` since 2026-11-12 — requests are sent in the app (A82); the web never calls
  `POST /booking-requests/estimate`.
- **listings**: also `GET /listings?weeklyMonthly=true` (the weekly & monthly pages); cards and the detail
  carry `carRating` and `offersWeeklyMonthly`, no week/month prices (A79, A87).
- **carpool**: `GET /trips`, `/trips/:id`, `POST /trips`; `GET /my/trips[/:id]`,
  `PATCH /my/trips/:id/cancel`, `POST /my/trips/:id/start|events|end`, `GET /my/trips/:id/manifest`,
  `GET /my/active-ride`; `POST|GET /trip-inquiries`, `GET /trip-inquiries/:id`,
  `PATCH /trip-inquiries/:id/status`, `GET /trip-inquiries/:id/messages`, `GET /my/trip-inquiries`;
  `POST|GET /my/vehicles`, `GET /my/vehicles/approved`, `GET|DELETE /my/vehicles/:id`. Unused wrappers:
  `tripsApi.update`/`getMetaCities`/`getRouteGroups`, `tripInquiriesApi.getMyCounts`/`getInboxCounts`.
  No wrapper for the backend's `PATCH /my/vehicles/:id`.
- **reviews**: `POST /reviews`, `GET /reviews`, `GET /reviews/summary`, `GET /reviews/my/eligible`.
- **admin**: §22.12.

---

## 10. Hooks & query keys

| File | Hooks → keys (notes) |
|---|---|
| `useAuth` | plain callbacks, no React Query: `requestPhoneCode`, `verifyPhoneCode`, `registerWithPhone`, email code calls, `routeAfterSignIn`, `logout`, `isIdentityVerified`, role helpers |
| `usePhoneVerification` | `useMe` `['users','me']` (60 s); `useApplyUser`; `useSendPhoneCode`; `useVerifyPhoneCode`; `useUpdateWhatsAppUpdates` (optimistic); `phoneErrorInfo`; `useCurrentAccount` |
| `useAccountDeletion` | `useRequestAccountDeletion`, `useCancelAccountDeletionByToken`; app-wide `getApiErrorMessage`/`getApiErrorCode` |
| `useCountdown` | `[seconds, setSeconds]` |
| `useWorkspace` | `['workspaces','mine',userId]` (60 s); `can()`, `select()`, `invalidateWorkspaces()` (§17.1) |
| `useProviderProfile` | `['provider','me']`; update/submit/showroom mutations |
| `useBusinessDocuments` | mutation keys `['business-documents',…]`; `useOpenBusinessDocument` (local state) |
| `useTeam` | `['team','list']`; invite/reinvite/remove (cache writes, no toasts) |
| `useActivityLogs` | `['activity-logs','list',category,actor]` (infinite, 30/page); `['activity-logs','actors']` |
| `useBusinessRatings` | `useCustomersToRate` → `['reviews','my','eligible']` (shared key); `useRateCustomer` |
| `useVehicles` | `['vehicles','my',filters,page]`, `['vehicles','my','infinite']`, `['vehicles','detail',id]`; create/update/submit/archive + photo add/remove/reorder — all refresh the car and `['vehicles','my']` |
| `useBookingRequests` | `['booking-requests','list',filter,page]`, `['booking-requests','counts']`, `['booking-requests','detail',id]`, `['booking-requests','eligible-drivers',id]` (staleTime 0); status/driver mutations refresh `['booking-requests']` + `['live-map']` |
| `useLiveMap` | `['live-map','drivers']` (10 s), `['live-map','route',id]` (15 s) |
| `useDriverProfile` | `['driver','profile']`; step save, submit, agreements, uploads, open document |
| `useDriverJobs` | `['driver','jobs']`; respond; `['reviews','my','eligible']`; rate customer; `['driver','return-trip-template',id]`; create return trip |
| `useDriverBusinesses` | `['driver','businesses']`; accept, leave |
| `useBookings` | `['bookings','my',page,limit]`, `['bookings','counts']` (60 s), `useBooking` (no callers); update status (no create since A82) |
| `useTrips` | `['trips','my',params]`, `['trips','my','detail',id]`, `['trips','my','manifest',id]` (20 s), `['trips','active-ride']` (20 s); create (GA `offer_ride`), cancel, start, record event, end |
| `useTripInquiries` | `['trip-inquiries','my',page,limit]`, `['trip-inquiries',id]` (15 s only while IN_PROGRESS), `['trip-inquiry-inbox',params]` (30 s); create (GA `join_ride`), update status (invalidates `trip-inquiries`, `trip-inquiry-inbox`, `trips`, `trip`) |
| `useUserVehicles` | `['user-vehicles','my']`, `…,'approved'`, `…,'detail',id`; create, delete |
| `useReviews` | `['reviews',type,id,page]`, `['reviews','summary',type,id]` (60 s), `['reviews','my','eligible']`; create (invalidates `['reviews']`) |
| `useSavedVehicles` | `['savedVehicles',page,limit]`, `['savedVehicles','all']` (enabled when signed in) |
| `useRideSocket` | `useSyncExternalStore` over the socket singleton (§14.1) |
| `useTripRoomPresence` | joins/leaves a trip room |
| `useUpload` | plain `useState` upload helper (§25) |
| `useAdmin` | §22.12 |

Business-portal and driver hooks leave toasts to their components (exceptions: `useSubmitForReview` and
`useDriverActionError` toast). Carpool, review and admin hooks mostly toast themselves.

---

## 11. Customer dashboard (`(dashboard)`)

Routes: `/dashboard` (overview), `/dashboard/inquiries` (own rental requests, §12),
`/dashboard/trips` (+ `/new`, `/[id]`), `/dashboard/trip-inquiries` (+ `/[id]`),
`/dashboard/incoming-requests`, `/dashboard/my-vehicles` (+ `/new`, `/[id]`), `/dashboard/reviews`,
`/dashboard/settings` (§7).

- **Overview**: "Welcome back, {first name | 'there'}"; cards "Active Inquiries" and "Completed
  Bookings" (both link to `/dashboard/inquiries`) from `useMyBookingCounts` → `GET
  /booking-requests/counts` (`{active, completed}`); quick actions "Browse vehicles →" (`/rent-a-car`),
  "View all inquiries →". No carpool content on the overview. (Until 2026-11-10 both cards always showed
  0: `bookingsApi.getMyCounts` returned the envelope and the page read `counts.active` off it.)
- **`DashboardSidebar`**: Logo + "My Account", the user's name/email, `WorkspaceSwitcher
  current="personal"`, then Overview, My Inquiries, My Trips, Incoming Requests, Trip Requests, My
  Vehicles, Reviews, Account Settings; footer "Browse vehicles", "Sign out". On mobile,
  `MobileSidebarBar` (Radix Dialog drawer; × button, overlay click and any link click close it).

---

## 12. Rental booking flow (customer side)

**The website takes no rental booking requests** (owner decision 2026-11-11, plan A82; switched off
2026-11-12). The car page's call to action (`components/vehicles/AppRequestCta.tsx`) says to send the
request in the KerayeGo app — where the customer picks the package, the pickup and drop-off points and
sees whether the route fits (plan §3c) — with the store buttons once a store URL is set ("coming soon to
Google Play and the App Store" until then) and the provider's WhatsApp for questions. The old form URL,
`/rent-a-car/[city]/[makeModel]/[slug]/inquire`, permanently redirects to the car page. Removed with it:
`InquiryCta`, `useCreateBooking`, `bookingsApi.create`, `lib/validations/booking.schema.ts`, and the GA
events `begin_booking` / `complete_booking`. Carpool seat requests and customer sign-in stay for now.

`/dashboard/inquiries` ("My Inquiries", `useMyBookings`) still lists the customer's requests (sent from
the app): every status's label, the package as people say it ("12 hours", "3 days", "1 week" — old
requests "6 hours × 2"), the estimated total or "Price to agree — the business will call you" (a week or
month request, A79), where it goes ("Hyderabad → Larkana, round trip · 3 stops · 620 km"), passengers, a
folded "Route" list of the stops with expected times and notes (plan §3c), and — once a driver is
assigned and the booking is ACCEPTED, IN_PROGRESS or COMPLETED — the **driver card** (plan A86: photo,
name, rating, rides, "✓ Identity verified" / "✓ Licence verified", never "safe"; Call / WhatsApp when the
backend sends the phone, otherwise "You can call your driver once they confirm the job"). Also the
provider's WhatsApp and note, a NOT_STARTED explainer and the last status-history entry. **Cancel** is
offered **only while PENDING** — the backend's rule (`BOOKING_TRANSITIONS`: from CONTACTED on, only the
provider or KerayeGo can move it) and mobile's `userBookingActions`. It confirms in `ConfirmModal` (× and
tap-outside close) → `PATCH status CANCELLED`; a failure is toasted and the dialog stays open. (Until
2026-11-10 it was also offered while CONTACTED, where the backend always refused.)

A `PROVIDER` account has no page for rental requests it sent itself: `inquiries` isn't a shared section.

Status transitions on the business side: §19.

---

## 13. Carpool

### 13.1 Posting a trip (`TripForm`, `/…/trips/new`)

- Vehicle picker lists only **APPROVED** personal vehicles (`GET /my/vehicles/approved`); with none, an
  `EmptyState` links to "Add a vehicle". Fleet cars / return trips are not posted here — a driver posts
  those from `/driver/jobs` (§21.7).
- Fields (`trip.schema.ts`): from/to city; departure (must be in the future, read as Asia/Karachi time,
  sent via `karachiLocalToISOString`); seats 1–20 (default 3); price per seat ≥ 1; WhatsApp contact
  6–20 chars; notes ≤ 500; **pickup and drop-off stops**, min 1 / max 10 each (label via
  `MapLocationField`, optional lat/lng). The "Add another" link has no UI cap; the schema rejects the
  11th.
- Every rider pays the flat `pricePerSeat` for the whole route; stops are alternative meeting points at
  each end.
- Success: toast "Trip posted — now visible to riders", go to the trip page; GA `offer_ride`.

### 13.2 Poster actions (`MyTripsList`, `MyTripDetail`)

- `MyTripsList`: `limit: 50`, no pagination; "Cancel" for ACTIVE trips.
- `MyTripDetail` while ACTIVE: **Cancel trip** disabled while any PENDING/ACCEPTED seat exists (plan A49;
  no reason sent though the backend accepts one); **Start trip** behind a `ConfirmDialog`. Per seat:
  Accept (no confirm), Decline (Modal with optional note), Cancel seat (`CancelSeatModal`, poster only —
  ACCEPTED, trip not COMPLETED/CANCELLED/SUSPENDED, before departure; optional reason ≤ 500 sent as
  `note`). The seat count and per-trip inbox use only the first page (20).
- IN_PROGRESS: the page becomes the **driver cockpit** (§14.2).
- Return trips (posted by a business driver, plan A48) show the fleet car + "Business Return Carpool" and
  run through the same cockpit.

### 13.3 Seat requests (rider side)

- `/carpool/[route]/[id]/inquire` (layout noindex): signed out → `/login?redirect=…`; guards for a full
  trip or missing stops; seat stepper capped at `availableSeats`; pickup and drop-off `PillToggle`s
  (first of each preselected); optional "Add a note" → `pickupNote` (≤ 200); optional message (≤ 500) →
  `POST /trip-inquiries {tripId, requestedSeats, pickupStopId, dropoffStopId, pickupNote?, message?}`.
  Success copy mentions expiry ("24h or 2h before departure"); "View my requests" is hardcoded to
  `/dashboard/trip-inquiries` (middleware remaps it for a PROVIDER).
- `MyTripInquiriesList` (`/…/trip-inquiries`) and `RiderTripDetail` (`/…/trip-inquiries/[id]`): Cancel
  while PENDING/ACCEPTED and the trip isn't IN_PROGRESS (also shown after the trip is over — the backend
  refuses); ACCEPTED shows the driver, car and WhatsApp (`postedBy` is masked by the backend until
  ACCEPTED); ACCEPTED + trip IN_PROGRESS → `RiderLiveView` (§14.3); COMPLETED → "Leave a review".

### 13.4 Poster inbox — the naming trap

`/dashboard/incoming-requests` and `/provider/incoming-requests` are **carpool**, not rental: both render
`<TripInquiryInbox tripBasePath>`, the poster's inbox across all trips (accept/decline). The rental
booking-request pages are named `inquiries`, and they differ by portal:
`/dashboard/inquiries` = the customer's own sent requests (§12); `/provider/inquiries` = the business's
received inbox (§19). The inbox and `MyTripDetail` show the rider's `pickupNote` but not the chosen
stops (only the cockpit's rider cards show those).

### 13.5 Shared pages between `(dashboard)` and `(provider)`

`trips`, `trips/new`, `trips/[id]`, `trip-inquiries`, `trip-inquiries/[id]`, `my-vehicles`,
`my-vehicles/new`, `my-vehicles/[id]`, `incoming-requests`, `reviews` exist in both groups as 7–18-line
wrappers around the same component (`MyTripsList`, `TripForm`, `MyTripDetail`, `MyTripInquiriesList`,
`RiderTripDetail`, `MyVehiclesList`, `UserVehicleForm`, `MyVehicleDetail`, `TripInquiryInbox`,
`EligibleReviewsList`); only `/dashboard` ↔ `/provider` prefixes and the reviews subtitle differ. Under
`/provider` these are a PROVIDER account's own carpool ("My carpool" in its sidebar) and render whatever
business dashboard is active. Carpool is open to both roles, per the backend.

---

## 14. Live ride & chat (carpool day-of layer)

Ported from mobile, deliberately narrower. Talks to the backend's `/ride` Socket.IO gateway
(`RideRealtimeGateway`).

### 14.1 Socket (`lib/realtime/ride-socket.ts`, `hooks/useRideSocket.ts`)

- A singleton created lazily on the first `useRideSocket` subscriber (`DriverCockpit`, `RiderLiveView`,
  `ChatPanel`): `io(<API origin>/ride, {transports:['websocket'], auth: cb => cb({token})})`, default
  Socket.IO reconnection; on `connect_error` it calls `refreshAccessToken()`. Snapshot
  `{isConnected, isReady}`; joins and sends wait for the server's `ready`; acks time out after 8 s.
  Never disconnected (not even on logout).
- Emits: `trip.join`/`trip.leave {tripId}`; `location.update {tripId, lat, lng, headingDeg?, speedKmh?,
  accuracyM?, ts}`; `inquiry.join`/`inquiry.leave {tripInquiryId}`; `chat.message {id (uuid),
  tripInquiryId, body}` (ack); `chat.typing {tripInquiryId}`, `chat.read {tripInquiryId,
  lastReadMessageId}` (no ack).
- Listens: `ready`, `location.update`, `chat.message`, `chat.typing`, `chat.read`.
- **Contract check (2026-11-10):** every event name and payload matches the backend gateway's DTOs.
  Gaps on the web side: a handshake the server rejects (`disconnect(true)`) is never retried — the socket
  stays dead until reload (mobile handles this); `chat.read` ignores `readerId`; the server broadcasts
  location to everyone except the sender, so a web driver never sees their own marker move.

### 14.2 Driver cockpit (`components/trips/live/DriverCockpit.tsx`)

Shown by `MyTripDetail` while the trip is IN_PROGRESS. Joins the trip room; manifest
`GET /my/trips/:id/manifest` every 20 s; `LiveTripMap` with the manifest's `routeStops` and the driver
marker; a **"Share my live location"** card, **off by default** (`useDriverLocationWatch`:
`watchPosition({enableHighAccuracy:true})`, throttled to 4 s, stops on unmount); rider cards (Picked up /
No-show, then Dropped off; WhatsApp; Chat → `ChatModal`); stop list where "Arrived" is enabled only on
the next un-arrived stop; End trip behind a confirm. Events go to `POST /my/trips/:id/events`; the web
never sends `DEPARTED` ("Start next leg"). Each tap generates a new event id — repeats are harmless only
because the backend's effects are first-writer-wins.

### 14.3 Rider live view (`RiderLiveView`, `useRiderLiveRoute`)

Map with the driver's live position, "Driver is X away" (haversine to the rider's pickup stop), driver
and car, WhatsApp, "I've arrived" (`ARRIVED`), "Complete ride" (`DROPOFF`, with confirm), "Message
driver". The inquiry is polled every 15 s while the trip is IN_PROGRESS. `useRiderLiveRoute(tripId,
stops, live)` joins the room, listens for `location.update`, takes the stops from the rider's own request
— `GET /trip-inquiries/:id` returns the trip's whole route as `trip.stops` (with each stop's `arrivedAt`)
— and the polyline (first pickup → last drop-off) from **`GET /geo/route-directions`** (once, staleTime
Infinity). Not from the public `GET /trips/:id`, which 404s once the trip has started — until 2026-11-10
it did, and the live map had no stops and no route line.

### 14.4 Known live-layer bugs

- Arrived / no-show state is local and lost on reload; the backend now persists it (`arrivedAt`,
  `departedAt`, `currentStopId`, `riders[].noShowAt`, `serverNow`) but web types ignore these.
- "No-show" is offered at once; the backend requires ARRIVED at that stop ≥ 5 min earlier. A no-show
  rider stays in the live view and gets 409s.
- The rider page doesn't switch to live by itself when the driver starts (it polls only once IN_PROGRESS).
- `['trips','active-ride']` is never invalidated by start/end, so the banner goes stale; the cockpit
  doesn't leave if the trip is ended on another device.
- Stops without coordinates become (0,0) on the driver map; `LiveTripMap` can miss its one-time fit.
- A `watchPosition` error flips the toggle off without `clearWatch` — fixes may keep being sent.
- `confirmArrived` shows success even when the request failed.

### 14.5 Chat (`ChatPanel` in `ChatModal`)

History `GET /trip-inquiries/:id/messages` once on mount (the oldest 50 — `meta.nextCursor` is dropped,
and there's no catch-up after reconnect); joins the inquiry room when ready; optimistic send reconciled by
the client id on ack; a failed send shows "Failed to send" (no resend); typing throttled to 2.5 s,
indicator clears after 4 s; marks read when the newest message is from the other party; ticks
Sending… / Sent / Delivered / Read. Opened only from the cockpit and the rider live view, i.e. while the
trip is IN_PROGRESS (the backend allows chat for any ACCEPTED inquiry). No 2000-char limit in the
textarea (the server's limit).

### 14.6 Active-ride banner and what's omitted vs mobile

`components/layout/ActiveRideBanner.tsx` (in `(dashboard)` and `PortalFrame`): when `GET /my/active-ride`
returns a ride and it hasn't been dismissed (component state), links to `…/trips/:tripId` (driver) or
`…/trip-inquiries/:inquiryId` (rider). It replaces mobile's forced redirect. Also omitted vs mobile (noted
in the files' own comments): the offline action queue, GPS geofencing (rider self-report is a plain
button), rider location sharing (`POST /trip-inquiries/:id/location`, `PATCH …/location-sharing`), the
driver's view of rider positions, the REST location batch, `DEPARTED`/leg-by-leg route and the no-show
wait timer.

---

## 15. Personal vehicles (carpool cars)

- `UserVehicleForm` (`/…/my-vehicles/new`), 3 steps — **Vehicle** (make, model, plate, year 1990…now+2
  optional, owner CNIC auto-formatted `12345-1234567-1`, plan A68) → **Documents** (up to 6 optional photos
  via `VehiclePhotosField`, context `user_vehicle_photo`; 4 required documents via `DocumentUploadField`,
  context `trip_document`: CNIC front, CNIC back, driving licence, vehicle registration; JPEG/PNG/PDF) →
  **Review**. It sends a client-generated `crypto.randomUUID()` as `id` so every upload lands in the
  vehicle's storage folder before the record exists (the backend requires it).
- `MyVehicleDetail`: details, documents, photos; **Delete vehicle** (2026-11-07) → `ConfirmModal` →
  `DELETE /my/vehicles/:id` (removes the vehicle with its photos and documents; disabled while SUSPENDED;
  a 409 for an upcoming/ongoing trip shows inside the modal).
- No edit UI (the backend has `PATCH /my/vehicles/:id`; no wrapper). Only APPROVED vehicles can be used
  in `TripForm`.

---

## 16. Reviews & saved vehicles

- **Reviews** (`components/reviews/EligibleReviewsList.tsx`, `/…/reviews`): one component for both
  portals, no props. `GET /reviews/my/eligible` returns four arrays (`bookingsAsCustomer`,
  `bookingsAsProvider`, `tripsAsRider`, `tripsAsDriver`; the backend also sends `bookingsAsDriver`, which
  `reviews.api.ts` doesn't type — the driver area reads it with its own type). A customer rates the
  VEHICLE and the assigned driver (USER); a rider rates the USER_VEHICLE (VEHICLE for a return trip) and
  the poster (USER); providers and drivers rate the customer (USER, private). One `POST /reviews {context,
  contextId, entries:[{subjectType, subjectId, rating, comment?}]}`; every star must be set. Success
  invalidates `['reviews']`. Display: `ReviewsList`, `RatingSummaryBadge`, `RatingStars`/`RatingBadge`.
  No business (PROVIDER) reviews exist (plan A18).
- **Saved vehicles**: `GET/POST/DELETE /users/me/saved-vehicles`; `SaveButton` (heart) and the
  favourites tab in `VehiclesView`; `useIsVehicleSaved` checks a page of 100; no dedicated page, no
  toasts. A signed-out click goes to `/login?callbackUrl=<this page>` (until 2026-11-10 it sent
  `returnTo`, which login ignored).

---

## 17. Business portal (`/provider/*`, plan A69)

Every business — business admin (owner), managers and drivers — gets on the web what the KerayeGo
Partner app gives them, except a driver's on-trip session. Access is by **business membership**, not the
JWT role: managers and drivers are ordinary `USER` accounts. "Business admin" is never KerayeGo admin.

### 17.1 Workspaces and the permission table

- `GET /users/me/workspaces` (`hooks/useWorkspace.ts`, key `['workspaces','mine',userId]`, 60 s) lists
  the person's dashboards: Business admin (owns a business), Manager (active manager membership), Driver
  (a driver profile, an ACTIVE driver membership, or a pending unexpired DRIVER invite), plus
  `canCreateBusiness`.
- Active dashboard: the remembered choice (`store/workspace.store.ts`, localStorage
  `kerayego.workspace.<userId>`) if still available, else the first of Business admin, Manager, Driver.
  `select()` stores it without navigating. Status `loading` / `error` / `ready`.
- **`can(action)`** (`lib/workspace/workspaceSelection.ts:95-119`) — **every role-based show/hide goes
  through it.** The file is a copy of `kerayego-partner/src/features/workspace/workspaceSelection.ts`
  and must change together with it (identical action by action on 2026-11-10).

  | Action | Business admin | Manager | Driver |
  |---|:-:|:-:|:-:|
  | `viewFleet`, `editFleet`, `manageBookings`, `viewTeam`, `inviteDrivers`, `viewLiveMap`, `viewRatings` | ✓ | ✓ | |
  | `editBusinessProfile`, `manageShowrooms`, `manageDocuments`, `submitBusinessForReview`, `viewActivityLogs`, `rateCustomers`, `manageFleet`, `inviteManagers` | ✓ | | |
  | `driverJobs`, `driverBusinesses`, `driverProfile` | | | ✓ |

  `manageableTeamRoles()`: owner → DRIVER, MANAGER; manager → DRIVER. No active dashboard → everything
  false. `workspaceSwitchLabels` is unused on the web (kept so the file stays identical).
- **Route → action map** (`lib/workspace/workspaceRoutes.ts:51-61`, longest prefix wins):
  `/provider/inquiries` manageBookings · `/provider/vehicles` viewFleet · `/provider/vehicles/new`
  manageFleet · `/provider/live-map` viewLiveMap · `/provider/team` viewTeam · `/provider/ratings`
  viewRatings · `/provider/activity` viewActivityLogs · `/provider/profile` editBusinessProfile ·
  `/provider/documents` manageDocuments · `/provider/dashboard` none. Driver: `/driver/jobs` driverJobs ·
  `/driver/businesses` driverBusinesses · `/driver/profile`, `/driver/setup` driverProfile.
  `WORKSPACE_HOME`: business dashboards → `/provider/dashboard`, Driver → `/driver/jobs`.

### 17.2 `ProviderPortal` decision order and screens

`components/provider/ProviderPortal.tsx:38-70`:

1. Personal carpool path (`my-vehicles`, `trips`, `trip-inquiries`, `incoming-requests`, `reviews`) →
   render with the sidebar, whatever dashboard is active.
2. Workspaces loading / error → full-page screen.
3. Active Business admin or Manager → render if the route has no action or `can(action)`; else
   `NotForYourRoleScreen` ("Not available in this dashboard"; a Manager sees "Only the business admin can
   open this page.").
4. Has a business dashboard but isn't in it → `SwitchWorkspaceScreen` ("Switch to {label} · {business}" /
   "Stay as {X}").
5. `/provider/profile` and `canCreateBusiness` → the create-a-business flow.
6. Otherwise `NoBusinessScreen` ("Set up my rental business" if allowed; "Open my driver dashboard" or
   "Become a driver").

Back links: "Back to my carpool" (`/provider/trips`) for a PROVIDER account, else "Back to my dashboard".
`WorkspaceSwitcher` ("Working as" dropdown) lists each dashboard (business name, or "My driver work"), the
personal side ("My carpool" for PROVIDER, "My customer dashboard" for USER), and "Become a driver" / "Set
up my rental business" when available; it sits at the top of the business, driver and customer sidebars.

### 17.3 `ProviderSidebar`

"Business Portal". Business items (only while Business admin or Manager is active, filtered by `can()`):
Dashboard · Bookings (`/provider/inquiries`, locked until the business is approved) · Fleet
(`/provider/vehicles`, locked until approved) · Live map · Team · Ratings · Activity log (owner) · Business
profile (owner) · Documents (owner). A Manager sees Dashboard, Bookings, Fleet, Live map, Team, Ratings.
"My carpool" (PROVIDER accounts only): Trips, My Vehicles, Incoming Requests, Trip Requests, Reviews.
Footer: email, Home, Browse vehicles, Sign out. The lock reads only `verificationStatus`; the routes
themselves don't check approval.

### 17.4 Dashboard (`/provider/dashboard`)

Header ("Business dashboard · {role}"), a status card per verification status, the submit-for-review card
(owner; an inline copy of `SubmitForReviewCard`), stat cards (Business status, Showrooms, Documents with
`manageDocuments`), completeness (with `editBusinessProfile`), quick actions filtered by `can()` (Edit
business profile, Add a vehicle, Fleet, Bookings, Team, Live map). Add a vehicle / Fleet / Bookings are
greyed unless the business is APPROVED **and** has a showroom — stricter than the sidebar lock.

### 17.5 Business profile (`/provider/profile`)

- **No business yet** (`GET /providers/me` → null; needs `canCreateBusiness`): tabs "Business" / "Personal
  information". Name, optional description, owner CNIC (`12345-1234567-1`, plan A68) → `POST /providers`
  (called directly, not via a hook) → toast "Business registered. Next, add your showroom and documents."
  → `select(BUSINESS_ADMIN)`.
- **Existing business**: header (logo, name, StatusBadge), `CompletenessCard` (score from the backend;
  green ≥ 80, amber ≥ 60, red below; each missing item links to its tab or to `/provider/documents`),
  `SubmitForReviewCard`, a documents link card, and **three tabs**: "Business details" (Branding — logo and
  banner — then name/description/CNIC; `PATCH /providers/me`, save disabled until changed; 403
  `IDENTITY_BLOCKED` inline), "Showroom (n)", "Personal information" (§7).
- **Submit for review**: only while PENDING or REJECTED ("Submit again"); blocked without a showroom, under
  60 % complete, or without the owner's CNIC; never while SUSPENDED (`lib/workspace/businessStatus.ts`).
- **Logo / banner**: JPEG/PNG/WebP ≤ 5 MB checked in the browser → `POST /media/upload?context=
  provider_logo|provider_banner` → PATCH with the URL; remove sends `null`.
- **Showroom**: one per business (`MAX_SHOWROOMS_PER_BUSINESS = 1`, matching the backend's 409). Market
  (Pakistan / Saudi Arabia / UAE — phone code and sample cities only; every price is PKR), name, address
  via `MapLocationPicker`, city, area, contact number, WhatsApp. Opening hours aren't editable. Delete asks
  first.

### 17.6 Documents (`/provider/documents`, owner)

Seven types (`DOCUMENT_TYPES` in `lib/api/media.api.ts`: BUSINESS_LICENSE, TRADE_LICENSE,
OWNERSHIP_PROOF, ID_DOCUMENT, VEHICLE_REGISTRATION, VEHICLE_INSURANCE, OTHER). JPEG/PNG/PDF ≤ 10 MB
checked in the browser → `POST /media/upload?context=document&documentType=…`. Rows show a status badge
and any rejection note (a code comment says the backend doesn't review these yet, so they stay PENDING);
**View** opens the signed link (refetched first if older than 9 minutes); **Replace** uploads the new file
then `DELETE /media/:publicId` on the old one; **Remove** deletes. One document change at a time.

### 17.7 Team (`/provider/team`)

"Team & drivers" (owner) / "Drivers" (manager). Filters All / Managers / Drivers; sections: the Business
admin card, Managers, Drivers, Pending invites (expire after 7 days), collapsed "Past members"
(INACTIVE/DECLINED). Invite modal: role switch when more than one role is allowed (Driver default), full
name (2–150), email, optional mobile (≤ 25) → toast "Invitation sent." Rows: "Send again" for an expired
invite; Cancel invite / Remove behind role-specific confirms, shown only if the person may manage that
role. Driver rows show whether the driver can be given jobs (VERIFIED and licence not expired).

### 17.8 Activity log (`/provider/activity`, owner)

Category chips (All, Bookings, Jobs, Fleet, Team, Business) + "Person" select (`/actors`); 30 per page with
"Load more"; grouped by Asia/Karachi day (Today / Yesterday / date); actor name or "KerayeGo (automatic)",
role chip, time, summary; BOOKING rows link to `/provider/inquiries/:id`, VEHICLE rows to
`/provider/vehicles/:id/edit`. Read-only (plan A33).

### 17.9 Ratings (`/provider/ratings`)

Owner: tabs "Car ratings" / "Rate customers (n)" (`?tab=customers`); manager: cars only. Cars: each fleet
car's rating summary + "Show reviews". Customers: completed rentals awaiting a rating → 1–5 stars +
optional comment (≤ 1000) → `POST /reviews {context:'BOOKING_REQUEST', entries:[{subjectType:'USER', …}]}`.
The same rating card appears on the booking detail page for COMPLETED bookings.

---

## 18. Fleet (`/provider/vehicles`)

- **List**: tabs All / Live / Under Review / Draft / Rejected / Archived (no Suspended tab — suspended cars
  show under All); search by title/make/model (not debounced); 20 per page; rows show cover, title, status
  (APPROVED reads "Approved" while its tab says "Live"), specs, day price, photo/request counts, rejection
  reason. "Add car" + `AddCarGate` only with `can('manageFleet')`; a manager sees "Cars the business admin
  lists will appear here."
- **Add-car gate** (`addCarBlockers()`, `lib/ops/fleetRules.ts:51-59`, used by the list and `/new`): no
  business, no showroom, not APPROVED — several can show at once.
- **Form** (`VehicleForm`, `vehicleFormSchema` in `lib/ops/vehicleForm.ts:59-98`; one page, four cards):
  - Basic: title 3–100, plate optional 2–20 (uppercase by CSS only), make 2–50, model 1–50, year
    1990…now+2, seats 1–20, engine ≤ 60, transmission AUTOMATIC/MANUAL/CVT, fuel
    PETROL/DIESEL/ELECTRIC/HYBRID/CNG.
  - Pricing (PKR): daily price required; 6 h and 12 h optional (empty = not offered); each
    `^\d{1,8}(\.\d{1,2})?$` and ≥ 1; pricing notes ≤ 500. **No week or month prices** (plan A79): a
    **"Weekly & monthly rental" switch** (`offersWeeklyMonthly`, A84) puts the car on the weekly & monthly
    pages, "price to agree". A backend from before 2026-11-11 doesn't send the switch — then an old week or
    month price stands for it (`offersWeeklyMonthly()` in `lib/ops/vehicleForm.ts`, as in Partner). The
    read-only specs card (archived/suspended) says "Weekly & monthly rental: Yes, price to agree / Not
    offered".
  - Location & details: showroom (a Select when there are several), availability notes ≤ 500, special
    conditions ≤ 1000. Features: chips from 16 `COMMON_FEATURES` (no free text).
  - Create omits empty optionals; edit sends an emptied optional as `null` and omits a locked plate.
  - `lib/validations/vehicle.schema.ts` now holds only the option constants (its dead `vehicleSchema`,
    with week/month prices, was removed 2026-11-12).
- **Plate lock** (plan A65): APPROVED with a plate → read-only, "contact KerayeGo support" (admin corrects
  it, §22.5); `PlateHistoryCard` when the API returns `plateHistory`.
- **Photos**: JPEG/PNG/WebP, original ≤ 40 MB, ≤ 5 MB after in-browser compression
  (`lib/ops/compressImage.ts`: longer side 2048 → 1536 → 1152 px, JPEG quality 0.85 → 0.62 aiming at
  ≤ 1.5 MB, white background, keeps the original if not smaller); max 10 per car. Upload
  `POST /media/upload?context=vehicle&entityId=<carId>` then `POST /vehicles/:id/images`; if attaching
  fails the uploaded file is deleted. One at a time; a failure doesn't stop the rest. The edit page adds
  remove (confirm), left/right reorder and "Make cover" (`PATCH …/images/reorder`; the Partner app has no
  reorder). The first photo is the cover.
- **Add flow**: `POST /vehicles` (DRAFT) → photos upload → edit page. GA `list_vehicle_start` /
  `list_vehicle_complete`.
- **Per-status rules** (details and photos need `editFleet` — admin + manager, plan A52/A64; Submit and
  Archive need `manageFleet` — admin only):

  | Status | Edit | Submit | Archive |
  |---|---|---|---|
  | DRAFT | ✓ | "Submit for review" (needs a photo, no unsaved changes) | ✓ |
  | PENDING_REVIEW | ✓ | – | ✓ |
  | APPROVED | ✓ (plate locked; "Customers now see…") | – | ✓ |
  | REJECTED | ✓ (saving moves it back to DRAFT) | "Submit again", disabled until saved | ✓ |
  | ARCHIVED | read-only | – | – |
  | SUSPENDED | read-only, reason shown | – | shown, but the backend answers 409 (bug, same in Partner) |

  Submitting can come back APPROVED at once (backend auto-approves when the business is APPROVED and the
  owner ACTIVE). Archive asks first; "An archived car cannot be reactivated."

---

## 19. Booking requests inbox & driver assignment (`/provider/inquiries`)

- **List** ("Bookings"): chips All, Needs a driver, New, Contacted, Accepted, In Progress, Completed, Not
  started, Rejected, Cancelled; counts on Needs a driver / New / Contacted (`GET /provider/inquiries/counts`);
  `?status=`, `?needsDriver=true`, `?page=` in the URL; 20 per page. Cards (same as Partner): car, status,
  customer, where it goes ("Hyderabad → Larkana, round trip · 3 stops · 620 km", `bookingPlaceSummary`),
  dates, package · passengers · estimated total or "Price to agree", "Needs a driver".
- **Wording and route** (plan §3c, A74–A88; `lib/ops/bookingRoute.ts`, a port of Partner's
  `bookingRoute.ts`): the package as people say it — "6 hours", "12 hours", "3 days", "1 week" (old
  requests "6 hours × 2"; `durationLabel`); "One way" / "Round trip"; passengers (A83). Requests sent
  before 2026-11-11 have no stops and keep their single pickup / drop-off rows.
- **Actions** (`BUSINESS_BOOKING_ACTIONS`, `lib/ops/bookingDisplay.ts`, a copy of the Partner app's
  table in `kerayego-partner/src/types/enums.ts` — change both together; business admin and manager get
  the same buttons). Plan A71 (2026-11-09; web since 2026-11-10): **only the assigned driver starts and
  ends a rental**, in the Partner app — a business never moves a booking to IN_PROGRESS or COMPLETED.

  | Status | Buttons | Note shown above the buttons | Driver card |
  |---|---|---|---|
  | PENDING | Mark contacted → CONTACTED; Decline → REJECTED | — | hidden |
  | CONTACTED | Accept → ACCEPTED (choose a driver, or "Accept, assign later"); Decline | — | hidden |
  | ACCEPTED | **Cancel booking → CANCELLED** (until the driver starts the job) | the driver starts the job in the Partner app; you can change the driver or cancel until then | Assign / Change / Remove (until the job starts) |
  | IN_PROGRESS | none | only the driver can end it, in the Partner app | driver + Call; "See the driver on the live map" |
  | COMPLETED / NOT_STARTED / REJECTED / CANCELLED | none | a closing line | driver + Call |

  Every move goes through `StatusActionModal` (optional note ≤ 500, visible to the customer; Cancel
  booking is a destructive confirm that tells the customer and driver). A COMPLETED booking shows the
  rate-customer card to the owner. NOT_STARTED / auto-complete come from the backend (plan A70). The
  backend's `BOOKING_TRANSITIONS` still lets a `PROVIDER` move a booking to IN_PROGRESS/COMPLETED via
  `PATCH /booking-requests/:id/status` — a backend ripple, not reachable from the web UI any more.
- **Driver picker**: `GET /booking-requests/:id/eligible-drivers` (fetched only while open); ineligible
  drivers greyed with the backend's reasons, verification badge, licence expiry, Refresh; "Invite a driver"
  → `/provider/team`; `PATCH /booking-requests/:id/driver {assignedDriverId | null}`. A driver who declined
  counts as no driver. Errors inline, no success toast.
- **Detail** (`/provider/inquiries/[id]`): car (link to the public page); **"This car is already
  booked"** (`CarClashWarning`, plan A88) on a PENDING / CONTACTED request whose car has an overlapping
  accepted or in-progress booking (`carClashes`, each linked) — also inside the Accept dialog, and a 409
  `VEHICLE_ALREADY_BOOKED` shows the backend's words plus "Decline this request, or ask the customer about
  another time"; driver card; job-state text; Rental (pickup, return, duration, trip, passengers, the
  single pickup / drop-off rows only on a request without stops, a weekly/monthly request's driver hours a
  day / days a week / km a month (A85), estimated total or "Price: To agree — call the customer" (A79), day
  rate); **Route** (`RouteCard`, A78: every stop in route order with its expected time, note and the leg
  from the stop before, then distance, driving, time needed, time to spare or over the package, way back,
  showroom → first pickup and a one-way driver's drive back, with the "Google's estimates without
  traffic" footnote — places only, never anyone's position); customer card (Call, WhatsApp — a local `0…`
  number gets the market's code — Email), message, status history (newest first).

---

## 20. Live map (`/provider/live-map`)

`GET /providers/me/live-drivers` every 10 s; the selected job's `GET /providers/me/live-drivers/:bookingId/
route` every 15 s (polling pauses in a hidden tab). One marker per driver with a fix — **drivers only**,
never customers (plan A72/A73); the selected one is larger with its route line. Fits all drivers once;
"Show every driver" refits; default centre Lahore; without the maps key a placeholder replaces the map.
Cards: driver, licence category, car, LIVE / last seen, speed, "Renter: <name>", Call driver, Booking
details. Other drivers stay visible when one is selected (plan A27 says only that one — same divergence as
the Partner app).

---

## 21. Driver portal (`/driver/*`)

### 21.1 Gating (`components/driver/DriverPortal.tsx:29-51`)

Workspaces loading/error → screen. Active dashboard Driver → page + `DriverSidebar` (with `can()`, always
true for a driver). Not in the Driver dashboard but on an onboarding path (`/driver/profile*`,
`/driver/setup/*`) → the page **without** the sidebar (the become-a-driver flow; also for an existing driver
currently working in a business dashboard). Otherwise `SwitchWorkspaceScreen` if a Driver dashboard exists,
else `NotADriverScreen` ("You're not a driver yet" → "Become a driver" → `/driver/profile`). No
`/driver` index page and no `loading.tsx`.

`DriverSidebar`: "Driver Portal", switcher, badge "Driver profile <status>" (UNVERIFIED reads "Not
submitted" here but "Unverified" on the profile page), Jobs, Businesses, Profile; footer email, Home,
Browse vehicles, Sign out.

### 21.2 Setup wizard (`/driver/setup/[step]`, `lib/driver/setupSteps.ts`)

Steps in order: `personal`, `identity`, `experience`, `services`, `availability`, `payouts`. Steps 2–6
open only after the first save. Frame: six step chips, "Step n of 6", Back, "Save & next" / "Save &
finish"; unsaved changes → "Leave without saving?" and a `beforeunload` prompt; an unchanged form moves on
without saving. Markers: `*` rental-ready, "(for hire)", "(before payouts)", "(optional)", "(recommended)".
The client blocks only malformed input; completeness and readiness come from the backend.

1. **Personal** — photo (after first save; `driver_photo`, JPEG/PNG/WebP ≤ 5 MB), full name\*,
   mobile/WhatsApp\* (stored unverified), date of birth\* (18+), city\*, area\*, home address\*
   (`MapLocationField`, sets the home pin), gender\*, comfortable with families/women (hire), languages\*
   (chips + free text, ≤ 20), email (optional). The first save creates the profile and switches to the
   Driver dashboard.
2. **Identity** — CNIC\* + expiry\* (future), licence number\*, category\*, issue date\* (not future),
   expiry\* (future, after issue), issuing authority\* (7 province chips), documents card, emergency
   contact\* (name, phone, relation), 3 declarations\*.
3. **Experience** — total years\*, years as a driver\* (≤ total), vehicles\* (7 chips), transmissions\*,
   highway\*, smartphone with GPS\*, Google Maps (recommended), certifications (≤ 500), previous jobs
   (≤ 10), references (≤ 5; name + phone).
4. **Services** (for hire) — 10 checkboxes; household services (personal/family, monthly, school, night)
   need a police certificate; uniform when corporate is chosen.
5. **Availability** — service city (defaults to the step-1 city — bug: never saved if nothing else
   changes, same in Partner), coverage areas, per-day hours (09:00–18:00 default; end before start =
   overnight; equal refused), outstation/overnight, rates by chosen services (hourly + minimum hours,
   full-day, monthly salary), overtime (optional), advance notice (hire), max km. Amounts PKR, sent as
   `"1500.00"`.
6. **Payouts** — BANK / JazzCash / Easypaisa, account title, account number (write-only: masked
   placeholder, sent only when typed), 4 versioned agreements (`POST /driver/profile/agreements` for newly
   ticked ones; "Read" shows a summary — full text is `TODO(driver-agreements)`, `PayoutsStep.tsx:204`).
   Saving finishes with "Driver profile saved" → `/driver/profile`.

Changing any of 9 identity fields while PENDING_REVIEW or VERIFIED asks "Save anyway" (re-verification).

### 21.3 Documents and the live selfie

Slots: CNIC front/back, licence front (`DRIVING_LICENSE`)/back, **live selfie** (camera), police
certificate (optional; needed for household services). JPEG/PNG/PDF ≤ 10 MB (selfie JPEG/PNG), checked in
the browser → `POST /media/upload?context=driver_document&documentType=…` (120 s timeout). Replacing a
document while PENDING_REVIEW/VERIFIED asks first ("This needs checking again"). **View** opens a new tab
first (pop-up safe) and refetches the signed link if ≥ 9 minutes old. `SelfieCaptureModal`:
`getUserMedia({video:{facingMode:'user'}})` mirrored preview → canvas JPEG → Retake / "Use this photo";
without a camera it falls back to `<input type=file capture="user">`, which on desktop accepts any stored
file (against the plan 3b "camera, not gallery" spec, §32.2). Admin compares selfie, CNIC and profile photo
(plan A59, §22.7).

### 21.4 `/driver/profile`

Verification card (Unverified / Under Review / Verified / Rejected + reason; "Submit for verification" for
UNVERIFIED/REJECTED when complete → `POST /driver/profile/submit`), readiness card (Rental-ready,
Hire-ready "coming soon", Payout-ready, each with what's missing; plan A58), setup-steps card
("Complete" / "Missing: …"). Documents are on the identity step, not here.

### 21.5 `/driver/businesses`

Sections: "Invitations to manage a business" (MANAGER invites, Accept/Decline), "Invitations" (DRIVER
invites), "Businesses you drive for" (Leave). Expired invites show a badge and no Accept; decline/leave go
through a `ConfirmDialog` and both call `POST /driver/businesses/:id/leave`; toast only on accept. An amber
"Confirm your email to see invitations sent to it" note + `/verify-email` link shows when the stored user's
email isn't verified — but `/verify-email` sends a phone-verified person straight to `/dashboard`, and the
backend also matches invites by verified phone, so the note is misleading (§32.1).

### 21.6 `/driver/jobs`

Blue note: start and end jobs in the KerayeGo Partner app; location is shared with the business only from
the app while a job is in progress. Cards: car, business, status, answer badge (when the driver hasn't
accepted), customer name/phone, car, dates, then the job's route (`components/driver/JobPlaces.tsx` +
`lib/driver/jobPlaces.ts`, ports of Partner's, plan §3c/A72): "12 hours · Round trip · 3 passengers · 620
km · 9 h 20 min", every stop in route order with its expected time and note, a **Map** link per stop
(Google Maps directions by coordinates, or by the place text on an older job) and **Directions for the
whole route** (all stops, a round trip back through the pickups; not offered past Google's 9 waypoints) —
links only while the job is ACCEPTED or IN_PROGRESS; plain Google Maps URLs, no Maps JavaScript. Actions:
**Accept job / Decline**
(`POST /driver/jobs/:id/respond`; an identity-hold refusal shows the hold message), **Rate customer**
(completed jobs, `RateCustomerModal`: 1–5 stars, comment ≤ 1000, private), **Post return trip**. No
Start/End, "Picked up" or location controls (plan A71/A72); no customer location anywhere. Jobs don't poll.

### 21.7 Return trips (plan A48/A28/A29)

`ReturnTripModal` (completed one-way jobs): loads `GET /driver/jobs/:id/return-trip-template` (reversed
route, car, capacity, business, suggested departure) → price per seat (PKR, > 0), seats (prefilled),
pickup/drop-off points, contact number (required), notes → `POST /trips {fleetVehicleId,
returnFromBookingId, originCity, destinationCity, pickupPoint?, dropoffPoint?, departureAt (the suggested
time, not editable), availableSeats, pricePerSeat, contactNumber, notes?}` → "Return trip is live!" (no
review step). A port of the Partner sheet. The button stays visible after posting.

### 21.8 Parity gaps vs the Partner app / plan

- A person invited only as a **manager** (no Driver dashboard) gets `NotADriverScreen` and can't reach
  `/driver/businesses` to accept — the Partner app shows manager invitations on its welcome screen.
- Answer rules: Partner lets a driver answer only while ACCEPTED and shows the answer badge only then; the
  web allows any unfinished status and shows "Reply needed" on finished jobs.
- Plan A69's reason "a manager sometimes completes a driver's profile" isn't supported — the wizard only
  edits the signed-in account's own profile (a manager would sign in as the driver).

---

## 22. Admin console (`/admin/*`)

All 18 pages are client components. `(admin)/layout.tsx` has **no auth, role or phone gate** — middleware
is the only web-side check; the backend enforces `@Roles`. SUPER_ADMIN-only buttons (lift block, delete
activity entry) are UX checks via `useAuth().isSuperAdmin`.

### 22.1 Sidebar and shared parts

`components/layout/AdminSidebar.tsx` (the live one; no props, inline SVG icons): Overview, Providers,
Vehicles, Trips, Vehicle Verifications (`/admin/user-vehicles`), Drivers, Users, Blocks, Possible blocked
people (`/admin/identity-reviews`), Audit Logs, Tracking Lookup (`/admin/tracking`), Settings; footer
email, Home, Browse vehicles, Sign out. `components/admin/AdminSidebar.tsx` is an empty `export {};`
stub. Shared (`components/admin/index.ts`): `AdminPageHeader`, `AdminTable`/`AdminRow`/`AdminEmptyRow`/
`AdminSkeletonRows`/`AdminTableFooter` (assumes 20 per page)/`StatusTabs`, `RoleBadge`/`ActionBadge`/
`AdminStat`, `ApproveDialog` (optional note), `ReasonModal` (5–500, or 0–500 optional)/`IdentifierHints`/
`BlockResultSummary`; plus `BusinessActivityCard` and `DriverPhoto` (not in the barrel). Hand-rolled
pages: `vehicles/[id]`, `trips/[id]`, `user-vehicles/[id]` (own markup and modals) and `drivers/[id]` (own
layout, uses `ConfirmDialog`). All filters are `useState` (lost on navigation).

### 22.2 Dashboard

Stats: Total Users, Active Providers, Active Vehicles, Active Bookings; "Pending approvals" for providers
and vehicles; quick links. No queue for personal vehicles, drivers or identity reviews.

### 22.3 Providers

List shows **pending applications only** (cards; Approve with optional note, Reject with reason). Detail:
Approve/Reject while PENDING_REVIEW; summary (plan A31: team breakdown, bookings & rides breakdown — the
plan codes appear in the UI copy); `BusinessActivityCard` (latest entries; "Show all" pages 30 with
category pills; **SUPER_ADMIN** can delete an entry with a reason ≥ 5, plan A33/A45); business details,
owner (incl. CNIC), showrooms, document previews.

### 22.4 Vehicles (rental fleet)

Tabs All / Pending Review / Approved / Rejected / Draft / Archived (no Suspended); search. PENDING_REVIEW →
Approve + Reject; DRAFT/REJECTED → Approve only. The detail shows 6 h / 12 h prices and "Weekly & monthly:
Offered, price to agree / Not offered" (no week or month prices since 2026-11-11, A79). Detail adds **Correct plate** (plan A65) for every status
(uppercase, ≤ 20, ≥ 2 chars + reason) → `PATCH /admin/vehicles/:id/plate`. **No suspend/reactivate UI**
although the backend has `PATCH /admin/vehicles/:id/suspend|reactivate`.

### 22.5 Trips

Tabs Active (default) / All / Cancelled / Suspended. ACTIVE → Suspend, SUSPENDED → Reactivate — one click,
no confirm, no reason (list and detail). Return trips show the fleet car and business.

### 22.6 Vehicle Verifications (personal vehicles)

Tabs Pending Review (default) / Approved / All / Rejected / Suspended. List: Review (→ detail) + Reject;
APPROVED → Suspend, SUSPENDED → Reactivate (one click). Detail: owner (incl. CNIC), document previews;
Approve (no note) needs the "I have opened and reviewed…" checkbox when documents exist; Reject opens a
modal with **no × and no tap-outside close**. `DOC_LABELS` lacks CNIC front/back (raw names shown).

### 22.7 Drivers (plan A58/A59)

Tabs Under Review (default) / Verified / Rejected / Not submitted (no "all"; the backend defaults to
PENDING_REVIEW). Detail (`drivers/[id]`, ~1065 lines): red flags (under 18, CNIC or licence expired),
readiness (rental, hire, payout, household), identity check (selfie, CNIC front, profile photo side by
side), all six setup steps, account and memberships, six document slots. **Approve needs five documents**
(CNIC front/back, licence front/back, selfie; police certificate optional) and a "reviewed" checkbox;
Reject needs 5–500 chars; both only while PENDING_REVIEW. The document links are ~10-minute signed URLs, so
`useAdminDriverDetail` never caches (staleTime/gcTime 0, refetch on focus, every 5 min, "Refresh links").

### 22.8 Users

Filters role (All/User/Provider/Admin) and status (All/Active/Pending/Suspended). List: **Release mobile
number** when the account has a phone (reason 5–500 → `POST /admin/users/:id/release-phone`; the returned
row replaces the cached one, so another account can register that number — plan A23); Activate for
SUSPENDED; Suspend (reason) for USER/PROVIDER only. Detail: Activate/Suspend; **Block person** (admin,
USER/PROVIDER, not deleted; reason 5–500) → result modal with the identifiers now blocked and how many
accounts were put on hold.

### 22.9 Blocks (plan A22/A66/A67)

Person blocks: blocked user, reason, who/when, identifier hints (CNIC / PHONE / EMAIL — kept as one-way
codes), Active or "Lifted <date>". "Include lifted" checkbox. **Lift** (SUPER_ADMIN only, reason 5–500)
doesn't reactivate the account. There's no plate/vehicle-register block UI.

### 22.10 Possible blocked people (identity reviews)

Tabs Waiting / Cleared / Blocked. A row = the held account, the matched kind (**PHONE or CNIC** — an email
match is refused at sign-up, not reviewed, plan A67), the block it matched, the date. Waiting rows: Clear
(optional note) or Block (reason 5–500). Held accounts can sign in and browse but can't book, post trips,
request seats or drive (plan A66).

### 22.11 Tracking lookup, audit logs, settings

- **Tracking Lookup** (plan A39 — no all-vehicle live map): one free-text query (vehicle title/slug, driver
  name/phone, booking ID) → `GET /admin/tracking/lookup`, polled every 15 s. No map is drawn: LIVE NOW /
  LAST KNOWN, an "Open in Google Maps" link (no Maps JS, no API cost), vehicle/driver/business/customer
  cards, last fix (coordinates, speed, heading). A not-found 404 shows axios's generic message and keeps
  polling.
- **Audit Logs**: entity-type filter (All, USER, PROVIDER, VEHICLE, BOOKING_REQUEST, PLATFORM_SETTING) +
  entity ID; read-only — the audit log is permanent (backend DELETE answers 403). 50 per page while the
  footer assumes 20; `BOOKING_REQUEST` matches nothing the backend writes; object metadata renders as
  `[object Object]`.
- **Settings**: key/value list (JSON values), edit per row, "Add setting" with 4 presets
  (`platform.maintenance_mode`, `max_vehicles_per_provider`, `inquiry_expiry_days`,
  `featured_listings_count`) — the backend reads none of them. `useUpsertSetting` toasts axios's generic
  `error.message` on failure; the page's `mutateAsync` has no try/catch (unhandled rejection).

### 22.12 `admin.api.ts` / `useAdmin.ts`

Single items unwrapped, paged lists `{data, meta}`. Endpoints: `GET /admin/overview`;
`GET /admin/providers/pending`, `/admin/providers/:id`, `/:id/summary`, `/:id/activity-logs`,
`PATCH …/approve|reject`; `GET /admin/vehicles`, `/:id`, `PATCH …/approve|reject|plate`;
`GET /admin/users`, `/:id`, `PATCH …/suspend|activate`, `POST …/release-phone|block`; `GET /admin/blocks`,
`POST /admin/blocks/:id/lift`; `GET /admin/identity-reviews`, `POST …/:id/clear|block`; `GET /admin/trips`,
`/:id`, `PATCH …/suspend|reactivate`; `GET /admin/user-vehicles`, `/:id`,
`PATCH …/approve|reject|suspend|reactivate`; `GET /admin/drivers`, `/:userId`, `PATCH …/approve|reject`;
`GET /admin/audit-logs`; `DELETE /admin/business-activity-logs/:id`; `GET /admin/tracking/lookup`;
`GET /admin/settings`, `PATCH /admin/settings/:key`. Unused: `getAllProviders`, `deleteReview` (only via
the dead `useDeleteReview` — no review-delete UI). No wrapper: `vehicles/pending`,
`vehicles/:id/suspend|reactivate`, `system/process-deletions`.

Query keys `['admin', <resource>, …]`, staleTime 30 s (settings 60 s, driver detail 0, tracking 10 s).
Only provider/vehicle approve/reject also invalidate `['admin','overview']`. Errors: most mutations toast a
fixed message; drivers use `driverErrorMessage`; release-phone and delete-activity use
`getApiErrorMessage`; plate, block, lift and identity-review mutations show errors inline.

---

## 23. Public site & SEO

### 23.1 Homepage (`app/page.tsx`, server, dynamic — reads cookies)

Reads the `userLocation` cookie; one `Promise.all`: 6 featured listings within 8 km of it, distinct
cities, listings count, providers count. Sections: hero ("Find your perfect rental", `HeroSearch` →
`/rent-a-car?search&city`, "Browse all vehicles", "List your fleet" → `/register?role=PROVIDER`,
`HeroStats`, `HeroCollage` from the first 3 featured photos), 4 trust signals, featured grid, "Browse by
city" (10), provider CTA. Footer: Logo, ©, Browse, Providers, Carpool, Price Index, About, FAQ, Guides,
Safety, Contact, Privacy, Terms, Delete account, Sign in, app links. Copy says "real prices for 6 hours,
12 hours and days" — never week/month prices (A79). **No carpool section** (carpool is the
owner's top priority — §32.3). `HeroCollage` always shows "Reply in ~14 min" (a hardcoded default).

### 23.2 Rental pages

| Route | Behaviour |
|---|---|
| `/rent-a-car` | `fetchListings` (cookie location, 8 km), makes, cities, price index → `<VehiclesView>` (filters in the URL). Page-1 SEO copy (median price, city links, "no self-drive" line). Canonical keeps only `page`. |
| `/rent-a-car/[city]` | `generateStaticParams` from distinct cities; indexed only when it has listings; a city with no listings renders (noindexed) if it has a `CITY_PROFILES` entry, else 404; 24 per page; Breadcrumb + FAQPage JSON-LD (city FAQs + profile FAQs). When the city has weekly & monthly cars (`fetchWeeklyMonthlyCount`): a header chip, a paragraph and an FAQ answer link to its weekly & monthly page (no prices). FAQ answers say requests are sent and cancelled in the KerayeGo app. |
| `/rent-a-car/[city]/weekly-monthly` | **Weekly & monthly page per city** (plan A84, 2026-11-12): the cars switched on for it (`fetchWeeklyMonthlyListings` → `GET /listings?city=…&weeklyMonthly=true`), cards with "Price to agree" instead of the day price, no price anywhere, "How to ask for a weekly or monthly price" (in the app: week 1–4 / month 1–12, start, places, passengers, driver hours a day, days a week, km a month — A85), FAQ (+ FAQPage JSON-LD on page 1), Breadcrumb, links to the city hub, the monthly-vs-daily guide and the city's carpool. A static segment, resolved before `[makeModel]`. **404 when the city has none** — and on a backend from before 2026-11-11, which rejects the filter (400). In the sitemap only for cities that have such cars. |
| `/rent-a-car/[city]/[makeModel]` | `splitMakeModel` (longest known make prefix); 404 on zero results (no doorway pages); Breadcrumb + FAQPage (page 1); the "by the week or month" FAQ counts cars with `offersWeeklyMonthly` and says there's no set price. |
| `/rent-a-car/[city]/[makeModel]/[slug]` | Vehicle detail (`fetchVehicleBySlug`, §9.2); canonical from `getVehicleUrl`; Product (LeaseOut Offer, InStock/OutOfStock, aggregateRating when rated) + Breadcrumb JSON-LD; gallery, save, **"This exact car · ★ 4.6 (12) · 30 rides on KerayeGo"** (`CarRatingLine` from the listing's `carRating`, A87 — the car's own figures across its plate; a backend without `carRating` falls back to `/reviews/summary`, which also feeds the Product `aggregateRating`), a hardcoded "Verified provider" line, price card (day price, then 6 h / 12 h, then "Week or month — Price to agree" linking to the city's weekly & monthly page when the car is switched on; never week/month prices, A79), `AppRequestCta` (§12), "Free to send a request · No payment online", "Comes with the provider's driver · No self-drive"; GA `view_vehicle`. A booked car still resolves, marked BOOKED with `bookedUntil` (formatted in the server's time zone). |
| `…/[slug]/inquire` | Permanent redirect to the car page — the web booking form is off (A82, §12). |
| `/rent-a-car/price-index` | Price index by city and make + month-by-month history (≥ 2 snapshots); Breadcrumb + Dataset JSON-LD (CC BY 4.0, DataDownload). |
| `/rent-a-car/price-index/download` | Route handler, revalidate 3600: CSV `group,name,vehicles,lowest_pkr,median_pkr,average_pkr,highest_pkr` (overall, cities, makes), `kerayego-price-index-YYYY-MM-DD.csv`, `X-Robots-Tag: noindex`, 503 when empty. |
| `/vehicles/[slug]` | Route handler: look up the slug, 301 to its `/rent-a-car/…` URL; unknown → plain-text 404. |
| `/providers` | `fetchAllProviders` (12/page, `?city`, cookie location) → `<ProvidersView>`. |
| `/providers/[slug]` | **Dual purpose**: a known city → provider city hub (24/page, Breadcrumb); otherwise the provider page (`fetchProviderBySlug`, AutoRental JSON-LD with `addressCountry 'PK'`, hardcoded "Verified" badge, WhatsApp + call, `ProviderVehiclesSection` — client-only, local-state filters). A provider whose slug equals a city name can't be reached. |

Pagination rules on every list page: `?page=1` → 308 to the bare URL; an invalid or out-of-range page →
404; canonicals carry only the page number (filters dropped). Filter changes set `page=1` explicitly, so
each costs an extra redirect.

### 23.3 Carpool pages

| Route | Behaviour |
|---|---|
| `/carpool` | Route groups (`RouteGroupCard`) + "Browse by city" + links to 3 guides. No JSON-LD, no OG image, no "post a trip" button. |
| `/carpool/[route]` | `[route]` = `city` or `city-to-city`; indexed only with results; Breadcrumb; GA `view_carpool_route` (two-city routes); `<TripsView>` with origin/destination locked; "Post your trip" → `/dashboard/trips/new` (middleware remaps for a PROVIDER). |
| `/carpool/[route]/[id]` | Trip detail, **always noindex,follow**; Breadcrumb; return trips show "Business fleet · name"; stops, driver card with a hardcoded "Identity & documents verified" badge (the public endpoint only serves trips whose car is APPROVED, but the badge isn't tied to any field), the driver's USER rating + reviews, "Request seats", WhatsApp, call. |
| `…/[id]/inquire` | §13.3 |

### 23.4 Content pages, sitemap, robots, OG

- Static pages — about, contact, faq, safety, privacy, terms: metadata, canonical, Breadcrumb (FAQ also
  FAQPage); privacy and terms dated "November 7, 2026"; contact/privacy/terms use a personal Gmail support
  address (temporary per a code comment); privacy still names AWS for storage (storage moved to Google
  Cloud Storage on 2026-11-07).
- Guides: hub + `how-carpooling-works`, `how-to-offer-a-ride`, `carpool-safety-pakistan`,
  `how-to-rent-a-car-in-pakistan`, `how-to-list-your-car-for-rent`, `monthly-vs-daily-car-rental`; each has
  a 3-level Breadcrumb + Article JSON-LD via `GuideByline`. `how-to-offer-a-ride` swaps its web CTAs for
  app buttons once a store URL is set. **`monthly-vs-daily-car-rental`** was rewritten 2026-11-12 for plan
  §3c: set prices for 6 h / 12 h / 1–6 days, no set price for a week or a month (asked in the app, agreed
  with the business), how to ask, which to choose, and links to every city's weekly & monthly page that
  has cars (fetched live). `how-to-rent-a-car-in-pakistan` and `how-to-list-your-car-for-rent` (also
  updated 2026-11-12: requests sent in the app, the switch instead of week/month prices, the real profile
  steps) no longer quote week/month prices or describe the web form.
- `/aws-test`: now a stub returning `null` — a blank, indexable 200 page inheriting the homepage canonical.
- **`app/sitemap.ts`**: 18 static URLs (home, rent-a-car, price index, providers, carpool, about, faq,
  contact, safety, privacy, terms, guides hub + 6); city hubs; vehicles 100 per page × max 20 pages (the
  public `/listings` caps `limit` at 100); providers 100 × 20; provider city hubs; city+make and
  city+make-model pages from the vehicle crawl; weekly & monthly city pages (only cities that have such
  cars, one `/listings?…&weeklyMonthly=true&limit=1` call per city); carpool city and route URLs sampled
  from the newest 100
  trips only (trip pages excluded — they're noindex). Own `fetchJson`; returns what it can when the backend
  fails. `/rent-a-car` priority 0.9, `/carpool` 0.8.
- **`app/robots.ts`** (static, fetches nothing): allows `/`, `/rent-a-car`, `/providers`, `/carpool`;
  disallows `/admin/`, `/provider/`, `/dashboard/`, `/api/`, `/login`, `/register`, `/verify-email`,
  `/verify-phone`, `/rent-a-car/*/*/*/inquire`, `/carpool/*/*/inquire`. Not disallowed: `/driver/`,
  `/account/`, `/delete-account`, `/aws-test`.
- `app/opengraph-image.tsx`: site-wide 1200×630 image, edge runtime.

SEO work is tracked in the root [`docs/SEO_ROADMAP.md`](../../docs/SEO_ROADMAP.md) — update its
checkboxes + changelog when SEO-related code ships.

### 23.5 Navbar, analytics, app links

- `PublicNavbar`: Rent a Car, Providers, Carpool; reads the `userRole` cookie during render (so the server
  always renders signed-out → hydration flash); signed in → "Dashboard" (admin → `/admin/dashboard`,
  PROVIDER → `/provider/dashboard`, else `/dashboard`); signed out → Sign in / Register; mobile Radix Dialog
  drawer.
- Google Analytics (`components/analytics/GoogleAnalytics.tsx`): renders nothing without
  `NEXT_PUBLIC_GA_ID`. `trackEvent` (`lib/utils/analytics.ts`) is a no-op until `window.gtag` exists (no
  queue, so first-load `TrackEvent`s are probably dropped). Events: `view_vehicle`, `view_carpool_route`,
  `join_ride`, `offer_ride`, `list_vehicle_start`,
  `list_vehicle_complete`, `sign_up`, `provider_signup`, `contact_provider {method:'whatsapp'}` (fires on
  every `WhatsAppButton`, including support and trip drivers). `begin_booking` / `complete_booking` went
  with the web booking form (2026-11-12, A82).
- `lib/config/apps.ts`: `APP_STORE_URL` / `PLAY_STORE_URL` from env (build-time); `AppDownloadButtons`
  renders nothing while both are unset (homepage footer, `(public)` footer, `how-carpooling-works`).

### 23.6 Content policy check (2026-11-10)

- **Self-drive**: no public copy implies the customer drives (fixed 2026-11-10: the Karachi and
  Hyderabad FAQs in `lib/config/cityProfiles.ts` — also in each city page's FAQPage JSON-LD — used to say
  "Some are happy for you to drive out of Karachi" and "Can I drive a car rented in Hyderabad to
  Karachi?"; they now say every car comes with the provider's own driver and it's up to the provider
  whether they'll make the trip; Karachi's "having your own car" line likewise). The remaining mentions
  of "self-drive"/"without a driver" only say KerayeGo doesn't offer it (FAQ, city FAQ, about, safety,
  terms, rent-a-car copy, vehicle page, two guides), which the owner's rule allows.
- **Currency**: every price renders as PKR. Stale comments still talk about per-market currency
  (`VehiclesView.tsx:435`, `app/layout.tsx`, `providers.api.ts:35`, `showroomPayload.ts:36-40`).
- **Unbacked figures**: "Reply in ~14 min" (homepage collage), "Most providers reply the same day, often
  within an hour" (trust signal), "1,240 vehicles listed" / "380 verified providers" (register page brand
  panel, hardcoded).

### 23.7 Config

- `lib/config/markets.ts` — identical data to the backend's `src/config/markets.config.ts`: PK / SA / AE,
  phone codes +92 / +966 / +971, sample cities, `DEFAULT_MARKET` PK, **`currencyCode: 'PKR'` for all**.
- `lib/config/cityProfiles.ts` — hand-written region/about/FAQ/carpool-route copy for 12 cities (9 live +
  Sukkur, Larkana, Nawabshah).
- City lists hardcoded on about/FAQ (9 cities).

---

## 24. Maps & location

- `@vis.gl/react-google-maps` with `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` (browser key, restricted by
  referrer). `GoogleMapsProvider` (`<APIProvider>`, no `libraries`) is mounted separately by
  `LocationSearch`, `MapLocationPicker`, `ResultsMap`, `LiveTripMap` and `LiveDriversMap`; the live-map
  page also reads the key directly. On `/rent-a-car` the maps script loads on every visit, phones
  included (the desktop filter panel is only CSS-hidden).
- **Places goes straight from the browser to Google** (Places API (New):
  `AutocompleteSuggestion.fetchAutocompleteSuggestions`, `toPlace().fetchFields(['location',
  'formattedAddress'])`), loaded via `useMapsLibrary('places')` in `PlaceAutocompleteInput`, with
  `includedRegionCodes: ['PK','AE','SA']` — this **restricts** results to those countries. One session
  token per search, renewed after a selection; 300 ms debounce; outside-click/Escape close. Cross-field
  dropdown exclusivity is a module singleton (`components/maps/activeAutocomplete.ts`).
- **Backend `/geo` calls from the web: `GET /geo/reverse`** (`LocationSearch`, `MapLocationPicker` — after
  a map click/drag or "use my location") **and `GET /geo/route-directions`** (`useRiderLiveRoute`, §14.3).
  The backend's `/geo/places/*` are never called by the web (mobile uses them).
- Browser geolocation: `lib/utils/geolocation.ts` (`maximumAge`) and `MapLocationPicker`
  (`enableHighAccuracy`); no fallback coordinates on denial. `userLocation` cookie
  (`lib/utils/userLocation.ts`): `{lat,lng,label}`, 365 days, `sameSite: lax`, readable by Server
  Components (homepage, `/rent-a-car`, `/providers` personalise from it).
- `ResultsMap`: classic `Marker` (no Map ID needed), a radius `Circle`, fixed zoom bands, no clustering.

---

## 25. File uploads

| Path | Context(s) | Client checks |
|---|---|---|
| Business logo/banner (`BusinessImageField`) | `provider_logo`, `provider_banner` | JPEG/PNG/WebP ≤ 5 MB |
| Business documents (`useBusinessDocuments`) | `document` + `documentType` | JPEG/PNG/PDF ≤ 10 MB |
| Fleet photos (`useVehicles`, `lib/ops/photos.ts`) | `vehicle` + `entityId` | JPEG/PNG/WebP, compressed, ≤ 5 MB, max 10 |
| Driver documents/photo (`driverApi.upload`, 120 s timeout) | `driver_document` + type, `driver_photo` | JPEG/PNG/PDF ≤ 10 MB; photo/selfie images |
| Personal-vehicle photos / documents (`useUpload` via `VehiclePhotosField`, `DocumentUploadField`) | `user_vehicle_photo`, `trip_document` | **none** (only `accept`) |

All go to `POST /media/upload` (multipart, `onUploadProgress`); `mediaApi.delete` → `DELETE
/media/:publicId` is used on document replace/remove and on a failed fleet-photo attach. The backend
accepts 8 contexts (the six in `media.api.ts`'s `UploadContext` + the two driver ones typed in
`types/driver.types.ts`); its limits are images JPEG/PNG/WebP ≤ 5 MB, documents JPEG/PNG/PDF ≤ 10 MB.
`mediaApi.upload` keeps the default 30 s timeout. `hooks/useUpload.ts` is a plain `useState` helper
(`{uploading, progress, url, publicId, error}`; on error toasts `error.message` from the envelope and
returns `null`). `components/uploads/ImageUpload.tsx` and `DocumentUpload.tsx` are **dead** (zero
importers). There is no drag-and-drop anywhere — dashed borders are styling only.

---

## 26. Design system & Tailwind

- **Hand-rolled components**, not shadcn/ui (PascalCase per file). `components/ui` (barrel `index.ts`):
  `Avatar`, `BackButton`, `Button` (+`buttonVariants`, the only `class-variance-authority` user: variants
  primary/secondary/ghost/link/danger/danger-outline/whatsapp, sizes sm/md/lg/icon, `loading`), `Card`,
  `ConfirmDialog`, `DebouncedInput`, `EmptyState`/`ErrorState`, `Input`/`Textarea`/`Select`, `Modal`,
  `Pagination`, `RatingStars`/`RatingBadge`, `Selection` (`Checkbox`, `PillToggle`, `RadioCard`,
  `Switch`), `Stepper`, `Tabs` (`UnderlineTabs`, `SegmentedTabs` — plain buttons, no ARIA tab roles),
  `WhatsAppButton`. `cn()` (`lib/utils/cn.ts`, clsx + tailwind-merge) is used in 72 files; `lucide-react`
  for icons.
- **Dialogs — pick the right one** (owner rule: every sheet/modal has a top-right × and closes on
  tap-outside):
  - `Modal` (Radix Dialog): × button, outside click and Esc close. Used in 24 files.
  - `ConfirmDialog` (Radix AlertDialog): **no ×, no tap-outside close** (Cancel/Esc only) — breaks the
    rule; used in 17 files. Supports `requireReason`, `minReasonLength`/`maxReasonLength`.
  - `components/ops/ConfirmModal.tsx`: yes/no built on `Modal` precisely to meet the rule (4 files).
    Prefer it for new confirms.
- **Radix**: 17 `@radix-ui/react-*` packages installed; only `react-dialog` (`Modal`, `MobileSidebarBar`,
  `PublicNavbar`, `VehicleImageGallery`) and `react-alert-dialog` (`ConfirmDialog`) are imported.
  `react-tabs` and the other 14 are unused. Also unused: `date-fns`, `next-themes`, `tailwindcss-animate`
  utilities. `framer-motion` is used once (`VehicleImageGallery`).
- **`StatusBadge`** (`components/common/StatusBadge.tsx`, 41 importers) is the single status → colour map
  (Tailwind's `colors.status` is "Frozen" — don't add a second map). Tones exist for ProviderStatus,
  VehicleStatus, BookingRequestStatus, UserVehicleStatus, TripStatus, TripInquiryStatus, DocumentStatus,
  DriverVerificationStatus, CLEARED/BLOCKED. Missing: `PENDING_VERIFICATION` tone, `PENDING_DELETION`/
  `DELETED` (no label either), MembershipStatus INVITED/INACTIVE/DECLINED, DriverJobStatus DECLINED.
- **Tailwind tokens** (`tailwind.config.ts`), two systems:
  - **Sunset Coral** (current): `brand` 50/100/600/700/800 (no DEFAULT; `bg-brand` is the coral → amber
    gradient from `backgroundImage`), `amber`, `ink`, `page`, `surface`, `surface-hover`, `border-subtle`,
    `border-strong`, `text-muted`, `text-faint`, `whatsapp`, `status.{amber,blue,emerald,red,slate,violet,
    teal}.{fg,bg,border,dot}`; radius chip 8 / control 11 / media 14 / card 18 / sheet 26 px; warm shadows
    xs…lg, coral, coral-lg; easing spring/smooth; keyframes fade-in, slide-in-left, shimmer (+ unused
    accordion).
  - **Legacy shadcn-style HSL variables** (`primary`, `foreground`, `muted`, `destructive`, …) defined in
    `app/globals.css:24-43`, whose own comment says "DELETE THIS BLOCK once those pages are migrated".
    They are still used — ~78 class uses in 23 files (all error boundaries, `not-found`, the three
    hand-rolled admin detail pages, provider cards, the dead upload components) plus
    `* { @apply border-border }`. New code uses Sunset Coral only.
  - Undefined classes that silently do nothing: `text-ink-soft` (13 uses), `brand-500`/`brand-200`.
- **Dark mode**: `darkMode: ['class']` is configured but nothing sets the class; `globals.css` forces
  `color-scheme: light`. The only `dark:` classes (admin tracking page) never apply.
- Internal comments call this the "4321-Drive design system" (an old project name; `globals.css:15`,
  `StatusBadge.tsx:3`, `tailwind.config.ts:56`) and cite `PROJECT_DESIGN_REFERENCE.md` /
  `KerayeGo_SEO_Master_Reference.md`, which don't exist.
- Shared field components: `Select` has no dropdown arrow; `required` isn't passed to the element (only the
  asterisk shows); `Modal` clips tall content (`overflow-hidden`, no max height).

---

## 27. Forms & validation

React Hook Form + Zod (`@hookform/resolvers/zod`). Schemas in `lib/validations/` (11): `auth`
(`phoneProfileSchema`, `requestCodeSchema`, `verifyCodeSchema`), `phone` (`sendPhoneCodeSchema`), `cnic`
(`CNIC_PATTERN`, `cnicNumberSchema`, `formatCnicInput` — shared by business, personal-vehicle and driver
forms), `business` (details + showroom), `team` (invite), `driver-setup` (per step), `trip`,
`trip-inquiry`, `user-vehicle`, `vehicle` (only option constants; the live fleet schema is
`lib/ops/vehicleForm.ts`), `provider` (**dead**). (`booking.schema.ts` went with the web booking form,
2026-11-12.) Other rule files: `lib/ops/statusAction.ts`
(status note), `lib/ops/ratings.ts`, `lib/driver/fields.ts`.

Known gaps: the personal-vehicle uploads have no size/type check; trip stops have no UI cap; chat and decline-note inputs
have no max length matching the backend's.

---

## 28. Types & the enum mirror

`types/enums.ts` mirrors the backend Prisma enums by hand (no codegen — see the root
`docs/ARCHITECTURE.md` "triple mirror"). Checked 2026-11-10 against `kerayego-backend/prisma/schema.prisma`:
identical for Role, ProviderStatus, VehicleStatus (incl. SUSPENDED), Market, BookingRequestStatus (8),
DocumentStatus, BusinessRole, DriverVerificationStatus, DriverGender, DriverVehicleType,
DriverTransmission, DriverService, PayoutMethod, DriverAgreementType, DriverDocumentType, Transmission,
FuelType — **except `UserStatus`, which lacks `PENDING_DELETION` and `DELETED`** (code uses them as string
literals). String unions in the API files (TripStatus, TripEventType, PickupSource, TripStopType,
TripInquiryStatus, UserVehicleStatus, RentalDurationType, ReviewContext, DriverJobStatus, DriverJobAnswer,
IdentityReviewStatus, PersonBlockIdentifierKind) match the backend. Duplicates: BookingRequestStatus as
three unions besides the enum; MembershipStatus as an enum (`team.types.ts`) and a union
(`driver.types.ts`). AuditActionType/EntityType are typed `string`. `DOCUMENT_TYPES` (7) +
`DriverDocumentType` (6) cover all 13 backend `DocumentType` values. Web types ignore several newer
backend fields (§14.4, `codeSent`/`messageUsUrl`, `bookingsAsDriver`).

Rental booking redesign (2026-11-11, plan §3c/§3d) types, mirrored 2026-11-12 from the Partner app's:
`BookingStop`, `BookingRouteFields` (tripType, passengerCount, route km/minutes, way back, time needed,
driver hours/days/km, stops), `BookingTripType` + `BOOKING_TRIP_TYPE_LABELS`, `CarClash` and
`BookingRequestDetail.carClashes`, the business-only approach / drive-back legs
(`types/booking-requests.types.ts`); the customer's `BookingRequest` (`lib/api/bookings.api.ts`) extends
the route fields and adds the driver card (`identityVerified`, `licenceVerified`, `rating`, `rideCount`);
`DriverAssignedJob` extends them too; listings get `CarRating` / `carRating` and `offersWeeklyMonthly` and
lose `pricePerWeek` / `pricePerMonth`; fleet types get `offersWeeklyMonthly` (the payload no longer sends
week/month prices). Every new field is optional — the web also runs on a backend from before 2026-11-11.
`RentalDurationType` keeps WEEK and MONTH (requests can be for them); `lib/utils/rentalDuration.ts`'s
priced packages are 6 h / 12 h / day only.

When the backend changes an enum or contract, the backend is right — update the web mirror; never change
the backend to match the web. Exact shapes: the backend's OpenAPI at `/api/docs` (dev).

---

## 29. Environment variables

| Variable | Read in | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `lib/api/client.ts`, `lib/api/server.ts`, `app/sitemap.ts` | Default `http://localhost:3001/v1`; the socket uses its origin |
| `NEXT_PUBLIC_SITE_URL` | `app/layout.tsx`, `robots.ts`, `sitemap.ts`, `price-index/page.tsx`, `GuideByline.tsx` | Falls back to `https://www.kerayego.com` in all five; example file sets `http://localhost:3000`; should equal the backend's `FRONTEND_URL` |
| `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` | `GoogleMapsProvider.tsx`, `provider/live-map/page.tsx` | Browser key, restrict by referrer; Maps JS + Places (New) |
| `NEXT_PUBLIC_GA_ID` | `GoogleAnalytics.tsx` | Unset → GA never loads (commented out in the example) |
| `NEXT_PUBLIC_APP_STORE_URL`, `NEXT_PUBLIC_PLAY_STORE_URL` | `lib/config/apps.ts` | Unset → every "get the app" button hidden; build-time |
| `NEXT_PUBLIC_SENTRY_DSN` | — | Commented out in the example; no Sentry code exists |

`NEXT_PUBLIC_SITE_NAME` is no longer in `.env.local.example` (only a local `.env` has it) and nothing reads
it — the name `'KerayeGo'` is hardcoded in `app/layout.tsx`.

---

## 30. Errors, loading & notifications

- Errors: route `error.tsx` boundaries per group (§4); `server.ts` never throws (returns `null`);
  `client.ts` handles 401 (refresh) and 403 `PHONE_NOT_VERIFIED` (gate) specially, everything else
  rejects to the caller. Many `mutateAsync` calls lack try/catch (unhandled rejections in admin pages,
  rider cancel, customer cancel).
- Loading: 8 `loading.tsx` files (§4); otherwise each component shows its hook's `isLoading`/`isPending`.
- Notifications: **`sonner` toasts only** (`<Toaster>` in the root layout). No push, no service worker, no
  notification inbox. Async events reach web users by email (sent by the backend) and, for carpool live
  rides and chat, over the socket.

---

## 31. Testing, build & commands

- **No tests**: no runner, no `*.test.*`/`*.spec.*` files, no `test` script. Verify changes with
  type-check + lint and by running the app against a backend.
- Commands: `npm run dev` (next dev, port 3000), `build`, `start`, `lint` (next lint), `type-check`
  (`tsc --noEmit`; writes `tsconfig.tsbuildinfo` because `incremental` is on), `format` (prettier on
  ts/tsx/md).
- Deploy: Vercel (§0). The sitemap and server pages degrade gracefully when the backend is down.

---

## 32. Known issues & open items (2026-11-10)

Reported, not fixed. Fix the code, then move the item to the changelog.

### 32.1 Bugs

- Live-layer bugs in §14.4; a rejected socket handshake is never retried; the socket isn't disconnected
  on logout.
- Backend error text lost where code reads `response.data.message` instead of `error.message`
  (`useTripInquiries.ts:71-73`, `useReviews.ts:41-43`, `ChatPanel.tsx:35-40`).
- Chat history shows only the oldest 50 messages (`nextCursor` dropped).
- Rider "Cancel my seat" offered after the trip is over.
- Phone gate never shows in a fresh tab (empty store); refresh-failure cleanup leaves the store signed in;
  no path clears the React Query cache.
- While WhatsApp codes are off, sign-in still says the code was sent on WhatsApp (ignores `codeSent` /
  `messageUsUrl`).
- `/driver/businesses` "Confirm your email" link bounces phone-verified people to `/dashboard`.
- Fleet: Archive shown for a SUSPENDED car (backend 409); search not debounced.
- Driver availability: the default service city is never saved.
- Admin: tracking 404 shows a generic error and keeps polling; audit-log footer maths (50 vs 20),
  unfilterable entity types, `[object Object]` metadata; settings save → unhandled rejection; users list
  shows raw `PENDING_DELETION`/`DELETED`.
- Navbar hydration mismatch; nested `<a>` in
  `TripCard` and `VehicleCard`; city/make slug forms inconsistent (`getVehicleUrl` hyphenates multi-word
  cities while hubs and the sitemap use `%20`); `bookedUntil` formatted in the server's time zone.

### 32.2 Plan / parity gaps

- **A71** (web done 2026-11-10, §19): the backend still accepts a `PROVIDER`'s move to
  IN_PROGRESS/COMPLETED; "Remind driver" waits for a backend endpoint. The Partner app's own Accept dialog
  still says "Once accepted, only KerayeGo can change this request" next to its Cancel button (the web's
  copy was corrected).
- Driver side (§21.8): manager-only invitees can't accept on web; answer rules differ; a manager can't
  edit a driver's profile; the selfie fallback accepts a stored file on desktop.
- Rental redesign (plan §3c/§3d): "Plate checked by KerayeGo" (A87) isn't shown — the listing doesn't say
  yet (also open in the customer app); the business Route section has no small map of the stops (Partner
  hasn't one either; plan §3c mentions it).
- Live map keeps all drivers visible when one is selected (A27; same as Partner).
- Admin: no rental-vehicle suspend/reactivate; no review delete UI.
- No personal-information route for a PROVIDER account working only as Manager/Driver (§7).
- A PROVIDER account has no page for rental requests it sent (§12).
- Dashboard quick actions require a showroom, the sidebar lock doesn't (§17.4).

### 32.3 Content & SEO

- Unbacked homepage/register figures (§23.6).
- Carpool (the owner's top priority) is absent from the homepage and has no JSON-LD/OG on `/carpool`.
- Privacy page names AWS for storage (Google Cloud Storage since 2026-11-07).
- `/aws-test` blank indexable page; robots doesn't disallow `/driver/`, `/account/`, `/delete-account`.
- Root `alternates.canonical` inherited by pages without their own; Breadcrumb JSON-LD uses relative URLs.
- Personal Gmail used as the support address on public pages.

### 32.4 Code hygiene

- Dead: `store/ui.store.ts`, `components/uploads/*`, `components/admin/AdminSidebar.tsx` (stub),
  `lib/validations/provider.schema.ts`, `vehicleSchema`, `authApi.refresh`, `useBooking`/`bookingsApi.getOne`,
  `bookingsApi.getLiveDriver`/`getLiveRoute` (their response types also don't match the backend's
  live-driver shape — fix before first use), `tripsApi.update`/`getMetaCities`/`getRouteGroups`,
  `tripInquiriesApi.getMyCounts`/`getInboxCounts`, `adminApi.getAllProviders`, `useDeleteReview`,
  `formatAmount`, `formatMonth`, `IDENTITY_BLOCKED` (driver errors), `findPendingCustomerRating`
  (`lib/ops/ratings.ts`), `sameOrder` (`lib/ops/photos.ts`).
- Duplicates: two `getApiErrorCode`s; `IDENTITY_HOLD_MESSAGE` ×2; `isDocumentLinkFresh` ×2; `formatPKR`
  ×2; `toDisplayName` ×6; `/users/me` fetched by three different hooks; several hand-rolled countdowns
  beside `useCountdown`.
- Stale comments: "S3" in `media.api.ts:37`, `DocumentUploadField.tsx:20`, `VehiclePhotosField.tsx:12`,
  `UserVehicleForm.tsx:30` and `:251-252`, `user-vehicles.api.ts:54`, `DriverBusinessCards.tsx:14`,
  `DriverPhotoField.tsx:29`; `fleet.types.ts:10` (SUSPENDED); `middleware.ts:57-67`; `useTrips.ts:76-77,
  91-92`; `DriverCockpit.tsx:28,43-44`; `driver.api.ts:16-18` (customer location, A72).
- Legacy colour tokens and undefined classes (§26); `en-AE` locale in two admin pages; plan codes ("A31")
  in admin UI copy.

---

## 33. Changelog

- **2026-11-12** (jainshaikh) — Rental booking redesign on the web (plan §3c/§3d, A74–A88; the backend
  half is from 2026-11-11 and **not on production yet** — every new field is read as optional, so the web
  keeps working on the old backend). Not deployed. `npx tsc --noEmit` and `npm run lint` clean; no test
  suite. Checked in a browser on a local dev server against a local mock of the new backend shapes
  (stops, route figures, `carClashes`, driver card, `carRating`, `offersWeeklyMonthly`): business booking
  list/detail/Accept, driver jobs, customer dashboard and requests, the fleet form, car page, city page,
  weekly & monthly page, guide, sitemap — no console errors; not tried against the real new backend (its
  migration isn't applied to any database confirmed safe to use).
  - **Web booking form off (A82):** `AppRequestCta` on the car page sends customers to the app; `/inquire`
    → 308 to the car page; removed `InquiryCta`, `useCreateBooking`, `bookingsApi.create`,
    `booking.schema.ts`, GA `begin_booking` / `complete_booking`. §12.
  - **Business portal = Partner (A69):** `lib/ops/bookingRoute.ts` (port), duration wording "6 hours" /
    "3 days" / "1 week" (`durationLabel`), booking card route line + passengers + "Price to agree",
    detail Route section (`RouteCard`), trip type, passengers, weekly/monthly hours/days/km (A85), "Price:
    To agree" (A79), the double-booking warning on the page and in Accept + the `VEHICLE_ALREADY_BOOKED`
    message (`CarClashWarning`, A88); fleet form's weekly & monthly switch replaces week/month prices
    (A84), also on the read-only specs card and the admin vehicle page. §18, §19, §22.4.
  - **Driver jobs (A72, §3c):** `JobPlaces` — stops with times and notes, "Map" per stop, "Directions for
    the whole route" — closes the "no Map directions" parity gap. §21.6.
  - **Customer dashboard:** package wording, route line, folded stop list, passengers, "price to agree",
    the driver card (A86). §12.
  - **Public:** no week/month prices anywhere (car page, cards, city/make-model copy and FAQs, homepage,
    layout metadata, price-index note); "This exact car" with the car's rating and rides (`CarRatingLine`,
    A87) on the car page and cards; new **weekly & monthly page per city**
    `/rent-a-car/[city]/weekly-monthly` (A84) linked from the city hub, the car page and the rewritten
    `monthly-vs-daily-car-rental` guide, in the sitemap; FAQ, about, rent-a-car hub and the two rental
    guides describe requests in the app; `how-to-list-your-car-for-rent`'s stale five-tab wizard fixed;
    removed the dead `vehicleSchema`. §23.
- **2026-11-10** — Fixed seven bugs from the cross-check (local, not deployed). `npx tsc --noEmit` and
  `npm run lint` clean; no test suite. Checked on a local dev server against the live backend: the
  Karachi/Hyderabad city pages show the new FAQ wording; `/login` keeps a same-site `callbackUrl` in its
  links and drops a foreign one; the changed signed-in pages compile and render. `safeRedirect` checked
  against 14 attack/normal strings and the business action table run directly. The signed-in flows
  themselves (counters, inbox, rider live map) were not exercised end to end — no test account.
  - **Customer dashboard counters** always showed 0: `lib/api/bookings.api.ts` returned the backend
    envelope for every call; it now unwraps like the other API files (also fixes
    `useUpdateBookingStatus` caching under `['bookings', undefined]`). §9.1, §11.
  - **Plan A71 in the business inbox**: ACCEPTED offers **Cancel booking** (until the driver starts the
    job) instead of Start trip; IN_PROGRESS offers nothing instead of Complete trip; notes, the Cancel
    dialog copy and success toast match the Partner app; the closing note now shows above the buttons;
    the Accept dialog no longer says "only KerayeGo can change this request". `lib/ops/bookingDisplay.ts`,
    `lib/ops/statusAction.ts`, `components/ops/bookings/StatusActionModal.tsx`,
    `app/(provider)/provider/inquiries/[id]/page.tsx`. §19.
  - **Open redirect after sign-in**: new `lib/utils/safeRedirect.ts` (same-site paths only; also blocks
    `/\host`) applied in `/login`, `/register`, `/verify-email`, `/verify-phone` and
    `useAuth().routeAfterSignIn`; `/verify-email`'s self-heal now goes to the user's own role's dashboard
    instead of always `/dashboard` (`roleToRoute` exported from `hooks/useAuth.ts`). §6.4, §6.5.
  - **Vehicle detail pages cached with no expiry**: `fetchVehicleBySlug` now uses `cache: 'no-store'`
    via a new `serverFetch` option `noStore` (`revalidate: false` is gone). §9.2.
  - **Rider live map had no stops or route line**: `useRiderLiveRoute` now takes the stops from the
    rider's inquiry detail (`trip.stops`, now typed on `TripInquiryTrip`) instead of the public
    `GET /trips/:id`, which 404s once the trip starts. §14.3.
  - **Customer Cancel on a CONTACTED request** (the backend refuses): offered only while PENDING, as on
    mobile; the hand-rolled overlay became `ConfirmModal` (× + tap-outside), failures no longer leave an
    unhandled rejection. §12.
  - **Self-drive wording** in the Karachi and Hyderabad city FAQs (and their FAQPage JSON-LD) reworded to
    driver-included; Karachi's "having your own car" line too. §23.6. Also: `SaveButton` now sends
    `callbackUrl` (login ignored `returnTo`). §16.
- **2026-11-10** — Whole repo cross-checked against this document and `CLAUDE.md`; both rewritten to the
  code's current state (no code changed). Corrected: the carpool live ride, chat and Socket.IO client
  **exist** (old §1/§14/§16/§18 said absent); `(provider)` is a membership-based business portal for USER
  and PROVIDER accounts with a `can()` route guard, not a PROVIDER-only portal; the `(driver)` group,
  business portal pages (dashboard, documents, team, activity, ratings, live map, booking detail), admin
  blocks/identity reviews/tracking, and account deletion were undocumented; the business profile has 3
  tabs, not 6; `@radix-ui/react-tabs` is unused; `cn` is in 72 files; legacy tokens are still used; the
  site URL fallback is `https://www.kerayego.com`, not `rentalmarket.ae`; `useUpdateTripInquiryStatus`
  does invalidate the inbox; `useUpsertSetting` has an `onError`; driver approval needs 5 documents; the
  REJECTED-vehicle resubmit gap is fixed; the rider request sends separate pickup/drop-off stop ids;
  `mediaApi.delete` is used; most "dead" hooks were deleted; upload size checks exist on most paths;
  `loading.tsx` coverage recounted (8); hosting is Vercel. Added §0 (current state), §32 (known issues
  found in this pass) and this changelog.
- **2026-11-07** — Storage moved to Google Cloud Storage (`next.config.mjs` image host); personal-vehicle
  delete added (`MyVehicleDetail`).
- **2026-11-06** — Phone-first sign-in/sign-up (`PhoneAuthFlow`); email code kept as backup sign-in.
- **2026-11-01** — Passwords removed; WhatsApp phone verification gate added.
- **2026-10-30** — Plan A69: full business portal on the web for business admin, managers and drivers.
