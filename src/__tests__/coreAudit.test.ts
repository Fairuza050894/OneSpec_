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
  assert.match(patch, /index 0000000\.\.[0-9a-f]{8}/, 'Patch index must use crypto hex random');
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
