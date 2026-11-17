/**
 * OneSpec SDLC Workbench - Enterprise ISO Product, Web & Documentation Library Portal Service
 * Provides:
 * 1. ISO 9001:2015 Clause 7.5 Formal Document Control Sheet & Automated Revision History Ledger
 * 2. Global Cross-Project Federated Search Engine across Vault projects (modules, APIs, DB, rules, manuals, QA)
 * 3. Enterprise Portfolio Governance, Cross-System Dependency Map & ISO 5055 Executive ROI Metrics
 */

import type { SavedProjectRecord, VaultProjectType } from './workspaceVaultService';
import { computeUnifiedQualityMetrics, type CompiledSdlcState } from './sdlcCompiler';
import { domainLogicBrainService } from './domainLogicBrainService';
import { getEnvironmentLabel, maskTargetUrl, type EnvironmentLabel } from '@/lib/presentationSanitizer';

export interface IsoRevisionLedgerRow {
  version: string;
  date: string;
  author: string;
  modulesAndApisCount: string;
  qaPassRate: string;
  changeSummary: string;
}

export interface Iso9001DocumentControlSheet {
  documentControlId: string;
  projectId: string;
  projectName: string;
  targetUrl: string;
  versionNumber: string;
  lifecycleStatus: 'APPROVED & RELEASED' | 'IN TECHNICAL REVIEW' | 'WORKING DRAFT';
  classification: string;
  effectiveDate: string;
  nextReviewDate: string;
  preparedBy: string;
  approvedBy: string;
  revisionHistoryLedger: IsoRevisionLedgerRow[];
}

export type FederatedArtifactCategory =
  | 'FEATURE_MODULE'
  | 'API_ENDPOINT'
  | 'DATA_DICTIONARY'
  | 'BUSINESS_RULE'
  | 'USER_MANUAL_CONTROL'
  | 'QA_TEST_OR_BUG';

export interface FederatedSearchResultItem {
  projectId: string;
  projectName: string;
  targetUrl: string;
  matchCategory: FederatedArtifactCategory;
  artifactId: string;
  title: string;
  snippet: string;
  routeOrLocation: string;
}

export interface CrossSystemDependencyNode {
  projectId: string;
  projectName: string;
  targetUrl: string;
  sharedAuthGateways: string[];
  upstreamLinkedProjectName?: string | null;
  exposedEndpointsCount: number;
  topEndpoints: string[];
}

export interface ProductCatalogCard {
  projectId: string;
  projectName: string;
  targetUrl: string;
  projectType: VaultProjectType;
  detectedDomainLabel: string;
  documentControlId: string;
  versionNumber: string;
  lifecycleStatus: Iso9001DocumentControlSheet['lifecycleStatus'];
  healthScorePercent: number;
  deliveryReadinessPercent: number;
  auditCompliancePercent: number;
  qualityConfidencePercent: number;
  dataAsOf: string;
  environment: EnvironmentLabel;
  displayTargetUrl: string;
  owner: string;
  lastScanAt: string;
  lastScanAgeDays: number | null;
  freshnessStatus: 'FRESH' | 'STALE' | 'OVERDUE' | 'UNKNOWN';
  modulesCount: number;
  apisCount: number;
  tablesCount: number;
  testsCount: number;
  passRatePercent: number;
  openBugsCount: number;
  manHoursSaved: number;
  ctoGovernanceScorecard: {
    busFactorEliminationPercent: number;
    documentationFreshnessSla: string;
    manHoursSavedTotal: { ba: number; architect: number; sdetQa: number; techWriter: number };
    estimatedCostSavingsIdr: number;
    estimatedCostSavingsUsd: number;
    p0SmokeReadinessStatus: string;
  };
  lastUpdated: string;
}

export interface EnterprisePortfolioSummary {
  totalProductsCataloged: number;
  totalModulesDocumented: number;
  totalApisMapped: number;
  totalAutomatedTests: number;
  averageCompliancePercent: number;
  totalManHoursSaved: number;
  totalEstimatedSavingsIdr: number;
  totalEstimatedSavingsUsd: number;
  crossSystemDependencyGraph: CrossSystemDependencyNode[];
  productCatalogCards: ProductCatalogCard[];
  totalManHoursSavedByRole: { ba: number; architect: number; sdetQa: number; techWriter: number };
  totalP0SmokeTests: number;
}

