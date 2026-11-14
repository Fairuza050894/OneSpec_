'use client';

import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Bug,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Compass,
  Database,
  Layers,
  RefreshCw,
  Search,
  ShieldCheck,
  Workflow,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import type { CompiledSdlcState } from '@/services/sdlcCompiler';
import type { RegressionDiffSummary } from '@/services/workspaceVaultService';
import {
  productKnowledgeAndMonitoringService,
  type ManagementBriefingReport,
  type WorkflowStage,
  type CrudMatrixRow,
  type FieldLineageMapping,
  type ModuleHealth,
} from '@/services/productKnowledgeAndMonitoringService';
import { domainLogicBrainService } from '@/services/domainLogicBrainService';
import { ModuleScreenshot } from '@/components/shared/ModuleScreenshot';
import { buildFeatureModuleBlueprintSvgDataUrl } from '@/lib/featureModuleBlueprint';

export interface ProductKnowledgeMonitorHubProps {
  compiledState: CompiledSdlcState | null;
  regressionDiff?: RegressionDiffSummary | null;
  locale?: 'en' | 'id';
}

type TabId = 'DIGITAL_TWIN' | 'DATA_LINEAGE' | 'BUG_AND_TEST_FACTORY' | 'EXECUTIVE_SRE' | 'ALL';
type IssueStatus = 'OPEN' | 'FIXED' | 'VERIFIED';

const statusTone: Record<string, string> = {
  NORMAL: 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40',
  WARNING: 'bg-amber-950/60 text-amber-300 border-amber-600/40',
  ERROR: 'bg-rose-950/60 text-rose-300 border-rose-600/40',
  CLEAN: 'bg-[#16191F] text-[#EDEDED] border-[#22262E]',
  FRONTEND_UI: 'bg-blue-950/60 text-blue-300 border-blue-600/40',
  BACKEND_API: 'bg-purple-950/60 text-purple-300 border-purple-600/40',
  DATABASE_SCHEMA: 'bg-amber-950/60 text-amber-300 border-amber-600/40',
  VALIDATION_RULE: 'bg-cyan-950/60 text-cyan-300 border-cyan-600/40',
};

