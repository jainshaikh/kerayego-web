'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, Check, ExternalLink, Minus, RefreshCw, X } from 'lucide-react';
import {
  driverErrorMessage,
  useAdminDriverDetail,
  useApproveDriver,
  useRejectDriver,
} from '../../../../../hooks/useAdmin';
import {
  DRIVER_AGREEMENT_TYPE_LABELS,
  DRIVER_DOCUMENT_TYPE_LABELS,
  DRIVER_GENDER_LABELS,
  DRIVER_SERVICE_LABELS,
  DRIVER_TRANSMISSION_LABELS,
  DRIVER_VEHICLE_TYPE_LABELS,
  DriverAgreementType,
  DriverDocumentType,
  DriverVerificationStatus,
  HOUSEHOLD_DRIVER_SERVICES,
  PAYOUT_METHOD_LABELS,
} from '../../../../../types/enums';
import type {
  AdminDriverDocument,
  DriverCompletion,
  DriverOnboardingStep,
  DriverReadiness,
  DriverWeekday,
} from '../../../../../types/api.types';
import { StatusBadge } from '../../../../../components/common/StatusBadge';
import { Button, ConfirmDialog } from '../../../../../components/ui';
import { DriverPhoto, formatDate } from '../../../../../components/admin/DriverPhoto';
import { cn } from '../../../../../lib/utils/cn';

// Backend RejectDriverDto bounds.
const REASON_MIN = 5;
const REASON_MAX = 500;

// The six document slots, in review order. Only the police certificate is
// optional (required only for household services, A60).
const DOC_SLOTS: DriverDocumentType[] = [
  DriverDocumentType.ID_DOCUMENT_FRONT,
  DriverDocumentType.ID_DOCUMENT_BACK,
  DriverDocumentType.DRIVING_LICENSE,
  DriverDocumentType.DRIVING_LICENSE_BACK,
  DriverDocumentType.SELFIE,
  DriverDocumentType.POLICE_CERTIFICATE,
];

// The rental-ready documents the backend requires before approval.
const REQUIRED_FOR_APPROVAL: DriverDocumentType[] = [
  DriverDocumentType.ID_DOCUMENT_FRONT,
  DriverDocumentType.ID_DOCUMENT_BACK,
  DriverDocumentType.DRIVING_LICENSE,
  DriverDocumentType.DRIVING_LICENSE_BACK,
  DriverDocumentType.SELFIE,
];

const ROLE_LABELS: Record<string, string> = {
  BUSINESS_ADMIN: 'Business admin',
  MANAGER: 'Manager',
  DRIVER: 'Driver',
};

const WEEKDAYS: { key: DriverWeekday; label: string }[] = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

const AGREEMENT_ORDER: DriverAgreementType[] = [
  DriverAgreementType.SERVICE_AGREEMENT,
  DriverAgreementType.CODE_OF_CONDUCT,
  DriverAgreementType.PRIVACY_CONSENT,
  DriverAgreementType.FITNESS_DECLARATION,
];

// ─── Formatting helpers ──────────────────────────────────────────────────────

/** Parses a 'YYYY-MM-DD' (or full ISO) date as a LOCAL calendar day. */
function parseDay(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
}

function formatDay(value: string | null | undefined): string | null {
  if (!value) return null;
  return parseDay(value).toLocaleDateString('en-PK', { dateStyle: 'medium' });
}

/** Expired once the expiry day is before today; valid through the expiry day itself. */
function isDayPast(value: string | null | undefined): boolean {
  if (!value) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseDay(value).getTime() < today.getTime();
}

function ageOn(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const birth = parseDay(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

/** 'YYYY-MM' → "Mar 2021". */
function formatMonth(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})/.exec(value);
  if (!m) return value;
  return new Date(Number(m[1]), Number(m[2]) - 1, 1).toLocaleDateString('en-PK', {
    month: 'short',
    year: 'numeric',
  });
}

/** Money is a decimal string in the driver's market currency (PKR for now). */
function formatMoney(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? `PKR ${n.toLocaleString('en-PK')}` : value;
}

