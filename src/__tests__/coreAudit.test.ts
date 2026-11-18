import test from 'node:test';
import assert from 'node:assert/strict';
import { validateUrlForSsrf, isMetadataHost, isPrivateOrLoopbackHost } from '../lib/serverSecurity';
import { computeUnifiedQualityMetrics, type CompiledSdlcState } from '../services/sdlcCompiler';
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
