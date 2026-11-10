# KerayeGo Web — CLAUDE.md

Guidance for agents changing this codebase. Full detail — every route, hook, endpoint, rule and known
issue — is in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md); its **§0 is the current state** and **§32
the known-issues list**. Both files were rebuilt from a full read of the code on 2026-11-10. Code wins
over either: if they disagree, fix the doc and add a line to the changelog (`docs/ARCHITECTURE.md` §33).

## What this is

Next.js 14 App Router + TypeScript site for KerayeGo, talking only to `kerayego-backend`
(`NEXT_PUBLIC_API_URL`, default `http://localhost:3001/v1`). Deployed on **Vercel** at
`https://www.kerayego.com`. It covers:

- **Public site + SEO** — rental listings, providers, carpool routes, guides, price index (`(public)`,
  homepage `app/page.tsx`).
- **Customer dashboard** `/dashboard/*` — own rental requests, carpool trips and seat requests, personal
  vehicles, reviews, settings.
- **Carpool day-of layer** — driver cockpit, rider live view, live location over the backend's `/ride`
  Socket.IO gateway, chat (`components/trips/live/`, `lib/realtime/ride-socket.ts`). Narrower than mobile:
  no offline queue, no geofencing (rider self-report is a button), the web driver's location sharing is an
  opt-in "Share my live location" toggle, no rider location sharing.
- **Business portal** `/provider/*` + **driver portal** `/driver/*` — everything the KerayeGo Partner app
  does for business admins, managers and drivers (plan A69), except a driver's on-trip session (Start/End
  job, live location), which the web only explains.
- **KerayeGo admin console** `/admin/*`.

Not here: push notifications ("notifications" = `sonner` toasts), rental customer's live driver view.

## Stack & conventions

Next.js 14.2.35 (`^14.2.5`) · React 18.3.1 · TypeScript strict · TanStack React Query v5 (server state) ·
Zustand (client state) · axios (`lib/api/client.ts`, authenticated) + native `fetch` (`lib/api/server.ts`,
public SSR) · React Hook Form + Zod · Tailwind + a **hand-rolled** component set (`components/ui`, not
shadcn) · `@vis.gl/react-google-maps` · `socket.io-client` · `sonner` · `lucide-react`.

- **Imports are relative** everywhere (`'../../hooks/useAuth'`). The tsconfig aliases exist but nothing
  uses them — don't introduce them.
- Prettier: single quotes, trailing commas, width 100. ESLint: `next/core-web-vitals`.
- Each domain has `lib/api/<domain>.api.ts` + `hooks/use<Domain>.ts`. **Wrappers are inconsistent about
  the `{success, data}` envelope** — `auth.api.ts`, `bookings.api.ts`, most of `providers.api.ts` and parts
  of `users.api.ts` return it un-unwrapped (table in ARCHITECTURE §9.1). Check before reading a field.
  Error text is at `error.response.data.error.message` — use `getApiErrorMessage` (in
  `hooks/useAccountDeletion.ts`) or `lib/ops/apiError.ts`.
- **Business/driver UI permissions go through `can(action)`** from `hooks/useWorkspace.ts`
  (`lib/workspace/workspaceSelection.ts`). That file is a copy of the Partner app's
  `src/features/workspace/workspaceSelection.ts` — **change both together**. Route guards per action are in
  `lib/workspace/workspaceRoutes.ts`. `lib/ops/*` and `lib/driver/*` are likewise hand ports of Partner-app
  logic; check the Partner file when changing one.
- **Dialogs** (owner rule: every sheet/modal has a top-right × and closes on tap-outside): use `Modal` or
  `components/ops/ConfirmModal.tsx`. `ConfirmDialog` (Radix AlertDialog) has neither — don't use it for new
  work.
- Colours: Sunset Coral tokens (`brand`, `ink`, `page`, `surface`, `status-*`…). The legacy shadcn HSL
  classes (`bg-primary`, `text-foreground`…) are slated for deletion — don't add more. Status colours come
  only from `components/common/StatusBadge.tsx`.
- **Owner policies**: every rental comes with the provider's driver — never self-drive wording; every
  price is PKR (markets only set phone codes and cities); carpool is the top priority in public content.

## Route groups & access

```
app/
  (auth)/       /login, /register (one phone-first flow), /verify-email, /verify-phone
  (dashboard)/  /dashboard/*   customer portal (USER)
  (provider)/   /provider/*    business portal by membership + a PROVIDER account's own carpool
  (driver)/     /driver/*      driver portal: jobs, businesses, profile, setup/[step]
  (admin)/      /admin/*       ADMIN / SUPER_ADMIN
  (public)/     public pages (+ /delete-account, /account/cancel-deletion)
  page.tsx      homepage — outside (public), own navbar + footer
```

- **`middleware.ts` is UX only** — it reads two plain cookies (`userRole`, `emailVerified`) set at sign-in
  and can't verify a JWT. The backend is the only security boundary. Rules: signed out → `/login?callbackUrl=`;
  `emailVerified` not `'true'` → `/verify-email`; USER may use `/dashboard`, `/provider/`, `/driver/`;
  PROVIDER `/provider/`, `/driver/`; admins `/admin`. The shared carpool sections (`trips`,
  `trip-inquiries`, `my-vehicles`, `incoming-requests`, `reviews`) are remapped to the role's own prefix.
