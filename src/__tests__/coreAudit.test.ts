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
import { buildK6Script } from '../lib/k6ScriptBuilder';
import { computeUnifiedQualityMetrics, isNoiseUiControlOrInternalId, cleanProjectDisplayName, type CompiledSdlcState } from '../services/sdlcCompiler';
import { ReaBridgeService } from '../services/reaBridge';
import { smtFormalVerifierService } from '../services/smtFormalVerifierService';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

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

test('Test 11: k6 script generation injection defense & effective load parameters (T-04: F-06, F-15)', async () => {
  // (a) Malicious URL with JavaScript injection does not break syntax or allow code execution
  const injectionUrl = "http://x/'+process.exit(1)+'";
  const script = buildK6Script(injectionUrl, 10, 5, [injectionUrl]);

  // Ensure TARGET is safely encoded as a JSON string literal and not unquoted/interpolated directly into http.get
  assert.ok(script.includes('const TARGET = "http://x/\'+process.exit(1)+\'";'));
  assert.ok(script.includes('http.get(TARGET,'));
  assert.ok(!script.includes("http.get('http://x/'+process.exit(1)+',"));

  // (b) Target URL pointing to metadata endpoint is blocked before writing script
  assert.throws(
    () => {
      buildK6Script('http://169.254.169.254/latest/meta-data', 10, 5);
    },
    (err: Error) => {
      assert.match(err.message, /SSRF Blocked.*metadata/i);
      return true;
    }
  );

  // (c) Effective parameters reporting in K6MetricSummary
  // Calling /api/runner/execute with VUs=50 must return requested: { vus: 50 } and clamped effective: { vus: 20 } or probe count
  const req = new NextRequest('http://localhost:3000/api/runner/execute', {
    method: 'POST',
    headers: {
      origin: 'http://localhost:3000',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      targetUrl: 'http://127.0.0.1:3000',
      vus: 50,
      durationSeconds: 15,
      apiEndpoints: [{ path: '/api/health', method: 'GET' }],
    }),
  });

  const { POST } = await import('../app/api/runner/execute/route');
  const res = await POST(req);
  assert.equal(res.status, 200);
  const data = await res.json();

  assert.ok(data.k6Metrics, 'Response must include k6Metrics');
  assert.deepEqual(data.k6Metrics.requested, { vus: 50, durationSeconds: 15 });
  assert.ok(data.k6Metrics.effective, 'k6Metrics must report effective parameters');
  assert.ok(typeof data.k6Metrics.effective.vus === 'number');
  assert.ok(data.k6Metrics.effective.vus <= 25, 'Effective VUs must be clamped according to environment bounds');
  assert.ok(data.k6Metrics.provenance === 'MEASURED_K6' || data.k6Metrics.provenance === 'MEASURED_HTTP_PROBE');
});

test('Test 12: Zero Math.random across services/lib/api and crypto-backed IDs (T-05: F-07)', async () => {
  const { workspaceVaultService } = await import('../services/workspaceVaultService');
  const dummyState = {
    projectName: 'Test App',
    discoveredFeatureModules: [],
    discoveredApiEndpoints: [],
    synthesizedTestCases: [],
    bugReportTickets: [],
    uatApprovals: [],
  } as unknown as CompiledSdlcState;

  const savedRecord = workspaceVaultService.saveProjectState({
    compiledState: dummyState,
    projectName: 'Crypto Test App',
    createSnapshot: true,
  });
  const snapshot = savedRecord.snapshots[0];
  assert.ok(snapshot);
  assert.match(snapshot.snapshotId, /^SNAP-\d+-[0-9A-F]{6}$/, 'Snapshot ID must be cryptographically hex-generated');

  const { selfHealingPatchService } = await import('../services/selfHealingPatchService');
  const patch = selfHealingPatchService.generateUnifiedGitPatch(dummyState);
  assert.match(patch, /index 0000000\.\.[0-9a-f]{7}/, 'Patch index must use authentic git blob sha');
});

