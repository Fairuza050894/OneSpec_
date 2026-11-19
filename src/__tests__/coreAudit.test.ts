import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import {
  validateUrlForSsrf,
  isMetadataHost,
  isPrivateOrLoopbackHost,
  verifyInternalOriginOrToken,
  isAllowedOrigin,
  allowedOriginSet,
} from '../lib/serverSecurity';
import { middleware } from '../middleware';
import { guardedFetch } from '../lib/guardedFetch';
import { computeUnifiedQualityMetrics, isNoiseUiControlOrInternalId, cleanProjectDisplayName, type CompiledSdlcState } from '../services/sdlcCompiler';
import { ReaBridgeService } from '../services/reaBridge';

test('Test 1: serverSecurity blocks SSRF to metadata IP and unauthorized private/loopback hosts', () => {
  // Cloud metadata endpoint
  const metadataRes = validateUrlForSsrf('http://169.254.169.254/latest/meta-data/');
  assert.equal(metadataRes.isValid, false);
  assert.match(metadataRes.error || '', /SSRF Blocked.*metadata/i);
  assert.equal(isMetadataHost('169.254.169.254'), true);
  assert.equal(isMetadataHost('metadata.google.internal'), true);

  // Private / loopback host without explicit allowlist
  const loopbackRes = validateUrlForSsrf('http://127.0.0.1:8080/admin');
  assert.equal(loopbackRes.isValid, false);
  assert.match(loopbackRes.error || '', /SSRF Blocked.*private or loopback/i);
  assert.equal(isPrivateOrLoopbackHost('127.0.0.1'), true);
  assert.equal(isPrivateOrLoopbackHost('10.0.0.1'), true);
  assert.equal(isPrivateOrLoopbackHost('192.168.1.1'), true);

  // Permitted public host
  const publicRes = validateUrlForSsrf('https://example.com/api/v1');
  assert.equal(publicRes.isValid, true);
  assert.equal(publicRes.parsedUrl?.hostname, 'example.com');

  // Explicitly allowed private host
  const allowedRes = validateUrlForSsrf('http://10.10.15.75:3100/login', ['10.10.15.75:3100']);
  assert.equal(allowedRes.isValid, true);
});

test('Test 2: computeUnifiedQualityMetrics ensures (passed + failed === total) and is 100% deterministic (no Math.random)', () => {
  const mockState: Partial<CompiledSdlcState> = {
    rtmRows: [
      { id: '1', requirementId: 'REQ-1', testCaseId: 'TC-1', executionVerdict: 'PASSED' } as any,
      { id: '2', requirementId: 'REQ-2', testCaseId: 'TC-2', executionVerdict: 'PASSED' } as any,
      { id: '3', requirementId: 'REQ-3', testCaseId: 'TC-3', executionVerdict: 'FAILED' } as any,
      { id: '4', requirementId: 'REQ-4', testCaseId: 'TC-4', executionVerdict: 'PASSED' } as any,
    ],
    executionTraces: [
      { testId: 'TC-1', totalDurationMs: 40 } as any,
      { testId: 'TC-2', totalDurationMs: 60 } as any,
    ],
  };

  // Run 10 times to verify determinism (zero Math.random jitter)
  const results = Array.from({ length: 10 }, () => computeUnifiedQualityMetrics(mockState as CompiledSdlcState));

  for (const qm of results) {
    assert.equal(qm.totalCases, 4);
    assert.equal(qm.passedCases, 3);
    assert.equal(qm.failedCases, 1);
    assert.equal(qm.warningCases, 0);
    assert.equal(qm.passedCases + qm.failedCases, qm.totalCases);
    assert.equal(qm.passRatePercent, 75);
    assert.equal(qm.releaseGateStatus, 'NO_GO');
  }

  // All iterations must produce identical p95 latency and release status
  const first = results[0];
  for (const r of results) {
    assert.deepEqual(r, first);
  }
});

test('Test 3: reaBridge.getExecutableInfo() never resolves to @latest or unsafe dynamic packages', () => {
  const rea = ReaBridgeService.getInstance();
  const exeInfo = rea.getExecutableInfo();

  // Executable info should either point to local node_modules pinned binary or unavailable
  assert.ok(['local', 'unavailable'].includes(exeInfo.source));

  // Ensure no command line or prefix invokes @latest
  const allStrings = [exeInfo.executable, ...exeInfo.argsPrefix].join(' ');
  assert.equal(allStrings.includes('@latest'), false);
  assert.equal(allStrings.includes('npx -y'), false);
});