export class EnterpriseLibraryPortalService {
  private static instance: EnterpriseLibraryPortalService;

  private constructor() {}

  public static getInstance(): EnterpriseLibraryPortalService {
    if (!EnterpriseLibraryPortalService.instance) {
      EnterpriseLibraryPortalService.instance = new EnterpriseLibraryPortalService();
    }
    return EnterpriseLibraryPortalService.instance;
  }

  public buildIsoDocumentControlSheet(
    projectOrState: SavedProjectRecord | CompiledSdlcState,
    explicitProjectId?: string
  ): Iso9001DocumentControlSheet {
    const isRecord = 'latestState' in projectOrState;
    const state = isRecord ? projectOrState.latestState : projectOrState;
    const projectId = isRecord
      ? projectOrState.projectId
      : explicitProjectId ||
        (state.appName || 'onespec')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') ||
        'onespec';
    const projectName = isRecord ? projectOrState.projectName : state.appName;
    const targetUrl = isRecord ? projectOrState.targetUrl : state.targetUrl;
    const snapshots = isRecord ? projectOrState.snapshots || [] : [];

    const idToken = projectId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'ONESPC';
    const documentControlId = `DOC-ONESPEC-${idToken}-2026`;
    const minorVer = Math.max(0, snapshots.length - 1);
    const versionNumber = `v1.${minorVer}.0`;

    const bugs = state.bugReports || [];
    const criticalBugs = bugs.filter((b) => b.severity === 'CRITICAL').length;
    const lifecycleStatus: Iso9001DocumentControlSheet['lifecycleStatus'] =
      state.releaseSignOff?.status === 'APPROVED_FOR_PRODUCTION' || (bugs.length === 0 && (state.rtmRows?.length || 0) > 0)
        ? 'APPROVED & RELEASED'
        : criticalBugs === 0
        ? 'IN TECHNICAL REVIEW'
        : 'WORKING DRAFT';

    const effectiveDate = (isRecord ? projectOrState.updatedAt : undefined) || new Date().toISOString();
    const nextReviewObj = new Date(effectiveDate);
    nextReviewObj.setMonth(nextReviewObj.getMonth() + 6);
    const nextReviewDate = nextReviewObj.toISOString();

    const revisionHistoryLedger: IsoRevisionLedgerRow[] = [];
    if (snapshots.length > 0) {
      // Snapshots are newest-first in vault; order oldest->newest for formal ISO revision table
      const ordered = [...snapshots].reverse();
      ordered.forEach((snap, idx) => {
        const prev = idx > 0 ? ordered[idx - 1] : null;
        let changeSummary = `Initial baseline compilation (${snap.versionLabel || 'Snapshot'})`;
        if (prev) {
          const prevMods = new Set(prev.discoveredPages || []);
          const addedMods = (snap.discoveredPages || []).filter((p) => !prevMods.has(p));
          const prevApis = new Set(prev.apiPaths || []);
          const addedApis = (snap.apiPaths || []).filter((a) => !prevApis.has(a));
          const deltaPass = snap.passRatePercent - prev.passRatePercent;
          const parts: string[] = [];
          if (addedMods.length > 0) parts.push(`+${addedMods.length} module(s)`);
          if (addedApis.length > 0) parts.push(`+${addedApis.length} API(s)`);
          if (deltaPass !== 0) parts.push(`${deltaPass > 0 ? '+' : ''}${deltaPass}% QA pass rate`);
          changeSummary = parts.length > 0 ? `${snap.versionLabel}: ${parts.join(', ')}` : `${snap.versionLabel}: Re-verified without drift`;
        }
        revisionHistoryLedger.push({
          version: `v1.${idx}.0`,
          date: snap.timestamp,
          author: state.releaseSignOff?.approvedBy || 'OneSpec Autonomous SDLC Engine',
          modulesAndApisCount: `${snap.modulesCount} Modules · ${snap.apisCount} APIs`,
          qaPassRate: `${snap.passedTests}/${snap.totalTests} (${snap.passRatePercent}%)`,
          changeSummary,
        });
      });
    } else {
      const modCnt = Math.max(state.discoveredFeatureModules?.length || 0, state.discoveredModules?.length || 0, 1);
      const apiCnt = state.discoveryResult?.apiEndpoints?.length || 0;
      const totTests = state.rtmRows?.length || 0;
      const failedTests = (state.rtmRows || []).filter((r) => r.executionVerdict === 'FAILED').length;
      const passedTests = Math.max(0, totTests - failedTests);
      const passRate = totTests > 0 ? Math.round((passedTests / totTests) * 100) : 100;
      revisionHistoryLedger.push({
        version: 'v1.0.0',
        date: effectiveDate,
        author: state.releaseSignOff?.approvedBy || 'OneSpec Autonomous SDLC Engine',
        modulesAndApisCount: `${modCnt} Modules · ${apiCnt} APIs`,
        qaPassRate: `${passedTests}/${totTests} (${passRate}%)`,
        changeSummary: 'Baseline ISO 9001 / 29148 / 29119 / 26514 Living Documentation Compilation',
      });
    }

    return {
      documentControlId,
      projectId,
      projectName,
      targetUrl,
      versionNumber,
      lifecycleStatus,
      classification: 'INTERNAL ENTERPRISE CONFIDENTIAL — ISO 9001 / 29148 / 29119 / 26514 CONTROLLED',
      effectiveDate,
      nextReviewDate,
      preparedBy: 'OneSpec Autonomous SDLC Engine & Lead BA/QA/Tech Writer',
      approvedBy: state.releaseSignOff?.approvedBy || 'Architecture & QA Review Board',
      revisionHistoryLedger,
    };
  }