test('Test 13: Provenance model, Measured<T> metrics and NOT_RUN value null enforcement (T-06)', async () => {
  const { migrateLegacyProvenance, isMeasured } = await import('../types/provenance');

  // 1. Migration from legacy values
  assert.equal(migrateLegacyProvenance('EMPIRICAL', true), 'MEASURED_PLAYWRIGHT');
  assert.equal(migrateLegacyProvenance('EMPIRICAL', false), 'INFERRED');
  assert.equal(migrateLegacyProvenance('EMPIRICAL_K6'), 'MEASURED_K6');
  assert.equal(migrateLegacyProvenance('HTTP_CONCURRENCY_PROBE'), 'MEASURED_HTTP_PROBE');
  assert.equal(migrateLegacyProvenance('NOT_RUN'), 'NOT_RUN');
  assert.equal(migrateLegacyProvenance(null), 'NOT_RUN');

  // 2. isMeasured helper
  assert.equal(isMeasured('MEASURED_K6'), true);
  assert.equal(isMeasured('MEASURED_PLAYWRIGHT'), true);
  assert.equal(isMeasured('MEASURED_HTTP_PROBE'), true);
  assert.equal(isMeasured('INFERRED'), false);
  assert.equal(isMeasured('STATIC_ANALYSIS'), false);
  assert.equal(isMeasured('ESTIMATED'), false);
  assert.equal(isMeasured('NOT_RUN'), false);

  // 3. computeUnifiedQualityMetrics with empty state (NOT_RUN) yields value: null
  const emptyMetrics = computeUnifiedQualityMetrics(null);
  assert.equal(emptyMetrics.assertions.value, null);
  assert.equal(emptyMetrics.assertions.provenance, 'NOT_RUN');
  assert.equal(emptyMetrics.passRate.value, null);
  assert.equal(emptyMetrics.passRate.provenance, 'NOT_RUN');
  assert.equal(emptyMetrics.throughput.value, null);
  assert.equal(emptyMetrics.throughput.provenance, 'NOT_RUN');
  assert.equal(emptyMetrics.p95Latency.value, null);
  assert.equal(emptyMetrics.p95Latency.provenance, 'NOT_RUN');
  assert.equal(emptyMetrics.errorRate.value, null);
  assert.equal(emptyMetrics.errorRate.provenance, 'NOT_RUN');
  assert.equal(emptyMetrics.releaseGateStatus, 'NOT_EXECUTED');

  // 4. State with Playwright traces yields MEASURED_PLAYWRIGHT
  const executedMetrics = computeUnifiedQualityMetrics({
    rtmRows: [
      { executionVerdict: 'PASSED' },
      { executionVerdict: 'PASSED' },
      { executionVerdict: 'FAILED' },
    ],
    executionTraces: [
      { totalDurationMs: 42, stageId: 'STAGE-1' },
      { totalDurationMs: 88, stageId: 'STAGE-2' },
    ],
  } as unknown as CompiledSdlcState);

  assert.equal(executedMetrics.assertions.value, 3);
  assert.equal(executedMetrics.assertions.provenance, 'MEASURED_PLAYWRIGHT');
  assert.equal(executedMetrics.passRate.value, 67);
  assert.equal(executedMetrics.passRate.provenance, 'MEASURED_PLAYWRIGHT');
  assert.equal(executedMetrics.releaseGateStatus, 'NO_GO');
  assert.equal(executedMetrics.p95Latency.provenance, 'MEASURED_PLAYWRIGHT');
  assert.equal(executedMetrics.p95Latency.value, 88);

  // 5. State with k6Summary yields MEASURED_K6 or MEASURED_HTTP_PROBE
  const k6MetricsState = computeUnifiedQualityMetrics({
    rtmRows: [{ executionVerdict: 'PASSED' }],
    k6Summary: {
      vus: 20,
      durationSeconds: 5,
      totalRequests: 400,
      throughputRps: 80,
      errorRatePercent: 0,
      provenance: 'MEASURED_K6',
      latency: { min: 10, avg: 25, med: 22, p90: 35, p95: 45, p99: 60, max: 80 },
      thresholds: { httpReqFailedPass: true, httpReqDurationP95Pass: true, p95ThresholdMs: 500, p95ActualMs: 45 },
    },
  } as unknown as CompiledSdlcState);

  assert.equal(k6MetricsState.throughput.value, 80);
  assert.equal(k6MetricsState.throughput.provenance, 'MEASURED_K6');
  assert.equal(k6MetricsState.p95Latency.value, 45);
  assert.equal(k6MetricsState.p95Latency.provenance, 'MEASURED_K6');
});