test('Test 4: isNoiseUiControlOrInternalId purges framework noise, radix IDs, and global chrome', () => {
  // Framework noise IDs must be rejected
  assert.equal(isNoiseUiControlOrInternalId('field-_r_d_'), true);
  assert.equal(isNoiseUiControlOrInternalId('Field- R D'), true);
  assert.equal(isNoiseUiControlOrInternalId('_r_123'), true);
  assert.equal(isNoiseUiControlOrInternalId('radix-:r1:'), true);
  assert.equal(isNoiseUiControlOrInternalId('headlessui-listbox-button-1'), true);
  assert.equal(isNoiseUiControlOrInternalId('nav-button-catalog'), true);
  assert.equal(isNoiseUiControlOrInternalId('select_3'), true);
  assert.equal(isNoiseUiControlOrInternalId('input_4'), true);
  assert.equal(isNoiseUiControlOrInternalId('field_5'), true);

  // Global navigation chrome, shortcuts, and avatars must be rejected
  assert.equal(isNoiseUiControlOrInternalId('⌘k'), true);
  assert.equal(isNoiseUiControlOrInternalId('ctrl+k'), true);
  assert.equal(isNoiseUiControlOrInternalId('id'), true);
  assert.equal(isNoiseUiControlOrInternalId('en'), true);
  assert.equal(isNoiseUiControlOrInternalId('fairuza.restu'), true);
  assert.equal(isNoiseUiControlOrInternalId('Baris per halaman:'), true);
  assert.equal(isNoiseUiControlOrInternalId('Rows per page:'), true);
  assert.equal(isNoiseUiControlOrInternalId('menu profil pengguna'), true);
  assert.equal(isNoiseUiControlOrInternalId('toggle sidebar'), true);
  assert.equal(isNoiseUiControlOrInternalId('logout'), true);
  assert.equal(isNoiseUiControlOrInternalId('keluar'), true);

  // Legitimate business fields must pass
  assert.equal(isNoiseUiControlOrInternalId('Origin'), false);
  assert.equal(isNoiseUiControlOrInternalId('Destination'), false);
  assert.equal(isNoiseUiControlOrInternalId('Filter Tipe'), false);
  assert.equal(isNoiseUiControlOrInternalId('Filter Business Unit'), false);
  assert.equal(isNoiseUiControlOrInternalId('Nama Penawaran'), false);
  assert.equal(isNoiseUiControlOrInternalId('Customer & PIC'), false);
  assert.equal(isNoiseUiControlOrInternalId('SQ-2026-JKT-001'), false);
});

test('Test 5: cleanProjectDisplayName never substitutes target app with OneSpec SDLC Studio', () => {
  assert.equal(cleanProjectDisplayName('OneSpec SDLC Studio', 'http://10.10.15.79:3000/'), 'Commercial Center | Pancaran');
  assert.equal(cleanProjectDisplayName('OneSpec', 'http://10.10.15.79:3000/'), 'Commercial Center | Pancaran');
  assert.equal(cleanProjectDisplayName('Default Architecture Workspace', 'http://10.10.15.79:3000/'), 'Commercial Center | Pancaran');
  assert.equal(cleanProjectDisplayName('Commercial Center | Pancaran', 'http://10.10.15.79:3000/'), 'Commercial Center | Pancaran');
  assert.equal(cleanProjectDisplayName(undefined, 'https://erp.internal.net/'), 'Erp');
});

test('Test 6: Score synchronization (49 passed, 8 warning out of 57 tests) yields CONDITIONAL_GO and exact pass counts', () => {
  const rtmRows = [
    ...Array.from({ length: 49 }, (_, i) => ({ id: `r-${i}`, executionVerdict: 'PASSED' as const })),
    ...Array.from({ length: 8 }, (_, i) => ({ id: `w-${i}`, executionVerdict: 'WARNING' as const })),
  ];
  const qm = computeUnifiedQualityMetrics({ rtmRows } as any);

  assert.equal(qm.totalCases, 57);
  assert.equal(qm.passedCases, 49);
  assert.equal(qm.warningCases, 8);
  assert.equal(qm.failedCases, 0);
  assert.equal(qm.passRatePercent, 86);
  assert.equal(qm.releaseGateStatus, 'CONDITIONAL_GO');
});

