/**
 * A destination taken from the URL (`callbackUrl` / `redirect` after sign-in,
 * verify-email or verify-phone), kept only if it is a path on this site.
 *
 * Refused (returns null, so the caller falls back to a dashboard): anything not
 * starting with `/`, a protocol-relative `//host`, and any backslash or control
 * character — browsers read `/\host` as `//host`. Without this,
 * `/login?callbackUrl=https://other.site` sent a person off the site right
 * after a real sign-in (open redirect).
 */
export function safeRedirect(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return null;
  return value;
}