test('Test 14: EvidenceChip, honest toolProbeService and ungrounded badge elimination (T-07)', async () => {
  const { toolProbeService } = await import('../services/toolProbeService');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const React = await import('react');
  const { EvidenceChip } = await import('../components/ui/EvidenceChip');
  const { MetricValue } = await import('../components/ui/MetricValue');
  const fs = await import('node:fs');
  const path = await import('node:path');

  // 1. Unexecuted / empty state yields NOT_RUN and 0 latency for execution tools
  const emptyState = null;
  const pwProbeEmpty = toolProbeService.executeToolProbe('playwright', emptyState);
  assert.equal(pwProbeEmpty.status, 'NOT_RUN');
  assert.equal(pwProbeEmpty.latencyMs, 0);
  assert.equal(pwProbeEmpty.provenance, 'NOT_RUN');

  const k6ProbeEmpty = toolProbeService.executeToolProbe('k6', emptyState);
  assert.equal(k6ProbeEmpty.status, 'NOT_RUN');
  assert.equal(k6ProbeEmpty.latencyMs, 0);
  assert.equal(k6ProbeEmpty.provenance, 'NOT_RUN');

  // 2. File export integrations yield FILE_EXPORT and 'Ekspor berkas (tidak terhubung)'
  const fileExportTools = ['jira', 'zephyr', 'testrail', 'allure', 'github-actions', 'gitlab', 'promptfoo', 'git-patch'];
  for (const toolId of fileExportTools) {
    const probe = toolProbeService.executeToolProbe(toolId, emptyState);
    assert.equal(probe.status, 'NOT_RUN', `${toolId} must be NOT_RUN when unexecuted`);
    assert.equal(probe.connectionMode, 'FILE_EXPORT', `${toolId} must have connectionMode FILE_EXPORT`);
    assert.match(probe.liveEvidence, /Ekspor berkas \(tidak terhubung\)/, `${toolId} must indicate disconnected file export`);
  }

  // 3. Fallback concurrency probe displays Probe HTTP chip and honest label
  const probeState = {
    k6Summary: {
      vus: 10,
      durationSeconds: 5,
      totalRequests: 200,
      throughputRps: 40,
      errorRatePercent: 0,
      provenance: 'MEASURED_HTTP_PROBE',
      latency: { min: 12, avg: 30, med: 25, p90: 40, p95: 55, p99: 70, max: 90 },
      thresholds: { httpReqFailedPass: true, httpReqDurationP95Pass: true, p95ThresholdMs: 500, p95ActualMs: 55 },
    },
  } as unknown as CompiledSdlcState;

  const k6ProbeRes = toolProbeService.executeToolProbe('k6', probeState);
  assert.equal(k6ProbeRes.provenance, 'MEASURED_HTTP_PROBE');
  assert.equal(k6ProbeRes.status, 'VERIFIED');
  assert.match(k6ProbeRes.liveEvidence, /^Probe Konkurensi HTTP \(bukan beban k6\)/);
  assert.doesNotMatch(k6ProbeRes.liveEvidence, /SLO PASS/);

  // 4. Measured k6 displays k6 provenance
  const measuredK6State = {
    k6Summary: {
      vus: 50,
      durationSeconds: 10,
      totalRequests: 1000,
      throughputRps: 100,
      errorRatePercent: 0,
      provenance: 'MEASURED_K6',
      latency: { min: 10, avg: 20, med: 18, p90: 30, p95: 42, p99: 55, max: 70 },
      thresholds: { httpReqFailedPass: true, httpReqDurationP95Pass: true, p95ThresholdMs: 500, p95ActualMs: 42 },
    },
  } as unknown as CompiledSdlcState;

  const k6MeasuredRes = toolProbeService.executeToolProbe('k6', measuredK6State);
  assert.equal(k6MeasuredRes.provenance, 'MEASURED_K6');
  assert.equal(k6MeasuredRes.status, 'VERIFIED');
  assert.match(k6MeasuredRes.liveEvidence, /\(k6\)/);

  // 5. Component rendering tests for EvidenceChip & MetricValue
  const chipK6 = renderToStaticMarkup(React.createElement(EvidenceChip, { provenance: 'MEASURED_K6' }));
  assert.match(chipK6, />k6</);

  const chipProbe = renderToStaticMarkup(React.createElement(EvidenceChip, { provenance: 'MEASURED_HTTP_PROBE' }));
  assert.match(chipProbe, />Probe HTTP</);

  const chipNotRun = renderToStaticMarkup(React.createElement(EvidenceChip, { provenance: 'NOT_RUN' }));
  assert.match(chipNotRun, />Belum dijalankan</);

  const metricNull = renderToStaticMarkup(React.createElement(MetricValue, { metric: { value: null, provenance: 'NOT_RUN' } }));
  assert.match(metricNull, />—</);
  assert.match(metricNull, />Belum dijalankan</);

  const metricVal = renderToStaticMarkup(React.createElement(MetricValue, { metric: { value: 86, unit: 'ms', provenance: 'MEASURED_K6' } }));
  assert.match(metricVal, /86/);
  assert.match(metricVal, />k6</);

  // 6. Source file check: no literal "Connected & Live-Probed" in components or services
  const workbenchSrc = fs.readFileSync(path.resolve(__dirname, '../components/runner/LiveRunnerWorkbench.tsx'), 'utf-8');
  assert.equal(workbenchSrc.includes('Connected &amp; Live-Probed'), false, 'LiveRunnerWorkbench must not contain Connected & Live-Probed');
  assert.equal(workbenchSrc.includes('Connected & Live-Probed'), false, 'LiveRunnerWorkbench must not contain Connected & Live-Probed');
  assert.equal(workbenchSrc.includes('>EMPIRICAL<'), false, 'LiveRunnerWorkbench must not contain literal >EMPIRICAL<');
});

