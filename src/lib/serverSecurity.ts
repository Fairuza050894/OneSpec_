/**
 * ONESPEC SDLC STUDIO — SERVER SECURITY & SSRF PROTECTION ENGINE
 * ISO/IEC 27001 & OWASP ASVS Strict Defense Guidelines
 */

import { NextRequest } from 'next/server';

export interface SsrfValidationResult {
  isValid: boolean;
  error?: string;
  parsedUrl?: URL;
}

const PRIVATE_IPV4_PATTERNS = [
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // 127.0.0.0/8 Loopback
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,  // 10.0.0.0/8 Private network
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12 Private network
  /^192\.168\.\d{1,3}\.\d{1,3}$/,     // 192.168.0.0/16 Private network
  /^169\.254\.\d{1,3}\.\d{1,3}$/,     // 169.254.0.0/16 Link-local / Cloud metadata (AWS, GCP, Azure)
  /^0\.0\.0\.0$/,                     // 0.0.0.0
];

const METADATA_HOSTNAMES = new Set([
  '169.254.169.254',
  'metadata.google.internal',
  'instance-data',
  '100.100.100.200', // Alibaba Cloud metadata
]);

const BLOCKED_LOCAL_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
]);

/**
 * Checks whether an IP or hostname belongs to cloud metadata services.
 * Under zero circumstances may metadata services be accessed.
 */
export function isMetadataHost(hostname: string): boolean {
  const clean = hostname.toLowerCase().trim().replace(/^\[|\]$/g, '');
  if (METADATA_HOSTNAMES.has(clean)) return true;
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(clean)) return true;
  return false;
}

/**
 * Checks whether an IP or hostname belongs to private/loopback address space.
 */
export function isPrivateOrLoopbackHost(hostname: string): boolean {
  const clean = hostname.toLowerCase().trim().replace(/^\[|\]$/g, '');
  if (BLOCKED_LOCAL_HOSTNAMES.has(clean)) return true;
  for (const regex of PRIVATE_IPV4_PATTERNS) {
    if (regex.test(clean)) return true;
  }
  // IPv6 loopback and unique local addresses
  if (clean === '::1' || clean === '::' || clean.startsWith('fe80:') || clean.startsWith('fc00:') || clean.startsWith('fd00:')) {
    return true;
  }
  // Decimal or hex encoded IP representations (e.g. 2130706433 or 0x7f000001)
  if (/^0x[0-9a-fA-F]+$/.test(clean) || (/^\d+$/.test(clean) && Number(clean) > 0)) {
    return true;
  }
  return false;
}

/**
 * Validates a target URL against SSRF attacks.
 * Allows private/loopback hosts ONLY if they are explicitly in allowedTargetHosts or ONESPEC_ALLOWED_TARGET_HOSTS.
 * Cloud metadata endpoints are unconditionally forbidden.
 */
export function validateUrlForSsrf(
  targetUrl: string,
  explicitAllowedHosts: string[] = []
): SsrfValidationResult {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return { isValid: false, error: 'Target URL is required' };
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl.trim());
  } catch {
    return { isValid: false, error: 'Malformed target URL format' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      isValid: false,
      error: `Invalid protocol "${parsed.protocol}". Only "http:" and "https:" are permitted.`,
    };
  }

  const hostname = parsed.hostname.toLowerCase().trim();
  const hostWithPort = parsed.host.toLowerCase().trim();

  // Cloud metadata is strictly and unconditionally blocked
  if (isMetadataHost(hostname)) {
    return {
      isValid: false,
      error: 'SSRF Blocked: Access to cloud metadata endpoints (169.254.169.254) is strictly forbidden.',
    };
  }

  // Build permitted host list from env and session
  const envAllowed = (process.env.ONESPEC_ALLOWED_TARGET_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  const allowedSet = new Set<string>();
  for (const h of [...envAllowed, ...explicitAllowedHosts]) {
    if (!h) continue;
    const clean = h.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (clean) {
      allowedSet.add(clean);
      allowedSet.add(clean.split(':')[0]); // also add hostname without port
    }
  }

  const isExplicitlyAllowed = allowedSet.has(hostname) || allowedSet.has(hostWithPort);

  if (isPrivateOrLoopbackHost(hostname)) {
    if (!isExplicitlyAllowed) {
      return {
        isValid: false,
        error: `SSRF Blocked: Destination "${parsed.host}" resolves to a private or loopback address. Add host to ONESPEC_ALLOWED_TARGET_HOSTS or active project target to permit.`,
      };
    }
  }

  return { isValid: true, parsedUrl: parsed };
}