  public searchAcrossProjects(
    records: SavedProjectRecord[],
    rawQuery: string
  ): FederatedSearchResultItem[] {
    const q = (rawQuery || '').trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const results: FederatedSearchResultItem[] = [];
    const seen = new Set<string>();
    const pushHit = (item: FederatedSearchResultItem) => {
      const k = `${item.projectId}::${item.matchCategory}::${item.artifactId}::${item.title}`;
      if (seen.has(k) || results.length >= 120) return;
      seen.add(k);
      results.push(item);
    };

    for (const rec of records) {
      const st = rec.latestState;
      if (!st) continue;

      // 1. FEATURE_MODULE & USER_MANUAL_CONTROL
      for (const fm of st.discoveredFeatureModules || []) {
        const modCorpus = `${fm.moduleName} ${fm.routePath} ${fm.pageHeading}`.toLowerCase();
        if (modCorpus.includes(q)) {
          pushHit({
            projectId: rec.projectId,
            projectName: rec.projectName,
            targetUrl: rec.targetUrl,
            matchCategory: 'FEATURE_MODULE',
            artifactId: fm.moduleId,
            title: `${fm.moduleName} (${fm.routePath})`,
            snippet: fm.pageHeading || `Feature screen on ${fm.routePath}`,
            routeOrLocation: fm.routePath,
          });
        }
        for (const ctrl of fm.screenControlsCatalog || []) {
          if (`${ctrl.controlName} ${ctrl.availableOptionsOrSample}`.toLowerCase().includes(q)) {
            pushHit({
              projectId: rec.projectId,
              projectName: rec.projectName,
              targetUrl: rec.targetUrl,
              matchCategory: 'USER_MANUAL_CONTROL',
              artifactId: ctrl.calloutNumber ? `PIN-#${ctrl.calloutNumber}` : fm.moduleId,
              title: `${ctrl.controlName} [${ctrl.controlType}]`,
              snippet: `${fm.moduleName} (${ctrl.screenLocation}) · ${ctrl.availableOptionsOrSample}`,
              routeOrLocation: fm.routePath,
            });
          }
        }
        for (const btn of fm.toolbarButtons || []) {
          if (btn.toLowerCase().includes(q)) {
            pushHit({
              projectId: rec.projectId,
              projectName: rec.projectName,
              targetUrl: rec.targetUrl,
              matchCategory: 'USER_MANUAL_CONTROL',
              artifactId: fm.moduleId,
              title: btn,
              snippet: `Toolbar action button in ${fm.moduleName}`,
              routeOrLocation: fm.routePath,
            });
          }
        }
      }

      // 2. API_ENDPOINT
      for (const ep of st.discoveryResult?.apiEndpoints || []) {
        if (`${ep.method} ${ep.path} ${ep.summary} ${ep.featureModule || ''}`.toLowerCase().includes(q)) {
          pushHit({
            projectId: rec.projectId,
            projectName: rec.projectName,
            targetUrl: rec.targetUrl,
            matchCategory: 'API_ENDPOINT',
            artifactId: ep.id,
            title: `${ep.method} ${ep.path}`,
            snippet: ep.summary || `Discovered endpoint (${ep.controllerPath})`,
            routeOrLocation: ep.path,
          });
        }
      }

      // 3. DATA_DICTIONARY
      for (const tbl of st.discoveryResult?.databaseTables || []) {
        const colMatch = tbl.columns.find((c) => `${c.name} ${c.type}`.toLowerCase().includes(q));
        if (tbl.tableName.toLowerCase().includes(q) || colMatch) {
          pushHit({
            projectId: rec.projectId,
            projectName: rec.projectName,
            targetUrl: rec.targetUrl,
            matchCategory: 'DATA_DICTIONARY',
            artifactId: tbl.id,
            title: colMatch ? `${tbl.tableName}.${colMatch.name}` : tbl.tableName,
            snippet: `Table ${tbl.tableName} (${tbl.columns.length} columns: ${tbl.columns.slice(0, 5).map((c) => c.name).join(', ')})`,
            routeOrLocation: `DB:${tbl.tableName}`,
          });
        }
      }

      // 4. BUSINESS_RULE & Validation
      for (const br of st.brdMatrixRows || []) {
        if (`${br.ruleId} ${br.statement} ${br.moduleName || ''}`.toLowerCase().includes(q)) {
          pushHit({
            projectId: rec.projectId,
            projectName: rec.projectName,
            targetUrl: rec.targetUrl,
            matchCategory: 'BUSINESS_RULE',
            artifactId: br.ruleId,
            title: `${br.ruleId} (${br.category})`,
            snippet: br.statement.slice(0, 180),
            routeOrLocation: br.moduleName || 'BRD',
          });
        }
      }
      for (const vr of st.validationRules || []) {
        if (`${vr.ruleId} ${vr.fieldName} ${vr.exactUiErrorString}`.toLowerCase().includes(q)) {
          pushHit({
            projectId: rec.projectId,
            projectName: rec.projectName,
            targetUrl: rec.targetUrl,
            matchCategory: 'BUSINESS_RULE',
            artifactId: vr.ruleId,
            title: `${vr.ruleId}: ${vr.fieldName}`,
            snippet: `${vr.constraintExpression} -> HTTP ${vr.httpStatus}`,
            routeOrLocation: 'PRD Validation',
          });
        }
      }

      // 5. QA_TEST_OR_BUG
      for (const tc of st.rtmRows || []) {
        if (`${tc.testId} ${tc.testTitle} ${tc.moduleName || ''} ${tc.expectedOutcome}`.toLowerCase().includes(q)) {
          pushHit({
            projectId: rec.projectId,
            projectName: rec.projectName,
            targetUrl: rec.targetUrl,
            matchCategory: 'QA_TEST_OR_BUG',
            artifactId: tc.testId,
            title: `${tc.testId}: ${tc.testTitle}`,
            snippet: `Expected: ${tc.expectedOutcome.slice(0, 120)}`,
            routeOrLocation: tc.pagePath || '/',
          });
        }
      }
      for (const bug of st.bugReports || []) {
        if (`${bug.bugId} ${bug.title} ${bug.moduleName}`.toLowerCase().includes(q)) {
          pushHit({
            projectId: rec.projectId,
            projectName: rec.projectName,
            targetUrl: rec.targetUrl,
            matchCategory: 'QA_TEST_OR_BUG',
            artifactId: bug.bugId,
            title: `${bug.bugId} [${bug.severity}]: ${bug.title}`,
            snippet: bug.actualResult.slice(0, 140),
            routeOrLocation: bug.featureUrl || '/',
          });
        }
      }
    }

    return results;
  }