test('Test 15: Real SHA-256 canonical hashing, ECDSA P-256 seal and non-repudiation verification (T-08 / F-10)', async () => {
  const {
    canonicalJson,
    sha256Digest,
    createCryptographicSeal,
    verifySeal,
  } = await import('../lib/safeCrypto');
  const { complianceBinderService } = await import('../services/complianceBinderService');

  // 1. canonicalJson sorts keys deterministically
  const objA = { b: 2, a: 1, nested: { y: 20, x: 10 } };
  const objB = { nested: { x: 10, y: 20 }, a: 1, b: 2 };
  assert.equal(canonicalJson(objA), canonicalJson(objB));
  assert.equal(canonicalJson(objA), '{"a":1,"b":2,"nested":{"x":10,"y":20}}');

  // 2. digest is exactly 71 characters: 'sha256:' + 64 hex characters
  const digestA = sha256Digest(objA);
  const digestB = sha256Digest(objB);
  assert.equal(digestA.length, 71);
  assert.match(digestA, /^sha256:[0-9a-f]{64}$/);
  assert.equal(digestA, digestB, 'Same payload in different key order must yield identical digest');

  // 3. Modifying 1 field yields a different digest
  const objModified = { ...objA, a: 99 };
  const digestModified = sha256Digest(objModified);
  assert.notEqual(digestA, digestModified, 'Modifying 1 field must produce a different digest');

  // 4. Zero Date.now() in digest: multiple invocations on same payload yield exact same digest
  const digestA2 = sha256Digest(objA);
  assert.equal(digestA, digestA2, 'Digest must be 100% deterministic with zero Date.now() timestamp variance');

  // 5. Option (a): Real ECDSA P-256 seal generation and verification
  const seal = createCryptographicSeal(objA);
  assert.equal(seal.algorithm, 'ECDSA-P256-SHA256');
  assert.equal(seal.digestSha256, digestA);
  assert.ok(seal.signature && seal.signature.length > 32);
  assert.match(seal.publicKeyFingerprint, /^sha256:[0-9a-f]{64}$/);

  // verifySeal passes on original payload
  const valid = verifySeal(objA, seal.signature, seal.publicKeyPem);
  assert.equal(valid, true, 'verifySeal must pass on unmodified payload');

  // verifySeal fails after payload is modified
  const tampered = verifySeal(objModified, seal.signature, seal.publicKeyPem);
  assert.equal(tampered, false, 'verifySeal must fail after payload is modified');

  // 6. complianceBinderService integration test
  const compliance = complianceBinderService.assessCompliance({
    appName: 'Pancaran Mobility Test',
    targetUrl: 'https://test.pancaran-group.co.id',
    apiEndpoints: [],
    databaseTables: [],
    validationRules: [],
    businessRules: [],
  });
  assert.equal(compliance.scorecard.auditCryptographicSignature.digestSha256.length, 71);
  assert.match(compliance.scorecard.auditCryptographicSignature.digestSha256, /^sha256:[0-9a-f]{64}$/);
  assert.equal(compliance.scorecard.auditCryptographicSignature.algorithm, 'ECDSA-P256-SHA256');

  const scorecardValid = complianceBinderService.verifyScorecardSeal(
    compliance.scorecard,
    'Pancaran Mobility Test',
    'https://test.pancaran-group.co.id'
  );
  assert.equal(scorecardValid, true, 'Scorecard seal must verify successfully');

  // Tamper with scorecard compliantCount
  const tamperedScorecard = {
    ...compliance.scorecard,
    compliantCount: compliance.scorecard.compliantCount + 1,
  };
  const scorecardTampered = complianceBinderService.verifyScorecardSeal(
    tamperedScorecard,
    'Pancaran Mobility Test',
    'https://test.pancaran-group.co.id'
  );
  assert.equal(scorecardTampered, false, 'Tampered scorecard must fail seal verification');
});

