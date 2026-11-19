import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeUnifiedQualityMetrics,
  isNoiseUiControlOrInternalId,
  type CompiledSdlcState,
} from '../services/sdlcCompiler';

test('Quality Metrics: calculates exact ISO 29119-3 release gate verdicts and pass rates', () => {
  // Scenario A: 100% Pass -> PRODUCTION_GO
  const passRows = Array.from({ length: 57 }, (_, i) => ({
    id: `tc-${i}`,
    executionVerdict: 'PASSED' as const,
  }));
  const passMetrics = computeUnifiedQualityMetrics({ rtmRows: passRows } as unknown as CompiledSdlcState);
  assert.equal(passMetrics.totalCases, 57);
  assert.equal(passMetrics.passedCases, 57);
  assert.equal(passMetrics.failedCases, 0);
  assert.equal(passMetrics.warningCases, 0);
  assert.equal(passMetrics.passRatePercent, 100);
  assert.equal(passMetrics.releaseGateStatus, 'PRODUCTION_GO');

  // Scenario B: 49 Passed + 8 Warnings -> CONDITIONAL_GO (86%)
  const conditionalRows = [
    ...Array.from({ length: 49 }, (_, i) => ({ id: `p-${i}`, executionVerdict: 'PASSED' as const })),
    ...Array.from({ length: 8 }, (_, i) => ({ id: `w-${i}`, executionVerdict: 'WARNING' as const })),
  ];
  const condMetrics = computeUnifiedQualityMetrics({ rtmRows: conditionalRows } as unknown as CompiledSdlcState);
  assert.equal(condMetrics.totalCases, 57);
  assert.equal(condMetrics.passedCases, 49);
  assert.equal(condMetrics.warningCases, 8);
  assert.equal(condMetrics.failedCases, 0);
  assert.equal(condMetrics.passRatePercent, 86);
  assert.equal(condMetrics.releaseGateStatus, 'CONDITIONAL_GO');

  // Scenario C: Any Hard Failure -> NO_GO
  const failRows = [
    { id: '1', executionVerdict: 'PASSED' as const },
    { id: '2', executionVerdict: 'FAILED' as const },
  ];
  const failMetrics = computeUnifiedQualityMetrics({ rtmRows: failRows } as unknown as CompiledSdlcState);
  assert.equal(failMetrics.releaseGateStatus, 'NO_GO');
  assert.equal(failMetrics.failedCases, 1);
  assert.equal(failMetrics.passRatePercent, 50);

  // Scenario D: Zero Cases -> NOT_EXECUTED
  const zeroMetrics = computeUnifiedQualityMetrics({ rtmRows: [] } as unknown as CompiledSdlcState);
  assert.equal(zeroMetrics.totalCases, 0);
  assert.equal(zeroMetrics.passRatePercent, 0);
  assert.equal(zeroMetrics.releaseGateStatus, 'NOT_EXECUTED');
});

test('Noise Filter: comprehensively purges framework IDs, chrome controls, and pagination artifacts', () => {
  // 1. Framework auto-generated IDs
  const frameworkArtifacts = [
    '_r_d_',
    '_r_14_',
    'field-_r_d_',
    'Field- R D',
    'radix-:r1:',
    'radix-:r2a:',
    'headlessui-listbox-button-1',
    'el-id-812',
    'v-input-29',
    'mui-component-select',
    'select_0',
    'select_1',
    'input_2',
    'field_99',
    'nav-button-pricing',
  ];

  for (const artifact of frameworkArtifacts) {
    assert.equal(
      isNoiseUiControlOrInternalId(artifact),
      true,
      `Expected "${artifact}" to be recognized as noise`
    );
  }

  // 2. Global application chrome, keyboard shortcuts, and table pagination
  const chromeNoise = [
    '⌘k',
    '⌘K',
    'ctrl+k',
    'id',
    'en',
    'fairuza.restu',
    'admin',
    'Baris per halaman:',
    'baris per halaman',
    'Rows per page:',
    'rows per page',
    'menu profil pengguna',
    'toggle sidebar',
    'keluar',
    'logout',
  ];

  for (const noise of chromeNoise) {
    assert.equal(
      isNoiseUiControlOrInternalId(noise),
      true,
      `Expected chrome string "${noise}" to be recognized as noise`
    );
  }

  // 3. Genuine business domain entities MUST be preserved (never filtered)
  const genuineEntities = [
    'Sales Quotation ID',
    'Nomor Penawaran',
    'Customer & PIC Name',
    'Origin Port',
    'Destination Terminal',
    'Unit Trucking',
    'Tarif Dasar Freight',
    'PPN / Pajak (11%)',
    'Total Estimasi Biaya',
    'Tanggal Pengiriman',
    'Status Persetujuan',
  ];

  for (const entity of genuineEntities) {
    assert.equal(
      isNoiseUiControlOrInternalId(entity),
      false,
      `Expected genuine business entity "${entity}" NOT to be filtered as noise`
    );
  }
});
