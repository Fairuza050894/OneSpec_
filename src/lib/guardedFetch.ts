/**
 * ONESPEC SDLC STUDIO — GUARDED FETCH UTILITY
 * SSRF Prevention with DNS Resolution & Redirect Validation (ISO/IEC 27001 & OWASP ASVS)
 */

import dns from 'node:dns/promises';
import net from 'node:net';
import { validateUrlForSsrf, isMetadataHost, isPrivateOrLoopbackHost } from './serverSecurity';

export interface GuardedFetchInit extends RequestInit {
  allowedHosts?: string[];
  maxRedirects?: number;
  lookupFn?: (hostname: string, options: { all: boolean }) => Promise<Array<{ address: string; family: number }>>;
  fetchFn?: typeof fetch;
}

export async function guardedFetch(
  url: string,
  init: GuardedFetchInit = {}
): Promise<Response> {
  const {
    allowedHosts = [],
    maxRedirects = 3,
    lookupFn = dns.lookup,
    fetchFn = fetch,
    ...rest
  } = init;

  let current = url;
  for (let i = 0; i <= maxRedirects; i++) {
    const v = validateUrlForSsrf(current, allowedHosts);
    if (!v.isValid || !v.parsedUrl) {
      throw new Error(v.error || 'SSRF: URL ditolak');
    }

    const host = v.parsedUrl.hostname.replace(/^\[|\]$/g, '');
    const cleanAllowed = allowedHosts.map((h) =>
      h.toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split(':')[0]
    );
    const explicitlyAllowed = cleanAllowed.includes(host.toLowerCase());

    if (!net.isIP(host)) {
      const addrs = await lookupFn(host, { all: true });
      for (const a of addrs) {
        if (isMetadataHost(a.address)) {
          throw new Error('SSRF: hostname meresolusi ke endpoint metadata');
        }
        if (isPrivateOrLoopbackHost(a.address) && !explicitlyAllowed) {
          throw new Error('SSRF: hostname meresolusi ke alamat privat');
        }
      }
    }

    const res = await fetchFn(current, { ...rest, redirect: 'manual' });
    const loc = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && loc) {
      current = new URL(loc, current).toString();
      continue;
    }
    return res;
  }

  throw new Error('Terlalu banyak redirect');
}
