/**
 * ONESPEC SDLC STUDIO — K6 LOAD SCRIPT BUILDER
 * Strict Injection & SSRF Prevention
 */

import { validateUrlForSsrf } from './serverSecurity';

export function buildK6Script(
  targetUrl: string,
  vus: number,
  durationSeconds: number,
  allowedHosts: string[] = []
): string {
  const check = validateUrlForSsrf(targetUrl, allowedHosts.length > 0 ? allowedHosts : [targetUrl]);
  if (!check.isValid) {
    throw new Error(check.error || 'SSRF Blocked: Invalid target URL for k6 script');
  }
  const targetLiteral = JSON.stringify(targetUrl);
  return `import http from 'k6/http';
import { check } from 'k6';

const TARGET = ${targetLiteral};

export const options = {
  vus: ${vus},
  duration: '${durationSeconds}s',
};

export default function () {
  const res = http.get(TARGET, {
    headers: { 'User-Agent': 'OneSpec-K6-Empirical/1.0' },
    timeout: '5s',
  });
  check(res, { 'status is nominal': (r) => r.status < 500 });
}
`;
}
