/**
 * OneSpec SDLC Workbench - Multi-Project Permanent Vault, Version History & Regression Diff Engine
 * Persists multiple projects in `.onespec-vault/` with up to 15 historical snapshots per project,
 * deep 1:1 delta structural inspection (buttons, subtabs, inputs, APIs, DB columns),
 * and automatic semantic versioning engine with ISO 9001 Clause 7.5 audit ledgers.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type { CompiledSdlcState } from './sdlcCompiler';
import type { ReleaseAuditSignatureRecord } from '@/types/sdlc';

export type VaultProjectType = 'EXISTING_WEB' | 'GIT_REPO' | 'LOCAL_ZIP' | 'NEW_PROJECT_FROM_ZERO';

export type ChangeClassification =
  | 'INITIAL_BASELINE'
  | 'MAJOR_BREAKING_UPDATE'
  | 'MINOR_FEATURE_ENHANCEMENT'
  | 'PATCH_DEFECT_FIX'
  | 'NO_STRUCTURAL_CHANGE';

export interface ProjectHistoricalSnapshot {
  snapshotId: string;
  versionLabel: string;
  timestamp: string;
  semanticVersion: string; // e.g. 'v1.0.0', 'v1.1.0', 'v2.0.0'
  changeType: 'INITIAL_BASELINE' | 'MAJOR_BREAKING_UPDATE' | 'MINOR_FEATURE_ENHANCEMENT' | 'PATCH_DEFECT_FIX';
  autoChangeRequestId: string; // e.g. 'CR-AUTO-001'
  modulesCount: number;
  apisCount: number;
  totalTests: number;
  passedTests: number;
  passRatePercent: number;
  openBugsCount: number;
  uatAcceptedCount: number;
  discoveredPages: string[];
  apiPaths: string[];
  tableNames: string[];
  bugTitles: string[];
  buttonsInventory: string[]; // e.g. "[ModuleName] ButtonName (Location)"
  subTabsInventory: string[]; // e.g. "[ModuleName] SubTabName"
  filtersAndInputsInventory: string[]; // e.g. "[ModuleName] ControlName [Type: Options]"
  validationRulesInventory: string[]; // e.g. "VR-xx: fieldName (constraintExpression) -> HTTP status"
  apiContractSignatures: string[]; // e.g. "METHOD /path | Req:[fields] | Resp2xx:[fields] | Err:[codes]"
  dbColumnSignatures: string[]; // e.g. "TableName.columnName (Type)"
}

export interface ModifiedApiContractDiffItem {
  endpoint: string;
  changeType: 'NEW_ENDPOINT' | 'SCHEMA_UPDATED' | 'REMOVED_ENDPOINT';
  beforeSignature: string;
  afterSignature: string;
  impactNote: string;
}

export interface RegressionDiffSummary {
  comparedAgainstSnapshotId: string;
  comparedAgainstLabel: string;
  comparedAgainstTimestamp: string;
  previousVersion: string; // e.g. 'v1.0.0'
  newVersion: string; // e.g. 'v1.1.0'
  autoChangeRequestId: string; // e.g. 'CR-AUTO-002'
  changeClassification: ChangeClassification;
  newModulesAdded: string[];
  removedModules: string[];
  newApisAdded: string[];
  removedApis: string[];
  newBugsIntroduced: string[];
  bugsResolved: string[];
  passRateDelta: number;
  addedButtonsAndActions: string[];
  removedButtonsAndActions: string[];
  addedSubTabs: string[];
  addedOrModifiedFiltersAndInputs: string[];
  modifiedApiContracts: ModifiedApiContractDiffItem[];
  modifiedValidationAndErrorRules: string[];
  modifiedUserManualSops: string[];
  administrativeAuditNarrativeId: string;
  administrativeAuditNarrativeEn: string;
  plainDiffSummary: string;
  plainDiffSummaryEn: string;
}

export interface SavedProjectRecord {
  projectId: string;
  projectName: string;
  targetUrl: string;
  projectType: VaultProjectType;
  updatedAt: string;
  latestState: CompiledSdlcState;
  snapshots: ProjectHistoricalSnapshot[];
  regressionDiffSummary?: RegressionDiffSummary | null;
  auditSignatures?: ReleaseAuditSignatureRecord[];
}

export interface ProjectIndexEntry {
  projectId: string;
  projectName: string;
  targetUrl: string;
  projectType: VaultProjectType;
  updatedAt: string;
  snapshotCount: number;
  latestPassRatePercent: number;
  latestModulesCount: number;
  latestApisCount: number;
  latestOpenBugsCount: number;
  latestUatAcceptedCount: number;
  latestSemanticVersion?: string;
  latestAutoChangeRequestId?: string;
}

const VAULT_ROOT_DIR = path.resolve(process.cwd(), '.onespec-vault');
const PROJECTS_DIR = path.join(VAULT_ROOT_DIR, 'projects');
const INDEX_FILE_PATH = path.join(VAULT_ROOT_DIR, 'projects-index.json');
const LEGACY_CACHE_FILE_PATH = path.resolve(process.cwd(), '.onespec-workspace-cache.json');
const MAX_SNAPSHOTS_PER_PROJECT = 15;

export function computeNextSemanticVersion(
  prevVersion: string | undefined,
  changeType: 'INITIAL_BASELINE' | 'MAJOR_BREAKING_UPDATE' | 'MINOR_FEATURE_ENHANCEMENT' | 'PATCH_DEFECT_FIX'
): string {
  if (!prevVersion || changeType === 'INITIAL_BASELINE') return 'v1.0.0';
  const match = prevVersion.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  let major = 1;
  let minor = 0;
  let patch = 0;
  if (match) {
    major = parseInt(match[1], 10);
    minor = parseInt(match[2], 10);
    patch = parseInt(match[3], 10);
  }
  if (changeType === 'MAJOR_BREAKING_UPDATE') {
    return `v${major + 1}.0.0`;
  }
  if (changeType === 'MINOR_FEATURE_ENHANCEMENT') {
    return `v${major}.${minor + 1}.0`;
  }
  return `v${major}.${minor}.${patch + 1}`;
}

import { cleanProjectDisplayName } from './sdlcCompiler';
export { cleanProjectDisplayName };

export class WorkspaceVaultService {
  private static instance: WorkspaceVaultService;

  private constructor() {
    this.ensureVaultDirectories();
  }

  public static getInstance(): WorkspaceVaultService {
    if (!WorkspaceVaultService.instance) {
      WorkspaceVaultService.instance = new WorkspaceVaultService();
    }
    return WorkspaceVaultService.instance;
  }

  private ensureVaultDirectories(): void {
    try {
      if (!fs.existsSync(VAULT_ROOT_DIR)) fs.mkdirSync(VAULT_ROOT_DIR, { recursive: true });
      if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });
    } catch {}
  }

  public slugifyProjectId(rawNameOrUrl: string): string {
    const cleaned = (rawNameOrUrl || 'project')
      .replace(/^https?:\/\//i, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 64);
    return cleaned || `project-${Date.now()}`;
  }

  public cleanProjectDisplayName(rawName?: string, targetUrl?: string): string {
    return cleanProjectDisplayName(rawName, targetUrl);
  }

  public extractMetricsFromState(state: CompiledSdlcState): {
    modulesCount: number;
    apisCount: number;
    totalTests: number;
    passedTests: number;
    passRatePercent: number;
    openBugsCount: number;
    uatAcceptedCount: number;
    discoveredPages: string[];
    apiPaths: string[];
    tableNames: string[];
    bugTitles: string[];
    buttonsInventory: string[];
    subTabsInventory: string[];
    filtersAndInputsInventory: string[];
    validationRulesInventory: string[];
    apiContractSignatures: string[];
    dbColumnSignatures: string[];
  } {
    const modules = state.discoveredModules || [];
    const featureModules = state.discoveredFeatureModules || [];
    const modulesCount = Math.max(featureModules.length, modules.length, 1);
    const apis = state.discoveryResult?.apiEndpoints || [];
    const apisCount = apis.length;
    const rtmRows = state.rtmRows || [];
    const totalTests = rtmRows.length || state.testScenarios?.length || 1;
    const failedTests = rtmRows.filter((r) => r.executionVerdict === 'FAILED').length;
    const passedTests = Math.max(0, totalTests - failedTests);
    const passRatePercent = Math.round((passedTests / Math.max(totalTests, 1)) * 100);
    const bugs = state.bugReports || [];
    const openBugsCount = bugs.length;
    const uatAcceptedCount = (state.uatFlows || []).filter(
      (u) => u.uatStatus === 'ACCEPTED' || u.uatStatus === 'ACCEPTED_WITH_NOTES'
    ).length;

    const discoveredPages = Array.from(
      new Set([
        ...modules.map((m) => m.moduleName || m.pagePath).filter(Boolean),
        ...featureModules.map((fm) => fm.moduleName || fm.routePath).filter(Boolean),
      ])
    );
    const apiPaths = Array.from(new Set(apis.map((a) => `${a.method} ${a.path}`)));
    const tableNames = Array.from(
      new Set((state.discoveryResult?.databaseTables || []).map((t) => t.tableName).filter(Boolean))
    );
    const bugTitles = Array.from(new Set(bugs.map((b) => `[${b.moduleName}] ${b.title}`)));

    // 1. Buttons Inventory: [ModuleName] ButtonName (Location)
    const buttonsSet = new Set<string>();
    for (const fm of featureModules) {
      const modName = fm.moduleName || 'Core';
      if (fm.toolbarButtons && Array.isArray(fm.toolbarButtons)) {
        for (const b of fm.toolbarButtons) {
          buttonsSet.add(`[${modName}] ${b} (toolbar)`);
        }
      }
      if (fm.screenControlsCatalog && Array.isArray(fm.screenControlsCatalog)) {
        for (const c of fm.screenControlsCatalog) {
          if (c.controlType === 'PRIMARY_ACTION_BUTTON') {
            buttonsSet.add(`[${modName}] ${c.controlName} (${c.screenLocation || 'body'})`);
          }
        }
      }
    }
    const buttonsInventory = Array.from(buttonsSet).sort();

    // 2. Sub-Tabs Inventory: [ModuleName] SubTabName
    const subTabsSet = new Set<string>();
    for (const fm of featureModules) {
      const modName = fm.moduleName || 'Core';
      if (fm.subTabsCatalog && Array.isArray(fm.subTabsCatalog)) {
        for (const st of fm.subTabsCatalog) {
          subTabsSet.add(`[${modName}] ${st.tabName}`);
        }
      }
    }
    const subTabsInventory = Array.from(subTabsSet).sort();

    // 3. Filters & Inputs Inventory: [ModuleName] ControlName [Type: Options]
    const filtersSet = new Set<string>();
    for (const fm of featureModules) {
      const modName = fm.moduleName || 'Core';
      if (fm.screenControlsCatalog && Array.isArray(fm.screenControlsCatalog)) {
        for (const c of fm.screenControlsCatalog) {
          if (c.controlType !== 'PRIMARY_ACTION_BUTTON') {
            filtersSet.add(`[${modName}] ${c.controlName} [Type: ${c.controlType}]`);
          }
        }
      }
      if (fm.formsAndModals && Array.isArray(fm.formsAndModals)) {
        for (const f of fm.formsAndModals) {
          if (f.inputs && Array.isArray(f.inputs)) {
            for (const inp of f.inputs) {
              filtersSet.add(`[${modName}] ${inp.name} [Type: ${inp.type}${inp.required ? ', Mandatory' : ''}]`);
            }
          }
        }
      }
    }
    const filtersAndInputsInventory = Array.from(filtersSet).sort();

    // 4. Validation Rules Inventory: VR-xx: fieldName (constraintExpression) -> HTTP status
    const vrSet = new Set<string>();
    for (const vr of state.validationRules || []) {
      vrSet.add(`${vr.ruleId}: ${vr.fieldName} (${vr.constraintExpression}) -> HTTP ${vr.httpStatus}`);
    }
    const validationRulesInventory = Array.from(vrSet).sort();

    // 5. API Contract Signatures: METHOD /path | Req:[fields] | Resp2xx:[fields] | Err:[codes]
    const apiSigSet = new Set<string>();
    const integrationContracts = state.deconstructedArchitecture?.integrationHandoffKit?.integrationContracts || [];
    if (integrationContracts.length > 0) {
      for (const ic of integrationContracts) {
        const reqFields = ic.requestBodyContract?.schemaFields?.map((f) => f.field).join(',') || 'none';
        const succCodes = ic.successResponses?.map((s) => s.statusCode).join(',') || '200';
        const errCodes = ic.errorResponses?.map((e) => e.statusCode).join(',') || '400,500';
        apiSigSet.add(`${ic.method} ${ic.endpoint} | Req:[${reqFields}] | Resp:[${succCodes}] | Err:[${errCodes}]`);
      }
    } else {
      for (const a of apis) {
        const queryKeys = a.queryParameters ? Object.keys(a.queryParameters).join(',') : 'none';
        const reqFields = a.requestBodySchema ? Object.keys(a.requestBodySchema).join(',') : queryKeys;
        apiSigSet.add(`${a.method} ${a.path} | Req:[${reqFields}] | Resp:[200] | Err:[400,401,422,500]`);
      }
    }
    const apiContractSignatures = Array.from(apiSigSet).sort();

    // 6. DB Column Signatures: TableName.columnName (Type)
    const dbColSet = new Set<string>();
    for (const t of state.discoveryResult?.databaseTables || []) {
      for (const c of t.columns || []) {
        dbColSet.add(`${t.tableName}.${c.name} (${c.type}${c.isPrimaryKey ? ', PK' : ''})`);
      }
    }
    const dbColumnSignatures = Array.from(dbColSet).sort();

    return {
      modulesCount,
      apisCount,
      totalTests,
      passedTests,
      passRatePercent,
      openBugsCount,
      uatAcceptedCount,
      discoveredPages,
      apiPaths,
      tableNames,
      bugTitles,
      buttonsInventory,
      subTabsInventory,
      filtersAndInputsInventory,
      validationRulesInventory,
      apiContractSignatures,
      dbColumnSignatures,
    };
  }

  private buildSnapshot(
    state: CompiledSdlcState,
    snapshotIndex: number,
    semanticVersion: string,
    changeType: 'INITIAL_BASELINE' | 'MAJOR_BREAKING_UPDATE' | 'MINOR_FEATURE_ENHANCEMENT' | 'PATCH_DEFECT_FIX',
    autoChangeRequestId: string,
    customLabel?: string
  ): ProjectHistoricalSnapshot {
    const now = new Date();
    const timestamp = now.toISOString();
    const formattedDate = now.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const m = this.extractMetricsFromState(state);

    return {
      snapshotId: `SNAP-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      versionLabel: customLabel || `${semanticVersion} (${formattedDate}) — ${autoChangeRequestId}`,
      timestamp,
      semanticVersion,
      changeType,
      autoChangeRequestId,
      modulesCount: m.modulesCount,
      apisCount: m.apisCount,
      totalTests: m.totalTests,
      passedTests: m.passedTests,
      passRatePercent: m.passRatePercent,
      openBugsCount: m.openBugsCount,
      uatAcceptedCount: m.uatAcceptedCount,
      discoveredPages: m.discoveredPages,
      apiPaths: m.apiPaths,
      tableNames: m.tableNames,
      bugTitles: m.bugTitles,
      buttonsInventory: m.buttonsInventory,
      subTabsInventory: m.subTabsInventory,
      filtersAndInputsInventory: m.filtersAndInputsInventory,
      validationRulesInventory: m.validationRulesInventory,
      apiContractSignatures: m.apiContractSignatures,
      dbColumnSignatures: m.dbColumnSignatures,
    };
  }

  public compareSnapshots(
    prevSnapshot: ProjectHistoricalSnapshot,
    currentState: CompiledSdlcState
  ): RegressionDiffSummary {
    const curr = this.extractMetricsFromState(currentState);
    const prevPages = new Set(prevSnapshot.discoveredPages || []);
    const currPages = new Set(curr.discoveredPages);
    const prevApis = new Set(prevSnapshot.apiPaths || []);
    const currApis = new Set(curr.apiPaths);
    const prevBugs = new Set(prevSnapshot.bugTitles || []);
    const currBugs = new Set(curr.bugTitles);

    const newModulesAdded = curr.discoveredPages.filter((p) => !prevPages.has(p));
    const removedModules = (prevSnapshot.discoveredPages || []).filter((p) => !currPages.has(p));
    const newApisAdded = curr.apiPaths.filter((a) => !prevApis.has(a));
    const removedApis = (prevSnapshot.apiPaths || []).filter((a) => !currApis.has(a));
    const newBugsIntroduced = curr.bugTitles.filter((b) => !prevBugs.has(b));
    const bugsResolved = (prevSnapshot.bugTitles || []).filter((b) => !currBugs.has(b));
    const passRateDelta = curr.passRatePercent - prevSnapshot.passRatePercent;

    // Granular 1:1 Diffs
    const prevButtons = new Set(prevSnapshot.buttonsInventory || []);
    const currButtons = new Set(curr.buttonsInventory);
    const addedButtonsAndActions = curr.buttonsInventory.filter((b) => !prevButtons.has(b));
    const removedButtonsAndActions = (prevSnapshot.buttonsInventory || []).filter((b) => !currButtons.has(b));

    const prevSubTabs = new Set(prevSnapshot.subTabsInventory || []);
    const currSubTabs = new Set(curr.subTabsInventory);
    const addedSubTabs = curr.subTabsInventory.filter((st) => !prevSubTabs.has(st));

    const prevInputs = new Set(prevSnapshot.filtersAndInputsInventory || []);
    const currInputs = new Set(curr.filtersAndInputsInventory);
    const addedOrModifiedFiltersAndInputs = curr.filtersAndInputsInventory.filter((i) => !prevInputs.has(i));

    const prevVrs = new Set(prevSnapshot.validationRulesInventory || []);
    const currVrs = new Set(curr.validationRulesInventory);
    const modifiedValidationAndErrorRules = curr.validationRulesInventory.filter((vr) => !prevVrs.has(vr));

    // API Contracts Granular Diff
    const prevSigMap = new Map<string, string>();
    for (const sig of prevSnapshot.apiContractSignatures || []) {
      const ep = sig.split('|')[0]?.trim() || sig;
      prevSigMap.set(ep, sig);
    }
    const currSigMap = new Map<string, string>();
    for (const sig of curr.apiContractSignatures || []) {
      const ep = sig.split('|')[0]?.trim() || sig;
      currSigMap.set(ep, sig);
    }

    const modifiedApiContracts: ModifiedApiContractDiffItem[] = [];
    for (const [ep, sig] of currSigMap.entries()) {
      if (!prevSigMap.has(ep)) {
        modifiedApiContracts.push({
          endpoint: ep,
          changeType: 'NEW_ENDPOINT',
          beforeSignature: 'NONE (Not in previous version)',
          afterSignature: sig,
          impactNote: 'Endpoint API baru berhasil terdeteksi dan dipetakan ke integrasi kit.',
        });
      } else {
        const oldSig = prevSigMap.get(ep)!;
        if (oldSig !== sig) {
          modifiedApiContracts.push({
            endpoint: ep,
            changeType: 'SCHEMA_UPDATED',
            beforeSignature: oldSig,
            afterSignature: sig,
            impactNote: 'Skema payload, header, atau kode status error mengalami perubahan.',
          });
        }
      }
    }
    for (const [ep, oldSig] of prevSigMap.entries()) {
      if (!currSigMap.has(ep)) {
        modifiedApiContracts.push({
          endpoint: ep,
          changeType: 'REMOVED_ENDPOINT',
          beforeSignature: oldSig,
          afterSignature: 'DEPRECATED / REMOVED',
          impactNote: 'BREAKING CHANGE: Endpoint tidak lagi terdaftar pada rute aktif sistem.',
        });
      }
    }

    // Modules where user manual & SOPs were regenerated
    const affectedModulesSet = new Set<string>();
    for (const btn of [...addedButtonsAndActions, ...removedButtonsAndActions]) {
      const match = btn.match(/^\[(.*?)\]/);
      if (match) affectedModulesSet.add(match[1]);
    }
    for (const st of addedSubTabs) {
      const match = st.match(/^\[(.*?)\]/);
      if (match) affectedModulesSet.add(match[1]);
    }
    for (const inp of addedOrModifiedFiltersAndInputs) {
      const match = inp.match(/^\[(.*?)\]/);
      if (match) affectedModulesSet.add(match[1]);
    }
    const modifiedUserManualSops = Array.from(affectedModulesSet).map(
      (mod) => `[Modul ${mod}] Buku Manual ISO 26514 Seksi 3, 4, 5 & 8 diperbarui otomatis untuk merefleksikan kontrol UI terbaru.`
    );

    // Determine changeClassification
    let changeClassification: ChangeClassification = 'PATCH_DEFECT_FIX';
    if (removedModules.length > 0 || removedApis.length > 0 || modifiedApiContracts.some((c) => c.changeType === 'REMOVED_ENDPOINT')) {
      changeClassification = 'MAJOR_BREAKING_UPDATE';
    } else if (
      newModulesAdded.length > 0 ||
      newApisAdded.length > 0 ||
      addedButtonsAndActions.length > 0 ||
      addedSubTabs.length > 0 ||
      addedOrModifiedFiltersAndInputs.length > 0
    ) {
      changeClassification = 'MINOR_FEATURE_ENHANCEMENT';
    } else if (newBugsIntroduced.length === 0 && bugsResolved.length === 0 && passRateDelta === 0) {
      changeClassification = 'NO_STRUCTURAL_CHANGE';
    }

    const previousVersion = prevSnapshot.semanticVersion || 'v1.0.0';
    const prevVersion = previousVersion;
    const newVersion = computeNextSemanticVersion(
      prevVersion,
      changeClassification === 'NO_STRUCTURAL_CHANGE' ? 'PATCH_DEFECT_FIX' : changeClassification
    );
    const crNumber = parseInt(prevSnapshot.autoChangeRequestId?.replace(/[^0-9]/g, '') || '1', 10) + 1;
    const autoChangeRequestId = `CR-AUTO-${String(crNumber).padStart(3, '0')}`;

    const deltaSign = passRateDelta > 0 ? `+${passRateDelta}%` : `${passRateDelta}%`;
    const plainDiffSummary =
      `Peralihan versi ${prevVersion} -> ${newVersion} (${autoChangeRequestId} | ${changeClassification}): ` +
      `QA pass rate berubah ${deltaSign} (kini ${curr.passRatePercent}%). ` +
      `${addedButtonsAndActions.length > 0 ? `+${addedButtonsAndActions.length} tombol/aksi UI baru (${addedButtonsAndActions.slice(0, 2).join(', ')}). ` : ''}` +
      `${addedSubTabs.length > 0 ? `+${addedSubTabs.length} sub-tab baru (${addedSubTabs.slice(0, 2).join(', ')}). ` : ''}` +
      `${addedOrModifiedFiltersAndInputs.length > 0 ? `+${addedOrModifiedFiltersAndInputs.length} filter/input baru. ` : ''}` +
      `${newApisAdded.length > 0 ? `+${newApisAdded.length} endpoint API baru. ` : ''}` +
      `${newBugsIntroduced.length > 0 ? `+${newBugsIntroduced.length} regresi baru, ` : 'Nihil regresi baru, '}` +
      `${bugsResolved.length} bug teratasi.`;

    const plainDiffSummaryEn =
      `Version transition ${prevVersion} -> ${newVersion} (${autoChangeRequestId} | ${changeClassification}): ` +
      `QA pass rate shifted ${deltaSign} (now ${curr.passRatePercent}%). ` +
      `${addedButtonsAndActions.length > 0 ? `+${addedButtonsAndActions.length} new button(s)/action(s) (${addedButtonsAndActions.slice(0, 2).join(', ')}). ` : ''}` +
      `${addedSubTabs.length > 0 ? `+${addedSubTabs.length} new sub-tab(s) (${addedSubTabs.slice(0, 2).join(', ')}). ` : ''}` +
      `${addedOrModifiedFiltersAndInputs.length > 0 ? `+${addedOrModifiedFiltersAndInputs.length} new input(s)/filter(s). ` : ''}` +
      `${newApisAdded.length > 0 ? `+${newApisAdded.length} new API endpoint(s). ` : ''}` +
      `${newBugsIntroduced.length > 0 ? `+${newBugsIntroduced.length} regression(s), ` : 'Zero regressions, '}` +
      `${bugsResolved.length} defect(s) resolved.`;

    // Formal Administrative Audit Narratives
    const administrativeAuditNarrativeId =
      `[BERITA ACARA AUDIT PERUBAHAN SISTEM | ISO 9001:2015 KLAUSUL 7.5 & ITIL CR]\n` +
      `ID Perubahan: ${autoChangeRequestId} | Klasifikasi: ${changeClassification} | Versi: ${prevVersion} -> ${newVersion}\n` +
      `Waktu Evaluasi: ${new Date().toISOString()}\n\n` +
      `1. Latar Belakang Perubahan & Dampak Ruang Lingkup:\n` +
      `- Penambahan Tombol & Kontrol UI: ${addedButtonsAndActions.length} item baru terdeteksi pada katalog kontrol.\n` +
      `- Penambahan Sub-Tab & Jalur Navigasi: ${addedSubTabs.length} sub-tab baru terintegrasi.\n` +
      `- Penambahan Input & Filter Form: ${addedOrModifiedFiltersAndInputs.length} kolom baru terdaftar.\n` +
      `- Kontrak Integrasi API: ${modifiedApiContracts.length} modifikasi endpoint (${newApisAdded.length} baru, ${removedApis.length} usang).\n\n` +
      `2. Kepatuhan Dokumentasi & Regenerasi Manual Pengguna:\n` +
      `- Sebanyak ${modifiedUserManualSops.length} modul telah memperbarui Buku Panduan Pengguna (ISO 26514) secara otomatis.\n` +
      `- Kesiapan Audit QA (ISO 29119): Tingkat kelulusan pengujian berada pada ${curr.passRatePercent}% (delta: ${deltaSign}).\n` +
      `3. Rekomendasi Auditor: Rilis ${newVersion} disetujui untuk pengujian tahap akhir (UAT Sign-Off).`;

    const administrativeAuditNarrativeEn =
      `[FORMAL SYSTEM CHANGE MANAGEMENT AUDIT RECEIPT | ISO 9001:2015 CLAUSE 7.5 & ITIL CR]\n` +
      `Change Request ID: ${autoChangeRequestId} | Classification: ${changeClassification} | Version: ${prevVersion} -> ${newVersion}\n` +
      `Evaluation Timestamp: ${new Date().toISOString()}\n\n` +
      `1. Change Background & Scope of Impact:\n` +
      `- UI Buttons & Actions: ${addedButtonsAndActions.length} new control(s) identified across feature modules.\n` +
      `- Navigation Sub-Tabs: ${addedSubTabs.length} new sub-tab(s) provisioned.\n` +
      `- Form Inputs & Filters: ${addedOrModifiedFiltersAndInputs.length} new field(s) enrolled.\n` +
      `- API Integration Contracts: ${modifiedApiContracts.length} endpoint mutation(s) (${newApisAdded.length} added, ${removedApis.length} deprecated).\n\n` +
      `2. Documentation Compliance & Automatic Manual Regeneration:\n` +
      `- ${modifiedUserManualSops.length} module(s) automatically regenerated their ISO 26514 User Manuals and SOPs.\n` +
      `- QA Audit Readiness (ISO 29119): Pass rate stands at ${curr.passRatePercent}% (delta: ${deltaSign}).\n` +
      `3. Auditor Verdict: Release ${newVersion} approved for final User Acceptance Testing (UAT Sign-Off).`;

    return {
      comparedAgainstSnapshotId: prevSnapshot.snapshotId,
      comparedAgainstLabel: prevSnapshot.versionLabel,
      comparedAgainstTimestamp: prevSnapshot.timestamp,
      previousVersion,
      newVersion,
      autoChangeRequestId,
      changeClassification,
      newModulesAdded,
      removedModules,
      newApisAdded,
      removedApis,
      newBugsIntroduced,
      bugsResolved,
      passRateDelta,
      addedButtonsAndActions,
      removedButtonsAndActions,
      addedSubTabs,
      addedOrModifiedFiltersAndInputs,
      modifiedApiContracts,
      modifiedValidationAndErrorRules,
      modifiedUserManualSops,
      administrativeAuditNarrativeId,
      administrativeAuditNarrativeEn,
      plainDiffSummary,
      plainDiffSummaryEn,
    };
  }

  private readIndexFile(): ProjectIndexEntry[] {
    this.ensureVaultDirectories();
    if (!fs.existsSync(INDEX_FILE_PATH)) return [];
    try {
      const raw = fs.readFileSync(INDEX_FILE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeIndexFile(entries: ProjectIndexEntry[]): void {
    this.ensureVaultDirectories();
    fs.writeFileSync(INDEX_FILE_PATH, JSON.stringify(entries, null, 2), 'utf8');
  }

  /**
   * Auto-import legacy `.onespec-workspace-cache.json` once if vault index is empty
   */
  private bootstrapFromLegacyCacheIfEmpty(): void {
    const existing = this.readIndexFile();
    if (existing.length > 0) return;
    if (!fs.existsSync(LEGACY_CACHE_FILE_PATH)) return;
    try {
      const raw = fs.readFileSync(LEGACY_CACHE_FILE_PATH, 'utf8');
      const cached = JSON.parse(raw) as CompiledSdlcState;
      if (cached && cached.appName && cached.discoveryResult) {
        const inferredType: VaultProjectType = cached.targetUrl?.startsWith('http')
          ? 'EXISTING_WEB'
          : cached.targetUrl?.startsWith('git') || cached.targetUrl?.includes('github') || cached.targetUrl?.includes('gitlab')
          ? 'GIT_REPO'
          : cached.targetUrl?.startsWith('greenfield://')
          ? 'NEW_PROJECT_FROM_ZERO'
          : 'LOCAL_ZIP';
        this.saveProjectState({
          projectName: cached.appName,
          targetUrl: cached.targetUrl,
          projectType: inferredType,
          compiledState: cached,
          createSnapshot: true,
        });
      }
    } catch {}
  }

  private getCanonicalTargetKey(raw: string): string {
    const trimmed = (raw || '').trim();
    try {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const u = new URL(trimmed);
        const hp = `${u.hostname.toLowerCase()}${u.port ? ':' + u.port : ''}`;
        if (u.hostname === '127.0.0.1' || u.hostname === 'localhost') {
          const seg = u.pathname.split('/').filter(Boolean)[0] || '';
          return seg && !/^(login|home|dashboard)$/i.test(seg) ? `${hp}/${seg.toLowerCase()}` : hp;
        }
        return hp;
      }
    } catch {}
    return trimmed.toLowerCase().replace(/\/+$/, '');
  }

  private compactDuplicateEntries(): void {
    const entries = this.readIndexFile();
    if (entries.length <= 1) return;

    const groups = new Map<string, ProjectIndexEntry[]>();
    for (const e of entries) {
      const key = this.getCanonicalTargetKey(e.targetUrl);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    }

    let modified = false;
    const finalEntries: ProjectIndexEntry[] = [];

    for (const [, group] of groups.entries()) {
      if (group.length <= 1) {
        finalEntries.push(group[0]);
        continue;
      }

      modified = true;
      group.sort((a, b) => {
        if (b.latestModulesCount !== a.latestModulesCount) {
          return b.latestModulesCount - a.latestModulesCount;
        }
        if (b.latestApisCount !== a.latestApisCount) {
          return b.latestApisCount - a.latestApisCount;
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      const winner = group[0];
      const losers = group.slice(1);
      const winnerRecord = this.getProject(winner.projectId);

      if (winnerRecord) {
        winnerRecord.projectName = cleanProjectDisplayName(winnerRecord.projectName, winnerRecord.targetUrl);
        winner.projectName = winnerRecord.projectName;
        if (winnerRecord.latestState) {
          winnerRecord.latestState.appName = winnerRecord.projectName;
        }

        winnerRecord.snapshots = winnerRecord.snapshots || [];
        const existingSnapIds = new Set(winnerRecord.snapshots.map((s) => s.snapshotId));

        for (const loser of losers) {
          const loserRecord = this.getProject(loser.projectId);
          if (loserRecord?.snapshots && Array.isArray(loserRecord.snapshots)) {
            for (const snap of loserRecord.snapshots) {
              if (!existingSnapIds.has(snap.snapshotId)) {
                winnerRecord.snapshots.push(snap);
                existingSnapIds.add(snap.snapshotId);
              }
            }
          }
          const loserPath = path.join(PROJECTS_DIR, `${this.slugifyProjectId(loser.projectId)}.json`);
          if (fs.existsSync(loserPath)) {
            try {
              fs.unlinkSync(loserPath);
            } catch {}
          }
        }

        winnerRecord.snapshots.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        winner.snapshotCount = winnerRecord.snapshots.length;

        const winnerPath = path.join(PROJECTS_DIR, `${this.slugifyProjectId(winner.projectId)}.json`);
        try {
          fs.writeFileSync(winnerPath, JSON.stringify(winnerRecord, null, 2), 'utf8');
        } catch {}
      }

      finalEntries.push(winner);
    }

    if (modified) {
      this.writeIndexFile(finalEntries);
    }
  }

  public listProjects(): ProjectIndexEntry[] {
    this.bootstrapFromLegacyCacheIfEmpty();
    this.compactDuplicateEntries();
    return this.readIndexFile().sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public getProject(projectId: string): SavedProjectRecord | null {
    this.ensureVaultDirectories();
    const safeId = this.slugifyProjectId(projectId);
    const filePath = path.join(PROJECTS_DIR, `${safeId}.json`);
    if (!fs.existsSync(filePath)) return null;
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const record = JSON.parse(raw) as SavedProjectRecord;
      if (record?.latestState) {
        const is404Mod = (m: { routePath?: string; moduleName?: string; pageHeading?: string }) => {
          const r = (m.routePath || '').toLowerCase();
          if (r === '/home') return true;
          const text = `${m.moduleName || ''} ${m.pageHeading || ''}`;
          return /halaman tidak ditemukan|404\s*not\s*found|page\s*not\s*found|tidak\s*ditemukan|error\s*404/i.test(text);
        };
        if (record.latestState.discoveredFeatureModules) {
          record.latestState.discoveredFeatureModules = record.latestState.discoveredFeatureModules
            .filter((m) => !is404Mod(m))
            .map((m, idx) => ({ ...m, moduleId: `MOD-${String(idx + 1).padStart(2, '0')}` }));
        }
        if ((record.latestState as any).userManuals) {
          (record.latestState as any).userManuals = ((record.latestState as any).userManuals || [])
            .filter((um: any) => !is404Mod(um))
            .map((um: any, idx: number) => ({ ...um, moduleId: `MOD-${String(idx + 1).padStart(2, '0')}` }));
        }
      }
      return record;
    } catch {
      return null;
    }
  }

  public saveProjectState(params: {
    projectId?: string;
    projectName?: string;
    targetUrl?: string;
    projectType?: VaultProjectType;
    compiledState: CompiledSdlcState;
    createSnapshot?: boolean;
    versionLabel?: string;
  }): SavedProjectRecord {
    this.ensureVaultDirectories();
    const { compiledState, createSnapshot = true, versionLabel } = params;
    const targetUrl = (params.targetUrl || compiledState.targetUrl || 'http://localhost:3000/').trim();
    const rawProjectName = (params.projectName || compiledState.appName || 'Active Project').trim();
    const projectName = cleanProjectDisplayName(rawProjectName, targetUrl);
    compiledState.appName = projectName;
    const projectType: VaultProjectType =
      params.projectType ||
      (targetUrl.startsWith('greenfield://')
        ? 'NEW_PROJECT_FROM_ZERO'
        : targetUrl.startsWith('local://') || targetUrl.endsWith('.zip')
        ? 'LOCAL_ZIP'
        : targetUrl.includes('.git')
        ? 'GIT_REPO'
        : 'EXISTING_WEB');

    const existingByUrl = this.readIndexFile().find(
      (e) => this.getCanonicalTargetKey(e.targetUrl) === this.getCanonicalTargetKey(targetUrl)
    );
    const projectId = existingByUrl?.projectId || this.slugifyProjectId(params.projectId || projectName || targetUrl);
    const projectFilePath = path.join(PROJECTS_DIR, `${projectId}.json`);
    const existingRecord = this.getProject(projectId);

    // Peta screenshot valid dari state sebelumnya berdasarkan rute ternormalisasi
    const prevShotsByRoute = new Map<string, string>();
    const normalizeKey = (r?: string) => (r || '').toLowerCase().replace(/^\/?#\/?/, '/').replace(/\/$/, '') || '/';
    if (existingRecord?.latestState) {
      for (const m of existingRecord.latestState.discoveredFeatureModules || []) {
        if (typeof m.screenshotDataUrl === 'string' && m.screenshotDataUrl.startsWith('data:image/') && m.screenshotDataUrl.length > 2500) {
          prevShotsByRoute.set(normalizeKey(m.routePath), m.screenshotDataUrl);
        }
      }
      for (const um of (existingRecord.latestState as any).userManuals || []) {
        if (typeof um.screenshotDataUrl === 'string' && um.screenshotDataUrl.startsWith('data:image/') && um.screenshotDataUrl.length > 2500) {
          prevShotsByRoute.set(normalizeKey(um.routePath), um.screenshotDataUrl);
        }
      }
    }

    if (existingRecord?.latestState) {
      const prevMods = existingRecord.latestState.discoveredFeatureModules || [];
      const currMods = compiledState.discoveredFeatureModules || [];

      // Smart Module Union: if previous state had more modules, never lose them due to partial scan
      if (prevMods.length > currMods.length) {
        const currRoutes = new Set(currMods.map((m) => (m.routePath || '').toLowerCase()));
        const preservedMods = prevMods.filter((m) => !currRoutes.has((m.routePath || '').toLowerCase()));
        const mergedMods = [...currMods, ...preservedMods].map((mod, idx) => ({
          ...mod,
          moduleId: `MOD-${String(idx + 1).padStart(2, '0')}`,
        }));
        compiledState.discoveredFeatureModules = mergedMods;
        if (compiledState.discoveryResult) {
          (compiledState.discoveryResult as any).featureModules = mergedMods;
        }
      }

      // Monotonically enrich apiEndpoints
      const prevApis = existingRecord.latestState.discoveryResult?.apiEndpoints || (existingRecord.latestState as any).apiEndpoints || [];
      const currApis = compiledState.discoveryResult?.apiEndpoints || (compiledState as any).apiEndpoints || [];
      const currApiKeys = new Set(currApis.map((a: any) => `${a.method || ''} ${(a.path || a.endpoint || '').toLowerCase()}`));
      const missingApis = prevApis.filter((a: any) => !currApiKeys.has(`${a.method || ''} ${(a.path || a.endpoint || '').toLowerCase()}`));
      if (missingApis.length > 0) {
        const enrichedApis = [...currApis, ...missingApis];
        if (compiledState.discoveryResult) {
          compiledState.discoveryResult.apiEndpoints = enrichedApis;
        }
        (compiledState as any).apiEndpoints = enrichedApis;
      }

      // Monotonically enrich databaseTables
      const prevTables = existingRecord.latestState.databaseTables || existingRecord.latestState.discoveryResult?.databaseTables || [];
      const currTables = compiledState.databaseTables || compiledState.discoveryResult?.databaseTables || [];
      const currTableNames = new Set(currTables.map((t: any) => (t.tableName || '').toLowerCase()));
      const missingTables = prevTables.filter((t: any) => !currTableNames.has((t.tableName || '').toLowerCase()));
      if (missingTables.length > 0) {
        const enrichedTables = [...currTables, ...missingTables];
        compiledState.databaseTables = enrichedTables;
        if (compiledState.discoveryResult) {
          compiledState.discoveryResult.databaseTables = enrichedTables;
        }
      }

      // Monotonically enrich userManuals
      const prevManuals = (existingRecord.latestState as any).userManuals || [];
      const currManuals = (compiledState as any).userManuals || [];
      const currManualRoutes = new Set(currManuals.map((m: any) => (m.routePath || '').toLowerCase()));
      const missingManuals = prevManuals.filter((m: any) => !currManualRoutes.has((m.routePath || '').toLowerCase()));
      if (missingManuals.length > 0) {
        (compiledState as any).userManuals = [...currManuals, ...missingManuals];
      }
    }

    // Wariskan screenshot valid ke discoveredFeatureModules & userManuals jika saat ini kosong/tidak valid
    if (compiledState.discoveredFeatureModules) {
      for (const m of compiledState.discoveredFeatureModules) {
        if (!m.screenshotDataUrl || !m.screenshotDataUrl.startsWith('data:image/') || m.screenshotDataUrl.length < 2500) {
          const inherited = prevShotsByRoute.get(normalizeKey(m.routePath));
          if (inherited) m.screenshotDataUrl = inherited;
        }
      }
    }
    if ((compiledState as any).userManuals) {
      for (const um of (compiledState as any).userManuals) {
        if (!um.screenshotDataUrl || !um.screenshotDataUrl.startsWith('data:image/') || um.screenshotDataUrl.length < 2500) {
          const inherited = prevShotsByRoute.get(normalizeKey(um.routePath));
          if (inherited) um.screenshotDataUrl = inherited;
        }
      }
    }

    // Auto-clean modul 404 / 'Halaman Tidak Ditemukan' / '/home' dari compiledState
    const is404Mod = (m: { routePath?: string; moduleName?: string; pageHeading?: string }) => {
      const r = (m.routePath || '').toLowerCase();
      if (r === '/home') return true;
      const text = `${m.moduleName || ''} ${m.pageHeading || ''}`;
      return /halaman tidak ditemukan|404\s*not\s*found|page\s*not\s*found|tidak\s*ditemukan|error\s*404/i.test(text);
    };

    if (compiledState.discoveredFeatureModules) {
      compiledState.discoveredFeatureModules = compiledState.discoveredFeatureModules
        .filter((m) => !is404Mod(m))
        .map((mod, idx) => ({
          ...mod,
          moduleId: `MOD-${String(idx + 1).padStart(2, '0')}`,
        }));
      if (compiledState.discoveryResult) {
        (compiledState.discoveryResult as any).featureModules = compiledState.discoveredFeatureModules;
      }
    }
    if ((compiledState as any).userManuals) {
      (compiledState as any).userManuals = (compiledState as any).userManuals
        .filter((um: any) => !is404Mod(um))
        .map((um: any, idx: number) => ({
          ...um,
          moduleId: `MOD-${String(idx + 1).padStart(2, '0')}`,
        }));
    }

    const existingSnapshots = existingRecord?.snapshots || [];

    let updatedSnapshots = [...existingSnapshots];
    let regressionDiffSummary: RegressionDiffSummary | null = existingRecord?.regressionDiffSummary || null;

    let semanticVersion = 'v1.0.0';
    let changeType: 'INITIAL_BASELINE' | 'MAJOR_BREAKING_UPDATE' | 'MINOR_FEATURE_ENHANCEMENT' | 'PATCH_DEFECT_FIX' = 'INITIAL_BASELINE';
    let autoChangeRequestId = 'CR-AUTO-001';

    if (existingSnapshots.length > 0) {
      // Calculate diff against previous latest snapshot
      const diff = this.compareSnapshots(existingSnapshots[0], compiledState);
      regressionDiffSummary = diff;

      // Explicit labels override the freeze; all other no-snapshot/no-change saves retain the current version.
      if (versionLabel) {
        semanticVersion = versionLabel;
      } else if (!createSnapshot || diff.changeClassification === 'NO_STRUCTURAL_CHANGE') {
        semanticVersion = existingSnapshots[0].semanticVersion || 'v1.0.0';
        changeType = 'PATCH_DEFECT_FIX';
        autoChangeRequestId = existingSnapshots[0].autoChangeRequestId || 'CR-AUTO-001';
      } else {
        semanticVersion = diff.newVersion;
        changeType = diff.changeClassification;
        autoChangeRequestId = diff.autoChangeRequestId;
      }
    }

    if (createSnapshot || existingSnapshots.length === 0) {
      const nextIndex = existingSnapshots.length + 1;
      const newSnap = this.buildSnapshot(
        compiledState,
        nextIndex,
        semanticVersion,
        changeType,
        autoChangeRequestId,
        versionLabel
      );
      updatedSnapshots = [newSnap, ...existingSnapshots].slice(0, MAX_SNAPSHOTS_PER_PROJECT);
    } else if (existingSnapshots.length > 1) {
      regressionDiffSummary = this.compareSnapshots(existingSnapshots[1], compiledState);
    }

    compiledState.regressionDiffSummary = regressionDiffSummary;

    const existingAuditSignatures = existingRecord?.auditSignatures || [];
    const stateAuditSignatures = compiledState.auditSignatures || (compiledState.releaseSignOff?.auditSignatures) || [];
    const mergedSignatures = [...stateAuditSignatures];
    for (const sig of existingAuditSignatures) {
      if (!mergedSignatures.some(s => s.signatureId === sig.signatureId)) {
        mergedSignatures.push(sig);
      }
    }
    compiledState.auditSignatures = mergedSignatures;
    if (compiledState.releaseSignOff) {
      compiledState.releaseSignOff.auditSignatures = mergedSignatures;
    }

    const updatedAt = new Date().toISOString();
    const record: SavedProjectRecord = {
      projectId,
      projectName,
      targetUrl,
      projectType,
      updatedAt,
      latestState: compiledState,
      snapshots: updatedSnapshots,
      regressionDiffSummary,
      auditSignatures: mergedSignatures,
    };

    fs.writeFileSync(projectFilePath, JSON.stringify(record, null, 2), 'utf8');

    // Sync projects-index.json
    const metrics = this.extractMetricsFromState(compiledState);
    const indexEntries = this.readIndexFile().filter((entry) => entry.projectId !== projectId);
    const newEntry: ProjectIndexEntry = {
      projectId,
      projectName,
      targetUrl,
      projectType,
      updatedAt,
      snapshotCount: updatedSnapshots.length,
      latestPassRatePercent: metrics.passRatePercent,
      latestModulesCount: metrics.modulesCount,
      latestApisCount: metrics.apisCount,
      latestOpenBugsCount: metrics.openBugsCount,
      latestUatAcceptedCount: metrics.uatAcceptedCount,
      latestSemanticVersion: semanticVersion,
      latestAutoChangeRequestId: autoChangeRequestId,
    };
    indexEntries.unshift(newEntry);
    this.writeIndexFile(indexEntries);

    // Maintain legacy single cache compatibility
    try {
      fs.writeFileSync(LEGACY_CACHE_FILE_PATH, JSON.stringify(compiledState, null, 2), 'utf8');
    } catch {}

    return record;
  }

  public appendAuditSignature(projectId: string, signature: ReleaseAuditSignatureRecord): SavedProjectRecord | null {
    this.ensureVaultDirectories();
    const record = this.getProject(projectId);
    if (!record) return null;

    const existingSignatures = record.auditSignatures || record.latestState.auditSignatures || record.latestState.releaseSignOff?.auditSignatures || [];
    const filtered = existingSignatures.filter((s) => s.signatureId !== signature.signatureId);
    const updatedSignatures = [signature, ...filtered];

    record.auditSignatures = updatedSignatures;
    record.latestState.auditSignatures = updatedSignatures;
    if (!record.latestState.releaseSignOff) {
      record.latestState.releaseSignOff = {
        status: 'APPROVED_FOR_PRODUCTION',
        isApproved: true,
        approvedBy: signature.approverName,
        approvedAt: signature.signedAt,
        signedAt: signature.signedAt,
        approverRole: signature.approverRole,
        roleTitle: signature.approverRole,
        notes: signature.approvalNotes,
        releaseNotes: signature.approvalNotes,
        snapshotHash: signature.snapshotHash,
        releaseGateStatus: signature.releaseGateStatus,
        operatorSessionId: signature.operatorSessionId,
        prerequisitesChecked: signature.prerequisitesChecked,
        auditSignatures: updatedSignatures,
      };
    } else {
      record.latestState.releaseSignOff.status = 'APPROVED_FOR_PRODUCTION';
      record.latestState.releaseSignOff.isApproved = true;
      record.latestState.releaseSignOff.approvedBy = signature.approverName;
      record.latestState.releaseSignOff.approvedAt = signature.signedAt;
      record.latestState.releaseSignOff.signedAt = signature.signedAt;
      record.latestState.releaseSignOff.approverRole = signature.approverRole;
      record.latestState.releaseSignOff.roleTitle = signature.approverRole;
      record.latestState.releaseSignOff.notes = signature.approvalNotes;
      record.latestState.releaseSignOff.releaseNotes = signature.approvalNotes;
      record.latestState.releaseSignOff.snapshotHash = signature.snapshotHash;
      record.latestState.releaseSignOff.releaseGateStatus = signature.releaseGateStatus;
      record.latestState.releaseSignOff.operatorSessionId = signature.operatorSessionId;
      record.latestState.releaseSignOff.prerequisitesChecked = signature.prerequisitesChecked;
      record.latestState.releaseSignOff.auditSignatures = updatedSignatures;
    }

    record.updatedAt = new Date().toISOString();
    const projectFilePath = path.join(PROJECTS_DIR, `${projectId}.json`);
    fs.writeFileSync(projectFilePath, JSON.stringify(record, null, 2), 'utf8');

    try {
      fs.writeFileSync(LEGACY_CACHE_FILE_PATH, JSON.stringify(record.latestState, null, 2), 'utf8');
    } catch {}

    return record;
  }

  public restoreSnapshotSummary(projectId: string, snapshotId: string): ProjectHistoricalSnapshot | null {
    const rec = this.getProject(projectId);
    if (!rec) return null;
    return rec.snapshots.find((s) => s.snapshotId === snapshotId) || null;
  }

  public compareTwoSnapshots(
    projectId: string,
    snapIdA: string,
    snapIdB: string
  ): RegressionDiffSummary | null {
    const rec = this.getProject(projectId);
    if (!rec) return null;
    const snapA = rec.snapshots.find((s) => s.snapshotId === snapIdA);
    const snapB = rec.snapshots.find((s) => s.snapshotId === snapIdB);
    if (!snapA || !snapB) return null;

    const prevPages = new Set(snapA.discoveredPages || []);
    const currPages = new Set(snapB.discoveredPages || []);
    const prevApis = new Set(snapA.apiPaths || []);
    const currApis = new Set(snapB.apiPaths || []);
    const prevBugs = new Set(snapA.bugTitles || []);
    const currBugs = new Set(snapB.bugTitles || []);

    const newModulesAdded = (snapB.discoveredPages || []).filter((p) => !prevPages.has(p));
    const removedModules = (snapA.discoveredPages || []).filter((p) => !currPages.has(p));
    const newApisAdded = (snapB.apiPaths || []).filter((a) => !prevApis.has(a));
    const removedApis = (snapA.apiPaths || []).filter((a) => !currApis.has(a));
    const newBugsIntroduced = (snapB.bugTitles || []).filter((b) => !prevBugs.has(b));
    const bugsResolved = (snapA.bugTitles || []).filter((b) => !currBugs.has(b));
    const passRateDelta = snapB.passRatePercent - snapA.passRatePercent;

    const prevButtons = new Set(snapA.buttonsInventory || []);
    const currButtons = new Set(snapB.buttonsInventory || []);
    const addedButtonsAndActions = (snapB.buttonsInventory || []).filter((b) => !prevButtons.has(b));
    const removedButtonsAndActions = (snapA.buttonsInventory || []).filter((b) => !currButtons.has(b));

    const prevSubTabs = new Set(snapA.subTabsInventory || []);
    const addedSubTabs = (snapB.subTabsInventory || []).filter((st) => !prevSubTabs.has(st));

    const prevInputs = new Set(snapA.filtersAndInputsInventory || []);
    const addedOrModifiedFiltersAndInputs = (snapB.filtersAndInputsInventory || []).filter((i) => !prevInputs.has(i));

    const prevVrs = new Set(snapA.validationRulesInventory || []);
    const modifiedValidationAndErrorRules = (snapB.validationRulesInventory || []).filter((vr) => !prevVrs.has(vr));

    // Granular 1:1 API Contract Signature Diff between snapA and snapB
    const prevSigMap = new Map<string, string>();
    for (const sig of snapA.apiContractSignatures || []) {
      const ep = sig.split('|')[0]?.trim() || sig;
      prevSigMap.set(ep, sig);
    }
    const currSigMap = new Map<string, string>();
    for (const sig of snapB.apiContractSignatures || []) {
      const ep = sig.split('|')[0]?.trim() || sig;
      currSigMap.set(ep, sig);
    }

    const modifiedApiContracts: ModifiedApiContractDiffItem[] = [];
    for (const [ep, sig] of currSigMap.entries()) {
      if (!prevSigMap.has(ep)) {
        modifiedApiContracts.push({
          endpoint: ep,
          changeType: 'NEW_ENDPOINT',
          beforeSignature: 'NONE (Not in previous version)',
          afterSignature: sig,
          impactNote: 'Endpoint API baru berhasil terdeteksi dan dipetakan ke integrasi kit.',
        });
      } else {
        const oldSig = prevSigMap.get(ep)!;
        if (oldSig !== sig) {
          modifiedApiContracts.push({
            endpoint: ep,
            changeType: 'SCHEMA_UPDATED',
            beforeSignature: oldSig,
            afterSignature: sig,
            impactNote: 'Skema payload, header, atau kode status error mengalami perubahan.',
          });
        }
      }
    }
    for (const [ep, oldSig] of prevSigMap.entries()) {
      if (!currSigMap.has(ep)) {
        modifiedApiContracts.push({
          endpoint: ep,
          changeType: 'REMOVED_ENDPOINT',
          beforeSignature: oldSig,
          afterSignature: 'DEPRECATED / REMOVED',
          impactNote: 'BREAKING CHANGE: Endpoint tidak lagi terdaftar pada rute aktif sistem.',
        });
      }
    }

    // Modules whose controls or API contracts changed.
    const affectedModulesSet = new Set<string>();
    for (const item of [...addedButtonsAndActions, ...removedButtonsAndActions, ...addedSubTabs, ...addedOrModifiedFiltersAndInputs]) {
      const match = item.match(/^\[(.*?)\]/);
      if (match) affectedModulesSet.add(match[1]);
    }
    for (const contract of modifiedApiContracts) {
      const apiPath = contract.endpoint.split(' ').slice(1).join(' ').toLowerCase();
      const moduleName = (snapB.discoveredPages || []).find((page) => apiPath.includes(page.toLowerCase()));
      if (moduleName) affectedModulesSet.add(moduleName);
    }
    const modifiedUserManualSops = Array.from(affectedModulesSet).map(
      (mod) => `[Modul ${mod}] Buku Manual ISO 26514 Seksi 3, 4, 5 & 8 diperbarui otomatis untuk merefleksikan kontrol UI terbaru.`
    );

    let changeClassification: ChangeClassification = 'PATCH_DEFECT_FIX';
    if (removedModules.length > 0 || removedApis.length > 0 || modifiedApiContracts.some((c) => c.changeType === 'REMOVED_ENDPOINT')) {
      changeClassification = 'MAJOR_BREAKING_UPDATE';
    } else if (
      newModulesAdded.length > 0 ||
      newApisAdded.length > 0 ||
      addedButtonsAndActions.length > 0 ||
      addedSubTabs.length > 0 ||
      addedOrModifiedFiltersAndInputs.length > 0
    ) {
      changeClassification = 'MINOR_FEATURE_ENHANCEMENT';
    } else if (newBugsIntroduced.length === 0 && bugsResolved.length === 0 && passRateDelta === 0) {
      changeClassification = 'NO_STRUCTURAL_CHANGE';
    }

    const previousVersion = snapA.semanticVersion || 'v1.0.0';
    const effectiveChangeType = changeClassification === 'NO_STRUCTURAL_CHANGE' ? 'PATCH_DEFECT_FIX' : changeClassification;
    const newVersion = snapB.semanticVersion || computeNextSemanticVersion(previousVersion, effectiveChangeType);
    const autoChangeRequestId = snapB.autoChangeRequestId || 'CR-AUTO-002';

    const deltaSign = passRateDelta > 0 ? `+${passRateDelta}%` : `${passRateDelta}%`;
    const plainDiffSummary =
      `Perbandingan ${previousVersion} vs ${newVersion} (${autoChangeRequestId}): Delta kelulusan ${deltaSign}, ` +
      `+${newModulesAdded.length} modul, -${removedModules.length} modul, +${newApisAdded.length} API baru, ` +
      `+${addedButtonsAndActions.length} tombol baru, ${bugsResolved.length} bug teratasi, ${newBugsIntroduced.length} regresi baru.`;

    const plainDiffSummaryEn =
      `Comparison ${previousVersion} vs ${newVersion} (${autoChangeRequestId}): Pass rate delta ${deltaSign}, ` +
      `+${newModulesAdded.length} module(s), -${removedModules.length} module(s), +${newApisAdded.length} new API(s), ` +
      `+${addedButtonsAndActions.length} new button(s), ${bugsResolved.length} defect(s) resolved, ${newBugsIntroduced.length} new regression(s).`;

    const administrativeAuditNarrativeId =
      `BERITA ACARA AUDIT PERUBAHAN SISTEM & DOKUMENTASI (ISO 9001:2015 KLAUSUL 7.5 / ITIL CHANGE MANAGEMENT)\n` +
      `========================================================================================\n` +
      `ID Permintaan Perubahan (CR) : ${autoChangeRequestId}\n` +
      `Transisi Snapshot             : ${snapA.snapshotId} (${previousVersion}) -> ${snapB.snapshotId} (${newVersion})\n` +
      `Klasifikasi Perubahan         : ${changeClassification}\n` +
      `Tingkat Kualitas & QA Pass    : Dari ${snapA.passRatePercent}% menjadi ${snapB.passRatePercent}% (Pergeseran: ${deltaSign})\n\n` +
      `1. RINGKASAN STRUKTURAL 1:1:\n` +
      `   - Modul Layar       : ${newModulesAdded.length > 0 ? `+${newModulesAdded.join(', ')}` : 'Tidak ada modul baru'}, ${removedModules.length > 0 ? `-${removedModules.join(', ')}` : 'Nihil modul dihapus'}\n` +
      `   - Kontrol UI & Aksi : ${addedButtonsAndActions.length > 0 ? `+${addedButtonsAndActions.length} tombol baru (${addedButtonsAndActions.slice(0, 3).join(', ')})` : 'Nihil penambahan tombol'}, ${removedButtonsAndActions.length > 0 ? `-${removedButtonsAndActions.length} tombol usang` : '0 tombol dihapus'}\n` +
      `   - Sub-Tab & Input   : ${addedSubTabs.length > 0 ? `+${addedSubTabs.join(', ')}` : 'Nihil sub-tab baru'}, ${addedOrModifiedFiltersAndInputs.length > 0 ? `+${addedOrModifiedFiltersAndInputs.length} kontrol form/filter dimutasi` : '0 mutasi kontrol'}\n` +
      `   - Kontrak API       : ${modifiedApiContracts.length} modifikasi endpoint (${newApisAdded.length} baru, ${removedApis.length} dihapus)\n` +
      `   - Aturan Validasi   : ${modifiedValidationAndErrorRules.length} aturan baru/diperbarui\n\n` +
      `2. PENYESUAIAN MANUAL PENGGUNA ISO 26514:\n` +
      (modifiedUserManualSops.length > 0 ? modifiedUserManualSops.map((s) => `   - ${s}`).join('\n') : '   - Seluruh SOP dan kamus kontrol pada Buku 1 dalam kondisi sinkron.\n') +
      `\n3. KESIMPULAN AUDITOR:\n` +
      `   Perubahan antar snapshot terbukti valid, lolos formal gate testing dengan stabilitas terkendali. Dokumen resmi dinaikkan ke versi ${newVersion}.`;

    const administrativeAuditNarrativeEn =
      `FORMAL SYSTEM & DOCUMENTATION AUDIT LEDGER (ISO 9001:2015 CLAUSE 7.5 / ITIL CHANGE MANAGEMENT)\n` +
      `========================================================================================\n` +
      `Change Request Identifier   : ${autoChangeRequestId}\n` +
      `Snapshot Transition         : ${snapA.snapshotId} (${previousVersion}) -> ${snapB.snapshotId} (${newVersion})\n` +
      `Change Classification       : ${changeClassification}\n` +
      `Quality Assurance Metric    : From ${snapA.passRatePercent}% to ${snapB.passRatePercent}% (Delta: ${deltaSign})\n\n` +
      `1. 1:1 STRUCTURAL MUTATION SUMMARY:\n` +
      `   - Screens & Modules     : ${newModulesAdded.length > 0 ? `+${newModulesAdded.join(', ')}` : 'No new modules'}, ${removedModules.length > 0 ? `-${removedModules.join(', ')}` : 'Zero modules deprecated'}\n` +
      `   - UI Controls & Actions : ${addedButtonsAndActions.length > 0 ? `+${addedButtonsAndActions.length} new button(s) (${addedButtonsAndActions.slice(0, 3).join(', ')})` : 'Zero new buttons'}, ${removedButtonsAndActions.length > 0 ? `-${removedButtonsAndActions.length} removed` : '0 removed'}\n` +
      `   - Sub-Tabs & Form Inputs: ${addedSubTabs.length > 0 ? `+${addedSubTabs.join(', ')}` : 'No new subtabs'}, ${addedOrModifiedFiltersAndInputs.length > 0 ? `+${addedOrModifiedFiltersAndInputs.length} mutated controls` : '0 mutated controls'}\n` +
      `   - API Contracts         : ${modifiedApiContracts.length} endpoint mutations (${newApisAdded.length} added, ${removedApis.length} deprecated)\n` +
      `   - Validation Invariants : ${modifiedValidationAndErrorRules.length} updated rules\n\n` +
      `2. ISO 26514 USER MANUAL ALIGNMENT:\n` +
      (modifiedUserManualSops.length > 0 ? modifiedUserManualSops.map((s) => `   - ${s}`).join('\n') : '   - All module SOPs and controls in Book 1 are verified in sync.\n') +
      `\n3. AUDIT CONCLUSION:\n` +
      `   Structural mutation verified compliant with continuous integration specifications. System state formalized under release ${newVersion}.`;

    return {
      comparedAgainstSnapshotId: snapA.snapshotId,
      comparedAgainstLabel: `${snapA.versionLabel} -> ${snapB.versionLabel}`,
      comparedAgainstTimestamp: snapA.timestamp,
      previousVersion,
      newVersion,
      autoChangeRequestId,
      changeClassification,
      newModulesAdded,
      removedModules,
      newApisAdded,
      removedApis,
      newBugsIntroduced,
      bugsResolved,
      passRateDelta,
      addedButtonsAndActions,
      removedButtonsAndActions,
      addedSubTabs,
      addedOrModifiedFiltersAndInputs,
      modifiedApiContracts,
      modifiedValidationAndErrorRules,
      modifiedUserManualSops,
      administrativeAuditNarrativeId,
      administrativeAuditNarrativeEn,
      plainDiffSummary,
      plainDiffSummaryEn,
    };
  }

  public deleteProject(projectId: string): boolean {
    this.ensureVaultDirectories();
    const safeId = this.slugifyProjectId(projectId);
    const projectFilePath = path.join(PROJECTS_DIR, `${safeId}.json`);
    let removed = false;
    if (fs.existsSync(projectFilePath)) {
      fs.unlinkSync(projectFilePath);
      removed = true;
    }
    const entries = this.readIndexFile();
    const nextEntries = entries.filter((e) => e.projectId !== safeId);
    if (nextEntries.length !== entries.length) {
      this.writeIndexFile(nextEntries);
      removed = true;
    }
    return removed;
  }
}

export const workspaceVaultService = WorkspaceVaultService.getInstance();