function plural(n: number | null | undefined, unit: string): string | null {
  return n == null ? null : `${n} ${unit}${n === 1 ? '' : 's'}`;
}

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

// ─── Small display pieces ────────────────────────────────────────────────────

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const empty = children == null || children === '' || (Array.isArray(children) && children.length === 0);
  return (
    <div className={className}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.07em] text-text-faint">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{empty ? <span className="text-text-faint">—</span> : children}</dd>
    </div>
  );
}

function Section({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-border-subtle bg-surface p-6 shadow-xs">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.07em] text-text-muted">{title}</h2>
          {subtitle && <div className="mt-1">{subtitle}</div>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function Pill({
  tone,
  children,
}: {
  tone: 'emerald' | 'amber' | 'red' | 'slate' | 'blue';
  children: React.ReactNode;
}) {
  const tones = {
    emerald: 'border-status-emerald-border bg-status-emerald-bg text-status-emerald-fg',
    amber: 'border-status-amber-border bg-status-amber-bg text-status-amber-fg',
    red: 'border-status-red-border bg-status-red-bg text-status-red-fg',
    slate: 'border-status-slate-border bg-status-slate-bg text-status-slate-fg',
    blue: 'border-status-blue-border bg-status-blue-bg text-status-blue-fg',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-chip border px-2 py-0.5 text-xs font-medium',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

function YesNo({ value }: { value: boolean | null | undefined }) {
  if (value == null) return <span className="text-text-faint">Not answered</span>;
  return value ? (
    <span className="inline-flex items-center gap-1 text-status-emerald-fg">
      <Check className="h-3.5 w-3.5" /> Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-text-muted">
      <X className="h-3.5 w-3.5" /> No
    </span>
  );
}

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) return <span className="text-text-faint">—</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Pill key={item} tone="slate">
          {item}
        </Pill>
      ))}
    </span>
  );
}

/** A red value with a short reason, for expired dates and under-age. */
function Flagged({ flagged, note, children }: { flagged: boolean; note: string; children: React.ReactNode }) {
  if (!flagged) return <>{children}</>;
  return (
    <span className="font-semibold text-red-700">
      {children} — {note}
    </span>
  );
}

/** The step's own completion from `profile.steps`, shown beside its title. */
function StepState({ state }: { state: DriverCompletion | undefined }) {
  if (!state) return null;
  if (state.complete) return <Pill tone="emerald">Step complete</Pill>;
  return (
    <span className="text-xs text-status-amber-fg">
      <Pill tone="amber">Incomplete</Pill>
      {state.missing.length > 0 && <span className="ml-2">Missing: {state.missing.join(', ')}</span>}
    </span>
  );
}