test('Test 7: T-01 verifyInternalOriginOrToken blocks origin spoofing, weak tokens, and cross-site requests', () => {
  // Save initial env
  const origToken = process.env.ONESPEC_SESSION_TOKEN;

  try {
    // 1. Origin: http://localhost:3000 -> authorized
    const req1 = new Request('http://localhost:3000/api/sdlc/discover', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
      },
    });
    assert.equal(verifyInternalOriginOrToken(req1).authorized, true);

    // 2. Origin: http://localhost:3000.evil.com -> ditolak
    const req2 = new Request('http://localhost:3000/api/sdlc/discover', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000.evil.com',
      },
    });
    const res2 = verifyInternalOriginOrToken(req2);
    assert.equal(res2.authorized, false);
    assert.match(res2.reason || '', /tidak diizinkan/i);

    // 3. Tanpa Origin dan tanpa token -> ditolak
    const req3 = new Request('http://localhost:3000/api/sdlc/discover', {
      method: 'POST',
    });
    const res3 = verifyInternalOriginOrToken(req3);
    assert.equal(res3.authorized, false);
    assert.match(res3.reason || '', /Origin tidak ada/i);

    // 4. Token "aaaaaaaaaaaaaaaa" (16 huruf) -> ditolak walau env kosong
    delete process.env.ONESPEC_SESSION_TOKEN;
    const req4 = new Request('http://localhost:3000/api/sdlc/discover', {
      method: 'POST',
      headers: {
        'x-onespec-session-token': 'aaaaaaaaaaaaaaaa',
      },
    });
    assert.equal(verifyInternalOriginOrToken(req4).authorized, false);

    // 5. Token sama dengan env (>= 32 char) -> authorized
    const validSecret = 'sec_token_0123456789abcdef0123456789abcdef';
    process.env.ONESPEC_SESSION_TOKEN = validSecret;
    const req5 = new Request('http://localhost:3000/api/sdlc/discover', {
      method: 'POST',
      headers: {
        'x-onespec-session-token': validSecret,
      },
    });
    assert.equal(verifyInternalOriginOrToken(req5).authorized, true);

    // Mismatched token of >=32 chars must be rejected
    const req5Mismatch = new Request('http://localhost:3000/api/sdlc/discover', {
      method: 'POST',
      headers: {
        'x-onespec-session-token': 'sec_token_wrong_0123456789abcdef0123456789',
      },
    });
    assert.equal(verifyInternalOriginOrToken(req5Mismatch).authorized, false);

    // 6. sec-fetch-site: cross-site dengan origin cocok -> ditolak
    const req6 = new Request('http://localhost:3000/api/sdlc/discover', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        'sec-fetch-site': 'cross-site',
      },
    });
    const res6 = verifyInternalOriginOrToken(req6);
    assert.equal(res6.authorized, false);
    assert.match(res6.reason || '', /Cross-site request ditolak/i);
  } finally {
    if (origToken !== undefined) {
      process.env.ONESPEC_SESSION_TOKEN = origToken;
    } else {
      delete process.env.ONESPEC_SESSION_TOKEN;
    }
  }
});

test('Test 8: Next.js middleware enforces auth & origin guard on all /api/* mutating endpoints (F-03)', async () => {
  // Mutating requests to previously unmatcher endpoints must now be intercepted and return 403
  const mutatingEndpoints = [
    'http://localhost:3000/api/runner/execute',
    'http://localhost:3000/api/security/dast-probe',
    'http://localhost:3000/api/workspace/vault',
    'http://localhost:3000/api/export/document',
  ];

  for (const url of mutatingEndpoints) {
    const unauthReq = new NextRequest(url, {
      method: 'POST',
      headers: {},
    });
    const response = middleware(unauthReq);
    assert.equal(response.status, 403, `Expected 403 for unauthorized POST to ${url}`);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.match(body.error, /Forbidden|Unauthorized|Origin tidak ada/i);
  }

  // Mutating request with authorized origin must pass through
  const authReq = new NextRequest('http://localhost:3000/api/runner/execute', {
    method: 'POST',
    headers: {
      origin: 'http://localhost:3000',
    },
  });
  const authResponse = middleware(authReq);
  assert.notEqual(authResponse.status, 403, 'Authorized origin must not be rejected with 403');

  // Read-only GET requests must bypass mutating auth check
  const getReq = new NextRequest('http://localhost:3000/api/manual-assets/sample.png', {
    method: 'GET',
    headers: {},
  });
  const getResponse = middleware(getReq);
  assert.notEqual(getResponse.status, 403, 'GET requests must not be rejected by mutating middleware');
});