function StatusBadge({ text, tone }: { text: string; tone?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 border rounded-[2px] font-mono text-[11px] font-semibold tracking-wide ${
        tone || 'bg-[#16191F] text-[#A1A1A1] border-[#22262E]'
      }`}
    >
      {text}
    </span>
  );
}

export function ProductKnowledgeMonitorHub({
  compiledState,
  regressionDiff,
  locale = 'id',
}: ProductKnowledgeMonitorHubProps) {
  const isId = locale === 'id';
  const [activeTab, setActiveTab] = useState<TabId>('DIGITAL_TWIN');
  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(0);
  const [selectedFactoryModIdx, setSelectedFactoryModIdx] = useState<number>(0);
  const [lineageQuery, setLineageQuery] = useState('');
  const [issueStatusOverrides, setIssueStatusOverrides] = useState<Record<string, IssueStatus>>({});
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const blueprint = useMemo(
    () => (compiledState ? productKnowledgeAndMonitoringService.buildProductKnowledgeBlueprint(compiledState) : null),
    [compiledState]
  );
  const board = useMemo(
    () =>
      compiledState
        ? productKnowledgeAndMonitoringService.buildBugAndIssueMonitoringBoard(compiledState, regressionDiff)
        : null,
    [compiledState, regressionDiff]
  );
  const briefing: ManagementBriefingReport | null = useMemo(
    () =>
      compiledState
        ? productKnowledgeAndMonitoringService.buildManagementBriefingReport(compiledState, regressionDiff)
        : null,
    [compiledState, regressionDiff]
  );
  const sreCard = useMemo(
    () => (compiledState ? productKnowledgeAndMonitoringService.buildSreAndCtoGovernanceScorecard(compiledState) : null),
    [compiledState]
  );

  const stages = blueprint?.endToEndWorkflowChain || [];
  const activeStage = stages[selectedStageIdx] || stages[0];
  const featureModules = compiledState?.discoveredFeatureModules || [];

  const matchedModule = useMemo(() => {
    if (!featureModules.length) return null;
    return (
      featureModules.find(
        (m) =>
          m.moduleName.toLowerCase() === (activeStage?.moduleName || '').toLowerCase() ||
          m.routePath === activeStage?.routePath
      ) || featureModules[selectedStageIdx] || featureModules[0]
    );
  }, [featureModules, activeStage, selectedStageIdx]);

  const matchedCrud = useMemo(() => {
    if (!blueprint || !matchedModule) return null;
    return blueprint.crudMatrixRows.find(
      (r) => r.moduleName.toLowerCase() === matchedModule.moduleName.toLowerCase()
    );
  }, [blueprint, matchedModule]);

  const matchedLineage = useMemo(() => {
    if (!blueprint || !matchedModule) return [];
    return blueprint.fieldLineageMappings.filter(
      (l) => l.moduleName.toLowerCase() === matchedModule.moduleName.toLowerCase()
    );
  }, [blueprint, matchedModule]);

  const matchedHealth = useMemo(() => {
    if (!board || !matchedModule) return null;
    return board.moduleHealthMonitor.find(
      (h) => h.moduleName.toLowerCase() === matchedModule.moduleName.toLowerCase()
    );
  }, [board, matchedModule]);

  const factoryMod = featureModules[selectedFactoryModIdx] || featureModules[0];
  const factoryIntel = useMemo(() => {
    if (!factoryMod || !compiledState) return null;
    return domainLogicBrainService.inferDomainIntelligence(factoryMod, {
      appName: compiledState.appName,
      targetUrl: compiledState.targetUrl,
    });
  }, [factoryMod, compiledState]);

  const syntheticBundle = factoryIntel?.syntheticTestDataFactory;

  const filteredLineage = useMemo(() => {
    if (!blueprint) return [];
    const query = lineageQuery.trim().toLowerCase();
    if (!query) return blueprint.fieldLineageMappings;
    return blueprint.fieldLineageMappings.filter((mapping) =>
      [
        mapping.moduleName,
        mapping.uiControl,
        mapping.apiJsonKey,
        mapping.databaseColumn,
        mapping.dataType,
        mapping.validationRule,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [blueprint, lineageQuery]);

  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedNotification(label);
      setTimeout(() => setCopiedNotification(null), 2500);
    }
  };

  if (!compiledState || !blueprint || !board || !briefing || !sreCard) {
    return (
      <div className="h-full flex items-center justify-center bg-[#111317] border border-[#22262E] rounded-[2px] p-8">
        <div className="text-center space-y-3 max-w-md">
          <Compass className="h-8 w-8 text-[#3B82F6] mx-auto animate-pulse" />
          <div className="font-mono text-sm font-bold text-[#EDEDED]">
            {isId ? 'Product Knowledge Hub Memerlukan Data Kompilasi SDLC' : 'Product Knowledge Hub Requires Compiled SDLC State'}
          </div>
          <div className="font-mono text-xs text-[#A1A1A1] leading-relaxed">
            {isId
              ? 'Jalankan Step 01–11 terlebih dahulu untuk menyusun alur kerja end-to-end, pemetaan data 3-lapis, dan metrik kesiapan produksi SRE.'
              : 'Execute Steps 01–11 to generate end-to-end workflows, 3-layer data mappings, and SRE production readiness metrics.'}
          </div>
        </div>
      </div>
    );
  }

  const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode; badge: string }> = [
    {
      id: 'DIGITAL_TWIN',
      label: isId ? 'Alur Kerja & Digital Twin' : 'Workflow & Digital Twin',
      icon: <Workflow className="h-3.5 w-3.5" />,
      badge: `${stages.length} ${isId ? 'Tahap' : 'Stages'}`,
    },
    {
      id: 'DATA_LINEAGE',
      label: isId ? 'Matriks CRUD & Lineage 3-Lapis' : 'CRUD & 3-Layer Lineage',
      icon: <Compass className="h-3.5 w-3.5" />,
      badge: `${filteredLineage.length} Fields`,
    },
    {
      id: 'BUG_AND_TEST_FACTORY',
      label: isId ? 'Triase Bug & Pabrik Uji QA' : 'Bug Triage & QA Test Factory',
      icon: <Bug className="h-3.5 w-3.5" />,
      badge: `${board.issueLifecycleTracker.persistingOpenIssues.length} ${isId ? 'Bug' : 'Bugs'}`,
    },
    {
      id: 'EXECUTIVE_SRE',
      label: isId ? 'Ringkasan Eksekutif & SRE' : 'Executive Brief & SRE PRR',
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      badge: `${sreCard.overallSreScore}% SRE`,
    },
    {
      id: 'ALL',
      label: isId ? 'Tampilkan Semua' : 'All Sections',
      icon: <Layers className="h-3.5 w-3.5" />,
      badge: isId ? 'Lengkap' : 'Full Flow',
    },
  ];

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#0B0C0E] border border-[#22262E] rounded-[2px] overflow-hidden">
      {/* Toast notification banner */}
      {copiedNotification && (
        <div className="shrink-0 px-3 py-2 bg-emerald-950/90 border-b border-emerald-500/60 text-emerald-200 text-xs font-mono font-medium flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>
              {isId ? 'Tersalin ke Clipboard:' : 'Copied to Clipboard:'} <strong>{copiedNotification}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCopiedNotification(null)}
            className="text-[11px] text-emerald-300 hover:text-white underline cursor-pointer"
          >
            {isId ? 'Tutup' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="shrink-0 px-3 py-2 bg-[#16191F] border-b border-[#22262E] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Compass className="h-4 w-4 text-[#3B82F6] shrink-0" />
          <span className="font-mono text-xs font-bold text-[#EDEDED] tracking-wide truncate">
            {isId ? 'PRODUCT KNOWLEDGE & EXECUTIVE COMMAND HUB' : 'PRODUCT KNOWLEDGE & EXECUTIVE COMMAND HUB'}
          </span>
          <span className="text-xs text-[#707070] font-mono truncate hidden sm:inline">
            · {compiledState.appName}
          </span>
          <StatusBadge
            text={board.overallOperationalStatus}
            tone={
              board.overallOperationalStatus.includes('KRITIS')
                ? statusTone.ERROR
                : board.overallOperationalStatus.includes('PERLU')
                ? statusTone.WARNING
                : statusTone.NORMAL
            }
          />
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              copyToClipboard(
                isId ? briefing.managementBriefingId : briefing.managementBriefingEn,
                isId ? 'Laporan Eksekutif Manajemen (WA / Email)' : 'Executive Briefing'
              )
            }
            className="h-7 px-2.5 rounded-[3px] bg-[#2563EB] hover:bg-blue-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
          >
            <ClipboardCopy className="h-3.5 w-3.5" />
            <span>{isId ? 'Copy Laporan Manajemen' : 'Copy Executive Report'}</span>
          </button>

          {compiledState.bugReports && compiledState.bugReports.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const allTickets = compiledState.bugReports!
                  .map((b) => productKnowledgeAndMonitoringService.buildDeveloperBugHandoverTicket(b, compiledState))
                  .join('\n\n----------------------------------------\n\n');
                copyToClipboard(
                  allTickets,
                  isId ? 'Semua Tiket Triase Bug Developer' : 'All Developer Bug Tickets'
                );
              }}
              className="h-7 px-2.5 rounded-[3px] bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/50 text-rose-200 font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Bug className="h-3.5 w-3.5 text-rose-400" />
              <span>
                {isId ? `Semua Tiket Bug (${compiledState.bugReports.length})` : `All Bug Tickets (${compiledState.bugReports.length})`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Segmented Control */}
      <div className="shrink-0 px-3 py-1.5 bg-[#0B0C0E] border-b border-[#22262E] flex flex-wrap items-center gap-1.5 font-mono text-xs overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`h-7 px-3 flex items-center gap-2 border rounded-[2px] transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#2563EB] border-[#2563EB] text-white font-bold shadow-sm'
                  : 'bg-[#111317] border-[#22262E] text-[#A1A1A1] hover:text-[#EDEDED] hover:bg-[#16191F]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-[2px] text-[10px] tabular-nums font-mono ${
                  isActive ? 'bg-white/20 text-white font-bold' : 'bg-[#16191F] text-[#707070] border border-[#22262E]'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Scrollable Work Area with smooth, full-height vertical scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6 pb-20 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-[#22262E] hover:[&::-webkit-scrollbar-thumb]:bg-[#333] [&::-webkit-scrollbar-thumb]:rounded-[2px]">
        {/* =========================================================================
         * SECTION 1: INTERACTIVE DIGITAL TWIN & END-TO-END WORKFLOW SIMULATOR
         * ========================================================================= */}
        {(activeTab === 'DIGITAL_TWIN' || activeTab === 'ALL') && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22262E] pb-2">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-400">
                <Workflow className="h-4 w-4" />
                <span>
                  {isId
                    ? 'SIMULATOR DIGITAL TWIN ALUR KERJA END-TO-END (INTERAKTIF)'
                    : 'INTERACTIVE DIGITAL TWIN END-TO-END WORKFLOW SIMULATOR'}
                </span>
              </div>
              <span className="font-mono text-xs text-[#707070] tabular-nums">
                {stages.length} {isId ? 'tahap alur terpetakan' : 'stages mapped'}
              </span>
            </div>

            {/* Stage Selector Stepper */}
            {stages.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {stages.map((st, idx) => {
                  const active = idx === selectedStageIdx;
                  return (
                    <button
                      key={`${st.stageNumber}-${st.moduleName}`}
                      type="button"
                      onClick={() => setSelectedStageIdx(idx)}
                      className={`h-8 px-3 rounded-[3px] text-xs font-medium cursor-pointer transition-colors border flex items-center gap-1.5 ${
                        active
                          ? 'bg-[#2563EB] text-white border-blue-400 font-semibold shadow-sm'
                          : 'bg-[#111317] text-[#A1A1A1] border-[#22262E] hover:text-white hover:bg-[#16191F]'
                      }`}
                    >
                      <span className="font-mono font-bold text-[11px] opacity-80">{st.stageNumber}.</span>
                      <span className="font-sans font-medium">{st.moduleName}</span>
                      <span className="font-mono text-[10px] text-[#707070] hidden md:inline">({st.routePath})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Split Screen Inspector: Left Visual Preview, Right Data Lineage */}
            {activeStage && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left: Screen Preview & Context */}
                <div className="lg:col-span-5 p-3.5 rounded-[3px] bg-[#111317] border border-[#22262E] space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-[#22262E] pb-2">
                    <span className="text-xs font-bold text-[#EDEDED] font-mono flex items-center gap-1.5 truncate">
                      <span>🖥️</span>
                      <span className="truncate">{activeStage.moduleName}</span>
                      <code className="text-blue-400 font-normal text-[11px]">{activeStage.routePath}</code>
                    </span>
                    <StatusBadge
                      text={matchedHealth?.healthBadge || 'NORMAL'}
                      tone={statusTone[matchedHealth?.healthBadge || 'NORMAL']}
                    />
                  </div>

                  {matchedModule?.screenshotDataUrl ? (
                    <div className="rounded-[3px] overflow-hidden border border-[#22262E] bg-black p-1">
                      <ModuleScreenshot
                        src={matchedModule.screenshotDataUrl}
                        blueprintDataUrl={buildFeatureModuleBlueprintSvgDataUrl({
                          moduleName: activeStage.moduleName,
                          routePath: activeStage.routePath,
                          pageHeading: activeStage.moduleName,
                        })}
                        alt={activeStage.moduleName}
                        className="w-full h-auto object-contain max-h-56 mx-auto rounded-[2px] bg-[#0F172A]"
                      />
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-[#707070] border border-dashed border-[#22262E] rounded-[3px] bg-[#0B0C0E]">
                      {isId
                        ? `Visual terpetakan dari struktur DOM & AST (${matchedModule?.screenControlsCatalog?.length || 0} kontrol aktif)`
                        : `Visual inferred from DOM AST structure (${matchedModule?.screenControlsCatalog?.length || 0} active controls)`}
                    </div>
                  )}

                  <div className="space-y-2 text-xs font-sans leading-relaxed">
                    <div className="p-2 rounded-[2px] bg-[#0B0C0E] border border-[#22262E]">
                      <div className="text-[11px] font-mono font-bold text-blue-400 mb-0.5">👤 {isId ? 'Aktor Pengguna' : 'Actor'}:</div>
                      <div className="text-[#EDEDED]">{activeStage.userActor}</div>
                    </div>
                    <div className="p-2 rounded-[2px] bg-[#0B0C0E] border border-[#22262E]">
                      <div className="text-[11px] font-mono font-bold text-amber-400 mb-0.5">🖱️ {isId ? 'Aksi di Layar' : 'User Action'}:</div>
                      <div className="text-[#A1A1A1]">{activeStage.whatUserDoes}</div>
                    </div>
                    <div className="p-2 rounded-[2px] bg-[#0B0C0E] border border-[#22262E]">
                      <div className="text-[11px] font-mono font-bold text-emerald-400 mb-0.5">⚙️ {isId ? 'Proses Sistem & API di Balik Layar' : 'Behind-the-Scenes API'}:</div>
                      <div className="text-[#A1A1A1] font-mono text-[11px]">{activeStage.whatSystemAndApiDoBehindTheScenes}</div>
                    </div>
                    <div className="p-2 rounded-[2px] bg-[#0B0C0E] border border-[#22262E]">
                      <div className="text-[11px] font-mono font-bold text-purple-400 mb-0.5">➡️ {isId ? 'Transisi Berikutnya' : 'Next Transition'}:</div>
                      <div className="text-[#A1A1A1]">{activeStage.nextStageTransition}</div>
                    </div>
                  </div>
                </div>

                {/* Right: Data Lineage for this stage */}
                <div className="lg:col-span-7 p-3.5 rounded-[3px] bg-[#111317] border border-[#22262E] flex flex-col space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22262E] pb-2">
                    <div className="text-xs font-bold text-[#EDEDED] font-mono">
                      🔗 {isId ? `Peta Koneksi Data System Analyst: "${activeStage.moduleName}"` : `System Analyst Data Lineage: "${activeStage.moduleName}"`}
                    </div>
                    <span className="text-[11px] font-mono text-[#707070]">UI ➔ API ➔ DB</span>
                  </div>

                  {/* Database Table CRUD Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {(matchedCrud?.entityPermissions || []).map((ep, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-[2px] bg-[#0B0C0E] border border-[#22262E] text-xs font-mono text-emerald-300 flex items-center gap-1.5"
                      >
                        <span>🗄️</span>
                        <strong>{ep.tableName}</strong>
                        <span className="text-amber-300">[{ep.crudFlags}]</span>
                        <span className="text-[#707070] text-[10.5px]">({ep.triggeredEndpoints.join(', ')})</span>
                      </span>
                    ))}
                    {(!matchedCrud || matchedCrud.entityPermissions.length === 0) && (
                      <span className="text-xs font-mono text-[#707070] italic">
                        {isId ? 'Tidak ada dependensi tabel DB langsung pada modul ini.' : 'No direct DB table dependency for this module.'}
                      </span>
                    )}
                  </div>

                  {/* Lineage Table for this active stage */}
                  <div className="flex-1 min-h-[220px] overflow-x-auto border border-[#22262E] rounded-[2px] bg-[#0B0C0E]">
                    <table className="w-full text-left border-collapse font-mono text-xs">
                      <thead className="sticky top-0 bg-[#16191F] text-[#A1A1A1] z-10">
                        <tr>
                          <th className="px-3 py-2 border-b border-[#22262E]">{isId ? 'Kontrol / Input UI' : 'UI Control / Input'}</th>
                          <th className="px-3 py-2 border-b border-[#22262E]">API JSON Key</th>
                          <th className="px-3 py-2 border-b border-[#22262E]">Tabel & Kolom DB</th>
                          <th className="px-3 py-2 border-b border-[#22262E]">{isId ? 'Aturan Validasi' : 'Validation Rule'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1A1D23]">
                        {matchedLineage.slice(0, 10).map((lin, idx) => (
                          <tr key={idx} className="hover:bg-[#16191F]/60">
                            <td className="px-3 py-2 text-[#EDEDED] font-sans font-medium">{lin.uiControl}</td>
                            <td className="px-3 py-2 text-blue-300 font-mono text-[11px]">{lin.apiJsonKey}</td>
                            <td className="px-3 py-2 text-amber-300 font-mono text-[11px]">
                              {lin.databaseColumn} <span className="text-[#707070]">({lin.dataType})</span>
                            </td>
                            <td className="px-3 py-2 text-emerald-300 font-mono text-[11px]">{lin.validationRule}</td>
                          </tr>
                        ))}
                        {matchedLineage.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-[#707070] italic">
                              {isId ? 'Belum ada relasi field spesifik terpetakan untuk modul ini.' : 'No specific field relation mapped for this module.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Full End-to-End Workflow Chain Table */}
            <div className="border border-[#22262E] rounded-[3px] bg-[#111317] overflow-hidden">
              <div className="px-3.5 py-2.5 bg-[#16191F] border-b border-[#22262E] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#60A5FA]">
                  <Workflow className="h-3.5 w-3.5" />
                  <span>{isId ? 'PETA ALUR KERJA APLIKASI END-TO-END LENGKAP' : 'END-TO-END APPLICATION WORKFLOW CHAIN'}</span>
                </div>
                <span className="font-mono text-xs text-[#707070] tabular-nums">
                  {blueprint.endToEndWorkflowChain.length} {isId ? 'tahap' : 'stages'}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse font-sans text-xs">
                  <thead>
                    <tr className="bg-[#0B0C0E] text-[#A1A1A1] font-mono text-[11px]">
                      <th className="px-3 py-2 border-b border-[#22262E] text-left w-12">#</th>
                      <th className="px-3 py-2 border-b border-[#22262E] text-left">{isId ? 'Tahap / Modul' : 'Stage / Module'}</th>
                      <th className="px-3 py-2 border-b border-[#22262E] text-left">{isId ? 'Aktor' : 'Actor'}</th>
                      <th className="px-3 py-2 border-b border-[#22262E] text-left">{isId ? 'Aksi Pengguna' : 'User Action'}</th>
                      <th className="px-3 py-2 border-b border-[#22262E] text-left">{isId ? 'Proses Sistem & API' : 'Behind-the-Scenes API'}</th>
                      <th className="px-3 py-2 border-b border-[#22262E] text-left">{isId ? 'Tabel DB' : 'DB Tables'}</th>
                      <th className="px-3 py-2 border-b border-[#22262E] text-left">{isId ? 'Transisi' : 'Next Transition'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1D23]">
                    {blueprint.endToEndWorkflowChain.map((stage) => (
                      <tr key={`${stage.stageNumber}-${stage.moduleName}`} className="hover:bg-[#16191F]/50 align-top">
                        <td className="px-3 py-2.5 font-mono text-[#3B82F6] font-bold tabular-nums">{stage.stageNumber}</td>
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-[#EDEDED]">{stage.stageTitle}</div>
                          <div className="font-mono text-[11px] text-[#707070]">{stage.moduleName} · {stage.routePath}</div>
                        </td>
                        <td className="px-3 py-2.5 text-[#A1A1A1]">{stage.userActor}</td>
                        <td className="px-3 py-2.5 text-[#A1A1A1]">{stage.whatUserDoes}</td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-[#A1A1A1]">{stage.whatSystemAndApiDoBehindTheScenes}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {stage.affectedDatabaseTables.map((table) => (
                              <StatusBadge key={table} text={table} tone="bg-[#0B0C0E] text-amber-300 border-[#78350F]" />
                            ))}
                            {stage.affectedDatabaseTables.length === 0 && (
                              <span className="text-[#707070] font-mono text-[11px]">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-[#707070] font-mono text-[11px]">{stage.nextStageTransition}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
         * SECTION 2: CRUD MATRIX & 3-LAYER SYSTEM ANALYST LINEAGE (UI ➔ API ➔ DB)
         * ========================================================================= */}
        {(activeTab === 'DATA_LINEAGE' || activeTab === 'ALL') && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22262E] pb-2">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-400">
                <Compass className="h-4 w-4" />
                <span>
                  {isId
                    ? 'MATRIKS CRUD & LINEAGE DATA 3-LAPIS (UI ➔ API ➔ TABEL DB)'
                    : 'CRUD MATRIX & 3-LAYER DATA LINEAGE (UI ➔ API ➔ DB TABLE)'}
                </span>
              </div>
              <span className="font-mono text-xs text-[#707070] tabular-nums">
                {filteredLineage.length} {isId ? 'kolom terpetakan' : 'fields mapped'}
              </span>
            </div>

            {/* 3-Layer System Analyst Lineage Table with live search filter */}
            <div className="border border-[#22262E] rounded-[3px] bg-[#111317] overflow-hidden">
              <div className="px-3.5 py-2.5 bg-[#16191F] border-b border-[#22262E] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-400">
                  <Database className="h-3.5 w-3.5" />
                  <span>{isId ? 'PEMETAAN DATA 3-LAPIS SYSTEM ANALYST (UI → API → DB)' : '3-LAYER SYSTEM ANALYST DATA MAPPING (UI → API → DB)'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 h-7 px-2.5 bg-[#0B0C0E] border border-[#22262E] rounded-[3px]">
                    <Search className="h-3.5 w-3.5 text-[#707070]" />
                    <input
                      type="text"
                      value={lineageQuery}
                      onChange={(e) => setLineageQuery(e.target.value)}
                      placeholder={isId ? 'Cari kontrol, API key, kolom DB, atau VR…' : 'Filter control, API key, DB column, VR…'}
                      className="w-[280px] bg-transparent outline-none font-mono text-xs text-[#EDEDED] placeholder:text-[#555]"
                    />
                    {lineageQuery && (
                      <button
                        type="button"
                        onClick={() => setLineageQuery('')}
                        className="text-[#707070] hover:text-white text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <span className="font-mono text-xs text-[#707070] tabular-nums">{filteredLineage.length} fields</span>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[460px]">
                <table className="w-full border-collapse font-sans text-xs">
                  <thead className="sticky top-0 bg-[#16191F] text-[#A1A1A1] font-mono text-[11px] z-10">
                    <tr>
                      <th className="px-3 py-2 border-b border-[#22262E] text-left">{isId ? 'Modul' : 'Module'}</th>
                      <th className="px-3 py-2 border-b border-[#22262E] text-left">{isId ? 'Kontrol UI' : 'UI Control'}</th>
                      <th className="px-3 py-2 border-b border-[#22262E] text-left">API JSON Key</th>
                      <th className="px-3 py-2 border-b border-[#22262E] text-left">Tabel & Kolom DB</th>
                      <th className="px-3 py-2 border-b border-[#22262E] text-left">{isId ? 'Tipe Data' : 'Data Type'}</th>
                      <th className="px-3 py-2 border-b border-[#22262E] text-left">{isId ? 'Aturan Validasi (VR)' : 'Validation Rule (VR)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1D23]">
                    {filteredLineage.map((mapping, idx) => (
                      <tr key={`${mapping.moduleId}-${mapping.uiControl}-${idx}`} className="hover:bg-[#16191F]/50">
                        <td className="px-3 py-2 font-mono text-[#A1A1A1]">{mapping.moduleName}</td>
                        <td className="px-3 py-2 font-semibold text-[#EDEDED]">{mapping.uiControl}</td>
                        <td className="px-3 py-2 font-mono text-blue-300 text-[11px]">{mapping.apiJsonKey}</td>
                        <td className="px-3 py-2 font-mono text-amber-300 text-[11px]">{mapping.databaseColumn}</td>
                        <td className="px-3 py-2 font-mono text-[#707070] text-[11px]">{mapping.dataType}</td>
                        <td className="px-3 py-2 font-mono text-emerald-300 text-[11px]">{mapping.validationRule}</td>
                      </tr>
                    ))}
                    {filteredLineage.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[#707070] font-mono text-xs">
                          {isId ? 'Tidak ada field yang cocok dengan filter pencarian.' : 'No field matches search filter.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* System Analyst CRUD Matrix Table */}
            <div className="border border-[#22262E] rounded-[3px] bg-[#111317] overflow-hidden">
              <div className="px-3.5 py-2.5 bg-[#16191F] border-b border-[#22262E] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-400">
                  <Database className="h-3.5 w-3.5" />
                  <span>{isId ? 'MATRIKS CRUD SYSTEM ANALYST (MODUL × TABEL DB)' : 'SYSTEM ANALYST CRUD MATRIX (MODULE × DB TABLE)'}</span>
                </div>
                <span className="font-mono text-xs text-[#707070] tabular-nums">
                  {blueprint.crudMatrixRows.reduce((sum, row) => sum + row.entityPermissions.length, 0)} {isId ? 'relasi' : 'relations'}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse font-sans text-xs">
                  <thead>
                    <tr className="bg-[#0B0C0E] text-[#A1A1A1] font-mono text-[11px]">
                      <th className="px-3 py-2 border-b border-[#22262E] text-left w-16">ID</th>
                      <th className="px-3 py-2 border-b border-[#22262E] text-left">{isId ? 'Modul' : 'Module'}</th>
                      <th className="px-3 py-2 border-b border-[#22262E] text-left">{isId ? 'Rute Path' : 'Route Path'}</th>
                      <th className="px-3 py-2 border-b border-[#22262E] text-left">{isId ? 'Tabel DB' : 'DB Table'}</th>
                      <th className="px-3 py-2 border-b border-[#22262E] text-left">CRUD</th>
                      <th className="px-3 py-2 border-b border-[#22262E] text-left">{isId ? 'Endpoint Pemicu' : 'Triggered Endpoints'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1D23]">
                    {blueprint.crudMatrixRows.flatMap((row) =>
                      row.entityPermissions.length > 0
                        ? row.entityPermissions.map((permission) => (
                            <tr key={`${row.moduleId}-${permission.tableName}`} className="hover:bg-[#16191F]/50">
                              <td className="px-3 py-2 font-mono text-[#3B82F6] tabular-nums font-bold">{row.moduleId}</td>
                              <td className="px-3 py-2 font-semibold text-[#EDEDED]">{row.moduleName}</td>
                              <td className="px-3 py-2 font-mono text-[#707070] text-[11px]">{row.routePath}</td>
                              <td className="px-3 py-2 font-mono text-amber-300 font-bold">{permission.tableName}</td>
                              <td className="px-3 py-2">
                                <StatusBadge
                                  text={permission.crudFlags}
                                  tone={
                                    permission.crudFlags.includes('D')
                                      ? statusTone.ERROR
                                      : permission.crudFlags.includes('U')
                                      ? statusTone.WARNING
                                      : statusTone.NORMAL
                                  }
                                />
                              </td>
                              <td className="px-3 py-2 font-mono text-[#A1A1A1] text-[11px]">
                                {permission.triggeredEndpoints.join('; ') || '-'}
                              </td>
                            </tr>
                          ))
                        : [
                            <tr key={`${row.moduleId}-none`} className="hover:bg-[#16191F]/50">
                              <td className="px-3 py-2 font-mono text-[#3B82F6] tabular-nums font-bold">{row.moduleId}</td>
                              <td className="px-3 py-2 font-semibold text-[#EDEDED]">{row.moduleName}</td>
                              <td className="px-3 py-2 font-mono text-[#707070] text-[11px]">{row.routePath}</td>
                              <td className="px-3 py-2 text-[#707070] font-mono italic" colSpan={3}>
                                {isId ? 'Tidak ada relasi tabel DB terbukti pada pemindaian ini.' : 'No table relation evidenced in this scan.'}
                              </td>
                            </tr>,
                          ]
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
         * SECTION 3: BUG TRIAGE HANDOVER & SYNTHETIC QA TEST DATA FACTORY
         * ========================================================================= */}
        {(activeTab === 'BUG_AND_TEST_FACTORY' || activeTab === 'ALL') && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22262E] pb-2">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-rose-400">
                <Bug className="h-4 w-4" />
                <span>
                  {isId
                    ? 'TRIASE BUG DEVELOPER 1-KLIK & PABRIK DATA UJI SINTETIS (ISO 29119-5)'
                    : '1-CLICK DEVELOPER BUG TRIAGE & SYNTHETIC TEST DATA FACTORY (ISO 29119-5)'}
                </span>
              </div>
              <span className="font-mono text-xs text-[#707070] tabular-nums">
                {board.issueLifecycleTracker.persistingOpenIssues.length} {isId ? 'tiket aktif' : 'active tickets'}
              </span>
            </div>

            {/* 2-Column Split: Bug Triage Left, Synthetic Test Data Factory Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: 1-Click Developer Bug Triage Handover */}
              <div className="lg:col-span-5 p-3.5 rounded-[3px] bg-[#111317] border border-[#22262E] space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-[#22262E] pb-2">
                  <div className="font-mono text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <span>🚨</span>
                    <span>{isId ? 'TRIASE BUG 1-KLIK KE DEVELOPER' : '1-CLICK DEVELOPER BUG HANDOVER'}</span>
                  </div>
                  <span className="font-mono text-xs text-[#707070] tabular-nums">
                    {(compiledState.bugReports || []).length} tickets
                  </span>
                </div>

                {(compiledState.bugReports || []).length === 0 ? (
                  <div className="p-6 rounded-[3px] bg-[#0B0C0E] border border-emerald-500/30 text-emerald-300 text-xs font-sans text-center space-y-1">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto" />
                    <div className="font-bold">{isId ? 'Nihil Bug Aktif Terdeteksi' : 'Zero Active Defects'}</div>
                    <div className="text-[#A1A1A1] text-[11px]">
                      {isId ? 'Seluruh modul merespons sesuai kontrak pada pemindaian terakhir.' : 'All modules respond according to specifications.'}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {(compiledState.bugReports || []).map((bug) => {
                      const status = issueStatusOverrides[bug.bugId] || bug.status;
                      return (
                        <div key={bug.bugId} className="p-3 rounded-[3px] bg-[#0B0C0E] border border-[#22262E] space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-rose-300">{bug.bugId}</span>
                                <StatusBadge text={bug.severity} tone={statusTone[bug.severity] || statusTone.ERROR} />
                                <span className="font-mono text-[11px] text-[#A1A1A1]">{bug.moduleName}</span>
                              </div>
                              <div className="text-xs font-semibold text-[#EDEDED] mt-1">{bug.title}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(
                                  productKnowledgeAndMonitoringService.buildDeveloperBugHandoverTicket(bug, compiledState),
                                  `Tiket Bug ${bug.bugId} (${bug.moduleName})`
                                )
                              }
                              className="shrink-0 h-6 px-2 rounded-[2px] bg-[#2563EB] hover:bg-blue-500 text-white font-mono text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <ClipboardCopy className="h-3 w-3" />
                              <span>Copy WA/Slack</span>
                            </button>
                          </div>

                          <div className="text-[11px] font-mono text-[#707070]">{bug.featureUrl}</div>
                          <div className="text-xs text-[#A1A1A1] font-sans">
                            <strong className="text-amber-300 font-mono text-[11px]">Solusi:</strong> {bug.recommendedFix}
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-[#1A1D23]">
                            <span className="font-mono text-[10px] text-[#707070] uppercase">Status Tiket:</span>
                            <div className="flex items-center gap-1 font-mono text-[10px]">
                              {(['OPEN', 'FIXED', 'VERIFIED'] as IssueStatus[]).map((next) => (
                                <button
                                  key={next}
                                  type="button"
                                  onClick={() => setIssueStatusOverrides((prev) => ({ ...prev, [bug.bugId]: next }))}
                                  className={`px-1.5 py-0.5 rounded-[2px] border cursor-pointer ${
                                    status === next
                                      ? 'bg-[#2563EB] border-[#2563EB] text-white font-bold'
                                      : 'bg-[#16191F] border-[#22262E] text-[#707070] hover:text-[#EDEDED]'
                                  }`}
                                >
                                  {next}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Synthetic Test Data Factory */}
              <div className="lg:col-span-7 p-3.5 rounded-[3px] bg-[#111317] border border-[#22262E] space-y-3 flex flex-col">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22262E] pb-2">
                  <div>
                    <div className="font-mono text-xs font-bold text-blue-400 flex items-center gap-1.5">
                      <span>🧬</span>
                      <span>{isId ? 'PABRIK DATA UJI SINTETIS (ISO 29119-5)' : 'SYNTHETIC TEST DATA FACTORY (ISO 29119-5)'}</span>
                    </div>
                    <div className="text-xs text-[#A1A1A1] mt-0.5">
                      {isId
                        ? 'Generate otomatis payload Positif, Batas 3-Titik BVA & Injeksi SQLi/XSS.'
                        : 'Auto-generate Positive, 3-Point BVA & Negative Injection test vectors.'}
                    </div>
                  </div>
                  <select
                    value={selectedFactoryModIdx}
                    onChange={(e) => setSelectedFactoryModIdx(Number(e.target.value))}
                    className="h-7 px-2.5 rounded-[3px] bg-[#0B0C0E] border border-[#22262E] font-mono text-xs text-[#EDEDED] cursor-pointer outline-none"
                  >
                    {featureModules.map((fm, i) => (
                      <option key={fm.moduleId} value={i}>
                        {fm.moduleId} — {fm.moduleName}
                      </option>
                    ))}
                  </select>
                </div>

                {syntheticBundle ? (
                  <div className="space-y-3 flex-1 flex flex-col">
                    {/* Copy Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(syntheticBundle.validProductionDataset, null, 2),
                            `Payload Positif (${syntheticBundle.moduleName})`
                          )
                        }
                        className="h-7 px-2.5 rounded-[3px] bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 font-mono text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <ClipboardCopy className="h-3 w-3" />
                        <span>Copy JSON Valid (Positive)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(syntheticBundle.boundary3PointDataset, null, 2),
                            `Payload Batas 3-Titik BVA (${syntheticBundle.moduleName})`
                          )
                        }
                        className="h-7 px-2.5 rounded-[3px] bg-blue-950/80 hover:bg-blue-900 border border-blue-500/50 text-blue-200 font-mono text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <ClipboardCopy className="h-3 w-3" />
                        <span>Copy Boundary (N-1, N, N+1)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(syntheticBundle.negativeAndInjectionDataset, null, 2),
                            `Payload Negatif & Injeksi (${syntheticBundle.moduleName})`
                          )
                        }
                        className="h-7 px-2.5 rounded-[3px] bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-200 font-mono text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <ClipboardCopy className="h-3 w-3" />
                        <span>Copy Negative & Injection</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(syntheticBundle.csvReadyRows, `CSV Data Uji (${syntheticBundle.moduleName})`)
                        }
                        className="h-7 px-2.5 rounded-[3px] bg-[#16191F] hover:bg-[#22262E] border border-[#22262E] text-[#EDEDED] font-mono text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Database className="h-3 w-3" />
                        <span>Copy CSV Runner</span>
                      </button>
                    </div>

                    {/* JSON Syntax Preview */}
                    <pre className="flex-1 p-3 rounded-[3px] bg-[#0B0C0E] border border-[#22262E] font-mono text-[11px] leading-relaxed text-blue-300 overflow-auto max-h-[260px]">
                      {JSON.stringify(
                        {
                          validProduction: syntheticBundle.validProductionDataset,
                          boundary3Point: syntheticBundle.boundary3PointDataset.exactBoundaryN,
                          negativeProbe: syntheticBundle.negativeAndInjectionDataset,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-[#707070] font-mono border border-dashed border-[#22262E] rounded-[3px]">
                    {isId ? 'Tidak ada data sintetis untuk modul ini.' : 'No synthetic data for this module.'}
                  </div>
                )}
              </div>
            </div>

            {/* Module Health Cards & Operational Status */}
            <div className="border border-[#22262E] rounded-[3px] bg-[#111317] p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22262E] pb-2">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-rose-400">
                  <Activity className="h-3.5 w-3.5" />
                  <span>{isId ? 'KESEHATAN MODUL & STATUS OPERASIONAL' : 'MODULE HEALTH & OPERATIONAL STATUS'}</span>
                </div>
                <StatusBadge
                  text={board.overallOperationalStatus}
                  tone={
                    board.overallOperationalStatus.includes('KRITIS')
                      ? statusTone.ERROR
                      : board.overallOperationalStatus.includes('PERLU')
                      ? statusTone.WARNING
                      : statusTone.NORMAL
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {board.moduleHealthMonitor.map((module) => (
                  <article key={module.moduleId} className="border border-[#22262E] rounded-[3px] bg-[#0B0C0E] p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-[#EDEDED] truncate">{module.moduleName}</div>
                        <div className="font-mono text-[11px] text-[#707070] truncate">{module.moduleId} · {module.routePath}</div>
                      </div>
                      <StatusBadge text={module.healthBadge} tone={statusTone[module.healthBadge]} />
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                      <div className="bg-[#111317] border border-[#22262E] rounded-[2px] px-2 py-1">
                        <div className="text-[10px] text-[#707070] uppercase">Bugs</div>
                        <div className="text-[#EDEDED] font-bold tabular-nums">{module.activeBugsCount}</div>
                      </div>
                      <div className="bg-[#111317] border border-[#22262E] rounded-[2px] px-2 py-1">
                        <div className="text-[10px] text-[#707070] uppercase">HTTP</div>
                        <div className="text-[#EDEDED] font-bold tabular-nums">{module.httpStatusObserved ?? '—'}</div>
                      </div>
                      <div className="bg-[#111317] border border-[#22262E] rounded-[2px] px-2 py-1">
                        <div className="text-[10px] text-[#707070] uppercase">Latency</div>
                        <div className="text-[#EDEDED] font-bold tabular-nums">
                          {module.avgLatencyMs === null ? '—' : `${module.avgLatencyMs}ms`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-[#1A1D23]">
                      <span className="font-mono text-[10.5px] text-[#707070] uppercase">Root cause:</span>
                      <StatusBadge text={module.rootCauseLayer} tone={statusTone[module.rootCauseLayer]} />
                    </div>
                    <p className="font-sans text-xs text-[#A1A1A1] leading-snug">{module.actionRequiredSummary}</p>
                  </article>
                ))}
              </div>
            </div>

            {/* Issue Lifecycle: New vs Open vs Resolved */}
            <div className="border border-[#22262E] rounded-[3px] bg-[#111317] p-3.5 space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-blue-400 border-b border-[#22262E] pb-2">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{isId ? 'SIKLUS ISU: BARU vs TERBUKA vs SELESAI' : 'ISSUE LIFECYCLE: NEW vs OPEN vs RESOLVED'}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="border border-[#22262E] rounded-[3px] bg-[#0B0C0E] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#F87171] uppercase">
                      {isId ? 'Baru Terdeteksi' : 'Newly Detected'}
                    </span>
                    <StatusBadge text={String(board.issueLifecycleTracker.newIssuesDetected.length)} tone={statusTone.ERROR} />
                  </div>
                  {board.issueLifecycleTracker.newIssuesDetected.length === 0 ? (
                    <p className="font-mono text-xs text-[#707070]">{isId ? 'Tidak ada isu baru.' : 'No new issues.'}</p>
                  ) : (
                    board.issueLifecycleTracker.newIssuesDetected.map((issue) => (
                      <p key={issue} className="font-sans text-xs text-[#A1A1A1] flex gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-[#F87171] shrink-0 mt-0.5" />
                        <span>{issue}</span>
                      </p>
                    ))
                  )}
                </div>

                <div className="border border-[#22262E] rounded-[3px] bg-[#0B0C0E] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-300 uppercase">
                      {isId ? 'Terbuka / Berlanjut' : 'Persisting Open'}
                    </span>
                    <StatusBadge text={String(board.issueLifecycleTracker.persistingOpenIssues.length)} tone={statusTone.WARNING} />
                  </div>
                  {board.issueLifecycleTracker.persistingOpenIssues.length === 0 ? (
                    <p className="font-mono text-xs text-[#707070]">{isId ? 'Tidak ada tiket terbuka.' : 'No open tickets.'}</p>
                  ) : (
                    board.issueLifecycleTracker.persistingOpenIssues.map((bug) => (
                      <div key={bug.bugId} className="font-sans text-xs text-[#A1A1A1] border-b border-[#1A1D23] pb-1.5 last:border-0">
                        <div className="font-mono font-bold text-[#EDEDED]">{bug.bugId} · {bug.moduleName}</div>
                        <div className="text-[11px] text-[#707070] truncate">{bug.title}</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border border-[#22262E] rounded-[3px] bg-[#0B0C0E] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-400 uppercase">
                      {isId ? 'Selesai Sejak Scan Lalu' : 'Resolved Since Last Scan'}
                    </span>
                    <StatusBadge text={String(board.issueLifecycleTracker.resolvedIssuesSinceLastScan.length)} tone={statusTone.NORMAL} />
                  </div>
                  {board.issueLifecycleTracker.resolvedIssuesSinceLastScan.length === 0 ? (
                    <p className="font-mono text-xs text-[#707070]">
                      {isId ? 'Belum ada isu yang terverifikasi selesai.' : 'No issues verified as resolved yet.'}
                    </p>
                  ) : (
                    board.issueLifecycleTracker.resolvedIssuesSinceLastScan.map((issue) => (
                      <p key={issue} className="font-sans text-xs text-[#A1A1A1] flex gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{issue}</span>
                      </p>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
         * SECTION 4: EXECUTIVE C-SUITE COMMAND BRIEF & SRE PRODUCTION READINESS
         * ========================================================================= */}
        {(activeTab === 'EXECUTIVE_SRE' || activeTab === 'ALL') && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22262E] pb-2">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-blue-400">
                <ShieldCheck className="h-4 w-4" />
                <span>
                  {isId
                    ? 'RINGKASAN EKSEKUTIF DIREKSI (CEO / CTO) & SKOR KESIAPAN PRODUKSI (SRE PRR)'
                    : 'C-SUITE EXECUTIVE COMMAND BRIEF & SRE PRODUCTION READINESS (PRR)'}
                </span>
              </div>
              <span className="font-mono text-xs text-[#707070] tabular-nums">ISO/IEC 25010 & ISO 9001:2015</span>
            </div>

            {/* 4 Executive KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-[3px] bg-[#111317] border border-[#22262E] space-y-1">
                <div className="text-xs text-[#A1A1A1] font-sans font-medium">
                  {isId ? 'Eliminasi Ketergantungan (Bus-Factor)' : 'Bus-Factor Elimination'}
                </div>
                <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums">
                  {sreCard.busFactorEliminationPercent}%
                </div>
                <div className="text-[11px] text-[#707070] font-mono truncate">
                  {featureModules.length} Modul, {compiledState.discoveryResult?.apiEndpoints?.length || 0} APIs, {compiledState.discoveryResult?.databaseTables?.length || 0} Tables
                </div>
              </div>

              <div className="p-3 rounded-[3px] bg-[#111317] border border-[#22262E] space-y-1">
                <div className="text-xs text-[#A1A1A1] font-sans font-medium">
                  {isId ? 'Kesiapan Produksi SRE (6 Gate)' : 'SRE Production Readiness'}
                </div>
                <div className="text-lg font-bold text-blue-400 font-mono tabular-nums">
                  {sreCard.overallSreScore}% READY
                </div>
                <div className="text-[11px] text-[#707070] font-mono truncate">OpenAPI 3.1 & ISO/IEC 25010</div>
              </div>

              <div className="p-3 rounded-[3px] bg-[#111317] border border-[#22262E] space-y-1">
                <div className="text-xs text-[#A1A1A1] font-sans font-medium">
                  {isId ? 'Status Versi (1:1 Sync)' : 'Version Sync Status'}
                </div>
                <div className="text-lg font-bold text-amber-300 font-mono tabular-nums truncate">
                  {regressionDiff ? `${regressionDiff.previousVersion} ➔ ${regressionDiff.newVersion}` : 'v1.0.0 (Baseline)'}
                </div>
                <div className="text-[11px] text-[#707070] font-mono truncate">
                  {regressionDiff?.autoChangeRequestId || 'CR-AUTO-001'}
                </div>
              </div>

              <div className="p-3 rounded-[3px] bg-[#111317] border border-[#22262E] space-y-1">
                <div className="text-xs text-[#A1A1A1] font-sans font-medium">
                  {isId ? 'Penghematan Jam Rekayasa' : 'Engineering Hours Saved'}
                </div>
                <div className="text-lg font-bold text-emerald-300 font-mono tabular-nums">
                  {sreCard.manHoursSavedTotal} Jam
                </div>
                <div className="text-[11px] text-[#707070] font-mono truncate">
                  BA:{sreCard.roleHoursSaved.baAndPmHours}j | SA:{sreCard.roleHoursSaved.systemAnalystAndArchHours}j | QA:{sreCard.roleHoursSaved.qaAndSdetHours}j
                </div>
              </div>
            </div>

            {/* 6 SRE Gates Compact Grid */}
            <div className="border border-[#22262E] rounded-[3px] bg-[#111317] p-3.5 space-y-3">
              <div className="text-xs font-mono font-bold text-[#EDEDED] border-b border-[#22262E] pb-2">
                🛡️ {isId ? '6 GERBANG KELAYAKAN SRE PRODUCTION READINESS REVIEW (PRR)' : '6 SRE PRODUCTION READINESS REVIEW GATES'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {sreCard.gates.map((g) => (
                  <div key={g.gateId} className="p-3 rounded-[3px] bg-[#0B0C0E] border border-[#22262E] space-y-2 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-[#EDEDED] font-sans leading-tight">
                        {isId ? g.gateNameId : g.gateNameEn}
                      </span>
                      <span className="shrink-0 px-2 py-0.5 rounded-[2px] text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/40 tabular-nums">
                        {g.scorePercent}% {g.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#A1A1A1] font-sans leading-relaxed">{g.evidenceId}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 1-Click Management Briefing */}
            <div className="border border-[#22262E] rounded-[3px] bg-[#111317] p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22262E] pb-2">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#60A5FA]">
                  <ClipboardCopy className="h-3.5 w-3.5" />
                  <span>{isId ? 'LAPORAN RINGKAS MANAJEMEN (SIAP KIRIM WA / EMAIL)' : 'EXECUTIVE MANAGEMENT BRIEFING (READY TO SEND)'}</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      isId ? briefing.managementBriefingId : briefing.managementBriefingEn,
                      isId ? 'Laporan Manajemen Direksi' : 'Management Briefing'
                    )
                  }
                  className="h-7 px-3 bg-[#2563EB] hover:bg-blue-500 text-white font-mono text-xs font-bold rounded-[3px] cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <ClipboardCopy className="h-3.5 w-3.5" />
                  <span>{isId ? 'Copy Teks Laporan Manajemen' : 'Copy Briefing Text'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {briefing.cards.map((card) => (
                  <article key={card.headingId} className="border border-[#22262E] rounded-[3px] bg-[#0B0C0E] p-3 space-y-2">
                    <h3 className="font-mono text-xs font-bold text-blue-300">{isId ? card.headingId : card.headingEn}</h3>
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-[#A1A1A1]">
                      {isId ? card.bodyId : card.bodyEn}
                    </pre>
                  </article>
                ))}
              </div>

              <div className="border border-[#22262E] rounded-[3px] bg-[#0B0C0E] p-3 space-y-2">
                <div className="font-mono text-[11px] uppercase text-[#707070]">
                  {isId ? 'Pratinjau Memo Lengkap (WhatsApp / Email / Board Meeting):' : 'Full Memo Preview (WhatsApp / Email / Board Meeting):'}
                </div>
                <pre className="max-h-[220px] overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-[#EDEDED] p-2 rounded-[2px] bg-[#111317] border border-[#22262E]">
                  {isId ? briefing.managementBriefingId : briefing.managementBriefingEn}
                </pre>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