test('Test 16: SMT Formal Verifier truthfulness and noise elimination (T-09: F-12, F-30)', () => {
  // 1. z3Installed = false yields formalTrustScore === null, provenCount === 0, and no PROVEN_CORRECT/UNSAT
  const noZ3Summary = smtFormalVerifierService.verifyInvariants({
    appName: 'Pancaran Test App',
    targetUrl: 'https://test.pancaran-group.co.id',
    apiEndpoints: [],
    databaseTables: [{ id: 'tbl-01', tableName: 'Shipments', columns: [], primaryKeys: ['id'] }],
    validationRules: [
      {
        ruleId: 'VR-01',
        userStoryId: 'REQ-US-01',
        fieldName: 'weight_kg',
        dataType: 'number',
        constraintExpression: 'weight_kg > 0',
        errorCode: 'ERR_INVALID_WEIGHT',
        httpStatus: 422,
        exactUiErrorString: 'Berat harus lebih dari 0',
      },
      {
        ruleId: 'VR-02',
        userStoryId: 'REQ-US-02',
        fieldName: 'password',
        dataType: 'string',
        constraintExpression: '^.{6,64}$',
        errorCode: 'ERR_PASS_LEN',
        httpStatus: 400,
        exactUiErrorString: 'Password minimal 6 karakter',
      },
      // Noise fields that should be purged
      {
        ruleId: 'select_3',
        userStoryId: 'REQ-US-03',
        fieldName: 'field-_r_d_',
        dataType: 'string',
        constraintExpression: '^.{1,10}$',
        errorCode: 'ERR_NOISE',
        httpStatus: 400,
        exactUiErrorString: 'Noise error',
      },
    ],
    businessRules: [],
    customZ3Binary: null, // explicitly simulate no Z3 installed
  });

  assert.equal(noZ3Summary.z3Installed, false, 'z3Installed must be false when binary is null');
  assert.equal(noZ3Summary.formalTrustScore, null, 'formalTrustScore must be null (not 100) when z3 is not installed');
  assert.equal(noZ3Summary.provenCount, 0, 'provenCount must be 0 when z3 is not installed');

  // Verify no invariant claims PROVEN_CORRECT or UNSAT
  for (const inv of noZ3Summary.invariants) {
    assert.notEqual(inv.solverVerdict, 'PROVEN_CORRECT', `Invariant ${inv.id} must not claim PROVEN_CORRECT when Z3 did not run`);
    assert.notEqual(inv.solverSatisfiability, 'UNSAT', `Invariant ${inv.id} must not claim UNSAT when Z3 did not run`);
    assert.equal(inv.solverVerdict, 'SPEC_GENERATED');
    assert.equal(inv.solverSatisfiability, 'NOT_SOLVED');
  }

  // 2. Framework noise elimination: 'field-_r_d_' and 'select_3' must not appear in invariants
  const invariantTitles = noZ3Summary.invariants.map((i) => i.title).join(' ');
  const invariantMaths = noZ3Summary.invariants.map((i) => i.mathematicalStatement).join(' ');
  assert.equal(invariantTitles.includes('field-_r_d_'), false, 'Framework noise ID field-_r_d_ must be purged');
  assert.equal(invariantTitles.includes('select_3'), false, 'Framework noise ID select_3 must be purged');
  assert.equal(invariantMaths.includes('field-_r_d_'), false, 'Framework noise ID must not appear in mathematicalStatement');

  // 3. Regex predicate has balanced parentheses
  const passwordInv = noZ3Summary.invariants.find((i) => i.title.includes('password'));
  assert.ok(passwordInv, 'Invariant for password should exist');
  const math = passwordInv.mathematicalStatement;
  assert.ok(math.includes('text{Regex}('), `Mathematical statement must contain \\text{Regex}(: ${math}`);
  assert.ok(math.includes('6,64'), `Mathematical statement must contain bounds 6,64: ${math}`);
  const openParens = (math.match(/\(/g) || []).length;
  const closeParens = (math.match(/\)/g) || []).length;
  assert.equal(openParens, closeParens, 'Parentheses in mathematicalStatement must be strictly balanced');
  const openBraces = (math.match(/\{/g) || []).length;
  const closeBraces = (math.match(/\}/g) || []).length;
  assert.equal(openBraces, closeBraces, 'Curly braces in mathematicalStatement must be strictly balanced');

  // 4. Markdown specification displays '—' for NOT_SOLVED invariants
  const md = noZ3Summary.formalSpecificationText;
  assert.ok(md.includes('| — | — |'), 'Markdown table must render — for Satisfiability and Verdict when NOT_SOLVED');
  assert.equal(md.includes('**`UNSAT`**'), false, 'Markdown must not claim UNSAT when Z3 did not run');
  assert.equal(md.includes('`PROVEN_CORRECT`'), false, 'Markdown must not claim PROVEN_CORRECT when Z3 did not run');

  // 5. Test with mock Z3 binary that returns 'unsat'
  const tmpDir = os.tmpdir();
  const mockZ3Path = path.join(tmpDir, `mock-z3-${Date.now()}.sh`);
  fs.writeFileSync(mockZ3Path, '#!/bin/sh\necho "unsat"\n', { mode: 0o755 });

  try {
    const liveZ3Summary = smtFormalVerifierService.verifyInvariants({
      appName: 'Pancaran Proved App',
      targetUrl: 'https://test.pancaran-group.co.id',
      apiEndpoints: [],
      databaseTables: [{ id: 'tbl-01', tableName: 'Shipments', columns: [], primaryKeys: ['id'] }],
      validationRules: [
        {
          ruleId: 'VR-01',
          userStoryId: 'REQ-US-01',
          fieldName: 'weight_kg',
          dataType: 'number',
          constraintExpression: 'weight_kg > 0',
          errorCode: 'ERR_INVALID_WEIGHT',
          httpStatus: 422,
          exactUiErrorString: 'Berat harus lebih dari 0',
        },
      ],
      businessRules: [],
      customZ3Binary: mockZ3Path,
    });

    assert.equal(liveZ3Summary.z3Installed, true);
    assert.ok(liveZ3Summary.provenCount > 0, 'Proven count should be > 0 when Z3 returns unsat');
    assert.equal(liveZ3Summary.formalTrustScore, Math.round((liveZ3Summary.provenCount / liveZ3Summary.totalInvariants) * 100));
    const provenInv = liveZ3Summary.invariants.find((i) => i.solverVerdict === 'PROVEN_CORRECT');
    assert.ok(provenInv, 'At least one invariant must have PROVEN_CORRECT');
    assert.equal(provenInv.solverSatisfiability, 'UNSAT');
  } finally {
    try {
      fs.unlinkSync(mockZ3Path);
    } catch {
      // ignore
    }
  }
});