function ReadinessCard({
  title,
  description,
  state,
}: {
  title: string;
  description: string;
  state: DriverCompletion | undefined;
}) {
  const complete = !!state?.complete;
  return (
    <div
      className={cn(
        'rounded-control border p-4',
        complete ? 'border-status-emerald-border bg-status-emerald-bg' : 'border-border-subtle bg-page',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">{title}</span>
        {state ? (
          <Pill tone={complete ? 'emerald' : 'amber'}>{complete ? 'Ready' : 'Not ready'}</Pill>
        ) : (
          <Pill tone="slate">Unknown</Pill>
        )}
      </div>
      <p className="mt-1 text-xs text-text-muted">{description}</p>
      {state && !complete && state.missing.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-status-amber-fg">
          {state.missing.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** One verification document. The URL is a short-lived signed link: rendered
 * straight from the live query (never stored), opened in a new tab. */
function DocumentCard({
  label,
  doc,
  emptyNote,
  emptyTone = 'amber',
}: {
  label: string;
  doc?: AdminDriverDocument;
  emptyNote?: string;
  emptyTone?: 'amber' | 'slate';
}) {
  const [previewFailed, setPreviewFailed] = useState(false);

  if (!doc) {
    return (
      <div
        className={cn(
          'flex min-h-[11rem] flex-col items-center justify-center rounded-control border border-dashed p-4 text-center',
          emptyTone === 'amber'
            ? 'border-status-amber-border bg-status-amber-bg text-status-amber-fg'
            : 'border-border-subtle bg-page text-text-muted',
        )}
      >
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 text-xs">{emptyNote ?? 'Not uploaded'}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-control border border-border-subtle">
      <a
        href={doc.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-40 items-center justify-center bg-page"
      >
        {previewFailed ? (
          <span className="px-3 text-center text-xs text-text-faint">
            No preview (PDF or expired link) — open to view
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={doc.fileUrl}
            alt={label}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
            onError={() => setPreviewFailed(true)}
          />
        )}
      </a>
      <div className="space-y-1.5 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-ink">{label}</span>
          <StatusBadge status={doc.status} size="sm" />
        </div>
        {doc.rejectionReason && <p className="text-xs text-red-700">Rejected: {doc.rejectionReason}</p>}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-mono text-text-faint">{formatDate(doc.createdAt)}</span>
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline"
          >
            View <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

/** A large, uncropped photo for the side-by-side identity comparison (A59). */
function ComparePhoto({ label, url }: { label: string; url: string | null | undefined }) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="overflow-hidden rounded-control border border-border-subtle">
      <div className="flex h-72 items-center justify-center bg-page">
        {!url ? (
          <span className="px-3 text-center text-sm font-semibold text-status-amber-fg">Not uploaded</span>
        ) : failed ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 text-center text-xs text-brand-700 hover:underline"
          >
            No preview (PDF or expired link) — open to view
          </a>
        ) : (
          <a href={url} target="_blank" rel="noopener noreferrer" className="h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={label}
              referrerPolicy="no-referrer"
              className="h-full w-full object-contain"
              onError={() => setFailed(true)}
            />
          </a>
        )}
      </div>
      <figcaption className="px-3 py-2 text-sm font-medium text-ink">{label}</figcaption>
    </figure>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminDriverDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const { data, isLoading, isError, error, refetch, isFetching, dataUpdatedAt } =
    useAdminDriverDetail(userId);
  const approve = useApproveDriver();
  const reject = useRejectDriver();
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [documentsReviewed, setDocumentsReviewed] = useState(false);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="h-4 w-24 rounded bg-page" />
        <div className="h-40 rounded-card border border-border-subtle bg-surface" />
        <div className="h-56 rounded-card border border-border-subtle bg-surface" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-card border border-border-subtle bg-surface py-16 text-center">
        <p className="font-medium text-ink">Driver not found</p>
        {error && <p className="mt-1 text-sm text-text-muted">{driverErrorMessage(error, '')}</p>}
        <Link href="/admin/drivers" className="mt-2 inline-block text-sm text-brand-700 hover:underline">
          Back to drivers
        </Link>
      </div>
    );
  }

  const { profile, user, documents, memberships } = data;
  const name = profile.fullName || user.name;
  const isPending = profile.verificationStatus === DriverVerificationStatus.PENDING_REVIEW;
  const docsByType = new Map(documents.map((d) => [d.documentType, d]));
  const docLabel = (t: DriverDocumentType) => DRIVER_DOCUMENT_TYPE_LABELS[t] ?? t;
  const missingRequired = REQUIRED_FOR_APPROVAL.filter((t) => !docsByType.has(t));

  const readiness: DriverReadiness | undefined = data.readiness ?? profile.readiness;
  const steps = profile.steps;
  const stepState = (key: DriverOnboardingStep) => steps?.[key];

  const services = profile.services ?? [];
  const householdSelected = services.filter((s) => HOUSEHOLD_DRIVER_SERVICES.includes(s));

  // Red flags (A59 review aids): expired CNIC/licence, under 18.
  const age = ageOn(profile.dateOfBirth);
  const underAge = age != null && age < 18;
  const cnicExpired = isDayPast(profile.cnicExpiry);
  const licenceExpired = isDayPast(profile.licenseExpiry);
  const redFlags = [
    underAge && `Under 18 (age ${age})`,
    cnicExpired && `CNIC expired on ${formatDay(profile.cnicExpiry)}`,
    licenceExpired && `Driving licence expired on ${formatDay(profile.licenseExpiry)}`,
  ].filter((f): f is string => !!f);

  const approveBlockedReason = !isPending
    ? 'Only drivers under review can be approved'
    : missingRequired.length > 0
      ? `Missing required documents: ${missingRequired.map(docLabel).join(', ')}`
      : !documentsReviewed
        ? 'Tick “I have reviewed the documents” above first'
        : undefined;
  const actionError = approve.error ?? reject.error;

  const refreshLinks = (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-faint">
        Links expire ~10 min after loading
        {dataUpdatedAt ? ` · loaded ${new Date(dataUpdatedAt).toLocaleTimeString()}` : ''}
      </span>
      <Button size="sm" variant="secondary" loading={isFetching} onClick={() => refetch()}>
        <RefreshCw className="h-3.5 w-3.5" /> Refresh links
      </Button>
    </div>
  );

  const acceptedByType = new Map((profile.agreements ?? []).map((a) => [a.type, a]));
  const workingHours = profile.workingHours;
  const homePin =
    profile.homeLat != null && profile.homeLng != null
      ? `https://www.google.com/maps/search/?api=1&query=${profile.homeLat},${profile.homeLng}`
      : null;

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-2 text-sm text-text-faint">
        <Link href="/admin/drivers" className="hover:text-ink">
          Driver Verifications
        </Link>
        <span>/</span>
        <span className="truncate text-ink">{name}</span>
      </nav>

      {/* Header */}
      <section className="rounded-card border border-border-subtle bg-surface p-6 shadow-xs">
        <div className="flex flex-wrap items-start gap-4">
          <DriverPhoto url={profile.avatarUrl} name={name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-ink">{name}</h1>
              <StatusBadge status={profile.verificationStatus} />
            </div>
            <p className="mt-1 text-sm text-text-muted">
              {[profile.city, user.email, profile.contactPhone ?? user.phone].filter(Boolean).join(' · ')}
            </p>
            {profile.rejectionReason && (
              <p className="mt-3 inline-block rounded-control bg-status-red-bg px-3 py-2 text-xs text-red-700">
                Rejected: {profile.rejectionReason}
              </p>
            )}
            {profile.reviewedAt && (
              <p className="mt-2 text-xs text-text-faint">Last reviewed {formatDate(profile.reviewedAt)}</p>
            )}
          </div>
          <Link href={`/admin/users/${user.id}`} className="text-sm font-semibold text-brand-700 hover:underline">
            View user account →
          </Link>
        </div>
        {redFlags.length > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-control border border-status-red-border bg-status-red-bg px-3 py-2.5 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <ul className="space-y-0.5 font-semibold">
              {redFlags.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Readiness (A58 / A60) */}
      <Section
        title="Readiness"
        subtitle={
          <span className="text-xs text-text-muted">
            Household services (police certificate on file):{' '}
            {readiness ? (
              readiness.householdAllowed ? (
                <Pill tone="emerald">Allowed</Pill>
              ) : (
                <Pill tone="slate">Not allowed</Pill>
              )
            ) : (
              '—'
            )}
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <ReadinessCard
            title="Rental-ready"
            description="Steps 1–3, emergency contact and all four agreements — can be assigned by rental businesses."
            state={readiness?.rentalReady}
          />
          <ReadinessCard
            title="Hire-ready"
            description="Rental-ready plus services and availability (and a police certificate for household services)."
            state={readiness?.hireReady}
          />
          <ReadinessCard
            title="Payout-ready"
            description="Payout method and account — needed only before the first payout."
            state={readiness?.payoutReady}
          />
        </div>
      </Section>

      {/* Identity check (A59): compare the selfie with the CNIC photo by eye. */}
      <Section title="Identity check" actions={refreshLinks}>
        <p className="mb-4 flex items-center gap-2 rounded-control bg-status-blue-bg px-3 py-2 text-sm font-medium text-status-blue-fg">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Compare the selfie with the CNIC photo.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ComparePhoto
            key={`selfie-${docsByType.get(DriverDocumentType.SELFIE)?.fileUrl ?? 'missing'}`}
            label="Live selfie"
            url={docsByType.get(DriverDocumentType.SELFIE)?.fileUrl}
          />
          <ComparePhoto
            key={`cnic-${docsByType.get(DriverDocumentType.ID_DOCUMENT_FRONT)?.fileUrl ?? 'missing'}`}
            label="CNIC front"
            url={docsByType.get(DriverDocumentType.ID_DOCUMENT_FRONT)?.fileUrl}
          />
          <ComparePhoto key={`avatar-${profile.avatarUrl ?? 'missing'}`} label="Profile photo" url={profile.avatarUrl} />
        </div>
      </Section>

      {/* Step 1 — Personal */}
      <Section title="1 · Personal information" subtitle={<StepState state={stepState('personal')} />}>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Full name (as on CNIC)">{profile.fullName}</Field>
          <Field label="Mobile / WhatsApp">
            {profile.contactPhone ? (
              <span className="flex flex-wrap items-center gap-2">
                <a href={telHref(profile.contactPhone)} className="text-brand-700 hover:underline">
                  {profile.contactPhone}
                </a>
                {profile.phoneVerified ? <Pill tone="emerald">Verified</Pill> : <Pill tone="slate">Unverified</Pill>}
              </span>
            ) : null}
          </Field>
          <Field label="Date of birth">
            {profile.dateOfBirth ? (
              <Flagged flagged={underAge} note="under 18">
                {formatDay(profile.dateOfBirth)}
                {age != null && ` (age ${age})`}
              </Flagged>
            ) : null}
          </Field>
          <Field label="Gender">{profile.gender ? DRIVER_GENDER_LABELS[profile.gender] ?? profile.gender : null}</Field>
          <Field label="City">{profile.city}</Field>
          <Field label="Area">{profile.area}</Field>
          <Field label="Residential address (private)" className="sm:col-span-2">
            {profile.residentialAddress}
          </Field>
          <Field label="Home location (private)">
            {homePin ? (
              <a
                href={homePin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-brand-700 hover:underline"
              >
                {profile.homeLat?.toFixed(5)}, {profile.homeLng?.toFixed(5)} <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </Field>
          <Field label="Comfortable with families / women-only">
            <YesNo value={profile.comfortableWithFamilies} />
          </Field>
          <Field label="Email">{profile.contactEmail}</Field>
          <Field label="Languages">
            {profile.languages && profile.languages.length > 0 ? <ChipList items={profile.languages} /> : null}
          </Field>
        </dl>
      </Section>

      {/* Step 2 — Identity & documents */}
      <Section
        title="2 · Identity & documents"
        subtitle={<StepState state={stepState('identity')} />}
        actions={refreshLinks}
      >
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="CNIC number">
            {profile.cnicNumber ? <span className="font-mono">{profile.cnicNumber}</span> : null}
          </Field>
          <Field label="CNIC expiry">
            {profile.cnicExpiry ? (
              <Flagged flagged={cnicExpired} note="expired">
                {formatDay(profile.cnicExpiry)}
              </Flagged>
            ) : null}
          </Field>
          <Field label="Licence number">
            {profile.licenseNumber ? <span className="font-mono">{profile.licenseNumber}</span> : null}
          </Field>
          <Field label="Licence category">{profile.licenseCategory}</Field>
          <Field label="Licence issued">{formatDay(profile.licenseIssueDate)}</Field>
          <Field label="Licence expiry">
            {profile.licenseExpiry ? (
              <Flagged flagged={licenceExpired} note="expired">
                {formatDay(profile.licenseExpiry)}
              </Flagged>
            ) : null}
          </Field>
          <Field label="Issuing province / authority">{profile.licenseIssuingAuthority}</Field>
        </dl>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">Emergency contact (private)</h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Name">{profile.emergencyContactName}</Field>
              <Field label="Phone">
                {profile.emergencyContactPhone ? (
                  <a href={telHref(profile.emergencyContactPhone)} className="text-brand-700 hover:underline">
                    {profile.emergencyContactPhone}
                  </a>
                ) : null}
              </Field>
              <Field label="Relation">{profile.emergencyContactRelation}</Field>
            </dl>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">Declarations</h3>
            <dl className="space-y-2">
              {(
                [
                  ['No serious traffic convictions', profile.declaredNoSeriousConvictions],
                  ['No criminal record', profile.declaredNoCriminalRecord],
                  ['No licence suspension in the last 3 years', profile.declaredNoLicenseSuspension],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-ink">{label}</dt>
                  <dd>
                    {value === true ? (
                      <Pill tone="emerald">
                        <Check className="h-3 w-3" /> Declared
                      </Pill>
                    ) : value === false ? (
                      <Pill tone="red">
                        <X className="h-3 w-3" /> Not declared
                      </Pill>
                    ) : (
                      <Pill tone="slate">
                        <Minus className="h-3 w-3" /> Not answered
                      </Pill>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Documents — above the decision so they can't be skipped. */}
        <h3 className="mb-3 mt-6 text-sm font-semibold text-ink">Documents</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DOC_SLOTS.map((type) => {
            const optional = type === DriverDocumentType.POLICE_CERTIFICATE;
            const neededForHousehold = optional && householdSelected.length > 0;
            return (
              // Keyed by URL so a refreshed link retries a failed preview.
              <DocumentCard
                key={`${type}-${docsByType.get(type)?.fileUrl ?? 'missing'}`}
                label={optional ? `${docLabel(type)} (optional)` : docLabel(type)}
                doc={docsByType.get(type)}
                emptyNote={
                  neededForHousehold
                    ? 'Not provided — required for the household services selected'
                    : optional
                      ? 'Not provided — required only for household services'
                      : undefined
                }
                emptyTone={optional && !neededForHousehold ? 'slate' : 'amber'}
              />
            );
          })}
        </div>

        {isPending && missingRequired.length === 0 && (
          <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={documentsReviewed}
              onChange={(e) => setDocumentsReviewed(e.target.checked)}
              className="mt-0.5"
            />
            I have reviewed the documents: opened the CNIC and driving licence (front and back) and checked them
            against the driver&apos;s details, and compared the live selfie with the CNIC photo.
          </label>
        )}
      </Section>

      {/* Step 3 — Experience */}
      <Section title="3 · Driving experience" subtitle={<StepState state={stepState('experience')} />}>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Total driving experience">{plural(profile.experienceYears, 'year')}</Field>
          <Field label="Professional experience">{plural(profile.professionalExperienceYears, 'year')}</Field>
          <Field label="Vehicle experience">
            <ChipList items={(profile.vehicleTypes ?? []).map((v) => DRIVER_VEHICLE_TYPE_LABELS[v] ?? v)} />
          </Field>
          <Field label="Transmission">
            <ChipList items={(profile.transmissions ?? []).map((t) => DRIVER_TRANSMISSION_LABELS[t] ?? t)} />
          </Field>
          <Field label="Highway / outstation experience">
            <YesNo value={profile.highwayExperience} />
          </Field>
          <Field label="Navigation / Google Maps skills">
            <YesNo value={profile.navigationSkills} />
          </Field>
          <Field label="Smartphone with GPS">
            <YesNo value={profile.hasSmartphoneGps} />
          </Field>
          <Field label="Certifications / training" className="sm:col-span-2">
            {profile.certifications}
          </Field>
        </dl>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">Employment history</h3>
            {(profile.employmentHistory ?? []).length === 0 ? (
              <p className="text-sm text-text-faint">None given.</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {profile.employmentHistory.map((e, i) => (
                  <li key={`${e.employer}-${i}`} className="py-2.5">
                    <p className="text-sm font-medium text-ink">
                      {e.role} · {e.employer}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatMonth(e.from)} – {e.to ? formatMonth(e.to) : 'present'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">References</h3>
            {(profile.references ?? []).length === 0 ? (
              <p className="text-sm text-text-faint">None given.</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {profile.references.map((r, i) => (
                  <li key={`${r.phone}-${i}`} className="flex items-center justify-between gap-3 py-2.5">
                    <span>
                      <span className="block text-sm font-medium text-ink">{r.name}</span>
                      <span className="block text-xs text-text-muted">{r.relation}</span>
                    </span>
                    <a href={telHref(r.phone)} className="text-sm font-semibold text-brand-700 hover:underline">
                      {r.phone}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Section>

      {/* Step 4 — Services */}
      <Section title="4 · Services offered" subtitle={<StepState state={stepState('services')} />}>
        {services.length === 0 ? (
          <p className="text-sm text-text-faint">No services selected.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {services.map((s) => (
              <Pill key={s} tone={HOUSEHOLD_DRIVER_SERVICES.includes(s) ? 'blue' : 'slate'}>
                {DRIVER_SERVICE_LABELS[s] ?? s}
                {HOUSEHOLD_DRIVER_SERVICES.includes(s) && ' · household'}
              </Pill>
            ))}
          </div>
        )}
        {householdSelected.length > 0 && readiness && !readiness.householdAllowed && (
          <p className="mt-3 text-xs text-status-amber-fg">
            Household services need a police character certificate (A60) — none on file.
          </p>
        )}
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Uniform available">
            <YesNo value={profile.uniformAvailable} />
          </Field>
        </dl>
      </Section>

      {/* Step 5 — Availability & pricing */}
      <Section title="5 · Availability & pricing" subtitle={<StepState state={stepState('availability')} />}>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Service city">{profile.serviceCity}</Field>
          <Field label="Coverage areas" className="sm:col-span-2">
            <ChipList items={profile.coverageAreas ?? []} />
          </Field>
          <Field label="Outstation travel">
            <YesNo value={profile.outstationAvailable} />
          </Field>
          <Field label="Overnight work">
            <YesNo value={profile.overnightAvailable} />
          </Field>
          <Field label="Maximum travel distance">
            {profile.maxTravelKm != null ? `${profile.maxTravelKm} km` : null}
          </Field>
          <Field label="Hourly rate">{formatMoney(profile.hourlyRate)}</Field>
          <Field label="Full-day rate">{formatMoney(profile.fullDayRate)}</Field>
          <Field label="Monthly salary">{formatMoney(profile.monthlySalary)}</Field>
          <Field label="Overtime / waiting rate">{formatMoney(profile.overtimeRate)}</Field>
          <Field label="Minimum booking">{plural(profile.minBookingHours, 'hour')}</Field>
          <Field label="Minimum advance notice">{plural(profile.minAdvanceNoticeHours, 'hour')}</Field>
        </dl>

        <h3 className="mb-2 mt-6 text-sm font-semibold text-ink">Working hours</h3>
        {!workingHours ? (
          <p className="text-sm text-text-faint">Not set.</p>
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-4">
            {WEEKDAYS.map(({ key, label }) => {
              const slot = workingHours[key];
              return (
                <div key={key} className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-text-muted">{label}</dt>
                  <dd className={slot ? 'font-mono text-ink' : 'text-text-faint'}>
                    {slot ? `${slot.start}–${slot.end}` : 'Off'}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </Section>

      {/* Step 6 — Payouts & agreements */}
      <Section
        title="6 · Payouts & agreements"
        subtitle={<StepState state={stepState('payoutsAgreements')} />}
      >
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Field label="Payout method">
            {profile.payoutMethod ? PAYOUT_METHOD_LABELS[profile.payoutMethod] ?? profile.payoutMethod : null}
          </Field>
          <Field label="Account title">{profile.payoutAccountTitle}</Field>
          <Field label="Account number">
            {/* Masked by the backend; the full number is never returned. */}
            {profile.payoutAccountMasked ? <span className="font-mono">{profile.payoutAccountMasked}</span> : null}
          </Field>
        </dl>

        <h3 className="mb-2 mt-6 text-sm font-semibold text-ink">Agreements</h3>
        <ul className="divide-y divide-border-subtle">
          {AGREEMENT_ORDER.map((type) => {
            const accepted = acceptedByType.get(type);
            const current = profile.currentAgreementVersions?.[type];
            const outdated = !!accepted && !!current && accepted.version !== current;
            return (
              <li key={type} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="text-sm font-medium text-ink">{DRIVER_AGREEMENT_TYPE_LABELS[type]}</span>
                <span className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  {accepted ? (
                    <>
                      <span className="font-mono">v{accepted.version}</span>
                      <span>accepted {formatDate(accepted.acceptedAt)}</span>
                      {outdated ? (
                        <Pill tone="amber">Older version — current is v{current}</Pill>
                      ) : (
                        <Pill tone="emerald">
                          <Check className="h-3 w-3" /> Current
                        </Pill>
                      )}
                    </>
                  ) : (
                    <Pill tone="amber">Not accepted{current ? ` (current v${current})` : ''}</Pill>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* Account + memberships */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title="Account">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Account name">{user.name}</Field>
            <Field label="Account status">
              <StatusBadge status={user.status} size="sm" />
            </Field>
            <Field label="Joined">{formatDate(user.createdAt)}</Field>
            <Field label="Profile updated">{formatDate(profile.updatedAt)}</Field>
            <Field label="Open to work">{profile.isOpenToWork ? 'Yes' : 'No'}</Field>
          </dl>
        </Section>
        <Section title="Business memberships">
          {memberships.length === 0 ? (
            <p className="text-sm text-text-faint">Not a member of any business.</p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {memberships.map((m, i) => (
                <li key={`${m.businessName}-${i}`} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-sm font-medium text-ink">{m.businessName}</span>
                  <span className="flex items-center gap-2 text-xs text-text-muted">
                    {ROLE_LABELS[m.role] ?? m.role}
                    <StatusBadge status={m.status} size="sm" />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* Actions */}
      <Section title="Decision">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setShowApprove(true)}
            disabled={!!approveBlockedReason || approve.isPending}
            title={approveBlockedReason}
          >
            Approve
          </Button>
          <Button
            variant="danger-outline"
            onClick={() => setShowReject(true)}
            disabled={!isPending || reject.isPending}
            title={!isPending ? 'Only drivers under review can be rejected' : undefined}
          >
            Reject
          </Button>
          {approveBlockedReason && <span className="text-xs text-text-faint">{approveBlockedReason}</span>}
        </div>
        {isPending && redFlags.length > 0 && (
          <p className="mt-3 text-xs font-semibold text-red-700">Check before approving: {redFlags.join(' · ')}</p>
        )}
        {!!actionError && (
          <p className="mt-3 rounded-control bg-status-red-bg px-3 py-2 text-sm text-red-700">
            {driverErrorMessage(actionError, 'Action failed')}
          </p>
        )}
      </Section>

      <ConfirmDialog
        open={showApprove}
        onOpenChange={setShowApprove}
        title="Verify this driver?"
        description={`${name} will be marked as a verified driver.`}
        destructive={false}
        confirmLabel="Approve driver"
        cancelLabel="Cancel"
        loading={approve.isPending}
        onConfirm={async () => {
          reject.reset();
          try {
            await approve.mutateAsync(userId);
            setShowApprove(false);
          } catch {
            // Toast + inline message already shown; keep the dialog open.
          }
        }}
      />

      <ConfirmDialog
        open={showReject}
        onOpenChange={setShowReject}
        title="Reject driver verification?"
        description={`${name} — the reason is saved with the rejection (5–500 characters).`}
        requireReason
        minReasonLength={REASON_MIN}
        maxReasonLength={REASON_MAX}
        reasonLabel="Reason for rejection"
        confirmLabel="Reject driver"
        cancelLabel="Cancel"
        loading={reject.isPending}
        onConfirm={async (reason) => {
          if (!reason || reason.length < REASON_MIN) return;
          approve.reset();
          try {
            await reject.mutateAsync({ userId, reason });
            setShowReject(false);
          } catch {
            // Toast + inline message already shown; keep the dialog open.
          }
        }}
      />
    </div>
  );
}