  public buildEnterprisePortfolioSummary(
    records: SavedProjectRecord[],
    activeState?: CompiledSdlcState | null
  ): EnterprisePortfolioSummary {
    const mergedRecords: SavedProjectRecord[] = [...records];
    if (activeState && activeState.appName) {
      const exists = mergedRecords.some(
        (r) => r.projectName.toLowerCase() === activeState.appName.toLowerCase() || r.targetUrl === activeState.targetUrl
      );
      if (!exists) {
        mergedRecords.unshift({
          projectId: 'active-workspace',
          projectName: activeState.appName,
          targetUrl: activeState.targetUrl,
          projectType: activeState.targetUrl.startsWith('http') ? 'EXISTING_WEB' : 'NEW_PROJECT_FROM_ZERO',
          updatedAt: new Date().toISOString(),
          latestState: activeState,
          snapshots: [],
          regressionDiffSummary: activeState.regressionDiffSummary,
        });
      }
    }

    let totalModulesDocumented = 0;
    let totalApisMapped = 0;
    let totalAutomatedTests = 0;
    let complianceSum = 0;
    let totalManHoursSaved = 0;
    let totalP0SmokeTests = 0;
    const totalManHoursSavedByRole = { ba: 0, architect: 0, sdetQa: 0, techWriter: 0 };
    const productCatalogCards: ProductCatalogCard[] = [];
    const crossSystemDependencyGraph: CrossSystemDependencyNode[] = [];

    for (const rec of mergedRecords) {
      const st = rec.latestState;
      const docCtrl = this.buildIsoDocumentControlSheet(rec);
      const modulesCount = Math.max(st.discoveredFeatureModules?.length || 0, st.discoveredModules?.length || 0, 1);
      const apis = st.discoveryResult?.apiEndpoints || [];
      const apisCount = apis.length;
      const tablesCount = st.discoveryResult?.databaseTables?.length || 0;
      const qm = computeUnifiedQualityMetrics(st);
      const testsCount = qm.totalCases || st.testScenarios?.length || 0;
      const passRatePercent = qm.passRatePercent;
      const openBugsCount = (st.bugReports || []).filter((b) => b.status === 'OPEN').length;
      const compliancePct = st.complianceAssessment?.scorecard?.overallComplianceRate ?? st.gapAuditSummary?.complianceRatePercent ?? 85;
      const qualityConfidencePercent = qm.totalCases > 0 ? passRatePercent : (st.testScenarios?.length ? 85 : 0);
      const healthScorePercent = Math.round((qualityConfidencePercent * 0.65) + (compliancePct * 0.35));
      const lastScanAt = rec.updatedAt || docCtrl.effectiveDate || new Date(0).toISOString();
      const ageDaysRaw = (Date.now() - new Date(lastScanAt).getTime()) / 86_400_000;
      const lastScanAgeDays = Number.isFinite(ageDaysRaw) && ageDaysRaw >= 0 ? Math.floor(ageDaysRaw) : null;
      const freshnessStatus: ProductCatalogCard['freshnessStatus'] =
        lastScanAgeDays === null ? 'UNKNOWN' : lastScanAgeDays <= 7 ? 'FRESH' : lastScanAgeDays <= 30 ? 'STALE' : 'OVERDUE';
      const environment = getEnvironmentLabel(rec.targetUrl);
      const owner = docCtrl.approvedBy || docCtrl.preparedBy || (rec as SavedProjectRecord & { owner?: string }).owner || 'Unassigned';

      // ISO 5055 Engineering ROI Estimate: BA (2.5h/mod) + Arch (1.5h/table+api) + QA (0.6h/test) + Tech Writer (3.0h/mod manual)
      const manHoursSaved = Math.round(modulesCount * 5.5 + apisCount * 0.75 + tablesCount * 1.2 + testsCount * 0.5);
      const manHoursSavedTotal = {
        ba: Math.round(modulesCount * 2.5),
        architect: Math.round((tablesCount + apisCount) * 1.5),
        sdetQa: Math.round(testsCount * 0.6),
        techWriter: Math.round(modulesCount * 3),
      };
      const documentedUnits = modulesCount + apisCount + tablesCount + testsCount;
      const p0Count = (st.rtmRows || []).filter((row) => row.executionPriorityTier === 'P0_CRITICAL_SMOKE').length;

      totalModulesDocumented += modulesCount;
      totalApisMapped += apisCount;
      totalAutomatedTests += testsCount;
      complianceSum += compliancePct;
      totalManHoursSavedByRole.ba += manHoursSavedTotal.ba;
      totalManHoursSavedByRole.architect += manHoursSavedTotal.architect;
      totalManHoursSavedByRole.sdetQa += manHoursSavedTotal.sdetQa;
      totalManHoursSavedByRole.techWriter += manHoursSavedTotal.techWriter;
      totalP0SmokeTests += p0Count;
      totalManHoursSaved += manHoursSaved;

      const firstMod = st.discoveredFeatureModules?.[0];
      const domainPattern = firstMod ? domainLogicBrainService.classifyDomain(firstMod) : 'ENTERPRISE_CRUD_WORKFLOW';
      const domainLabel = domainPattern.replace(/_/g, ' ');

      productCatalogCards.push({
        projectId: rec.projectId,
        projectName: rec.projectName,
        targetUrl: rec.targetUrl,
        projectType: rec.projectType,
        detectedDomainLabel: domainLabel,
        documentControlId: docCtrl.documentControlId,
        versionNumber: docCtrl.versionNumber,
        lifecycleStatus: docCtrl.lifecycleStatus,
        healthScorePercent,
        deliveryReadinessPercent: healthScorePercent,
        auditCompliancePercent: compliancePct,
        qualityConfidencePercent,
        dataAsOf: lastScanAt,
        environment,
        displayTargetUrl: maskTargetUrl(rec.targetUrl, 'en'),
        owner,
        lastScanAt,
        lastScanAgeDays,
        freshnessStatus,
        modulesCount,
        apisCount,
        tablesCount,
        testsCount,
        passRatePercent,
        openBugsCount,
        manHoursSaved,
        ctoGovernanceScorecard: {
          busFactorEliminationPercent: Math.min(100, Math.round(compliancePct * 0.5 + (documentedUnits > 0 ? 50 : 0))),
          documentationFreshnessSla:
            freshnessStatus === 'UNKNOWN' ? 'NO SCAN TIMESTAMP' : `${freshnessStatus} · ${lastScanAgeDays}d SINCE LAST SCAN`,
          manHoursSavedTotal,
          estimatedCostSavingsIdr: manHoursSaved * 450000,
          estimatedCostSavingsUsd: manHoursSaved * 75,
          p0SmokeReadinessStatus: p0Count > 0 ? `${p0Count} P0 tests documented` : 'P0 tests not present',
        },
        lastUpdated: rec.updatedAt,
      });

      const sharedAuthGateways = Array.from(
        new Set(
          apis
            .map((a) => a.path)
            .filter((p) => /oauth2|oidc|token|_auth\/session|\/auth\//i.test(p))
            .slice(0, 4)
        )
      );

      crossSystemDependencyGraph.push({
        projectId: rec.projectId,
        projectName: rec.projectName,
        targetUrl: rec.targetUrl,
        sharedAuthGateways,
        upstreamLinkedProjectName: st.deconstructedArchitecture?.integrationHandoffKit?.upstreamLinkedProject?.projectName || null,
        exposedEndpointsCount: apisCount,
        topEndpoints: apis
          .filter((a) => Boolean((a.path || '').trim()))
          .slice(0, 4)
          .map((a) => `${(a.method || 'GET').toUpperCase()} ${a.path.trim()}`),
      });
    }

    const totalProductsCataloged = mergedRecords.length;
    const averageCompliancePercent = totalProductsCataloged > 0 ? Math.round(complianceSum / totalProductsCataloged) : 100;
    // Consulting/Engineering Blended Rate: $75/hr USD | Rp 450.000/hr IDR
    const totalEstimatedSavingsUsd = totalManHoursSaved * 75;
    const totalEstimatedSavingsIdr = totalManHoursSaved * 450000;

    return {
      totalProductsCataloged,
      totalModulesDocumented,
      totalApisMapped,
      totalAutomatedTests,
      averageCompliancePercent,
      totalManHoursSaved,
      totalManHoursSavedByRole,
      totalP0SmokeTests,
      totalEstimatedSavingsIdr,
      totalEstimatedSavingsUsd,
      crossSystemDependencyGraph,
      productCatalogCards,
    };
  }
}

export const enterpriseLibraryPortalService = EnterpriseLibraryPortalService.getInstance();