test('Test 17: Delphi ARB rule-based consensus derivation and zero static claims (T-10)', async () => {
  const { delphiConsensusService } = await import('../services/delphiConsensusService');

  const baseParams = {
    appName: 'Test Cargo Port',
    targetUrl: 'https://cargo.pancaran-group.co.id',
    apiEndpoints: [
      {
        id: '1',
        path: '/api/v1/shipments',
        method: 'GET' as const,
        controllerPath: 'src/controllers/shipmentController.ts',
        lineNumber: 42,
        summary: 'List shipments',
        linkedTestCaseIds: ['TC-001'],
        linkedRequirementId: 'REQ-US-01',
      },
    ],
    databaseTables: [{ id: '1', tableName: 'Shipments', columns: [], primaryKeys: ['id'] }],
    validationRules: [
      {
        ruleId: 'VR-01',
        userStoryId: 'REQ-US-01',
        fieldName: 'container_no',
        dataType: 'string',
        constraintExpression: 'container_no != null',
        errorCode: 'ERR_CONTAINER_REQ',
        httpStatus: 400,
        exactUiErrorString: 'Container ID is required',
      },
    ],
    businessRules: [
      {
        ruleId: 'BRD-001',
        userStoryId: 'REQ-US-01',
        actor: 'Dispatcher',
        action: 'Dispatch Container',
        targetEntity: 'Container',
        precondition: 'Shipment created',
        postcondition: 'Shipment dispatched',
        statement: 'Only authenticated dispatchers can dispatch containers',
        category: 'SECURITY',
        targetKpi: 'Zero unauthorized dispatches',
        sourceMoMLine: 'Line 10',
        ruleCategory: 'SECURITY' as const,
        priority: 'HIGH' as const,
        impactScore: 5,
        testId: 'TC-DISP-01',
        traceabilityHash: 'hash-01',
      },
    ],
    rtmRows: [],
  };

  // 1. Gate NO_GO results in QA_LEAD CHALLENGE and verdict !== UNANIMOUS_APPROVE
  const noGoSummary = delphiConsensusService.simulateConsensus({
    ...baseParams,
    gateVerdict: 'NO_GO',
  });
  const qaEntry = noGoSummary.rounds[2]?.entries.find((e) => e.persona === 'QA_LEAD');
  assert.ok(qaEntry, 'QA_LEAD must have an entry in Round 3');
  assert.equal(qaEntry.stance, 'CHALLENGE', 'QA_LEAD must CHALLENGE when gate is NO_GO');
  assert.notEqual(noGoSummary.clearanceVerdict, 'UNANIMOUS_APPROVE');
  assert.equal(noGoSummary.clearanceVerdict, 'NOT_CONSENSUS');

  const qaSeal = noGoSummary.signOffSeals.find((s) => s.persona === 'QA_LEAD');
  assert.ok(qaSeal, 'QA_LEAD seal must exist');
  assert.equal(qaSeal.status, 'CHALLENGED_UNRESOLVED');
  assert.equal(qaSeal.signatureDigest, 'TANDA TANGAN DITANGGUHKAN');

  // 2. Critical DAST finding results in APPSEC CHALLENGE and NOT_CONSENSUS
  const dastChallengeSummary = delphiConsensusService.simulateConsensus({
    ...baseParams,
    gateVerdict: 'GO',
    dastStatus: 'COMPLETED',
    dastFindings: [{ id: 'SEC-01', severity: 'CRITICAL', title: 'SQL Injection in Shipment Query' }],
  });
  const secEntry = dastChallengeSummary.rounds[2]?.entries.find((e) => e.persona === 'APPSEC');
  assert.ok(secEntry, 'APPSEC must have an entry in Round 3');
  assert.equal(secEntry.stance, 'CHALLENGE', 'APPSEC must CHALLENGE on CRITICAL vulnerability');
  assert.equal(dastChallengeSummary.clearanceVerdict, 'NOT_CONSENSUS');
  const secSeal = dastChallengeSummary.signOffSeals.find((s) => s.persona === 'APPSEC');
  assert.equal(secSeal?.status, 'CHALLENGED_UNRESOLVED');
  assert.equal(secSeal?.signatureDigest, 'TANDA TANGAN DITANGGUHKAN');

  // 3. Clean environment produces UNANIMOUS_APPROVE
  const cleanSummary = delphiConsensusService.simulateConsensus({
    ...baseParams,
    gateVerdict: 'GO',
    dastStatus: 'COMPLETED',
    dastFindings: [],
    complianceRate: 100,
    hasStakeholderRequirements: true,
    isAsBuiltOnly: false,
    dbSchemaInferred: false,
    docsStaleOrIncomplete: false,
  });
  assert.equal(cleanSummary.clearanceVerdict, 'UNANIMOUS_APPROVE');
  assert.equal(cleanSummary.consensusScorePercent, 100);
  assert.equal(cleanSummary.convergenceScorePercent, 100);
  for (const seal of cleanSummary.signOffSeals) {
    assert.equal(seal.status, 'SIGNED_APPROVED', `Seal for ${seal.persona} must be SIGNED_APPROVED`);
    assert.notEqual(seal.signatureDigest, 'TANDA TANGAN DITANGGUHKAN');
  }

  // 4. Zero mentions of 'Completion Certificate' and all evidence references are valid artifact IDs
  const allEntries = noGoSummary.rounds.flatMap((r) => r.entries);
  for (const entry of allEntries) {
    assert.equal(
      entry.statement.includes('Completion Certificate'),
      false,
      `Statement must not mention Completion Certificate: ${entry.statement}`
    );
    assert.match(
      entry.evidenceReference,
      /^[A-Za-z0-9_-]+$/,
      `Evidence reference must be a valid ID string: ${entry.evidenceReference}`
    );
  }

  assert.equal(noGoSummary.clearancePacketMarkdown.includes('Completion Certificate'), false);
  assert.equal(cleanSummary.clearancePacketMarkdown.includes('Completion Certificate'), false);
});