/**
 * Checks if a cookie domain matches the target request hostname safely.
 */
export function isCookieDomainMatch(requestHost: string, cookieDomain?: string): boolean {
  if (!cookieDomain) return true;
  const reqHost = requestHost.toLowerCase().trim().split(':')[0];
  let domain = cookieDomain.toLowerCase().trim();

  if (domain.startsWith('.')) {
    domain = domain.slice(1);
    return reqHost === domain || reqHost.endsWith(`.${domain}`);
  }

  return reqHost === domain;
}

export interface StoredAuthCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  [key: string]: unknown;
}

/**
 * Safely filters session cookies to prevent cross-origin cookie leakage.
 * Rejects any cookie whose domain does not match the target URL hostname or active project origin.
 */
export function filterSafeCookiesForTarget(
  cookies: StoredAuthCookie[],
  targetUrl: string,
  baseTargetUrl?: string
): StoredAuthCookie[] {
  if (!Array.isArray(cookies) || cookies.length === 0) return [];

  let targetParsed: URL;
  try {
    targetParsed = new URL(targetUrl);
  } catch {
    return [];
  }

  // If baseTargetUrl is provided, ensure origin alignment
  if (baseTargetUrl) {
    try {
      const baseParsed = new URL(baseTargetUrl);
      if (targetParsed.origin !== baseParsed.origin) {
        // Different origin from active project target -> do not attach credentials
        return [];
      }
    } catch {
      return [];
    }
  }

  return cookies.filter((c) => {
    if (!c.name || typeof c.value !== 'string') return false;
    return isCookieDomainMatch(targetParsed.hostname, c.domain);
  });
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function normalizeOrigin(o: string): string {
  try {
    return new URL(o).origin.toLowerCase();
  } catch {
    return '';
  }
}

function allowedOriginSet(): Set<string> {
  const base = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
  ];
  const extra = (process.env.ONESPEC_ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => normalizeOrigin(s.trim()))
    .filter(Boolean);
  return new Set([...base, ...extra]);
}

/**
 * Verifies that an incoming mutating request (/api/sdlc/* or /api/discovery/*)
 * originates from an authorized local/whitelisted Origin or carries a valid internal session token.
 */
export function verifyInternalOriginOrToken(req: Request | NextRequest): {
  authorized: boolean;
  reason?: string;
} {
  const h = req.headers;
  const expected = process.env.ONESPEC_SESSION_TOKEN || '';
  const provided = h.get('x-onespec-session-token') || '';

  // 1. Session token validation (must be configured, >= 32 chars, and match constant-time)
  if (expected.length >= 32 && provided && constantTimeEqual(provided, expected)) {
    return { authorized: true };
  }

  // 2. Origin validation (must be exact match against whitelist)
  const origin = h.get('origin');
  if (origin) {
    if (h.get('sec-fetch-site') === 'cross-site') {
      return { authorized: false, reason: 'Cross-site request ditolak' };
    }
    const normalized = normalizeOrigin(origin);
    return allowedOriginSet().has(normalized)
      ? { authorized: true }
      : { authorized: false, reason: `Origin "${origin}" tidak diizinkan` };
  }

  // 3. Mutating requests without Origin are treated as non-browser: token is mandatory
  return { authorized: false, reason: 'Origin tidak ada dan token sesi tidak valid' };
}
