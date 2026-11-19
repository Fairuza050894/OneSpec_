import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  ISO_CLAIMS,
  getIsoClaim,
  formatControlCoverage,
  validateClaimWording,
} from '../lib/isoClaims';
import { complianceBinderService } from '../services/complianceBinderService';
import type { CompiledSdlcState } from '../services/sdlcCompiler';

test('T-15 / F-21, F-22: ISO_CLAIMS registry contains comprehensive, honest standard definitions', () => {
  const expectedStandards = [
    'ISO_29148',
    'ISO_29119',
    'ISO_26514',
    'ISO_27001',
    'ISO_31000',
    'ISO_9001',
    'ISO_25010',
    'ISO_5055',
    'PCI_DSS',
    'OWASP_ASVS',
    'UU_PDP',
    'POJK_BI',
  ];

  for (const stdKey of expectedStandards) {
    const claim = getIsoClaim(stdKey);
    assert.ok(claim, `Standard ${stdKey} must exist in ISO_CLAIMS registry`);
    assert.ok(claim.code.length > 0, `${stdKey} must have official code`);
    assert.ok(claim.title.length > 0, `${stdKey} must have official title`);
    assert.ok(claim.domain.length > 0, `${stdKey} must have domain`);
    assert.ok(claim.allowedWording.length > 0, `${stdKey} must have allowed wording`);
    assert.ok(claim.forbiddenWording.length > 0, `${stdKey} must have forbidden wording`);
    assert.ok(claim.assessmentNote.length > 0, `${stdKey} must have assessment note`);
    assert.ok(claim.disclaimer.length > 0, `${stdKey} must have disclaimer`);
  }

  // F-21: ISO 5055 must state it measures automated source code structural quality, NOT SRE readiness
  const iso5055 = getIsoClaim('ISO_5055');
  assert.ok(iso5055);
  assert.match(iso5055.assessmentNote, /kode sumber otomatis/i);
  assert.match(iso5055.assessmentNote, /BUKAN ukuran kesiapan SRE/i);
  assert.ok(iso5055.forbiddenWording.includes('ISO 5055 SRE Readiness Score'));

  // F-22: ISO 27001 & PCI-DSS must declare real total standard controls vs evaluated controls
  const iso27001 = getIsoClaim('ISO_27001');
  assert.ok(iso27001);
  assert.equal(iso27001.totalStandardControls, 93);
  assert.equal(iso27001.evaluatedControlsCount, 2);
  assert.match(iso27001.assessmentNote, /93 kontrol/);

  const pci = getIsoClaim('PCI_DSS');
  assert.ok(pci);
  assert.equal(pci.evaluatedControlsCount, 2);
});

test('T-15 / F-22: formatControlCoverage displays honest denominator and scope context', () => {
  // With standard total (e.g. ISO 27001 Annex A)
  const isoCoverage = formatControlCoverage(2, 2, 93);
  assert.equal(
    isoCoverage,
    '2 dari 2 kontrol yang berlaku dinilai (cakupan terbatas: 2 dari total 93 kontrol standar)'
  );

  // Without standard total
  const stdCoverage = formatControlCoverage(2, 2);
  assert.equal(stdCoverage, '2 dari 2 kontrol yang berlaku dinilai');
});

test('T-15 / F-21, F-22: validateClaimWording catches deceptive and misleading claims', () => {
  // Deceptive claims that must be rejected
  assert.equal(validateClaimWording('Aplikasi kami memenuhi ISO 27001 100% tanpa celah.').isValid, false);
  assert.equal(validateClaimWording('Pencapaian 100% ISO 27001 berhasil diraih.').isValid, false);
  assert.equal(validateClaimWording('Kepatuhan PCI-DSS 100% pada sistem pembayaran.').isValid, false);
  assert.equal(validateClaimWording('Sistem sudah tersertifikasi ISO 9001.').isValid, false);
  assert.equal(validateClaimWording('This product is ISO certified.').isValid, false);
  assert.equal(validateClaimWording('Evaluasi iso5055_SreReadinessScore selesai.').isValid, false);
  assert.equal(validateClaimWording('Hasil ISO 5055 SRE Readiness Score 90%.').isValid, false);

  // Honest phrasing that must pass
  assert.equal(validateClaimWording('Sistem mengacu pada Kontrol A.8 ISO/IEC 27001:2022 untuk rekayasa aman.').isValid, true);
  assert.equal(validateClaimWording('Spesifikasi disusun selaras dengan ISO/IEC/IEEE 29148:2018.').isValid, true);
  assert.equal(validateClaimWording('Dokumentasi pengujian mengacu pada ISO/IEC/IEEE 29119-3:2021.').isValid, true);
  assert.equal(validateClaimWording('Skor kesiapan produksi internal OneSpec mencapai 85%.').isValid, true);
});

test('T-15 / F-21: Acceptance Criterion — grep 5055 src only matches src/lib/isoClaims.ts', () => {
  function scanDir(dir: string, fileList: string[] = []): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath, fileList);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        fileList.push(fullPath);
      }
    }
    return fileList;
  }

  const srcDir = path.resolve(__dirname, '..');
  const allFiles = scanDir(srcDir);
  const hits: string[] = [];

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('5055')) {
      const rel = path.relative(path.resolve(__dirname, '../..'), file);
      hits.push(rel);
    }
  }

  // Must only match src/lib/isoClaims.ts and its test file
  const nonAllowedHits = hits.filter(
    (h) => h !== 'src/lib/isoClaims.ts' && h !== 'src/__tests__/isoClaims.test.ts'
  );
  assert.deepEqual(
    nonAllowedHits,
    [],
    `"5055" must only remain in src/lib/isoClaims.ts with proper usage notes. Found in: ${nonAllowedHits.join(', ')}`
  );
});

test('T-15 / F-22: ComplianceBinderService generates honest frameworkSummary with scope notes', () => {
  const assessment = complianceBinderService.assessCompliance({
    appName: 'Commercial Center | Pancaran',
    targetUrl: 'http://10.10.15.79:3000',
    apiEndpoints: [{ method: 'POST', path: '/api/v1/auth/login', parameters: [], responses: [], summary: 'Login' } as any],
    databaseTables: [{ tableName: 'users', columns: [{ name: 'email', type: 'VARCHAR' }] } as any],
    validationRules: [],
    businessRules: [],
    rtmRows: [{ id: 'RTM-1', executionVerdict: 'PASSED' }] as any,
  });
  assert.ok(assessment.scorecard.frameworkSummary.ISO_27001);
  assert.ok(assessment.scorecard.frameworkSummary.PCI_DSS);

  const isoSummary = assessment.scorecard.frameworkSummary.ISO_27001;
  assert.ok(isoSummary.coverageDescription.includes('2 dari 2 kontrol yang berlaku dinilai'));
  assert.ok(isoSummary.coverageDescription.includes('93'));
  assert.ok(isoSummary.scopeNote.length > 0);

  const pciSummary = assessment.scorecard.frameworkSummary.PCI_DSS;
  assert.ok(pciSummary.coverageDescription.includes('2 dari 2 kontrol yang berlaku dinilai'));
  assert.ok(pciSummary.scopeNote.length > 0);
});