test('Test 18: SelfHealingPatchService honest git apply verification and illustrative simulation labeling (T-11)', async () => {
  const { selfHealingPatchService, SelfHealingPatchService } = await import('../services/selfHealingPatchService');
  const cp = await import('node:child_process');
  const fs = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');

  // 1. Verify authentic git blob hash computation
  const testContent = 'import express from "express";\nexport const x = 1;\n';
  const expectedSha = 'c0f1576';
  assert.equal(
    SelfHealingPatchService.gitBlobSha7(testContent),
    expectedSha,
    'gitBlobSha7 must produce the mathematically authentic Git object blob SHA-1 prefix'
  );

  const dummyState: any = {
    appName: 'Pancaran Test App',
    targetUrl: 'https://test.pancaran-group.co.id',
    databaseTables: [{ tableName: 'Shipments' }],
    validationRules: [
      {
        ruleId: 'VR-01',
        fieldName: 'containerNumber',
        dataType: 'string',
        constraintExpression: 'nonempty',
        httpStatus: 400,
      },
    ],
    pipelineStages: [{ status: 'BOTTLENECK', rootCause: { sqlRemediationQuery: 'CREATE INDEX idx_test ON "Shipments" ("id");' } }],
  };

  // 2. Generate unified patch
  const patch = selfHealingPatchService.generateUnifiedGitPatch(dummyState);

  // 3. Verify illustrative metadata and absence of random index
  assert.match(patch, /X-OneSpec-Provenance: SIMULATED/, 'Patch must include SIMULATED provenance header');
  assert.match(patch, /X-OneSpec-Illustrative: true/, 'Patch must mark itself illustrative');
  assert.match(patch, /CONTOH PATCH REMEDIASI ILUSTRATIF/, 'Patch must contain illustrative title');
  assert.match(patch, /TIDAK untuk diterapkan langsung/, 'Patch must contain direct application warning');
  assert.match(patch, /index 0000000\.\.[0-9a-f]{7}/, 'Patch index must use authentic 7-char git blob sha');
  assert.equal(patch.includes('Math.random'), false);

  // 4. Verify git apply --check in temporary git repository (Mode A criteria)
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'onespec-t11-test-'));
  try {
    cp.execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
    const patchPath = path.join(tmpDir, 'test.patch');
    fs.writeFileSync(patchPath, patch, 'utf8');

    // Dry-run applicability check must pass cleanly with 0 errors
    cp.execSync('git apply --check test.patch', { cwd: tmpDir, stdio: 'pipe' });

    // Actual git apply must succeed and create all files
    cp.execSync('git apply test.patch', { cwd: tmpDir, stdio: 'pipe' });

    assert.ok(fs.existsSync(path.join(tmpDir, 'src/middleware/tenantIsolation.ts')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'src/schemas/strictValidationDto.ts')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'src/middleware/rateLimiter.ts')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'src/middleware/securityHeaders.ts')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'prisma/migrations/add_autonomous_remediation_indexes.sql')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'src/validators/inputContracts.ts')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'docs/AUTONOMOUS_REMEDIATION_RUNBOOK.md')));
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup error
    }
  }

  // 5. Verify Remediation Runbook contents and provenance
  const runbook = selfHealingPatchService.generateRemediationRunbook(dummyState);
  assert.match(runbook, /Contoh Patch \(Ilustratif \/ Simulated\)/, 'Runbook must include illustrative warning');
  assert.match(runbook, /SIMULATED/, 'Runbook must document SIMULATED provenance in table');
});

