import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CURRENT_SCHEMA_VERSION,
  CURRENT_ENGINE_BUILD_ID,
  validateWorkspaceCache,
  wrapWorkspaceEnvelope,
  isWorkspaceEnvelope,
  type WorkspaceEnvelope,
} from '../lib/workspaceCache';

test('T-13 / F-13: Workspace Cache Envelope & Stale Detection', async (t) => {
  await t.test('null or undefined input returns isStale false and empty state', () => {
    const resNull = validateWorkspaceCache(null);
    assert.equal(resNull.isStale, false);
    assert.equal(resNull.data, null);
    assert.equal(resNull.envelope, null);

    const resUndef = validateWorkspaceCache(undefined);
    assert.equal(resUndef.isStale, false);
    assert.equal(resUndef.data, null);
  });

  await t.test('malformed JSON string returns isStale true with parse error reason', () => {
    const res = validateWorkspaceCache('{ invalid: json ...');
    assert.equal(res.isStale, true);
    assert.match(res.staleReason || '', /JSON parse error/);
    assert.equal(res.data, null);
    assert.equal(res.envelope, null);
  });

  await t.test('legacy raw state without envelope is flagged as stale (F-13)', () => {
    // Previous versions stored the raw CompiledSdlcState directly in localStorage
    const legacyRawState = {
      appName: 'Pancaran Commercial Center',
      targetUrl: 'https://commercial.pancaran-group.co.id',
      discoveredModules: [],
      apiEndpoints: [],
      databaseTables: [],
    };

    const res = validateWorkspaceCache(legacyRawState);
    assert.equal(res.isStale, true, 'Legacy state without envelope must be flagged as stale');
    assert.match(res.staleReason || '', /format lama tanpa envelope/);
    assert.deepEqual(res.data, legacyRawState);
    assert.equal(res.envelope, null);

    // Also verify when passed as stringified JSON
    const resString = validateWorkspaceCache(JSON.stringify(legacyRawState));
    assert.equal(resString.isStale, true);
    assert.match(resString.staleReason || '', /format lama tanpa envelope/);
  });

  await t.test('envelope with outdated schemaVersion is flagged as stale', () => {
    const oldSchemaEnvelope: WorkspaceEnvelope<{ appName: string }> = {
      schemaVersion: CURRENT_SCHEMA_VERSION - 1,
      engineBuildId: CURRENT_ENGINE_BUILD_ID,
      compiledAt: new Date().toISOString(),
      data: { appName: 'Old Schema App' },
    };

    const res = validateWorkspaceCache<{ appName: string }>(oldSchemaEnvelope);
    assert.equal(res.isStale, true);
    assert.match(res.staleReason || '', /versi skema lama/);
    assert.equal(res.data?.appName, 'Old Schema App');
  });

  await t.test('envelope with outdated engineBuildId is flagged as stale (T-13 acceptance criteria)', () => {
    const oldBuildEnvelope: WorkspaceEnvelope<{ appName: string }> = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      engineBuildId: '0.9.0-alpha-old-engine',
      compiledAt: '2026-11-15T00:00:00.000Z',
      data: { appName: 'Old Build App' },
    };

    const res = validateWorkspaceCache<{ appName: string }>(oldBuildEnvelope);
    assert.equal(res.isStale, true, 'Old engineBuildId must yield isStale === true');
    assert.match(res.staleReason || '', /engine lama \(build 0\.9\.0-alpha-old-engine\)/);
    assert.equal(res.data?.appName, 'Old Build App');
  });

  await t.test('matching current envelope returns isStale false and pristine data', () => {
    const freshPayload = {
      appName: 'Fresh OneSpec Project',
      targetUrl: 'https://app.example.com',
      auditScore: 98,
    };

    const envelope = wrapWorkspaceEnvelope(freshPayload);
    assert.equal(envelope.schemaVersion, CURRENT_SCHEMA_VERSION);
    assert.equal(envelope.engineBuildId, CURRENT_ENGINE_BUILD_ID);
    assert.ok(envelope.compiledAt);

    const res = validateWorkspaceCache(envelope);
    assert.equal(res.isStale, false);
    assert.equal(res.staleReason, null);
    assert.deepEqual(res.data, freshPayload);
    assert.deepEqual(res.envelope, envelope);

    // Verify stringified version works identically
    const resString = validateWorkspaceCache(JSON.stringify(envelope));
    assert.equal(resString.isStale, false);
    assert.deepEqual(resString.data, freshPayload);
  });

  await t.test('isWorkspaceEnvelope guard accurately checks schema shape', () => {
    assert.equal(isWorkspaceEnvelope(null), false);
    assert.equal(isWorkspaceEnvelope(undefined), false);
    assert.equal(isWorkspaceEnvelope('string'), false);
    assert.equal(isWorkspaceEnvelope(123), false);
    assert.equal(isWorkspaceEnvelope({}), false);
    assert.equal(isWorkspaceEnvelope({ schemaVersion: 1 }), false);
    assert.equal(
      isWorkspaceEnvelope({
        schemaVersion: 1,
        engineBuildId: 'test',
        compiledAt: '2026-11-19T00:00:00Z',
        data: {},
      }),
      true
    );
  });
});