test('Test 9: WebSocket origin whitelist validation & CSWSH defense (F-09)', () => {
  // Authorized origins
  assert.equal(isAllowedOrigin('http://localhost:3000'), true);
  assert.equal(isAllowedOrigin('http://127.0.0.1:3000'), true);
  assert.equal(isAllowedOrigin('http://localhost:8080'), true);
  assert.equal(isAllowedOrigin('http://127.0.0.1:8080'), true);

  // Unauthorized / malicious origins
  assert.equal(isAllowedOrigin('http://evil.com'), false);
  assert.equal(isAllowedOrigin('http://localhost:3000.evil.com'), false);
  assert.equal(isAllowedOrigin('https://attacker.org'), false);
  assert.equal(isAllowedOrigin(''), false);
  assert.equal(isAllowedOrigin(null), false);
  assert.equal(isAllowedOrigin(undefined), false);

  // Allowed origin set integrity
  const set = allowedOriginSet();
  assert.ok(set.has('http://localhost:3000'));
  assert.ok(set.has('http://127.0.0.1:3000'));
  assert.ok(!set.has('http://evil.com'));

  // CSWSH Handshake protection simulation (as implemented in streamApp.get('/ws/runner-stream'))
  let closeEvent: { code: number; reason: string } | null = null;
  const mockSocket = {
    close: (code: number, reason: string) => {
      closeEvent = { code, reason };
    },
  };

  // Malicious handshake
  const untrustedReq = { headers: { origin: 'http://malicious-web.xyz' } };
  if (untrustedReq.headers.origin && !isAllowedOrigin(untrustedReq.headers.origin)) {
    mockSocket.close(1008, 'Policy Violation: Unauthorized WebSocket Origin');
  }
  assert.deepEqual(closeEvent, {
    code: 1008,
    reason: 'Policy Violation: Unauthorized WebSocket Origin',
  });

  // Legitimate local handshake
  closeEvent = null;
  const legitimateReq = { headers: { origin: 'http://localhost:3000' } };
  if (legitimateReq.headers.origin && !isAllowedOrigin(legitimateReq.headers.origin)) {
    mockSocket.close(1008, 'Policy Violation: Unauthorized WebSocket Origin');
  }
  assert.equal(closeEvent, null);
});

test('Test 10: guardedFetch and expanded SSRF defenses (T-03: F-04, F-05)', async () => {
  // (c) Detection of Carrier-grade NAT, IPv4-mapped IPv6, and IPv6 unique local addresses
  assert.equal(isPrivateOrLoopbackHost('::ffff:127.0.0.1'), true);
  assert.equal(isPrivateOrLoopbackHost('100.64.0.1'), true);
  assert.equal(isPrivateOrLoopbackHost('100.127.255.254'), true);
  assert.equal(isPrivateOrLoopbackHost('100.63.1.1'), false);
  assert.equal(isPrivateOrLoopbackHost('100.128.0.1'), false);
  assert.equal(isPrivateOrLoopbackHost('fc00::1'), true);
  assert.equal(isPrivateOrLoopbackHost('fd12:3456::1'), true);
  assert.equal(isMetadataHost('::ffff:169.254.169.254'), true);
  assert.equal(isMetadataHost('169.254.169.254'), true);

  // (a) Redirect from public host to http://169.254.169.254/ is strictly blocked
  const mockRedirectFetch: typeof fetch = async (input, init) => {
    return new Response(null, {
      status: 302,
      headers: {
        Location: 'http://169.254.169.254/latest/meta-data',
      },
    });
  };
  const mockPublicDns = async () => [{ address: '93.184.216.34', family: 4 }];

  await assert.rejects(
    async () => {
      await guardedFetch('http://example.com/login', {
        fetchFn: mockRedirectFetch,
        lookupFn: mockPublicDns,
      });
    },
    (err: Error) => {
      assert.match(err.message, /SSRF Blocked.*metadata/i);
      return true;
    }
  );

  // (b) Hostname resolving to 127.0.0.1 via DNS is rejected unless in allowlist
  const mockRebindDns = async () => [{ address: '127.0.0.1', family: 4 }];
  const mockSuccessFetch: typeof fetch = async () => new Response('{"ok":true}', { status: 200 });

  await assert.rejects(
    async () => {
      await guardedFetch('http://rebinding-attack.com/api', {
        fetchFn: mockSuccessFetch,
        lookupFn: mockRebindDns,
      });
    },
    (err: Error) => {
      assert.match(err.message, /SSRF: hostname meresolusi ke alamat privat/i);
      return true;
    }
  );

  // When hostname is explicitly in allowedHosts, DNS resolving to private IP is permitted
  const resAllowedHost = await guardedFetch('http://rebinding-attack.com/api', {
    allowedHosts: ['rebinding-attack.com'],
    fetchFn: mockSuccessFetch,
    lookupFn: mockRebindDns,
  });
  assert.equal(resAllowedHost.status, 200);

  // (d) Project target host in allowlist (e.g. 10.10.15.79) can be accessed safely
  const resProjectHost = await guardedFetch('http://10.10.15.79:3000/api/dashboard', {
    allowedHosts: ['http://10.10.15.79:3000'],
    fetchFn: mockSuccessFetch,
  });
  assert.equal(resProjectHost.status, 200);

  // DNS resolving to metadata endpoint is blocked unconditionally even if claimed in allowedHosts
  const mockDnsToMetadata = async () => [{ address: '169.254.169.254', family: 4 }];
  await assert.rejects(
    async () => {
      await guardedFetch('http://metadata-bypass.evil.com/leak', {
        allowedHosts: ['metadata-bypass.evil.com'],
        fetchFn: mockSuccessFetch,
        lookupFn: mockDnsToMetadata,
      });
    },
    (err: Error) => {
      assert.match(err.message, /SSRF: hostname meresolusi ke endpoint metadata/i);
      return true;
    }
  );
});
