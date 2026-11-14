import assert from 'node:assert/strict';
import { workspaceVaultService } from '../src/services/workspaceVaultService';
import type { ProjectHistoricalSnapshot } from '../src/services/workspaceVaultService';
import type { CompiledSdlcState } from '../src/services/sdlcCompiler';

const oldSnapshot: ProjectHistoricalSnapshot = {
  snapshotId: 'SNAP-A', versionLabel: 'v1.0.0', timestamp: '2026-01-01T00:00:00Z', semanticVersion: 'v1.0.0', changeType: 'INITIAL_BASELINE', autoChangeRequestId: 'CR-AUTO-001',
  modulesCount: 1, apisCount: 1, totalTests: 1, passedTests: 1, passRatePercent: 100, openBugsCount: 0, uatAcceptedCount: 0,
  discoveredPages: ['Invoices'], apiPaths: ['POST /invoices'], tableNames: ['Invoice'], bugTitles: [], buttonsInventory: [], subTabsInventory: [], filtersAndInputsInventory: [], validationRulesInventory: [], apiContractSignatures: ['POST /invoices | Req:[amount] | Resp2xx:[id]'], dbColumnSignatures: [],
};
const newSnapshot: ProjectHistoricalSnapshot = {
  ...oldSnapshot, snapshotId: 'SNAP-B', versionLabel: 'v1.1.0', semanticVersion: 'v1.1.0', autoChangeRequestId: 'CR-AUTO-002',
  apiContractSignatures: ['POST /invoices | Req:[amount,currency] | Resp2xx:[id]'],
};
const state = { appName: 'Invoices', targetUrl: 'https://example.invalid', discoveryResult: { apiEndpoints: [], databaseTables: [] }, discoveredModules: [], discoveredFeatureModules: [], rtmRows: [], testScenarios: [], bugReports: [], uatFlows: [] } as unknown as CompiledSdlcState;
const privateService = workspaceVaultService as unknown as { getProject: (id: string) => unknown };
const originalGetProject = privateService.getProject;
privateService.getProject = () => ({ snapshots: [oldSnapshot, newSnapshot] });
try {
  const diff = workspaceVaultService.compareTwoSnapshots('test', 'SNAP-A', 'SNAP-B');
  assert.equal(diff?.modifiedApiContracts.length, 1);
  assert.equal(diff?.modifiedApiContracts[0]?.changeType, 'SCHEMA_UPDATED');
  assert.match(diff?.administrativeAuditNarrativeEn || '', /SNAP-A.*SNAP-B/s);
  assert.match(diff?.administrativeAuditNarrativeId || '', /CR-AUTO-002/);
} finally {
  privateService.getProject = originalGetProject;
}
console.log('Snapshot API diff and audit narratives verified');
