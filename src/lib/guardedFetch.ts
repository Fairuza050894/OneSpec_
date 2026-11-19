/**
 * ONESPEC SDLC STUDIO — GUARDED FETCH UTILITY
 * SSRF Prevention with DNS Resolution & Redirect Validation (ISO/IEC 27001 & OWASP ASVS)
 */

import { validateUrlForSsrf, isMetadataHost, isPrivateOrLoopbackHost } from './serverSecurity';

export interface GuardedFetchInit extends RequestInit {
  allowedHosts?: string[];
  maxRedirects?: number;
  lookupFn?: (hostname: string, options: { all: boolean }) => Promise<Array<{ address: string; family: number }>>;
  fetchFn?: typeof fetch;
}

async function resolveDns(host: string): Promise<Array<{ address: string; family: number }>> {
  if (typeof window !== 'undefined') return [];
  try {
    const loadDns = new Function('return import("node:dns/promises")');
    const dns = await loadDns();
    return await (dns.default || dns).lookup(host, { all: true });
  } catch {
    return [];
  }
}

async function isIpAddress(host: string): Promise<number> {
  if (typeof window !== 'undefined') return 0;
  try {
    const loadNet = new Function('return import("node:net")');
    const net = await loadNet();
    return (net.default || net).isIP(host);
  } catch {
    return 0;
  }
}

export async function guardedFetch(
  url: string,
  init: GuardedFetchInit = {}
): Promise<Response> {
  const {
    allowedHosts = [],
    maxRedirects = 3,
    lookupFn,
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

    const isIp = await isIpAddress(host);
    if (!isIp) {
      const addrs = lookupFn ? await lookupFn(host, { all: true }) : await resolveDns(host);
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
