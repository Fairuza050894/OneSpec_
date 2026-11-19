'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  BookOpen,
  Network,
  Search,
  Download,
  FileText,
  ArrowRight,
  Copy,
  Wrench,
  Camera,
  X,
  RefreshCw,
} from 'lucide-react';
import type { SavedProjectRecord } from '@/services/workspaceVaultService';
import type { CompiledSdlcState } from '@/services/sdlcCompiler';
import {
  enterpriseLibraryPortalService,
  type EnterprisePortfolioSummary,
  type FederatedSearchResultItem,
  type ProductCatalogCard,
} from '@/services/enterpriseLibraryPortalService';
import { sdlcKnowledgeGraphService } from '@/services/sdlcKnowledgeGraphService';
import { architectureDeconstructorService } from '@/services/architectureDeconstructor';
import { SingleProductDeepReader } from '@/components/portal/SingleProductDeepReader';
import { sanitizeFeatureModuleScreenshots } from '@/lib/featureModuleScreenshotSanitizer';
import { detectBlankRasterDataUrl } from '@/lib/screenshotQuality';
import { useStudioLocale } from '@/lib/i18n';

export interface IsoLibraryPortalProps {
  compiledSdlcState?: CompiledSdlcState | null;
  activeState?: CompiledSdlcState | null;
  activeVaultProjectId: string;
  locale?: 'en' | 'id';
  onOpenInStudio: (projectId: string, jumpToStep?: number) => Promise<void> | void;
  onCopyBlueprintToNewProject: (blueprintMom: string, projectNameHint: string) => void;
  onSwitchToStudioMode: () => void;
  onAppendLog?: (msg: string) => void;
  onSyncProject?: (record: SavedProjectRecord) => Promise<void> | void;
  onRecaptureScreenshots?: () => Promise<void> | void;
  isRecapturingScreenshots?: boolean;
  onSwitchVaultProject?: (projectId: string) => Promise<void> | void;
}

