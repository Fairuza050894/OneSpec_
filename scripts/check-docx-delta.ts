import assert from 'node:assert/strict';
// @ts-ignore
import JSZip from 'jszip';
import { modernDocumentExporter } from '../src/services/modernDocumentExporter';
import type { RegressionDiffSummary } from '../src/services/workspaceVaultService';
import type { CompiledSdlcState } from '../src/services/sdlcCompiler';

const state = { appName: 'DOCX Delta Check', targetUrl: 'https://example.invalid', discoveryResult: { apiEndpoints: [], databaseTables: [], domTraceability: [] }, discoveredFeatureModules: [], discoveredModules: [], validationRules: [], brdMatrixRows: [], rtmRows: [], testScenarios: [], bugReports: [], uatFlows: [] } as unknown as CompiledSdlcState;
const diff = {
  comparedAgainstSnapshotId: 'SNAP-011', comparedAgainstLabel: 'v1.0.0 -> v1.2.0', comparedAgainstTimestamp: '2026-01-01T00:00:00Z',
  previousVersion: 'v1.0.0', newVersion: 'v1.2.0', autoChangeRequestId: 'CR-AUTO-012', changeClassification: 'MINOR_FEATURE_ENHANCEMENT',
  newModulesAdded: [], removedModules: [], newApisAdded: [], removedApis: [], newBugsIntroduced: [], bugsResolved: [], passRateDelta: 2,
  addedButtonsAndActions: ['[Invoices] Approve'], removedButtonsAndActions: ['[Invoices] Legacy'], addedSubTabs: ['[Invoices] History'], addedOrModifiedFiltersAndInputs: ['[Invoices] Status'],
  modifiedApiContracts: [{ endpoint: 'POST /invoices', changeType: 'SCHEMA_UPDATED', beforeSignature: 'POST /invoices | old', afterSignature: 'POST /invoices | new', impactNote: 'Request changed' }],
  modifiedValidationAndErrorRules: [], modifiedUserManualSops: ['[Modul Invoices] Manual section updated.'],
  administrativeAuditNarrativeId: 'AUDIT-NARRATIVE-ID-012', administrativeAuditNarrativeEn: 'AUDIT-NARRATIVE-EN-012',
  plainDiffSummary: 'Delta summary', plainDiffSummaryEn: 'Delta summary',
} as RegressionDiffSummary;
void (async () => {
  const buffer = await modernDocumentExporter.generateNativeDocxBuffer(state, diff, 'en');
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file('word/document.xml')!.async('string');
  const text = Array.from(xml.matchAll(/<w:t(?: [^>]*)?>(.*?)<\/w:t>/g), (m: any) => m[1]!.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')).join(' ');
  for (const expected of ['1:1 Feature & Documentation Change Ledger', 'v1.0.0', 'v1.2.0', 'CR-AUTO-012', 'MINOR_FEATURE_ENHANCEMENT', 'POST /invoices [SCHEMA_UPDATED]', 'AUDIT-NARRATIVE-EN-012']) assert(text.includes(expected), `DOCX missing ${expected}`);
  const tablePosition = xml.indexOf('CR-AUTO-012');
  const chapterBreakPosition = xml.indexOf('w:type="page"');
  assert(tablePosition >= 0 && chapterBreakPosition >= 0 && tablePosition < chapterBreakPosition, 'delta ledger must precede page 2 break');
  console.log('DOCX delta table content and Page 1 position verified');
})();
