/**
 * Presentation sanitizer & metric formatting helpers.
 *
 * Executive-facing surfaces must never expose internal hostnames, private IPs,
 * e-mail addresses, or raw autonomous-agent prompt markers. These helpers keep
 * the technical evidence available in Studio while presenting a safe summary
 * in the Library, wiki reader, knowledge graph, and portfolio views.
 */

export type PresentationLocale = 'id' | 'en';

export type EnvironmentLabel = 'PRODUCTION' | 'STAGING' | 'SANDBOX' | 'LOCAL' | 'UNKNOWN';

const PRIVATE_HOST =
  /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|\[?::1\]?|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|.*\.(?:local|internal))$/i;

const IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const WINDOWS_USER_PATH = /\b[A-Z]:\\(?:Users|Documents and Settings)\\[^\\\s]+/gi;
const UNIX_HOME_PATH = /\/(?:Users|home)\/[^/\s]+/g;

const RAW_PROMPT_MARKERS = [
  /^#\s*\[.*(?:AUTONOMOUS|REVERSE-ENGINEERED|ZERO-DOC|SYSTEM DISCOVERY).*$/i,
  /^\s*Target Host\s*:/i,
  /^\s*Harvest Timestamp\s*:/i,
  /^\s*Discovered Pages\s*:/i,
  /^\s*Discovered Feature Modules\s*:/i,
  /^\s*Application Name\s*:/i,
  /^\s*Autonomous\s+.*:\s*$/i,
  /^\s*Elicited from project target\s+/i,
  /^\s*Explored live view\s+/i,
];

export function isPrivateHost(hostname: string): boolean {
  return PRIVATE_HOST.test((hostname || '').trim());
}

export function getEnvironmentLabel(targetUrl: string): EnvironmentLabel {
  try {
    const raw = (targetUrl || '').trim();
    if (!raw) return 'UNKNOWN';
    const url = new URL(raw.startsWith('http') ? raw : `http://${raw}`);
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') return 'LOCAL';
    if (isPrivateHost(host)) return 'SANDBOX';
    if (/staging|sandbox|dev|test|uat|qa|preview|demo|stage/i.test(host)) return 'STAGING';
    return 'PRODUCTION';
  } catch {
    return 'UNKNOWN';
  }
}

/**
 * Masks internal hostnames while preserving the route path for technical context.
 * `http://10.10.15.79:3000/commercial/catalog` → `https://internal-host:3000/commercial/catalog`
 */
export function maskTargetUrl(targetUrl: string, locale: PresentationLocale = 'id'): string {
  const raw = (targetUrl || '').trim();
  if (!raw) return locale === 'id' ? 'Tidak ada URL target' : 'No target URL';
  try {
    const url = new URL(raw.startsWith('http') ? raw : `http://${raw}`);
    if (isPrivateHost(url.hostname)) {
      const port = url.port ? `:${url.port}` : '';
      const path = `${url.pathname === '/' ? '' : url.pathname}${url.search}`;
      return `https://internal-host${port}${path}`;
    }
    return url.toString();
  } catch {
    return redactSensitiveText(raw);
  }
}

/**
 * Redacts PII / infrastructure identifiers from any free-form text.
 */
export function redactSensitiveText(input: string): string {
  return String(input ?? '')
    .replace(EMAIL, '[redacted-email]')
    .replace(IPV4, '[redacted-ip]')
    .replace(WINDOWS_USER_PATH, '[redacted-local-path]')
    .replace(UNIX_HOME_PATH, '[redacted-local-path]')
    .replace(/https?:\/\/[^\s)]+/gi, (match) => maskTargetUrl(match, 'en'));
}

/**
 * Produces a business-readable stakeholder summary from raw agent notes.
 * Raw prompt scaffolding is removed; existing prose is retained and redacted.
 */
export function sanitizeStakeholderNotes(input: string): string {
  const lines = String(input ?? '').split(/\r?\n/);
  const kept: string[] = [];
  let skippedTechnicalBlock = false;
  for (const line of lines) {
    const trimmed = line.trim();
    const isMarker = RAW_PROMPT_MARKERS.some((rx) => rx.test(trimmed));
    if (isMarker) {
      skippedTechnicalBlock = true;
      continue;
    }
    if (skippedTechnicalBlock && !trimmed) {
      skippedTechnicalBlock = false;
      continue;
    }
    if (skippedTechnicalBlock && /^[-*•]\s+/.test(trimmed)) {
      // Drop bullets belonging to the raw discovery header block.
      continue;
    }
    skippedTechnicalBlock = false;
    kept.push(line);
  }
  const sanitized = kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return redactSensitiveText(sanitized);
}

export function formatDateTime(iso: string | undefined | null, locale: PresentationLocale = 'id'): string {
  if (!iso) return locale === 'id' ? 'Belum pernah' : 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return locale === 'id' ? 'Tidak valid' : 'Invalid';
  return new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateOnly(iso: string | undefined | null, locale: PresentationLocale = 'id'): string {
  if (!iso) return locale === 'id' ? 'Belum pernah' : 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return locale === 'id' ? 'Tidak valid' : 'Invalid';
  return new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatRelativeTime(
  iso: string | undefined | null,
  locale: PresentationLocale = 'id',
  now: Date = new Date()
): string {
  if (!iso) return locale === 'id' ? 'Belum pernah dipindai' : 'Never scanned';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return locale === 'id' ? 'Tidak valid' : 'Invalid';
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return locale === 'id' ? 'Baru saja' : 'Just now';
  if (diffMinutes < 60) return locale === 'id' ? `${diffMinutes} menit lalu` : `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return locale === 'id' ? `${diffHours} jam lalu` : `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return locale === 'id' ? `${diffDays} hari lalu` : `${diffDays}d ago`;
  const diffMonths = Math.round(diffDays / 30);
  if (diffMonths < 12) return locale === 'id' ? `${diffMonths} bulan lalu` : `${diffMonths}mo ago`;
  return formatDateOnly(iso, locale);
}

export function formatEndpoint(method: string, path: string): string {
  const safeMethod = (method || 'GET').toUpperCase().trim();
  const safePath = (path || '').trim();
  return safePath ? `${safeMethod} ${safePath}` : safeMethod;
}