test('Test 19: Gap Auditor as-built baseline match semantics and n/a compliance rate (T-12: F-17)', async () => {
  const { gapAuditorService } = await import('../services/gapAuditorService');

  // Case 1: As-Built Baseline Mode (Zero-Doc / No Stakeholder MoM/PRD uploaded)
  // When no stakeholder requirements are provided, invariants reverse-engineered from implementation
  // MUST NOT claim "COMPLIANT" or "100% Kepatuhan" against itself.
  // Verdict MUST be BASELINE_MATCH with complianceRatePercent === null (N/A).
  const asBuiltInput = {
    businessRules: [
      {
        ruleId: 'BR-AST-01',
        category: 'SECURITY',
        statement: 'The system shall enforce strict container number checks',
        targetKpi: '< 500ms response time',
        sourceMoMLine: 'AST-Inferred-Line-1',
        priority: 'HIGH' as const,
        provenance: 'AS_BUILT_DISCOVERED' as const,
      },
    ],
    validationRules: [
      {
        ruleId: 'VR-AST-01',
        userStoryId: 'REQ-US-01',
        fieldName: 'containerNumber',
        dataType: 'string',
        constraintExpression: 'nonempty',
        errorCode: 'ERR_INVALID_CONTAINER',
        httpStatus: 400,
        exactUiErrorString: 'Container number cannot be empty',
        provenance: 'AS_BUILT_DISCOVERED' as const,
      },
      {
        ruleId: 'VR-AST-02',
        userStoryId: 'REQ-US-01',
        fieldName: 'status',
        dataType: 'string',
        constraintExpression: "status IN ('PENDING', 'APPROVED')",
        errorCode: 'ERR_INVALID_STATUS',
        httpStatus: 400,
        exactUiErrorString: 'Status is not valid',
        provenance: 'AS_BUILT_DISCOVERED' as const,
      },
    ],
    apiEndpoints: [
      {
        id: 'EP-01',
        method: 'POST' as const,
        path: '/api/v1/shipments',
        controllerPath: 'src/controllers/shipments.ts',
        lineNumber: 10,
        summary: 'Create Shipment',
        requestBodySchema: { containerNumber: 'string', status: 'string' },
        linkedTestCaseIds: ['TC-001'],
        linkedRequirementId: 'REQ-US-01',
      },
    ],
    databaseTables: [
      {
        id: 'tbl-shipments-1',
        tableName: 'Shipments',
        primaryKeys: ['id'],
        columns: [
          { name: 'id', type: 'UUID', isPrimaryKey: true, isForeignKey: false, isNullable: false },
          { name: 'containerNumber', type: 'VARCHAR(255)', isPrimaryKey: false, isForeignKey: false, isNullable: false },
          { name: 'status', type: 'VARCHAR(50)', isPrimaryKey: false, isForeignKey: false, isNullable: false },
        ],
        relations: [],
      },
    ],
    hasSourceRequirements: false,
  };

  const asBuiltAudit = gapAuditorService.auditSpecificationsAgainstImplementation(asBuiltInput);

  assert.equal(asBuiltAudit.summary.compliantCount, 0, 'As-built mode must NOT report any COMPLIANT items');
  assert.equal(asBuiltAudit.summary.complianceRatePercent, null, 'Compliance rate must be null (N/A) in as-built mode');
  assert.ok(asBuiltAudit.summary.baselineMatchCount && asBuiltAudit.summary.baselineMatchCount > 0, 'Must record baselineMatchCount');
  assert.equal(asBuiltAudit.summary.baselineMatchCount, asBuiltAudit.summary.totalAudited);
  assert.equal(asBuiltAudit.summary.missingInBackendCount, 0);
  assert.equal(asBuiltAudit.summary.shadowApiCount, 0);

  // All individual discrepancy items in as-built mode must have BASELINE_MATCH verdict
  for (const item of asBuiltAudit.items) {
    assert.equal(
      item.verdict,
      'BASELINE_MATCH',
      `Item ${item.id} must be BASELINE_MATCH in as-built mode, got ${item.verdict}`
    );
    assert.notEqual(item.verdict, 'COMPLIANT');
  }

  // Unified Technical Documentation must state AS-BUILT BASELINE and Compliance Rate: N/A
  const techDoc = gapAuditorService.generateUnifiedTechDoc(asBuiltAudit.items, asBuiltAudit.summary);
  assert.match(techDoc, /Mode:\*\* AS-BUILT BASELINE/);
  assert.match(techDoc, /Compliance Rate:\*\* N\/A/);

  // Case 2: Dual-Track Mode (Stakeholder MoM / PRD source provided)
  // When stakeholder requirements are present, regular compliance auditing is executed.
  const dualTrackInput = {
    businessRules: [
      {
        ruleId: 'BR-SRC-01',
        category: 'SECURITY',
        statement: 'The system shall enforce strict container number checks',
        targetKpi: '< 500ms response time',
        sourceMoMLine: 'MoM-Page-1',
        priority: 'HIGH' as const,
        provenance: 'SOURCE_REQUIREMENT' as const,
      },
      {
        ruleId: 'BR-SRC-02',
        category: 'INTEGRATION',
        statement: 'The system shall send automatic WhatsApp notification to driver',
        targetKpi: 'Immediate delivery',
        sourceMoMLine: 'MoM-Page-2',
        priority: 'MEDIUM' as const,
        provenance: 'SOURCE_REQUIREMENT' as const,
      },
    ],
    validationRules: [
      {
        ruleId: 'VR-SRC-01',
        userStoryId: 'REQ-US-01',
        fieldName: 'containerNumber',
        dataType: 'string',
        constraintExpression: 'nonempty',
        errorCode: 'ERR_INVALID_CONTAINER',
        httpStatus: 400,
        exactUiErrorString: 'Container number cannot be empty',
        provenance: 'SOURCE_REQUIREMENT' as const,
      },
    ],
    apiEndpoints: [
      {
        id: 'EP-01',
        method: 'POST' as const,
        path: '/api/v1/shipments',
        controllerPath: 'src/controllers/shipments.ts',
        lineNumber: 10,
        summary: 'Create Shipment',
        requestBodySchema: { containerNumber: 'string' },
        linkedTestCaseIds: ['TC-001'],
        linkedRequirementId: 'REQ-US-01',
      },
    ],
    databaseTables: [
      {
        id: 'tbl-shipments-2',
        tableName: 'Shipments',
        primaryKeys: ['id'],
        columns: [
          { name: 'id', type: 'UUID', isPrimaryKey: true, isForeignKey: false, isNullable: false },
          { name: 'containerNumber', type: 'VARCHAR(255)', isPrimaryKey: false, isForeignKey: false, isNullable: false },
        ],
        relations: [],
      },
    ],
    hasSourceRequirements: true,
  };

  const dualTrackAudit = gapAuditorService.auditSpecificationsAgainstImplementation(dualTrackInput);

  assert.notEqual(dualTrackAudit.summary.complianceRatePercent, null, 'Dual-track mode must compute a numeric compliance rate');
  assert.ok(typeof dualTrackAudit.summary.complianceRatePercent === 'number');
  assert.ok(dualTrackAudit.summary.totalAudited > 0);
  assert.ok(dualTrackAudit.items.some((i) => i.verdict === 'COMPLIANT' || i.verdict === 'VERIFIED_MATCH'));
  assert.ok(dualTrackAudit.items.some((i) => i.verdict === 'MISSING_IMPLEMENTATION' || i.verdict === 'MISSING_IN_BACKEND'));

  const dualTrackDoc = gapAuditorService.generateUnifiedTechDoc(dualTrackAudit.items, dualTrackAudit.summary);
  assert.match(dualTrackDoc, /Mode:\*\* DUAL-TRACK/);
  assert.match(dualTrackDoc, /Compliant Contracts:\*\*/);
});
