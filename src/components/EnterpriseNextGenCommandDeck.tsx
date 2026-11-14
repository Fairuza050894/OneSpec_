'use client';

import React, { useState } from 'react';
import type { CompiledSdlcState } from '@/services/sdlcCompiler';
import type { RegressionDiffSummary } from '@/services/workspaceVaultService';
import type { DatabaseErdTable } from '@/types/sdlc';
import { productKnowledgeAndMonitoringService } from '@/services/productKnowledgeAndMonitoringService';
import { domainLogicBrainService } from '@/services/domainLogicBrainService';
import { ModuleScreenshot } from '@/components/shared/ModuleScreenshot';
import { buildFeatureModuleBlueprintSvgDataUrl } from '@/lib/featureModuleBlueprint';

export interface EnterpriseNextGenCommandDeckProps {
  compiledState?: CompiledSdlcState | null;
  regressionDiff?: RegressionDiffSummary | null;
  locale?: 'id' | 'en';
}

export function EnterpriseNextGenCommandDeck({
  compiledState,
  regressionDiff,
  locale = 'id',
}: EnterpriseNextGenCommandDeckProps) {
  const isId = locale === 'id';
  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(0);
  const [selectedFactoryModIdx, setSelectedFactoryModIdx] = useState<number>(0);
  const [copiedBanner, setCopiedBanner] = useState<string | null>(null);

  if (!compiledState) return null;

  const blueprint = productKnowledgeAndMonitoringService.buildProductKnowledgeBlueprint(compiledState);
  const board = productKnowledgeAndMonitoringService.buildBugAndIssueMonitoringBoard(compiledState, regressionDiff);
  const briefing = productKnowledgeAndMonitoringService.buildManagementBriefingReport(compiledState, regressionDiff);
  const sreCard = productKnowledgeAndMonitoringService.buildSreAndCtoGovernanceScorecard(compiledState);

  const stages = blueprint.endToEndWorkflowChain || [];
  const activeStage = stages[selectedStageIdx] || stages[0];
  const featureModules = compiledState.discoveredFeatureModules || [];
  const matchedModule =
    featureModules.find(
      (m) =>
        m.moduleName.toLowerCase() === (activeStage?.moduleName || '').toLowerCase() ||
        m.routePath === activeStage?.routePath
    ) || featureModules[selectedStageIdx] || featureModules[0];

  const matchedCrud = blueprint.crudMatrixRows.find(
    (r) => r.moduleName.toLowerCase() === (matchedModule?.moduleName || '').toLowerCase()
  );
  const matchedLineage = blueprint.fieldLineageMappings.filter(
    (l) => l.moduleName.toLowerCase() === (matchedModule?.moduleName || '').toLowerCase()
  );
  const matchedHealth = board.moduleHealthMonitor.find(
    (h) => h.moduleName.toLowerCase() === (matchedModule?.moduleName || '').toLowerCase()
  );

  const factoryMod = featureModules[selectedFactoryModIdx] || featureModules[0];
  const dbTables: DatabaseErdTable[] = compiledState.databaseTables || compiledState.discoveryResult?.databaseTables || [];
  const factoryIntel = factoryMod
    ? domainLogicBrainService.inferDomainIntelligence(factoryMod, {
        appName: compiledState.appName,
        targetUrl: compiledState.targetUrl,
        validationRules: compiledState.validationRules,
        databaseTables: dbTables,
      })
    : null;
  const syntheticBundle = factoryIntel?.syntheticTestDataFactory;

  const rules = compiledState.validationRules || [];
  const astVerifiedCount = rules.filter(
    (r) => r.ruleId.startsWith('VR-AST-') || r.exactUiErrorString?.includes('[AST')
  ).length;
  const domHarvestedCount = rules.filter(
    (r) => r.ruleId.startsWith('VR-DOM-') || r.exactUiErrorString?.includes('[DOM') || (!r.ruleId.startsWith('VR-AST-') && !r.exactUiErrorString?.includes('[AST'))
  ).length;

  const allForeignKeys: Array<{
    sourceTable: string;
    sourceCol: string;
    targetTable: string;
    targetCol: string;
  }> = dbTables.flatMap((tbl: DatabaseErdTable) =>
    (tbl.columns || [])
      .filter((c) => c.isForeignKey && c.foreignKeyTarget)
      .map((c) => ({
        sourceTable: tbl.tableName,
        sourceCol: c.name,
        targetTable: c.foreignKeyTarget!.table,
        targetCol: c.foreignKeyTarget!.column,
      }))
  );
  const dbFkCount = allForeignKeys.length;

  const stageTableNames = new Set([
    ...(matchedCrud?.entityPermissions?.map((ep) => ep.tableName.toLowerCase()) || []),
    matchedModule?.moduleName.toLowerCase() || '',
  ]);
  const stageFks = allForeignKeys.filter(
    (fk: { sourceTable: string; sourceCol: string; targetTable: string; targetCol: string }) =>
      stageTableNames.has(fk.sourceTable.toLowerCase()) || stageTableNames.has(fk.targetTable.toLowerCase())
  );
  const displayFks = stageFks.length > 0 ? stageFks : allForeignKeys.slice(0, 4);

  const copyText = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedBanner(label);
      setTimeout(() => setCopiedBanner(null), 2500);
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {copiedBanner && (
        <div className="p-2.5 rounded-[4px] bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-medium flex items-center justify-between">
          <span>✅ Berhasil disalin ke Clipboard: <strong>{copiedBanner}</strong></span>
          <button onClick={() => setCopiedBanner(null)} className="text-[11px] underline cursor-pointer">Tutup</button>
        </div>
      )}

      {/* PANEL A: CEO & CTO 1-PAGE EXECUTIVE COMMAND BRIEF + SRE PRODUCTION READINESS */}
      <div className="p-4 rounded-[4px] bg-[#111317] border border-[#22262E] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22262E] pb-3">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-blue-400">
              {isId ? '🛡️ RINGKASAN EKSEKUTIF DIREKSI (CEO / CTO) & SKOR KESIAPAN PRODUKSI (SRE PRR)' : '🛡️ C-SUITE EXECUTIVE COMMAND BRIEF & SRE PRODUCTION READINESS'}
            </div>
            <h3 className="text-sm font-bold text-[#EDEDED] mt-0.5">
              {compiledState.appName} — {board.overallOperationalStatus}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                copyText(
                  isId ? briefing.managementBriefingId : briefing.managementBriefingEn,
                  isId ? 'Laporan Eksekutif Manajemen (WA / Email Atasan)' : 'Executive Management Briefing'
                )
              }
              className="px-3 py-1.5 rounded-[3px] bg-[#2563EB] hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              📋 {isId ? 'Copy Laporan Manajemen (WA / Email Atasan)' : 'Copy Executive Management Report'}
            </button>
            {compiledState.bugReports && compiledState.bugReports.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const allTickets = compiledState.bugReports!
                    .map((b) => productKnowledgeAndMonitoringService.buildDeveloperBugHandoverTicket(b, compiledState))
                    .join('\n\n----------------------------------------\n\n');
                  copyText(allTickets, isId ? 'Semua Tiket Triase Bug Developer' : 'All Developer Bug Tickets');
                }}
                className="px-3 py-1.5 rounded-[3px] bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/50 text-rose-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                🚨 {isId ? `Copy Semua Tiket Bug ke Developer (${compiledState.bugReports.length})` : `Copy All Bug Tickets (${compiledState.bugReports.length})`}
              </button>
            )}
          </div>
        </div>

        {/* 4 Executive KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-[3px] bg-[#16191F] border border-[#22262E]">
            <div className="text-[10.5px] text-[#A1A1A1]">{isId ? 'Eliminasi Ketergantungan Developer (Bus-Factor)' : 'Bus-Factor Elimination'}</div>
            <div className="text-base font-bold text-emerald-400 tabular-nums mt-0.5">{sreCard.busFactorEliminationPercent}% TERDOKUMENTASI</div>
            <div className="text-[10.5px] text-[#707070]">{featureModules.length} Modul, {compiledState.discoveryResult?.apiEndpoints?.length || 0} API, {compiledState.discoveryResult?.databaseTables?.length || 0} Tabel DB</div>
          </div>
          <div className="p-2.5 rounded-[3px] bg-[#16191F] border border-[#22262E]">
            <div className="text-[10.5px] text-[#A1A1A1]">{isId ? 'Skor Kesiapan Produksi SRE (6 Gate)' : 'SRE Production Readiness'}</div>
            <div className="text-base font-bold text-blue-400 tabular-nums mt-0.5">{sreCard.overallSreScore}% READY</div>
            <div className="text-[10.5px] text-[#707070]">ISO/IEC 25010 & OpenAPI 3.1</div>
          </div>
          <div className="p-2.5 rounded-[3px] bg-[#16191F] border border-[#22262E]">
            <div className="text-[10.5px] text-[#A1A1A1]">{isId ? 'Status Versi & Perubahan (1:1 Sync)' : 'Version & 1:1 Change State'}</div>
            <div className="text-base font-bold text-amber-300 tabular-nums mt-0.5">
              {regressionDiff ? `${regressionDiff.previousVersion} ➔ ${regressionDiff.newVersion}` : 'v1.0.0 (Baseline)'}
            </div>
            <div className="text-[10.5px] text-[#707070]">{regressionDiff?.autoChangeRequestId || 'CR-AUTO-001'}</div>
          </div>
          <div className="p-2.5 rounded-[3px] bg-[#16191F] border border-[#22262E]">
            <div className="text-[10.5px] text-[#A1A1A1]">{isId ? 'Penghematan Jam Kerja (BA/SA/QA/Doc)' : 'Engineering Hours Saved'}</div>
            <div className="text-base font-bold text-emerald-300 tabular-nums mt-0.5">{sreCard.manHoursSavedTotal} Jam Kerja</div>
            <div className="text-[10.5px] text-[#707070]">BA:{sreCard.roleHoursSaved.baAndPmHours}j | SA:{sreCard.roleHoursSaved.systemAnalystAndArchHours}j | QA:{sreCard.roleHoursSaved.qaAndSdetHours}j</div>
          </div>
        </div>

        {/* 6 SRE Gates Compact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
          {sreCard.gates.map((g) => (
            <div key={g.gateId} className="p-2 rounded-[3px] bg-[#0B0C0E] border border-[#22262E] flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[#EDEDED]">{isId ? g.gateNameId : g.gateNameEn}</span>
                <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/40 tabular-nums">
                  {g.scorePercent}% {g.status}
                </span>
              </div>
              <div className="text-[10.5px] text-[#A1A1A1] mt-1">{g.evidenceId}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PANEL B: INTERACTIVE DIGITAL TWIN END-TO-END WORKFLOW SIMULATOR */}
      {stages.length > 0 && (
        <div className="p-4 rounded-[4px] bg-[#111317] border border-[#22262E] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22262E] pb-2.5">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
                {isId ? '🧭 SIMULATOR DIGITAL TWIN ALUR KERJA END-TO-END (KLIK TAHAP UNTUK INSPEKSI VISUAL, API & DB)' : '🧭 INTERACTIVE DIGITAL TWIN END-TO-END WORKFLOW SIMULATOR'}
              </div>
              <p className="text-xs text-[#A1A1A1]">
                {isId
                  ? 'Klik tahapan di bawah untuk melihat tangkapan layar modul, apa yang dilakukan pengguna vs sistem di balik layar, matriks CRUD database, dan pemetaan kolom 3-lapis.'
                  : 'Click any workflow stage below to inspect its screen, behind-the-scenes API logic, DB CRUD operations, and 3-layer field lineage.'}
              </p>
            </div>
          </div>

          {/* Stepper Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {stages.map((st, idx) => {
              const active = idx === selectedStageIdx;
              return (
                <button
                  key={st.stageNumber}
                  type="button"
                  onClick={() => setSelectedStageIdx(idx)}
                  className={`px-3 py-1.5 rounded-[3px] text-xs font-medium cursor-pointer transition-colors border ${
                    active
                      ? 'bg-[#2563EB] text-white border-blue-400 font-semibold'
                      : 'bg-[#16191F] text-[#A1A1A1] border-[#22262E] hover:text-white'
                  }`}
                >
                  {st.stageNumber}. {st.moduleName} ({st.routePath})
                </button>
              );
            })}
          </div>

          {/* Active Stage Split Inspector */}
          {activeStage && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
              {/* Left: Visual Screen Preview */}
              <div className="lg:col-span-5 p-3 rounded-[3px] bg-[#0B0C0E] border border-[#22262E] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#EDEDED]">
                    🖥️ {activeStage.moduleName} <code className="text-blue-400 font-mono">{activeStage.routePath}</code>
                  </span>
                  <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-semibold bg-blue-950 text-blue-300 border border-blue-500/40">
                    {matchedHealth?.healthBadge || 'NORMAL'}
                  </span>
                </div>
                {matchedModule?.screenshotDataUrl ? (
                  <div className="relative rounded-[3px] overflow-hidden border border-[#22262E] bg-black">
                    <ModuleScreenshot
                      src={matchedModule.screenshotDataUrl}
                      blueprintDataUrl={buildFeatureModuleBlueprintSvgDataUrl({
                        moduleName: activeStage.moduleName,
                        routePath: activeStage.routePath,
                        pageHeading: activeStage.moduleName,
                      })}
                      alt={activeStage.moduleName}
                      className="w-full h-auto object-contain max-h-56 bg-[#0F172A]"
                    />
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-[#707070] border border-dashed border-[#22262E] rounded-[3px]">
                    Visual terpetakan dari struktur DOM & AST ({matchedModule?.screenControlsCatalog?.length || 0} kontrol aktif)
                  </div>
                )}
                <div className="text-[11px] text-[#A1A1A1] space-y-1">
                  <div><strong className="text-white">👤 Aktor:</strong> {activeStage.userActor}</div>
                  <div><strong className="text-white">🖱️ Aksi di Layar:</strong> {activeStage.whatUserDoes}</div>
                  <div><strong className="text-white">⚙️ Proses Sistem & API:</strong> {activeStage.whatSystemAndApiDoBehindTheScenes}</div>
                  <div><strong className="text-white">➡️ Transisi Berikutnya:</strong> {activeStage.nextStageTransition}</div>
                </div>
              </div>

              {/* Right: System Analyst CRUD & 3-Layer Field Lineage for This Stage */}
              <div className="lg:col-span-7 p-3 rounded-[3px] bg-[#0B0C0E] border border-[#22262E] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#22262E] pb-1.5">
                  <div className="text-xs font-bold text-[#EDEDED]">
                    🔗 {isId ? `Peta Koneksi Data System Analyst pada "${activeStage.moduleName}" (UI ➔ API ➔ Tabel DB)` : `System Analyst Data Lineage for "${activeStage.moduleName}"`}
                  </div>
                  {/* Evidence Provenance Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-sm bg-[#16191F] border border-blue-500/40 text-[10px] font-mono text-blue-300 tabular-nums font-semibold" title="Rules extracted directly from AST source code">
                      [AST-VERIFIED: {astVerifiedCount}]
                    </span>
                    <span className="px-2 py-0.5 rounded-sm bg-[#16191F] border border-amber-500/40 text-[10px] font-mono text-amber-300 tabular-nums font-semibold" title="Rules extracted from DOM UI form inputs">
                      [DOM-HARVESTED: {domHarvestedCount}]
                    </span>
                    <span className="px-2 py-0.5 rounded-sm bg-[#16191F] border border-emerald-500/40 text-[10px] font-mono text-emerald-300 tabular-nums font-semibold" title="Database Foreign Key Referential Integrity Constraints">
                      [DB-FK-LINKED: {dbFkCount}]
                    </span>
                  </div>
                </div>

                {/* Database Foreign Key Relations for active stage */}
                {displayFks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-mono bg-[#111317] p-1.5 rounded-sm border border-[#22262E]">
                    <span className="text-[#A1A1A1] text-[10px] uppercase tracking-wider font-semibold">
                      {isId ? 'Relasi FK Database:' : 'DB Foreign Keys:'}
                    </span>
                    {displayFks.map((fk, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded-sm bg-[#16191F] border border-[#22262E] text-amber-300 font-mono text-[10.5px]"
                        title={`Foreign Key Constraint: ${fk.sourceTable}.${fk.sourceCol} -> ${fk.targetTable}.${fk.targetCol}`}
                      >
                        {fk.sourceTable}.{fk.sourceCol} ➔ {fk.targetTable}.{fk.targetCol}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {(matchedCrud?.entityPermissions || []).map((ep, i) => (
                    <span key={i} className="px-2 py-1 rounded-[2px] bg-[#16191F] border border-[#22262E] text-[11px] font-mono text-emerald-300">
                      🗄️ {ep.tableName} [{ep.crudFlags}] — {ep.triggeredEndpoints.join(', ')}
                    </span>
                  ))}
                </div>
                <div className="overflow-x-auto max-h-52">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#16191F] text-[#A1A1A1] font-mono">
                        <th className="p-1.5 border border-[#22262E]">Kontrol / Kolom UI</th>
                        <th className="p-1.5 border border-[#22262E]">Endpoint & Field JSON API</th>
                        <th className="p-1.5 border border-[#22262E]">Tabel & Kolom DB</th>
                        <th className="p-1.5 border border-[#22262E]">Aturan Validasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchedLineage.slice(0, 8).map((lin, idx) => (
                        <tr key={idx} className="border-b border-[#22262E]">
                          <td className="p-1.5 font-semibold text-white">{lin.uiControl}</td>
                          <td className="p-1.5 font-mono text-blue-300">{lin.apiJsonKey}</td>
                          <td className="p-1.5 font-mono text-amber-300">{lin.databaseColumn} ({lin.dataType})</td>
                          <td className="p-1.5 font-mono text-[#A1A1A1]">{lin.validationRule}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PANEL C: PRINCIPAL SDET SYNTHETIC TEST DATA FACTORY + 1-CLICK BUG HANDOVER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Synthetic Test Data Factory */}
        <div className="lg:col-span-7 p-4 rounded-[4px] bg-[#111317] border border-[#22262E] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-mono uppercase text-blue-400">
                🧬 {isId ? 'PABRIK DATA UJI SINTETIS OTOMATIS (ISO/IEC 29119-5 & ISO/IEC 20889)' : 'SYNTHETIC TEST DATA FACTORY (ISO 29119-5)'}
              </div>
              <div className="text-xs font-bold text-[#EDEDED]">
                {isId ? 'Pilih Modul untuk Copy Payload Uji Positif, Batas 3-Titik (BVA) & Negatif/Injeksi' : 'Select Module to Copy Valid, 3-Point BVA & Negative Payloads'}
              </div>
            </div>
            <select
              value={selectedFactoryModIdx}
              onChange={(e) => setSelectedFactoryModIdx(Number(e.target.value))}
              className="px-2.5 py-1 rounded-[3px] bg-[#16191F] border border-[#22262E] text-xs text-white cursor-pointer"
            >
              {featureModules.map((fm, i) => (
                <option key={fm.moduleId} value={i}>
                  {fm.moduleId} — {fm.moduleName}
                </option>
              ))}
            </select>
          </div>

          {syntheticBundle && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyText(JSON.stringify(syntheticBundle.validProductionDataset, null, 2), `Payload Positif (${syntheticBundle.moduleName})`)}
                  className="px-2.5 py-1 rounded-[3px] bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 text-[11px] font-semibold cursor-pointer"
                >
                  📋 Copy JSON Valid (Positive)
                </button>
                <button
                  type="button"
                  onClick={() => copyText(JSON.stringify(syntheticBundle.boundary3PointDataset, null, 2), `Payload Batas 3-Titik BVA (${syntheticBundle.moduleName})`)}
                  className="px-2.5 py-1 rounded-[3px] bg-blue-950 hover:bg-blue-900 border border-blue-500/50 text-blue-200 text-[11px] font-semibold cursor-pointer"
                >
                  📋 Copy JSON Boundary 3-Titik (N-1, N, N+1)
                </button>
                <button
                  type="button"
                  onClick={() => copyText(JSON.stringify(syntheticBundle.negativeAndInjectionDataset, null, 2), `Payload Negatif & SQLi/XSS (${syntheticBundle.moduleName})`)}
                  className="px-2.5 py-1 rounded-[3px] bg-amber-950 hover:bg-amber-900 border border-amber-500/50 text-amber-200 text-[11px] font-semibold cursor-pointer"
                >
                  📋 Copy JSON Negative & Injection
                </button>
                <button
                  type="button"
                  onClick={() => copyText(syntheticBundle.csvReadyRows, `CSV Data Uji (${syntheticBundle.moduleName})`)}
                  className="px-2.5 py-1 rounded-[3px] bg-[#16191F] hover:bg-[#22262E] border border-[#22262E] text-[#EDEDED] text-[11px] font-semibold cursor-pointer"
                >
                  📊 Copy CSV Data-Driven Runner
                </button>
              </div>
              <pre className="p-2.5 rounded-[3px] bg-[#0B0C0E] border border-[#22262E] text-[11px] font-mono text-blue-300 overflow-x-auto max-h-40">
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
          )}
        </div>

        {/* 1-Click Developer Bug Handover Cards */}
        <div className="lg:col-span-5 p-4 rounded-[4px] bg-[#111317] border border-[#22262E] space-y-2.5">
          <div className="text-[11px] font-mono uppercase text-rose-400">
            🚨 {isId ? 'TRIASE BUG 1-KLIK SIAP KIRIM KE DEVELOPER' : '1-CLICK DEVELOPER BUG TRIAGE HANDOVER'}
          </div>
          {(compiledState.bugReports || []).length === 0 ? (
            <div className="p-4 rounded-[3px] bg-[#0B0C0E] border border-emerald-500/30 text-emerald-300 text-xs">
              ✅ {isId ? 'Nihil bug aktif pada pemindaian terakhir. Seluruh modul merespons sesuai kontrak.' : 'Zero active defects detected in the latest scan.'}
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {(compiledState.bugReports || []).map((bug) => (
                <div key={bug.bugId} className="p-2.5 rounded-[3px] bg-[#0B0C0E] border border-[#22262E] flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-rose-300">
                      [{bug.bugId} • {bug.severity}] {bug.moduleName}
                    </div>
                    <div className="text-[11px] text-[#EDEDED] mt-0.5">{bug.title}</div>
                    <div className="text-[10.5px] text-[#A1A1A1] mt-0.5">Solusi: {bug.recommendedFix}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        productKnowledgeAndMonitoringService.buildDeveloperBugHandoverTicket(bug, compiledState),
                        `Tiket Triase ${bug.bugId} (${bug.moduleName})`
                      )
                    }
                    className="shrink-0 px-2.5 py-1 rounded-[3px] bg-[#2563EB] hover:bg-blue-500 text-white text-[11px] font-semibold cursor-pointer"
                  >
                    📋 Copy Tiket WA/Slack
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