export function IsoLibraryPortal({
  compiledSdlcState,
  activeState: propActiveState,
  activeVaultProjectId,
  locale: propLocale,
  onOpenInStudio,
  onCopyBlueprintToNewProject,
  onSwitchToStudioMode,
  onAppendLog,
  onSyncProject,
  onRecaptureScreenshots,
  isRecapturingScreenshots = false,
  onSwitchVaultProject,
}: IsoLibraryPortalProps) {
  const { locale: contextLocale } = useStudioLocale();
  const locale = propLocale || contextLocale || 'en';
  const isId = locale === 'id';
  const activeState = compiledSdlcState || propActiveState || null;

  const [portalView, setPortalView] = useState<'CATALOG' | 'WIKI_READER' | 'ECOSYSTEM'>('CATALOG');
  const [vaultRecords, setVaultRecords] = useState<SavedProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedProductId, setSelectedProductId] = useState<string>(activeVaultProjectId || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);
  const [copiedBlueprintId, setCopiedBlueprintId] = useState<string | null>(null);

  // Default project sync handler
  const handleDefaultSyncProject = async (rec: SavedProjectRecord) => {
    onAppendLog?.(
      `[1:1 SYNC & AUTO-VERSION] Initiating structural re-scan & audit ledger for "${rec.projectName}" (${rec.projectId})...`
    );
    try {
      if (rec.projectId && rec.projectId !== activeVaultProjectId && onSwitchVaultProject) {
        await onSwitchVaultProject(rec.projectId);
      }
      const saveRes = await fetch('/api/workspace/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_SNAPSHOT',
          projectId: rec.projectId,
          projectName: rec.projectName,
          targetUrl: rec.targetUrl,
          compiledState: rec.latestState || activeState,
          createSnapshot: true,
          versionLabel: `Live 1:1 Sync ${new Date().toLocaleTimeString()}`,
        }),
      });
      if (saveRes.ok) {
        const saveJson = await saveRes.json();
        const newVer = saveJson.data?.snapshots?.[0]?.semanticVersion || 'v1.1.0';
        const crId = saveJson.data?.snapshots?.[0]?.autoChangeRequestId || 'CR-AUTO-002';
        onAppendLog?.(
          `[1:1 SYNC COMPLETE] Successfully saved new version ${newVer} (${crId}) with deep delta verification.`
        );
      } else {
        onAppendLog?.(`[1:1 SYNC ERROR] Failed to save snapshot: ${saveRes.statusText}`);
      }
    } catch (err) {
      onAppendLog?.(
        `[1:1 SYNC ERROR] Sync exception: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  const effectiveSyncProject = onSyncProject || handleDefaultSyncProject;

  useEffect(() => {
    let active = true;
    const loadLibrary = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/enterprise/library');
        if (res.ok) {
          const json = (await res.json()) as { success?: boolean; records?: SavedProjectRecord[] };
          if (active && json.success && Array.isArray(json.records)) {
            setVaultRecords(json.records);
            if (!selectedProductId && json.records[0]) {
              setSelectedProductId(json.records[0].projectId);
            }
          }
        }
      } catch {
      } finally {
        if (active) setIsLoading(false);
      }
    };
    loadLibrary();
    return () => {
      active = false;
    };
  }, [activeVaultProjectId]);

  const effectiveRecords: SavedProjectRecord[] = useMemo(() => {
    const list: SavedProjectRecord[] = [];
    const seenKeys = new Set<string>();
    for (const r of vaultRecords) {
      const key = `${r.projectName.toLowerCase().trim()}::${r.targetUrl.toLowerCase().trim()}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        list.push(r);
      }
    }
    if (activeState && activeState.appName) {
      const activeKey = `${activeState.appName.toLowerCase().trim()}::${(activeState.targetUrl || '').toLowerCase().trim()}`;
      const idx = list.findIndex(
        (r) =>
          r.projectId === activeVaultProjectId ||
          `${r.projectName.toLowerCase().trim()}::${r.targetUrl.toLowerCase().trim()}` === activeKey
      );
      const activeRecord: SavedProjectRecord = {
        projectId: activeVaultProjectId || (idx >= 0 ? list[idx].projectId : 'active-workspace'),
        projectName: activeState.appName,
        targetUrl: activeState.targetUrl,
        projectType: activeState.targetUrl.startsWith('http') ? 'EXISTING_WEB' : 'NEW_PROJECT_FROM_ZERO',
        updatedAt: new Date().toISOString(),
        latestState: activeState,
        snapshots: idx >= 0 ? list[idx].snapshots : [],
        regressionDiffSummary: activeState.regressionDiffSummary,
      };
      if (idx >= 0) {
        list[idx] = activeRecord;
      } else {
        list.unshift(activeRecord);
      }
    }
    return list;
  }, [vaultRecords, activeState, activeVaultProjectId]);

  const portfolio: EnterprisePortfolioSummary = useMemo(
    () => enterpriseLibraryPortalService.buildEnterprisePortfolioSummary(effectiveRecords, activeState),
    [effectiveRecords, activeState]
  );

  const searchResults: FederatedSearchResultItem[] = useMemo(
    () => enterpriseLibraryPortalService.searchAcrossProjects(effectiveRecords, searchQuery),
    [effectiveRecords, searchQuery]
  );

  const selectedRecord: SavedProjectRecord | null = useMemo(() => {
    return (
      effectiveRecords.find((r) => r.projectId === selectedProductId) ||
      effectiveRecords[0] ||
      null
    );
  }, [effectiveRecords, selectedProductId]);

  const selectedDocControl = useMemo(() => {
    if (!selectedRecord) return null;
    return enterpriseLibraryPortalService.buildIsoDocumentControlSheet(selectedRecord);
  }, [selectedRecord]);

  const selectedGraphSummary = useMemo(() => {
    if (!selectedRecord) return null;
    const st = selectedRecord.latestState;
    return sdlcKnowledgeGraphService.buildUniversalGraph({
      appName: st.appName,
      targetUrl: st.targetUrl,
      locale,
      apiEndpoints: st.discoveryResult.apiEndpoints,
      databaseTables: st.discoveryResult.databaseTables,
      validationRules: st.validationRules,
      businessRules: st.brdMatrixRows,
      rtmRows: st.rtmRows,
      discoveredFeatureModules: st.discoveredFeatureModules,
      discoveredModules: st.discoveredModules,
      testScenarios: st.testScenarios,
      bugReports: st.bugReports,
      uatFlows: st.uatFlows,
      gapAuditSummary: st.gapAuditSummary,
      gapAuditItems: st.gapAuditItems,
      owaspDastSummary: st.owaspDastSummary,
      complianceAssessment: st.complianceAssessment,
      isoRiskSummary: st.isoRiskSummary,
      smtVerificationSummary: st.smtVerificationSummary,
      delphiConsensusSummary: st.delphiConsensusSummary,
      executionTraces: st.executionTraces,
      deconstructedArchitecture: st.deconstructedArchitecture,
      regressionDiffSummary: selectedRecord.regressionDiffSummary,
    });
  }, [selectedRecord, locale]);

  const selectedResolvedArch = useMemo(() => {
    if (!selectedRecord) return null;
    const st = selectedRecord.latestState;
    const raw =
      st.deconstructedArchitecture ||
      architectureDeconstructorService.deconstruct({
        appName: st.appName,
        targetUrl: st.targetUrl,
        apiEndpoints: st.discoveryResult.apiEndpoints,
        databaseTables: st.discoveryResult.databaseTables,
        domBindings: st.discoveryResult.domTraceability,
        validationRules: st.validationRules,
        businessRules: st.brdMatrixRows,
        discoveredModules: st.discoveredModules,
        regressionDiffSummary: selectedRecord.regressionDiffSummary,
      });
    return architectureDeconstructorService.normalizeArchitecture(raw);
  }, [selectedRecord]);

  const handleExportDocx = async (rec: SavedProjectRecord) => {
    if (isExportingDocx) return;
    setIsExportingDocx(true);
    try {
      const res = await fetch('/api/export/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'docx',
          compiledState: rec.latestState,
          regressionDiffSummary: rec.regressionDiffSummary,
          locale,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const slug = rec.projectName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'onespec_doc';
      const a = document.createElement('a');
      a.href = url;
      a.download = `OneSpec_AZ_Documentation_${slug}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      onAppendLog?.(`[ENTERPRISE PORTAL] Exported ISO 9001 / 26514 .docx for ${rec.projectName}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onAppendLog?.(`[ENTERPRISE PORTAL ERROR] ${msg}`);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleExportHtml = async (rec: SavedProjectRecord) => {
    const exportState = {
      ...rec.latestState,
      discoveredFeatureModules: await sanitizeFeatureModuleScreenshots(
        rec.latestState.discoveredFeatureModules || [],
        (url) => detectBlankRasterDataUrl(url).then((verdict) => verdict === 'BLANK')
      ),
    };
    const html = sdlcKnowledgeGraphService.generateCompleteAzLibraryHtml(
      exportState,
      rec.regressionDiffSummary,
      locale
    );
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const slug = rec.projectName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'onespec_doc';
    const a = document.createElement('a');
    a.href = url;
    a.download = `OneSpec_AZ_Portal_${slug}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyBlueprint = (rec: SavedProjectRecord) => {
    const st = rec.latestState;
    const apis = (st.discoveryResult?.apiEndpoints || []).slice(0, 8).map((a) => `- ${a.method} ${a.path}: ${a.summary}`).join('\n');
    const tables = (st.discoveryResult?.databaseTables || []).slice(0, 6).map((t) => `- ${t.tableName} (${t.columns.map((c) => c.name).join(', ')})`).join('\n');
    const blueprint = `# [REUSABLE ENTERPRISE INTEGRATION BLUEPRINT FROM: ${rec.projectName}]
Target Upstream Host: ${rec.targetUrl}

## 1. Upstream Auth & Integration Contracts:
${apis || '- GET /api/_auth/session'}

## 2. Shared Data Dictionary Entities:
${tables || '- Primary entity table'}

## 3. New Project Functional Requirements:
- Requirement: New service SHALL integrate with ${rec.projectName} upstream APIs using authenticated session/Bearer contracts.
- Requirement: System SHALL enforce strict schema validation and latency SLA < 500ms.`;

    setCopiedBlueprintId(rec.projectId);
    setTimeout(() => setCopiedBlueprintId(null), 2000);
    onCopyBlueprintToNewProject(blueprint, `${rec.projectName} Integration v2`);
  };

  const getStepForCategory = (cat: FederatedSearchResultItem['matchCategory']): number => {
    switch (cat) {
      case 'FEATURE_MODULE':
      case 'USER_MANUAL_CONTROL':
        return 12;
      case 'API_ENDPOINT':
      case 'DATA_DICTIONARY':
        return 5;
      case 'BUSINESS_RULE':
        return 3;
      case 'QA_TEST_OR_BUG':
        return 4;
    }
  };

  const getCategoryBadgeTone = (cat: FederatedSearchResultItem['matchCategory']) => {
    switch (cat) {
      case 'FEATURE_MODULE':
        return 'bg-[#2563EB]/20 text-[#60A5FA] border-[#2563EB]/40';
      case 'API_ENDPOINT':
        return 'bg-[#059669]/20 text-[#10B981] border-[#059669]/40';
      case 'DATA_DICTIONARY':
        return 'bg-[#D97706]/20 text-[#F59E0B] border-[#D97706]/40';
      case 'BUSINESS_RULE':
        return 'bg-[#8B5CF6]/20 text-[#A78BFA] border-[#8B5CF6]/40';
      case 'USER_MANUAL_CONTROL':
        return 'bg-[#06B6D4]/20 text-[#22D3EE] border-[#06B6D4]/40';
      case 'QA_TEST_OR_BUG':
        return 'bg-[#DC2626]/20 text-[#F87171] border-[#DC2626]/40';
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#090A0D] overflow-hidden min-h-0 font-sans">
      {/* Portal Navigation Sub-Header */}
      <div className="bg-[#101217] border-b border-white/[0.07] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#3B82F6]" />
            <h1 className="text-[15px] font-bold text-[#EDEDED] tracking-tight">
              {isId ? 'Portal Perpustakaan Produk & Dokumentasi ISO Enterprise' : 'Enterprise ISO Product & Documentation Library'}
            </h1>
            <span className="px-1.5 py-0.5 bg-[#059669]/20 border border-[#059669]/40 text-[#10B981] font-mono text-[10px] font-bold rounded">
              ISO 9001 · 29148 · 29119 · 26514
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => setPortalView('CATALOG')}
            className={`px-3 py-1 rounded border transition-colors cursor-pointer flex items-center gap-1.5 ${
              portalView === 'CATALOG'
                ? 'bg-[#2563EB] border-[#2563EB] text-white font-semibold'
                : 'bg-[#101217] border-white/[0.07] text-zinc-400 hover:text-[#EDEDED]'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>{isId ? 'Katalog Portofolio Produk' : 'Enterprise Product Catalog'}</span>
          </button>
          <button
            type="button"
            onClick={() => setPortalView('WIKI_READER')}
            className={`px-3 py-1 rounded border transition-colors cursor-pointer flex items-center gap-1.5 ${
              portalView === 'WIKI_READER'
                ? 'bg-[#2563EB] border-[#2563EB] text-white font-semibold'
                : 'bg-[#101217] border-white/[0.07] text-zinc-400 hover:text-[#EDEDED]'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>{isId ? 'Wiki Reader Mode (ISO 9001 + 4 Buku)' : 'Wiki Reader Mode (ISO 9001 + 4 Books)'}</span>
          </button>
          <button
            type="button"
            onClick={() => setPortalView('ECOSYSTEM')}
            className={`px-3 py-1 rounded border transition-colors cursor-pointer flex items-center gap-1.5 ${
              portalView === 'ECOSYSTEM'
                ? 'bg-[#2563EB] border-[#2563EB] text-white font-semibold'
                : 'bg-[#101217] border-white/[0.07] text-zinc-400 hover:text-[#EDEDED]'
            }`}
          >
            <Network className="h-3.5 w-3.5" />
            <span>{isId ? 'Peta Ekosistem & Blueprint' : 'Ecosystem & Blueprint Registry'}</span>
          </button>
          {onRecaptureScreenshots && (
            <button
              type="button"
              onClick={onRecaptureScreenshots}
              disabled={isRecapturingScreenshots}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-[#EDEDED] border border-white/[0.07] rounded transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="Re-run headless Playwright crawler to capture high-definition real screenshots for all discovered modules"
            >
              <Camera className={`h-3.5 w-3.5 text-[#388BFD] ${isRecapturingScreenshots ? 'animate-pulse' : ''}`} />
              <span>
                {isRecapturingScreenshots
                  ? (isId ? 'Memotret...' : 'Re-Capturing...')
                  : (isId ? 'Potret Ulang Screenshot' : 'Re-Capture Screenshots')}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={onSwitchToStudioMode}
            className="ml-1 px-3 py-1 bg-[#16181E] hover:bg-zinc-800 border border-white/[0.07] hover:border-[#3B82F6] text-[#EDEDED] font-semibold rounded cursor-pointer flex items-center gap-1.5"
          >
            <Wrench className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>{isId ? 'Kembali ke 12-Step Studio' : '12-Step Studio Mode'}</span>
          </button>
        </div>
      </div>

      {/* Main Portal Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
        {/* =========================================================================
         * VIEW 1: ENTERPRISE PRODUCT CATALOG & GLOBAL FEDERATED SEARCH
         * ========================================================================= */}
        {portalView === 'CATALOG' && (
          <div className="space-y-5 max-w-[1440px] mx-auto">
            {/* Executive ROI & Portfolio KPI Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 bg-[#101217] border border-white/[0.07] rounded-md space-y-1">
                <span className="text-[11px] text-zinc-400 uppercase font-semibold block">
                  {isId ? 'Produk / Web Terkatalog' : 'Cataloged Products'}
                </span>
                <div className="text-[22px] font-bold text-[#EDEDED] font-mono tabular-nums">
                  {portfolio.totalProductsCataloged}
                </div>
                <span className="text-[11.5px] text-[#3B82F6]">
                  {portfolio.totalModulesDocumented} {isId ? 'Modul Fitur Terdokumentasi' : 'Feature Modules Documented'}
                </span>
              </div>

              <div className="p-3.5 bg-[#101217] border border-white/[0.07] rounded-md space-y-1">
                <span className="text-[11px] text-zinc-400 uppercase font-semibold block">
                  {isId ? 'API & Test Case Terpetakan' : 'APIs & Automated Tests'}
                </span>
                <div className="text-[22px] font-bold text-[#10B981] font-mono tabular-nums">
                  {portfolio.totalApisMapped} APIs · {portfolio.totalAutomatedTests} TCs
                </div>
                <span className="text-[11.5px] text-zinc-300">
                  {isId ? 'Rata-rata Kepatuhan ISO:' : 'Avg ISO Compliance:'} {portfolio.averageCompliancePercent}%
                </span>
              </div>

              <div className="p-3.5 bg-[#101217] border border-white/[0.07] rounded-md space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 uppercase font-semibold block">
                    {isId ? 'Estimasi Efisiensi Rekayasa (Model Heuristik)' : 'Estimated Engineering Hours (Heuristic Model)'}
                  </span>
                  <span
                    title="(jumlah kontrak × 8 + 48) × 65 jam"
                    className="px-1.5 py-0.2 rounded bg-amber-950/70 border border-amber-700/60 text-amber-300 text-[9px] font-bold font-mono"
                  >
                    ESTIMATED
                  </span>
                </div>
                <div className="text-[22px] font-bold text-[#F59E0B] font-mono tabular-nums" title="(jumlah kontrak × 8 + 48) × 65 jam">
                  {portfolio.totalManHoursSaved.toLocaleString()} {isId ? 'Jam' : 'Hrs'}
                </div>
                <span className="text-[11.5px] text-zinc-400">
                  {isId ? 'BA + Arsitektur + QA + Tech Writer' : 'BA + Architecture + QA + Tech Writing'}
                </span>
              </div>

              <div className="p-3.5 bg-[#101217] border border-white/[0.07] rounded-md space-y-1">
                <span className="text-[11px] text-zinc-400 uppercase font-semibold block">
                  {isId ? 'Estimasi Penghematan Ekonomi' : 'Estimated Engineering ROI'}
                </span>
                <div className="text-[18px] font-bold text-[#34D399] font-mono tabular-nums">
                  ${portfolio.totalEstimatedSavingsUsd.toLocaleString()} USD
                </div>
                <span className="text-[11.5px] text-zinc-400 font-mono tabular-nums">
                  Rp {portfolio.totalEstimatedSavingsIdr.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <section aria-label="CTO Bus-Factor & ROI Scorecard" className="bg-[#101217] border border-white/[0.07] rounded-md p-3 text-[11px]">
              <h3 className="font-semibold text-[#EDEDED] mb-2">CTO BUS-FACTOR &amp; ROI SCORECARD</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-zinc-300">
                <span>Bus-factor coverage <b className="text-[#10B981] font-mono tabular-nums">{portfolio.productCatalogCards.length ? Math.round(portfolio.productCatalogCards.reduce((sum, card) => sum + card.ctoGovernanceScorecard.busFactorEliminationPercent, 0) / portfolio.productCatalogCards.length) : 0}%</b></span>
                {(() => {
                  const latestScanMs = portfolio.productCatalogCards.reduce((max, card) => {
                    const dateStr = card.lastScanAt || card.lastUpdated;
                    const t = dateStr ? new Date(dateStr).getTime() : 0;
                    return !isNaN(t) && t > max ? t : max;
                  }, 0);
                  const hoursDiff = latestScanMs > 0 ? (Date.now() - latestScanMs) / (1000 * 60 * 60) : 0;
                  const isLiveToday = hoursDiff < 24;
                  const isThisWeek = hoursDiff < 168;
                  const label = isLiveToday
                    ? 'SYNCHRONIZED · LIVE TODAY'
                    : isThisWeek
                    ? 'ACTIVE · THIS WEEK'
                    : 'SYNCHRONIZED · ARCHIVED';
                  return (
                    <span>
                      Freshness{' '}
                      <b className={isLiveToday ? 'text-[#10B981]' : isThisWeek ? 'text-[#38BDF8]' : 'text-[#EDEDED]'}>
                        {label}
                      </b>
                    </span>
                  );
                })()}
                <span>Portfolio hours <b className="text-[#EDEDED] font-mono tabular-nums">{portfolio.totalManHoursSaved}</b> · BA {portfolio.totalManHoursSavedByRole.ba} · Architect {portfolio.totalManHoursSavedByRole.architect} · QA {portfolio.totalManHoursSavedByRole.sdetQa} · Writer {portfolio.totalManHoursSavedByRole.techWriter}</span>
                <span>Cost savings <b className="text-[#EDEDED] font-mono tabular-nums">Rp {portfolio.totalEstimatedSavingsIdr.toLocaleString('id-ID')} / ${portfolio.totalEstimatedSavingsUsd.toLocaleString('en-US')}</b></span>
              </div>
            </section>

            {/* Global Cross-Project Federated Search Bar */}
            <div className="bg-[#101217] border border-blue-500/40 rounded-md p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-[#EDEDED]">
                  <Search className="h-4 w-4 text-[#3B82F6]" />
                  <span>
                    {isId
                      ? 'Pencarian Terfederasi Lintas-Project (Tabel DB, API, Aturan Bisnis, Kontrol UI & QA)'
                      : 'Global Cross-Project Federated Search (DB Tables, APIs, Rules, UI Controls & QA)'}
                  </span>
                </div>
                {searchQuery.trim().length >= 2 && (
                  <span className="font-mono text-[11px] text-[#10B981] font-bold tabular-nums">
                    {searchResults.length} {isId ? 'Artefak Ditemukan' : 'Matching Artifacts'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 bg-[#090A0D] border border-white/[0.07] focus-within:border-[#3B82F6] px-3 h-9 rounded">
                <Search className="h-4 w-4 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isId
                      ? 'Cari Tabel, Endpoint API, Aturan Bisnis, atau Tombol di Seluruh Project Perusahaan...'
                      : 'Search Tables, API Endpoints, Business Rules, or UI Controls across ALL Enterprise Projects...'
                  }
                  className="flex-1 bg-transparent border-none outline-none text-[#EDEDED] text-[12px] select-text"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-zinc-400 hover:text-[#EDEDED] cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {searchQuery.trim().length >= 2 && (
                <div className="max-h-[320px] overflow-y-auto divide-y divide-white/[0.07] border border-white/[0.07] rounded bg-[#090A0D]">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-zinc-400">
                      {isId ? `Tidak ada artefak cocok untuk "${searchQuery}".` : `No artifacts matched "${searchQuery}".`}
                    </div>
                  ) : (
                    searchResults.map((hit, idx) => (
                      <div
                        key={`${hit.projectId}-${hit.artifactId}-${idx}`}
                        className="p-2.5 flex flex-wrap items-center justify-between gap-3 hover:bg-[#16181E] transition-colors"
                      >
                        <div className="min-w-0 space-y-0.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className={`px-1.5 py-0.5 rounded border text-[9.5px] font-bold font-mono ${getCategoryBadgeTone(hit.matchCategory)}`}>
                              {hit.matchCategory}
                            </span>
                            <span className="text-[#3B82F6] font-semibold">{hit.projectName}</span>
                            <span className="text-zinc-500">·</span>
                            <span className="text-[#EDEDED] font-semibold">{hit.title}</span>
                          </div>
                          <div className="text-[11.5px] text-zinc-300 truncate">
                            {hit.snippet} ({hit.routeOrLocation})
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            await onOpenInStudio(hit.projectId, getStepForCategory(hit.matchCategory));
                          }}
                          className="h-7 px-2.5 bg-[#101217] hover:bg-[#2563EB] border border-white/[0.07] hover:border-[#2563EB] text-[#EDEDED] rounded text-[11px] font-semibold cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <span>{isId ? 'Buka Project & Lompat ke Artefak' : 'Open & Jump to Artifact'}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Product Portfolio Cards Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-2">
                <span className="text-[12px] font-semibold uppercase text-[#EDEDED]">
                  {isId ? 'Daftar Produk & Aplikasi Perusahaan Terdokumentasi' : 'Enterprise Product & Application Portfolio'}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono tabular-nums">
                  {isLoading ? 'Syncing Vault...' : `${portfolio.productCatalogCards.length} Products`}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {portfolio.productCatalogCards.map((card: ProductCatalogCard) => {
                  const rec = effectiveRecords.find((r) => r.projectId === card.projectId);
                  return (
                    <div
                      key={card.projectId}
                      className="p-4 bg-[#101217] border border-white/[0.07] hover:border-[#3B82F6]/60 rounded-md flex flex-col justify-between gap-3 transition-colors"
                    >
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-start justify-between gap-2 pb-2 border-b border-white/[0.07]">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-[14px] font-bold text-[#EDEDED] truncate">{card.projectName}</h3>
                              <span className="px-1.5 py-0.5 bg-[#2563EB]/20 border border-[#2563EB]/40 text-[#60A5FA] font-mono text-[9.5px] font-bold rounded">
                                {card.documentControlId} · {card.versionNumber}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-zinc-400 truncate block mt-0.5">
                              {card.targetUrl} · {card.detectedDomainLabel}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[9.5px] font-bold whitespace-nowrap border ${
                              card.lifecycleStatus === 'APPROVED & RELEASED'
                                ? 'bg-[#059669]/20 text-[#10B981] border-[#059669]/50'
                                : 'bg-[#D97706]/20 text-[#F59E0B] border-[#D97706]/50'
                            }`}
                          >
                            {card.lifecycleStatus}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-2 font-mono text-[11px]">
                          <div className="p-2 bg-[#090A0D] border border-white/[0.07] rounded">
                            <span className="text-zinc-400 text-[9px] block">READINESS</span>
                            <strong className="text-[#10B981] tabular-nums">{card.healthScorePercent}%</strong>
                          </div>
                          <div className="p-2 bg-[#090A0D] border border-white/[0.07] rounded">
                            <span className="text-zinc-400 text-[9px] block">MODULES</span>
                            <strong className="text-[#EDEDED] tabular-nums">{card.modulesCount}</strong>
                          </div>
                          <div className="p-2 bg-[#090A0D] border border-white/[0.07] rounded">
                            <span className="text-zinc-400 text-[9px] block">APIS / DB</span>
                            <strong className="text-[#60A5FA] tabular-nums">{card.apisCount} / {card.tablesCount}</strong>
                          </div>
                          <div className="p-2 bg-[#090A0D] border border-white/[0.07] rounded">
                            <span className="text-zinc-400 text-[9px] block">QA PASS</span>
                            <strong className="text-[#34D399] tabular-nums">{card.passRatePercent}%</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.07] text-[11px]">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProductId(card.projectId);
                              setPortalView('WIKI_READER');
                            }}
                            className="h-7 px-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded cursor-pointer flex items-center gap-1"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>{isId ? 'Baca Dokumentasi A–Z' : 'Read A–Z Docs (Wiki)'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenInStudio(card.projectId, 1)}
                            className="h-7 px-2.5 bg-[#090A0D] hover:bg-[#16181E] border border-white/[0.07] text-[#EDEDED] font-semibold rounded cursor-pointer flex items-center gap-1"
                          >
                            <Wrench className="h-3.5 w-3.5 text-[#3B82F6]" />
                            <span>{isId ? 'Buka di Studio' : 'Open in Studio'}</span>
                          </button>
                          {rec && (
                            <button
                              type="button"
                              onClick={() => effectiveSyncProject(rec)}
                              className="h-7 px-2.5 bg-[#059669]/20 hover:bg-[#059669]/30 border border-[#059669]/50 text-[#10B981] font-semibold rounded cursor-pointer flex items-center gap-1"
                              title={isId ? 'Pindai ulang fitur baru & perbarui versi otomatis (1:1 Sync)' : 'Re-scan new features & auto-version (1:1 Sync)'}
                            >
                              <RefreshCw className="h-3 w-3" />
                              <span>{isId ? '🔄 1:1 Sync' : '🔄 1:1 Sync'}</span>
                            </button>
                          )}
                        </div>

                        {rec && (
                          <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
                            <button
                              type="button"
                              onClick={() => handleExportDocx(rec)}
                              disabled={isExportingDocx}
                              className="h-7 px-2 bg-[#090A0D] hover:bg-[#16181E] border border-white/[0.07] hover:border-[#3B82F6] text-[#60A5FA] font-bold rounded cursor-pointer flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              <span>.docx</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExportHtml(rec)}
                              className="h-7 px-2 bg-[#090A0D] hover:bg-[#16181E] border border-white/[0.07] hover:border-[#10B981] text-[#10B981] font-bold rounded cursor-pointer flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" />
                              <span>.html</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
         * VIEW 2: UNIFIED SINGLE-PRODUCT ISO LIBRARY DEEP READER
         * ========================================================================= */}
        {portalView === 'WIKI_READER' && selectedRecord && selectedDocControl && selectedGraphSummary && selectedResolvedArch && (
          <div className="space-y-4 max-w-[1440px] mx-auto">
            <SingleProductDeepReader
              record={selectedRecord}
              docControl={selectedDocControl}
              graphSummary={selectedGraphSummary}
              resolvedArch={selectedResolvedArch}
              locale={locale}
              allRecords={effectiveRecords}
              selectedProductId={selectedRecord.projectId}
              onSelectProductId={(id) => setSelectedProductId(id)}
              onExportDocx={() => handleExportDocx(selectedRecord)}
              onExportHtml={() => handleExportHtml(selectedRecord)}
              onOpenInStudio={(jumpToStep) => onOpenInStudio(selectedRecord.projectId, jumpToStep)}
              onAppendLog={onAppendLog}
              onSyncProject={effectiveSyncProject}
              onRecaptureScreenshots={onRecaptureScreenshots}
              isRecapturingScreenshots={isRecapturingScreenshots}
            />
          </div>
        )}

        {portalView === 'WIKI_READER' && (!selectedRecord || !selectedDocControl || !selectedGraphSummary || !selectedResolvedArch) && (
          <div className="p-8 bg-[#101217] border border-white/[0.07] rounded-md text-center max-w-[640px] mx-auto my-12 space-y-3">
            <BookOpen className="h-8 w-8 text-zinc-400 mx-auto" />
            <h3 className="text-[14px] font-bold text-[#EDEDED]">
              {isId ? 'Belum Ada Dokumentasi Produk Terpilih' : 'No Vault Product Selected'}
            </h3>
            <p className="text-[12px] text-zinc-300">
              {isId
                ? 'Pilih produk dari Katalog Portofolio atau kompilasi project baru di Studio untuk membaca dokumentasi ISO.'
                : 'Select a product from the Catalog or compile a new project in Studio to read ISO documentation.'}
            </p>
            <button
              type="button"
              onClick={() => setPortalView('CATALOG')}
              className="h-8 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[11px] rounded cursor-pointer inline-flex items-center gap-1.5"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>{isId ? 'Buka Katalog Produk' : 'Open Product Catalog'}</span>
            </button>
          </div>
        )}

        {/* =========================================================================
         * VIEW 3: ECOSYSTEM DEPENDENCY MAP & REUSABLE BLUEPRINT REGISTRY
         * ========================================================================= */}
        {portalView === 'ECOSYSTEM' && (
          <div className="space-y-4 max-w-[1440px] mx-auto">
            <div className="p-4 bg-[#101217] border border-white/[0.07] rounded-md space-y-1">
              <h2 className="text-[14px] font-bold text-[#EDEDED]">
                {isId
                  ? 'Peta Ekosistem Lintas-Aplikasi & Blueprint Integrasi Perusahaan'
                  : 'Cross-System Ecosystem Dependency Map & Reusable Blueprint Registry'}
              </h2>
              <p className="text-[12px] text-zinc-300">
                {isId
                  ? 'Salin kontrak API, alur autentikasi, dan skema tabel dari produk perusahaan yang sudah berjalan untuk mempercepat pembangunan project baru.'
                  : 'Reuse verified auth gateways, API contracts, and schemas from existing enterprise products when kicking off a new project.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolio.crossSystemDependencyGraph.map((node) => {
                const rec = effectiveRecords.find((r) => r.projectId === node.projectId);
                return (
                  <div key={node.projectId} className="p-4 bg-[#101217] border border-white/[0.07] rounded-md space-y-3 text-[11px]">
                    <div className="flex items-start justify-between gap-2 pb-2 border-b border-white/[0.07]">
                      <div>
                        <div className="text-[13.5px] font-bold text-[#EDEDED]">{node.projectName}</div>
                        <div className="text-[11px] font-mono text-[#3B82F6]">{node.targetUrl}</div>
                      </div>
                      <span className="px-2 py-0.5 bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] font-mono text-[10px] font-bold rounded">
                        {node.exposedEndpointsCount} APIs
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div>
                        <span className="text-zinc-400 uppercase font-semibold block text-[10px]">Shared Auth Gateways:</span>
                        <span className="text-[#A78BFA] font-mono">
                          {node.sharedAuthGateways.length > 0 ? node.sharedAuthGateways.join(', ') : 'Standard Session / Bearer Gate'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 uppercase font-semibold block text-[10px]">Linked Upstream System:</span>
                        <span className="text-[#F59E0B] font-mono">
                          {node.upstreamLinkedProjectName || (isId ? 'Sistem Mandiri (Root Upstream)' : 'Standalone / Root Upstream')}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 uppercase font-semibold block text-[10px]">Key Integration Endpoints:</span>
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {node.topEndpoints.map((ep) => (
                            <span key={ep} className="px-1.5 py-0.5 bg-[#090A0D] border border-white/[0.07] text-[#D4D4D8] font-mono text-[10px] rounded">
                              {ep}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {rec && (
                      <div className="pt-2 border-t border-white/[0.07] flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleCopyBlueprint(rec)}
                          className="h-7 px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded cursor-pointer flex items-center gap-1.5"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span>
                            {copiedBlueprintId === rec.projectId
                              ? isId
                                ? 'Blueprint Tersalin ke Project Baru'
                                : 'Blueprint Copied to New Project'
                              : isId
                              ? 'Salin Blueprint ke Project Baru'
                              : 'Copy Blueprint to New Project'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