- `(dashboard)`, `(provider)`, `(driver)` layouts are wrapped in `PhoneVerificationGate` (blocking
  "Verify your mobile number" while the backend says `user.mustVerifyPhone`); `(admin)` has no gate and
  no role check of its own.
- **Business access is by membership** from `GET /users/me/workspaces`: owner = Business admin, active
  manager = Manager, driver profile / driver membership / pending driver invite = Driver. The active
  dashboard is remembered per user in localStorage. `ProviderPortal` / `DriverPortal` pick what to render
  (page, switch screen, "no business dashboard", "not a driver yet", "not for your role").
  `/provider/profile` doubles as create-a-business; `/driver/profile` + `/driver/setup/*` as
  become-a-driver.
- **Naming trap**: `incoming-requests` (both portals) is the **carpool** poster inbox. Rental booking
  requests are `inquiries`: `/dashboard/inquiries` = the customer's sent requests, `/provider/inquiries` =
  the business's received inbox — different pages sharing a name.

## Auth model (details: ARCHITECTURE §6)

No passwords. `/login` and `/register` run `components/auth/PhoneAuthFlow.tsx`: number → WhatsApp code
(`POST /auth/phone/request` → `/auth/phone/verify`) → signed in, or a profile step for a new number
(customer/business, name, email → `/auth/phone/register`). "Sign in with email instead"
(`/login?method=email`) uses the emailed code (`/auth/code/*`). The access token lives only in memory
(`client.ts`); the store (`store/auth.store.ts`) persists `{user, isAuthenticated}` to sessionStorage;
`AuthBootstrap` refreshes the token on load; a 401 triggers one shared refresh + retry (never for
`/auth/refresh`, `/auth/code/*`, `/auth/phone/*`); a 403 `PHONE_NOT_VERIFIED` raises the phone gate. The
refresh token is the backend's httpOnly cookie.

## State

React Query for server data (defaults: staleTime 60 s, no retry on 4xx, no refetch on focus). Zustand:
`auth.store` (persisted), `phone-gate.store`, `workspace.store`; `ui.store` is dead. Public browse pages
keep filters in the URL. `userLocation` cookie holds the visitor's resolved location for Server
Components.

## Things that will surprise you

- `docs/ARCHITECTURE.md` §0 lists the open items and §32 every known bug. Rules that past bugs taught:
  follow a redirect param only through `lib/utils/safeRedirect.ts`; a business never starts or completes
  a rental (plan A71 — only the driver, in the Partner app; the inbox offers Cancel for an accepted
  booking); a customer cancels a rental request only while PENDING; to make a `serverFetch` uncached use
  `noStore: true` (Next 14 auto-caches a fetch with no `cache` option); the rider's live view reads stops
  from the inquiry detail, never the public `GET /trips/:id` (404 once a trip starts).
- Places autocomplete talks **directly from the browser to Google** (restricted to PK/AE/SA). The web
  calls only two backend `/geo` endpoints: `/geo/reverse` and `/geo/route-directions` (live ride).
- Uploads go through `POST /media/upload` with a context (8 contexts incl. `driver_document`,
  `driver_photo`). Business, fleet and driver uploads check size/type in the browser; the personal-vehicle
  uploads (`useUpload`) don't. `components/uploads/*` is dead.
- Only `@radix-ui/react-dialog` and `react-alert-dialog` are used of 17 installed Radix packages.
- `components/admin/AdminSidebar.tsx` is an empty stub; the live admin sidebar is
  `components/layout/AdminSidebar.tsx`.
- `types/enums.ts` mirrors the backend by hand; `UserStatus` is missing `PENDING_DELETION`/`DELETED`. If
  the web and backend disagree, the backend is right.
- "4321-Drive" in comments is an old project name; `PROJECT_DESIGN_REFERENCE.md` /
  `KerayeGo_SEO_Master_Reference.md` cited in comments don't exist.

## Commands

```
npm run dev          # next dev (localhost:3000)
npm run build        # next build
npm run start        # next start
npm run lint         # next lint
npm run type-check   # tsc --noEmit (writes tsconfig.tsbuildinfo)
npm run format       # prettier --write ts/tsx/md
```

**No test suite exists** — say so explicitly when reporting. Definition of done here: `npm run
type-check` + `npm run lint` clean, then exercise the change in a browser against a running backend.

## Environment variables

From `.env.local.example`: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL` (falls back to
`https://www.kerayego.com` in code), `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`, and commented
`NEXT_PUBLIC_APP_STORE_URL` / `NEXT_PUBLIC_PLAY_STORE_URL` (every "get the app" button stays hidden until
one is set), `NEXT_PUBLIC_GA_ID` (GA doesn't load without it), `NEXT_PUBLIC_SENTRY_DSN` (no Sentry code).
`NEXT_PUBLIC_SITE_NAME` isn't read anywhere.

## Keeping docs current

For any web change, in the same task: fix the affected section of `docs/ARCHITECTURE.md`, update its §0
if a count, switch or open item changed, and add a dated line to §33. SEO work also updates the root
`docs/SEO_ROADMAP.md`; business-portal parity work also updates `PROVIDER_APP_PLAN.md`; contract changes
update the root `docs/API_CONTRACTS.md`. Don't create new summary Markdown files.
