'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  RowSelectionState,
} from '@tanstack/react-table';
import {
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileCode,
  FileText,
  ChevronDown,
  ChevronUp,
  Layers,
  Bug,
  ShieldCheck,
  Save,
  Camera,
  AlertTriangle,
  Zap,
  Plus,
} from 'lucide-react';
import type { SynthesizedRtmRow, RtmScenarioType } from '@/services/rtmSynthesizer';
import {
  generateFeatureBundle,
  generateTestRailCsv,
  generateRtmMarkdown,
  generateBugReportMarkdown,
  generateBugReportCsv,
} from '@/services/rtmSynthesizer';
import { unifiedReportGenerator } from '@/services/unifiedReportGenerator';
import type { DataDictionaryEntry } from '@/services/sdlcKnowledgeGraphService';
import type {
  TestScenarioItem,
  BugReportTicket,
  UatFeatureFlow,
  FeatureModuleSurface,
} from '@/types/sdlc';
import { useStudioLocale } from '@/lib/i18n';
import { changeImpactService, type ChangeImpactAnalysisReport } from '@/services/changeImpactService';
import type { CompiledSdlcState } from '@/services/sdlcCompiler';
import { ModuleScreenshot } from '@/components/shared/ModuleScreenshot';
import { buildFeatureModuleBlueprintSvgDataUrl } from '@/lib/featureModuleBlueprint';
interface RtmSpreadsheetGridProps {
  data: SynthesizedRtmRow[];
  testScenarios?: TestScenarioItem[];
  bugReports?: BugReportTicket[];
  uatFlows?: UatFeatureFlow[];
  featureModules?: FeatureModuleSurface[];
  dataDictionary?: DataDictionaryEntry[];
  appName?: string;
  targetUrl?: string;
  selectedRowId?: string;
  onRowSelect?: (row: SynthesizedRtmRow, selectedRows: SynthesizedRtmRow[]) => void;
  onExportAction?: (actionName: string) => void;
  onUpdateBugStatus?: (bugId: string, nextStatus: 'OPEN' | 'FIXED' | 'VERIFIED') => void;
  onUpdateUat?: (uatId: string, status: UatFeatureFlow['uatStatus'], testerNotes: string) => void;
  onSaveOverridesToVault?: () => void;
  hasUnsavedOverrides?: boolean;
  compiledState?: CompiledSdlcState | null;
  onMergeChangeRequest?: (report: ChangeImpactAnalysisReport) => void;
}

export function RtmSpreadsheetGrid({
  data,
  testScenarios = [],
  bugReports = [],
  uatFlows = [],
  featureModules = [],
  dataDictionary = [],
  appName = 'Active Project',
  targetUrl = 'http://localhost:3000/',
  selectedRowId,
  onRowSelect,
  onExportAction,
  onUpdateBugStatus,
  onUpdateUat,
  onSaveOverridesToVault,
  hasUnsavedOverrides = false,
  compiledState,
  onMergeChangeRequest,
}: RtmSpreadsheetGridProps) {
  const { locale, copy } = useStudioLocale();
  const isId = locale === 'id';
  const [activeWorkbookTab, setActiveWorkbookTab] = useState<'SCENARIO_MATRIX' | 'DETAILED_CASES' | 'BUG_REPORTS' | 'UAT_SIGNOFF'>('SCENARIO_MATRIX');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('ALL');
  const [globalFilter, setGlobalFilter] = useState('');
  const [scenarioFilter, setScenarioFilter] = useState<string>('ALL');
  const [parityFilter, setParityFilter] = useState<string>('ALL');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isCrOpen, setIsCrOpen] = useState(false);
  const [p0SmokeOnly, setP0SmokeOnly] = useState(false);
  const [crModuleId, setCrModuleId] = useState('MOD-01');
  const [crTitle, setCrTitle] = useState('');
  const [crDescription, setCrDescription] = useState('');
  const [crReport, setCrReport] = useState<ChangeImpactAnalysisReport | null>(null);

  // Build normalized module filter chips
  const moduleOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const fm of featureModules) {
      seen.set(fm.moduleId, fm.moduleName);
    }
    for (const sc of testScenarios) {
      if (!seen.has(sc.moduleId)) seen.set(sc.moduleId, sc.moduleName);
    }
    for (const r of data) {
      const id = r.moduleId || r.moduleName || 'MOD-01';
      if (!seen.has(id)) seen.set(id, r.moduleName || 'Core System');
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [featureModules, testScenarios, data]);

  // Fallback derived scenarios & UAT flows when default pre-crawl rows are rendered
  const effectiveScenarios: TestScenarioItem[] = useMemo(() => {
    if (testScenarios.length > 0) return testScenarios;
    return data.map((r, idx) => ({
      scenarioId: r.scenarioId || `TS-MOD01-${String(idx + 1).padStart(2, '0')}`,
      moduleId: r.moduleId || 'MOD-01',
      moduleName: r.moduleName || 'Core System',
      routePath: r.pagePath || '/',
      category: r.scenarioType.includes('BOUNDARY')
        ? 'BOUNDARY_FORMAT'
        : r.scenarioType.includes('SECURITY')
        ? 'SECURITY_API_CONTRACT'
        : r.scenarioType.includes('NEGATIVE')
        ? 'NEGATIVE_MANDATORY_VALIDATION'
        : 'POSITIVE_VIEW_TABLE',
      title: r.testTitle,
      description: r.testObjective,
      linkedTestCaseIds: [r.testId],
    }));
  }, [testScenarios, data]);

  const effectiveUatFlows: UatFeatureFlow[] = useMemo(() => {
    if (uatFlows.length > 0) return uatFlows;
    const modGroups = new Map<string, SynthesizedRtmRow[]>();
    for (const r of data) {
      const k = r.moduleName || 'Core System';
      const arr = modGroups.get(k) || [];
      arr.push(r);
      modGroups.set(k, arr);
    }
    return Array.from(modGroups.entries()).map(([modName, items], idx) => ({
      uatId: `UAT-${String(idx + 1).padStart(3, '0')}`,
      moduleId: items[0]?.moduleId || `MOD-${String(idx + 1).padStart(2, '0')}`,
      moduleName: modName,
      routePath: items[0]?.pagePath || '/',
      userRole: 'Authenticated Operator',
      businessScenarioTitle: `End-to-End Business Flow: ${modName}`,
      endToEndJourneySteps: items.slice(0, 4).map((i, sIdx) => `${sIdx + 1}. ${i.testTitle}`),
      acceptanceCriteria: [
        {
          criterion: `${modName} satisfies ${items.length} synthesized contract checks`,
          expected: items[0]?.expectedOutcome || 'HTTP 200 OK',
          actual: items[0]?.actualObservedResult || 'Verified in specification baseline',
          passed: items.every((i) => i.executionVerdict !== 'FAILED'),
        },
      ],
      uatStatus: items.some((i) => i.executionVerdict === 'FAILED') ? 'REJECTED' : 'ACCEPTED',
      testerNotes: `${items.length} test cases mapped to ${modName}.`,
    }));
  }, [uatFlows, data]);

  const matchesModule = (modId?: string, modName?: string) => {
    if (selectedModuleFilter === 'ALL') return true;
    const selectedObj = moduleOptions.find((m) => m.id === selectedModuleFilter);
    return modId === selectedModuleFilter || (selectedObj && modName === selectedObj.name);
  };

  const filteredScenarios = useMemo(() => {
    const q = globalFilter.trim().toLowerCase();
    return effectiveScenarios.filter((sc) => {
      if (!matchesModule(sc.moduleId, sc.moduleName)) return false;
      if (q && !`${sc.scenarioId} ${sc.moduleName} ${sc.title} ${sc.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [effectiveScenarios, selectedModuleFilter, globalFilter, moduleOptions]);

  const filteredBugs = useMemo(() => {
    const q = globalFilter.trim().toLowerCase();
    return bugReports.filter((b) => {
      if (selectedModuleFilter !== 'ALL' && b.moduleId !== 'GAP-AUDIT' && !matchesModule(b.moduleId, b.moduleName)) return false;
      if (q && !`${b.bugId} ${b.moduleName} ${b.title} ${b.actualResult}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [bugReports, selectedModuleFilter, globalFilter, moduleOptions]);

  const filteredUats = useMemo(() => {
    const q = globalFilter.trim().toLowerCase();
    return effectiveUatFlows.filter((u) => {
      if (!matchesModule(u.moduleId, u.moduleName)) return false;
      if (q && !`${u.uatId} ${u.moduleName} ${u.businessScenarioTitle}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [effectiveUatFlows, selectedModuleFilter, globalFilter, moduleOptions]);

  // Multi-column & scenario filtering supporting all 8 ISO 29119-4 techniques
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (!matchesModule(item.moduleId, item.moduleName) || (p0SmokeOnly && item.executionPriorityTier !== 'P0_CRITICAL_SMOKE')) return false;
      let matchScenario = true;
      if (scenarioFilter === 'POSITIVE') {
        matchScenario = item.scenarioType.startsWith('POSITIVE');
      } else if (scenarioFilter === 'BOUNDARY') {
        matchScenario = item.scenarioType.includes('BOUNDARY');
      } else if (scenarioFilter === 'NEGATIVE') {
        matchScenario = item.scenarioType.includes('NEGATIVE');
      } else if (scenarioFilter === 'STATE_CONCURRENCY') {
        matchScenario = item.scenarioType === 'STATE_TRANSITION' || item.scenarioType === 'CONCURRENCY_RACE';
      } else if (scenarioFilter === 'SECURITY_FUZZ') {
        matchScenario = ['SECURITY_INJECTION', 'API_CONTRACT_FUZZ', 'RESILIENCE_TIMEOUT'].includes(item.scenarioType);
      }

      const matchParity = parityFilter === 'ALL' || item.automationParityStatus === parityFilter;
      return matchScenario && matchParity;
    });
  }, [data, selectedModuleFilter, scenarioFilter, parityFilter, moduleOptions, p0SmokeOnly]);
  const columns = useMemo<ColumnDef<SynthesizedRtmRow>[]>(
    () => [
      {
        accessorKey: 'testId',
        header: 'TC ID',
        size: 80,
        cell: (info) => (
          <span className="font-mono font-bold text-[#3B82F6] whitespace-nowrap">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'moduleName',
        header: 'Fitur / Modul',
        size: 145,
        cell: (info) => (
          <div className="space-y-0.5">
            <span className="inline-block px-1.5 py-0.5 bg-[#2563EB]/15 border border-[#2563EB]/30 text-[#60A5FA] text-[9.5px] font-mono font-bold rounded-[2px] break-words">
              {(info.getValue() as string) || 'Core'}
            </span>
            {info.row.original.scenarioId && (
              <div className="text-[9px] text-[#707070] font-mono">{info.row.original.scenarioId}</div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'scenarioType',
        header: 'Scenario Type',
        size: 135,
        cell: (info) => {
          const type = String(info.getValue() || '');
          let badgeClass = 'bg-[#16191F] border-[#22262E] text-[#EDEDED]';
          if (type.startsWith('POSITIVE')) badgeClass = 'bg-[#059669]/15 border-[#059669] text-[#059669]';
          else if (type.includes('BOUNDARY')) badgeClass = 'bg-[#D97706]/15 border-[#D97706] text-[#D97706]';
          else if (type.includes('NEGATIVE')) badgeClass = 'bg-[#DC2626]/15 border-[#DC2626] text-[#DC2626]';
          else if (type === 'STATE_TRANSITION') badgeClass = 'bg-[#6366F1]/15 border-[#6366F1] text-[#818CF8]';
          else if (type === 'CONCURRENCY_RACE') badgeClass = 'bg-[#06B6D4]/15 border-[#06B6D4] text-[#22D3EE]';
          else if (type === 'SECURITY_INJECTION') badgeClass = 'bg-[#E11D48]/15 border-[#E11D48] text-[#FB7185]';
          else if (type === 'API_CONTRACT_FUZZ') badgeClass = 'bg-[#8B5CF6]/15 border-[#8B5CF6] text-[#A78BFA]';
          else if (type === 'RESILIENCE_TIMEOUT') badgeClass = 'bg-[#F97316]/15 border-[#F97316] text-[#FB923C]';
          return (
            <span className={`inline-block px-1.5 py-0.5 border text-[9px] font-mono font-bold rounded-[2px] leading-tight whitespace-nowrap ${badgeClass}`}>
              {type}
            </span>
          );
        },
      },
      {
        accessorKey: 'testTitle',
        header: 'Test Title & Step-by-Step Actions',
        size: 270,
        cell: (info) => (
          <div className="space-y-1 py-0.5">
            <div className="font-sans font-semibold text-[#EDEDED] text-[11.5px] leading-snug break-words whitespace-normal">
              {info.getValue() as string}
            </div>
            {info.row.original.manualSteps && info.row.original.manualSteps.length > 0 && (
              <ol className="text-[10px] text-[#A1A1A1] font-sans space-y-0.5 pl-3 list-decimal">
                {info.row.original.manualSteps.map((st) => (
                  <li key={st.stepNumber}>{st.action}</li>
                ))}
              </ol>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'testDataInput',
        header: 'Test Data',
        size: 160,
        cell: (info) => (
          <code className="text-[#38BDF8] text-[9.5px] font-mono break-all py-0.5 block leading-tight whitespace-pre-wrap">
            {info.getValue() as string}
          </code>
        ),
      },
      {
        accessorKey: 'expectedOutcome',
        header: 'Expected Result',
        size: 220,
        cell: (info) => (
          <div className="text-[#E5E7EB] text-[10.5px] leading-snug py-0.5 break-words whitespace-normal font-sans">
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: 'actualObservedResult',
        header: 'Actual Result (Live Web)',
        size: 230,
        cell: (info) => (
          <div className="text-[#A1A1A1] text-[10.5px] leading-snug py-0.5 break-words whitespace-normal font-sans">
            {(info.getValue() as string) || info.row.original.verificationLayers?.uiResult || 'Observed during crawl'}
          </div>
        ),
      },
      {
        accessorKey: 'executionVerdict',
        header: 'Verdict',
        size: 95,
        cell: (info) => {
          const verdict = (info.getValue() as string) || 'PASSED';
          return (
            <span
              className={`inline-block px-1.5 py-0.5 text-[9.5px] font-mono font-bold rounded-[2px] whitespace-nowrap border ${
                verdict === 'FAILED'
                  ? 'bg-[#DC2626]/20 text-[#EF4444] border-[#DC2626]'
                  : verdict === 'WARNING'
                  ? 'bg-[#D97706]/20 text-[#F59E0B] border-[#D97706]'
                  : 'bg-[#059669]/20 text-[#10B981] border-[#059669]'
              }`}
            >
              {verdict}
            </span>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      globalFilter,
      rowSelection,
    },
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Handle row click & keyboard navigation
  const handleRowClick = (row: SynthesizedRtmRow, rowIndex: number) => {
    setRowSelection({ [rowIndex]: true });
    if (onRowSelect) {
      onRowSelect(row, [row]);
    }
  };

  // Keyboard arrow navigation (ArrowUp / ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      const rows = table.getRowModel().rows;
      if (!rows.length) return;

      const currentIdx = rows.findIndex(
        (r, i) => selectedRowId === r.original.testId || rowSelection[i]
      );

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIdx = currentIdx < rows.length - 1 ? currentIdx + 1 : 0;
        const targetRow = rows[nextIdx];
        if (targetRow) {
          setRowSelection({ [nextIdx]: true });
          onRowSelect?.(targetRow.original, [targetRow.original]);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIdx = currentIdx > 0 ? currentIdx - 1 : rows.length - 1;
        const targetRow = rows[prevIdx];
        if (targetRow) {
          setRowSelection({ [prevIdx]: true });
          onRowSelect?.(targetRow.original, [targetRow.original]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [table, selectedRowId, rowSelection, onRowSelect]);

  // 1-Click Deterministic Exports
  const handleExportCsv = () => {
    const csvContent = generateTestRailCsv(filteredData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ISO29119_RTM_TestRail_Export.csv';
    link.click();
    if (onExportAction) onExportAction('Export CSV (TestRail/Jira format)');
  };

  const handleExportFeatureBundle = () => {
    const featureContent = generateFeatureBundle(filteredData);
    const blob = new Blob([featureContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'onespec_iso29119.feature';
    link.click();
    if (onExportAction) onExportAction('Export Cucumber Gherkin .feature Bundle');
  };

  const handleExportRtmMarkdown = () => {
    const mdContent = generateRtmMarkdown(filteredData);
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ISO29119_Requirement_Traceability_Matrix.md';
    link.click();
    if (onExportAction) onExportAction('Export ISO 29119 RTM Markdown Report');
  };

  const handleExportBugMarkdown = () => {
    const md = generateBugReportMarkdown(filteredBugs);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'OneSpec_Bug_Report_Log.md';
    link.click();
    if (onExportAction) onExportAction('Export Bug Report Markdown');
  };

  const handleExportBugCsv = () => {
    const csv = generateBugReportCsv(filteredBugs);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'OneSpec_Bug_Report_Log.csv';
    link.click();
    if (onExportAction) onExportAction('Export Bug Report CSV');
  };

  const handleExportExcelWorkbook = () => {
    const xls = unifiedReportGenerator.generateExcelQaWorkbookHtml({
      appName,
      targetUrl,
      testScenarios: filteredScenarios,
      rtmRows: filteredData,
      bugReports: filteredBugs,
      uatFlows: filteredUats,
      dataDictionary,
      compiledState: compiledState || undefined,
      locale,
    });
    const blob = new Blob([xls], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const slug = (appName || 'OneSpec').toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `OneSpec_QA_Workbook_${slug}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    if (onExportAction) onExportAction('Export Excel Workbook (.xls)');
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#111317] border border-[#22262E] rounded-[2px] overflow-hidden select-none">
      {/* TOP ROW: Feature / Module Filter Bar */}
      <div className="min-h-[34px] py-1 bg-[#111317] border-b border-[#22262E] px-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] shrink-0">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
          <span className="text-[#707070] uppercase font-bold flex items-center gap-1 shrink-0">
            <Filter className="h-3 w-3 text-[#3B82F6]" />
            <span>{copy.step04.modulesLabel}</span>
          </span>
          <button
            onClick={() => setSelectedModuleFilter('ALL')}
            className={`px-2 py-0.5 rounded-[2px] border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              selectedModuleFilter === 'ALL'
                ? 'bg-[#2563EB] text-white border-[#2563EB] font-bold'
                : 'bg-[#0B0C0E] text-[#A1A1A1] border-[#22262E] hover:text-[#EDEDED]'
            }`}
          >
            {copy.step04.allModules} ({moduleOptions.length})
          </button>
          {moduleOptions.length > 4 ? (
            <>
              <select
                aria-label="Filter by Feature Module"
                value={selectedModuleFilter}
                onChange={(e) => setSelectedModuleFilter(e.target.value)}
                className="h-6 px-2 bg-[#0B0C0E] border border-[#22262E] focus:border-[#3B82F6] text-[#EDEDED] rounded-[2px] outline-none cursor-pointer text-[10.5px] max-w-[240px]"
              >
                <option value="ALL">
                  {copy.step04.allModules} ({moduleOptions.length})
                </option>
                {moduleOptions.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.id}: {mod.name}
                  </option>
                ))}
              </select>
              {moduleOptions.slice(0, 3).map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModuleFilter(mod.id)}
                  className={`hidden 2xl:inline-flex px-2 py-0.5 rounded-[2px] border transition-colors cursor-pointer whitespace-nowrap max-w-[175px] truncate ${
                    selectedModuleFilter === mod.id
                      ? 'bg-[#2563EB] text-white border-[#2563EB] font-bold'
                      : 'bg-[#0B0C0E] text-[#A1A1A1] border-[#22262E] hover:text-[#EDEDED]'
                  }`}
                >
                  {mod.id}: {mod.name}
                </button>
              ))}
            </>
          ) : (
            moduleOptions.map((mod) => (
              <button
                key={mod.id}
                onClick={() => setSelectedModuleFilter(mod.id)}
                className={`px-2 py-0.5 rounded-[2px] border transition-colors cursor-pointer whitespace-nowrap ${
                  selectedModuleFilter === mod.id
                    ? 'bg-[#2563EB] text-white border-[#2563EB] font-bold'
                    : 'bg-[#0B0C0E] text-[#A1A1A1] border-[#22262E] hover:text-[#EDEDED]'
                }`}
              >
                {mod.id}: {mod.name}
              </button>
            ))
          )}
        </div>
        {/* Global Search */}
        <div className="flex items-center gap-1 bg-[#0B0C0E] border border-[#22262E] px-2 py-0.5 rounded-[2px] shrink-0">
          <Search className="h-3 w-3 text-[#707070]" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={copy.step04.searchPlaceholder}
            className="bg-transparent border-none outline-none text-[#EDEDED] text-[10.5px] w-44 font-mono"
          />
        </div>
      </div>

      {/* SECOND ROW: 4-Tab QA Workbook Switcher */}
      <div className="min-h-[36px] py-1 bg-[#16191F] border-b border-[#22262E] px-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] shrink-0">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setActiveWorkbookTab('SCENARIO_MATRIX')}
            className={`px-2.5 py-1 rounded-[2px] border flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap text-[10.5px] ${
              activeWorkbookTab === 'SCENARIO_MATRIX'
                ? 'bg-[#111317] text-[#EDEDED] font-bold border-[#3B82F6]'
                : 'text-[#A1A1A1] border-transparent hover:text-[#EDEDED]'
            }`}
          >
            <Layers className="h-3 w-3 text-[#3B82F6]" />
            <span>{copy.step04.tabScenarios} ({filteredScenarios.length})</span>
          </button>

          <button
            onClick={() => setActiveWorkbookTab('DETAILED_CASES')}
            className={`px-2.5 py-1 rounded-[2px] border flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap text-[10.5px] ${
              activeWorkbookTab === 'DETAILED_CASES'
                ? 'bg-[#111317] text-[#EDEDED] font-bold border-[#3B82F6]'
                : 'text-[#A1A1A1] border-transparent hover:text-[#EDEDED]'
            }`}
          >
            <CheckCircle2 className="h-3 w-3 text-[#10B981]" />
            <span>{copy.step04.tabCases} ({filteredData.length})</span>
          </button>

          <button
            onClick={() => setActiveWorkbookTab('BUG_REPORTS')}
            className={`px-2.5 py-1 rounded-[2px] border flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap text-[10.5px] ${
              activeWorkbookTab === 'BUG_REPORTS'
                ? 'bg-[#111317] text-[#EDEDED] font-bold border-[#EF4444]'
                : 'text-[#A1A1A1] border-transparent hover:text-[#EDEDED]'
            }`}
          >
            <Bug className={`h-3 w-3 ${filteredBugs.length > 0 ? 'text-[#EF4444]' : 'text-[#707070]'}`} />
            <span>{copy.step04.tabDefects} ({filteredBugs.length})</span>
          </button>

          <button
            onClick={() => setActiveWorkbookTab('UAT_SIGNOFF')}
            className={`px-2.5 py-1 rounded-[2px] border flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap text-[10.5px] ${
              activeWorkbookTab === 'UAT_SIGNOFF'
                ? 'bg-[#111317] text-[#EDEDED] font-bold border-[#3B82F6]'
                : 'text-[#A1A1A1] border-transparent hover:text-[#EDEDED]'
            }`}
          >
            <ShieldCheck className="h-3 w-3 text-[#F59E0B]" />
            <span>{copy.step04.tabUat} ({filteredUats.length})</span>
          </button>
        </div>

        {/* Contextual Right Export Actions */}
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {onSaveOverridesToVault && (
            <button
              onClick={onSaveOverridesToVault}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[10px] font-bold cursor-pointer transition-colors border ${
                hasUnsavedOverrides
                  ? 'bg-[#059669] hover:bg-[#047857] text-white border-[#10B981]'
                  : 'bg-[#111317] hover:border-[#10B981] text-[#10B981] border-[#22262E]'
              }`}
              title={isId ? 'Simpan perubahan status Bug / catatan UAT ke Vault permanen' : 'Save Bug / UAT overrides to Vault'}
            >
              <Save className="h-3 w-3" />
              <span>{isId ? 'Simpan Perubahan ke Vault' : 'Save Changes to Vault'}</span>
            </button>
          )}
          <button
            onClick={() => setIsCrOpen((prev) => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1 border rounded-[2px] text-[10px] font-bold cursor-pointer transition-colors ${
              isCrOpen
                ? 'bg-[#D97706] border-[#F59E0B] text-white'
                : 'bg-[#111317] border-[#F59E0B]/50 hover:border-[#F59E0B] text-[#F59E0B]'
            }`}
            title="Simulasi Change Request (CR) & Analisis Dampak Regresi"
          >
            <Zap className="h-3 w-3" />
            <span>{isId ? 'Simulasi CR & Dampak' : 'CR Impact Analyzer'}</span>
          </button>
          <button
            onClick={handleExportExcelWorkbook}
            className="flex items-center gap-1 px-2 py-1 bg-[#111317] border border-[#22262E] hover:border-[#10B981] text-[#10B981] rounded-[2px] text-[10px] font-bold cursor-pointer transition-colors"
            title="Download Excel QA Workbook & Data Dictionary (.xls)"
          >
            <FileSpreadsheet className="h-3 w-3" />
            <span>Excel (.xls)</span>
          </button>
          {activeWorkbookTab === 'BUG_REPORTS' ? (
            <>
              <button
                onClick={handleExportBugMarkdown}
                className="flex items-center gap-1 px-2.5 py-1 bg-[#111317] border border-[#22262E] hover:border-[#EF4444] text-[#EDEDED] rounded-[2px] text-[10px] font-bold cursor-pointer transition-colors"
              >
                <Download className="h-3 w-3 text-[#EF4444]" />
                <span>{copy.step04.exportDefectMd}</span>
              </button>
              <button
                onClick={handleExportBugCsv}
                className="flex items-center gap-1 px-2.5 py-1 bg-[#111317] border border-[#22262E] hover:border-[#3B82F6] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] text-[10px] font-bold cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="h-3 w-3 text-[#059669]" />
                <span>{copy.step04.exportDefectCsv}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1 px-2 py-1 bg-[#111317] border border-[#22262E] hover:border-[#3B82F6] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] text-[10px] font-bold cursor-pointer transition-colors"
                title="Export CSV in TestRail / Jira / Zephyr format"
              >
                <FileSpreadsheet className="h-3 w-3 text-[#059669]" />
                <span>{copy.step04.exportCsv}</span>
              </button>
              <button
                onClick={handleExportFeatureBundle}
                className="flex items-center gap-1 px-2 py-1 bg-[#111317] border border-[#22262E] hover:border-[#3B82F6] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] text-[10px] font-bold cursor-pointer transition-colors"
                title="Export Gherkin .feature specification bundle"
              >
                <FileCode className="h-3 w-3 text-[#3B82F6]" />
                <span>{copy.step04.exportFeature}</span>
              </button>
              <button
                onClick={handleExportRtmMarkdown}
                className="flex items-center gap-1 px-2 py-1 bg-[#111317] border border-[#22262E] hover:border-[#3B82F6] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] text-[10px] font-bold cursor-pointer transition-colors"
                title="Export ISO/IEC/IEEE 29119-3 Traceability Matrix Markdown"
              >
                <FileText className="h-3 w-3 text-[#D97706]" />
                <span>{copy.step04.exportMarkdown}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* COLLAPSIBLE CHANGE REQUEST (CR) & BLAST-RADIUS IMPACT ANALYZER */}
      {isCrOpen && (
        <div className="bg-[#0B0C0E] border-b border-[#F59E0B]/40 px-3 py-2.5 space-y-2.5 font-mono text-[11px] shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[#F59E0B] font-bold">
              <Zap className="h-3.5 w-3.5" />
              <span>
                {isId
                  ? 'Simulasi Change Request (CR) & Analisis Dampak Regresi'
                  : 'Change Request (CR) & Blast-Radius Impact Analyzer'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            <select
              value={crModuleId}
              onChange={(e) => setCrModuleId(e.target.value)}
              aria-label="Target Module for Change Request"
              className="md:col-span-3 h-8 px-2 bg-[#111317] border border-[#22262E] text-[#EDEDED] rounded-[2px] outline-none cursor-pointer"
            >
              {moduleOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}: {m.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={crTitle}
              onChange={(e) => setCrTitle(e.target.value)}
              placeholder={
                isId
                  ? 'Judul CR (mis. Tambah validasi diskon maks 15% & filter tanggal)'
                  : 'CR Title (e.g. Add max 15% discount & date filter)'
              }
              className="md:col-span-4 h-8 px-2.5 bg-[#111317] border border-[#22262E] text-[#EDEDED] rounded-[2px] outline-none select-text"
            />
            <input
              type="text"
              value={crDescription}
              onChange={(e) => setCrDescription(e.target.value)}
              placeholder={isId ? 'Detail field / API terdampak...' : 'Affected fields / APIs...'}
              className="md:col-span-3 h-8 px-2.5 bg-[#111317] border border-[#22262E] text-[#EDEDED] rounded-[2px] outline-none select-text"
            />
            <button
              type="button"
              onClick={() => {
                const report = changeImpactService.analyzeChangeRequestImpact(compiledState, {
                  targetModuleId: crModuleId || moduleOptions[0]?.id || 'MOD-01',
                  changeTitle: crTitle || 'Perubahan Aturan & Filter Modul',
                  changeDescription: crDescription || crTitle || 'Penambahan aturan validasi dan filter baru',
                  affectedFieldsOrApis: crDescription,
                });
                setCrReport(report);
              }}
              className="md:col-span-2 h-8 px-2.5 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-[2px] cursor-pointer flex items-center justify-center gap-1"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{isId ? 'Analisis Dampak & Generate Test Case CR' : 'Analyze Impact & Generate CR TCs'}</span>
            </button>
          </div>
          {crReport && (
            <div className="p-2.5 bg-[#111317] border border-[#22262E] rounded-[2px] space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[#F59E0B]">
                  {crReport.crId}: {crReport.targetModuleName} ({crReport.regressionTestCasesToReRun.length} regresi, {crReport.newlySynthesizedTestCases.length} TC baru)
                </span>
                {onMergeChangeRequest && (
                  <button
                    type="button"
                    onClick={() => onMergeChangeRequest(crReport)}
                    className="h-7 px-3 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-[2px] cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>
                      {isId
                        ? `Tambahkan ${crReport.newlySynthesizedTestCases.length} Test Case CR Ini ke Matriks Project & Simpan ke Vault`
                        : `Add ${crReport.newlySynthesizedTestCases.length} CR Test Cases to Project Matrix & Save Vault`}
                    </span>
                  </button>
                )}
              </div>
              <p className="text-[#D4D4D8] font-sans text-[11.5px]">
                {isId ? crReport.plainImpactSummaryId : crReport.plainImpactSummaryEn}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px]">
                <div className="p-2 bg-[#0B0C0E] border border-[#22262E] rounded-[2px]">
                  <span className="text-[#707070] uppercase font-bold block">API Terdampak ({crReport.impactedApis.length})</span>
                  <span className="text-[#60A5FA]">{crReport.impactedApis.join(', ')}</span>
                </div>
                <div className="p-2 bg-[#0B0C0E] border border-[#22262E] rounded-[2px]">
                  <span className="text-[#707070] uppercase font-bold block">Tabel DB & BRD/VR</span>
                  <span className="text-[#10B981]">{crReport.impactedTables.join(', ')} · {crReport.impactedBrdAndVrIds.slice(0, 4).join(', ')}</span>
                </div>
                <div className="p-2 bg-[#0B0C0E] border border-[#22262E] rounded-[2px]">
                  <span className="text-[#707070] uppercase font-bold block">Wajib Re-Test ({crReport.regressionTestCasesToReRun.length})</span>
                  <span className="text-[#F59E0B]">{crReport.regressionTestCasesToReRun.slice(0, 6).map((r) => r.testId).join(', ')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: Test Scenario Matrix (Per Fitur) */}
      {activeWorkbookTab === 'SCENARIO_MATRIX' && (
        <div className="flex-1 overflow-auto bg-[#0E1015]">
          <table className="w-full text-left font-mono text-[11px] border-collapse">
            <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] sticky top-0 z-10">
              <tr className="h-[30px]">
                <th className="py-1.5 px-3 w-[125px] border-r border-[#22262E] uppercase text-[10px]">{copy.step04.colScenarioId}</th>
                <th className="py-1.5 px-3 w-[180px] border-r border-[#22262E] uppercase text-[10px]">{copy.step04.colFeatureModule}</th>
                <th className="py-1.5 px-3 w-[185px] border-r border-[#22262E] uppercase text-[10px]">{copy.step04.colCategory}</th>
                <th className="py-1.5 px-3 border-r border-[#22262E] uppercase text-[10px]">{copy.step04.colScenarioCoverage}</th>
                <th className="py-1.5 px-3 w-[135px] uppercase text-[10px]">{copy.step04.colLinkedTcs}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22262E] bg-[#111317]">
              {filteredScenarios.map((sc) => (
                <tr
                  key={sc.scenarioId}
                  onClick={() => {
                    const targetTc = data.find((r) => sc.linkedTestCaseIds.includes(r.testId));
                    setActiveWorkbookTab('DETAILED_CASES');
                    if (targetTc && onRowSelect) onRowSelect(targetTc, [targetTc]);
                  }}
                  className="hover:bg-[#16191F] cursor-pointer transition-colors"
                >
                  <td className="py-2 px-3 font-bold text-[#3B82F6] border-r border-[#22262E] whitespace-nowrap align-top">
                    {sc.scenarioId}
                  </td>
                  <td className="py-2 px-3 border-r border-[#22262E] align-top">
                    <div className="font-bold text-[#EDEDED]">{sc.moduleName}</div>
                    <div className="text-[9.5px] text-[#707070]">{sc.routePath}</div>
                  </td>
                  <td className="py-2 px-3 border-r border-[#22262E] align-top">
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[9.5px] font-bold rounded-[2px] border ${
                        sc.category.startsWith('POSITIVE') || sc.category === 'CARD_DETAIL_WORKFLOW'
                          ? 'bg-[#059669]/15 text-[#10B981] border-[#059669]/50'
                          : sc.category.startsWith('NEGATIVE')
                          ? 'bg-[#DC2626]/15 text-[#EF4444] border-[#DC2626]/50'
                          : sc.category === 'BOUNDARY_FORMAT' || sc.category === 'BVA_PAGINATION'
                          ? 'bg-[#D97706]/15 text-[#F59E0B] border-[#D97706]/50'
                          : sc.category === 'MULTI_TAB_INTEGRITY' || sc.category === 'FILTER_COMBINATION_MATRIX'
                          ? 'bg-[#2563EB]/15 text-[#60A5FA] border-[#2563EB]/50'
                          : 'bg-[#8B5CF6]/15 text-[#A78BFA] border-[#8B5CF6]/50'
                      }`}
                    >
                      {sc.category}
                    </span>
                  </td>
                  <td className="py-2 px-3 border-r border-[#22262E] align-top font-sans">
                    <div className="text-[#EDEDED] font-semibold text-[11.5px]">{sc.title}</div>
                    <div className="text-[#A1A1A1] text-[10.5px] mt-0.5">{sc.description}</div>
                  </td>
                  <td className="py-2 px-3 align-top">
                    <div className="flex flex-wrap gap-1">
                      {sc.linkedTestCaseIds.map((tcId) => (
                        <span key={tcId} className="px-1.5 py-0.5 bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40 rounded-[2px] text-[9.5px] font-bold">
                          {tcId}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: Detailed Test Cases & Test Report (Expected vs Actual) */}
      {activeWorkbookTab === 'DETAILED_CASES' && (
        <>
          <div className="min-h-[30px] py-1 bg-[#111317] border-b border-[#22262E] px-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] shrink-0">
            <div className="flex items-center gap-1 bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[2px] overflow-x-auto">
              <button
                type="button"
                aria-pressed={p0SmokeOnly}
                onClick={() => setP0SmokeOnly((active) => !active)}
                className={`px-2 py-0.5 rounded-[2px] text-[9.5px] font-mono font-bold whitespace-nowrap cursor-pointer ${p0SmokeOnly ? 'bg-[#059669] text-white' : 'text-[#A1A1A1] hover:text-white'}`}
              >
                P0 CRITICAL SMOKE {p0SmokeOnly ? 'ON' : 'OFF'}
              </button>
              {[
                { id: 'ALL', label: 'ALL' },
                { id: 'POSITIVE', label: 'POSITIVE' },
                { id: 'BOUNDARY', label: 'BOUNDARY (BVA)' },
                { id: 'NEGATIVE', label: 'NEGATIVE' },
                { id: 'STATE_CONCURRENCY', label: 'STATE & CONCURRENCY' },
                { id: 'SECURITY_FUZZ', label: 'SECURITY & FUZZ' },
              ].map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => setScenarioFilter(sc.id)}
                  className={`px-2 py-0.5 rounded-[2px] text-[9.5px] font-mono font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    scenarioFilter === sc.id
                      ? 'bg-[#2563EB] text-white'
                      : 'text-[#707070] hover:text-[#EDEDED]'
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>
            <span className="px-2 py-0.5 bg-[#0B0C0E] border border-[#22262E] text-[10px] font-bold text-[#3B82F6] rounded-[2px] tabular-nums">
              {table.getRowModel().rows.length} / {data.length} TEST CASES
            </span>
          </div>
          <div className="flex-1 overflow-auto bg-[#0E1015] relative">
            <table className="w-full text-left font-mono text-[11px] border-collapse">
              <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] sticky top-0 z-10 shadow-sm">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="h-[28px]">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className="py-1 px-2.5 border-r border-[#22262E] font-semibold text-[10px] uppercase tracking-wider text-[#A1A1A1] truncate whitespace-nowrap"
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-[#22262E] bg-[#111317]">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-12 text-[#707070]">
                      {copy.step04.noMatchingCases}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row, idx) => {
                    const isSelected = selectedRowId === row.original.testId || rowSelection[idx];
                    return (
                      <tr
                        key={row.id}
                        onClick={() => handleRowClick(row.original, idx)}
                        className={`min-h-[36px] cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#16191F] border-l-2 border-l-[#2563EB]' : 'hover:bg-[#16191F]/60'
                        }`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="py-1.5 px-2.5 border-r border-[#22262E] align-top">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* TAB 3: Bug Report & Defect Log */}
      {activeWorkbookTab === 'BUG_REPORTS' && (
        <div className="flex-1 overflow-auto bg-[#0E1015]">
          {filteredBugs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center font-mono space-y-2">
              <CheckCircle2 className="h-7 w-7 text-[#10B981]" />
              <div className="text-[#EDEDED] font-bold text-[12px]">{copy.step04.noDefectsTitle}</div>
              <div className="text-[#707070] text-[11px]">{copy.step04.noDefectsDesc}</div>
            </div>
          ) : (
            <table className="w-full text-left font-mono text-[11px] border-collapse">
              <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] sticky top-0 z-10">
                <tr className="h-[30px]">
                  <th className="py-1.5 px-3 w-[90px] border-r border-[#22262E] uppercase text-[10px]">{copy.step04.colBugId}</th>
                  <th className="py-1.5 px-3 w-[160px] border-r border-[#22262E] uppercase text-[10px]">{copy.step04.colFeatureModule}</th>
                  <th className="py-1.5 px-3 w-[110px] border-r border-[#22262E] uppercase text-[10px]">{copy.step04.colSeverity}</th>
                  <th className="py-1.5 px-3 w-[210px] border-r border-[#22262E] uppercase text-[10px]">{copy.step04.colDefectSteps}</th>
                  <th className="py-1.5 px-3 w-[230px] border-r border-[#22262E] uppercase text-[10px]">{copy.step04.colExpectedActual}</th>
                  <th className="py-1.5 px-3 uppercase text-[10px]">{copy.step04.colEvidenceFix}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22262E] bg-[#111317]">
                {filteredBugs.map((bug) => (
                  <tr key={bug.bugId} className="hover:bg-[#16191F]">
                    <td className="py-2.5 px-3 font-bold text-[#EF4444] border-r border-[#22262E] align-top whitespace-nowrap">
                      {bug.bugId}
                      <div className="text-[9px] text-[#707070] mt-0.5">{bug.priority}</div>
                      <select
                        aria-label={`Bug status for ${bug.bugId}`}
                        value={bug.status}
                        onChange={(e) => onUpdateBugStatus?.(bug.bugId, e.target.value as 'OPEN' | 'FIXED' | 'VERIFIED')}
                        className={`mt-1 px-1.5 py-0.5 rounded-[2px] border text-[9.5px] font-bold outline-none cursor-pointer ${
                          bug.status === 'VERIFIED'
                            ? 'bg-[#059669]/20 text-[#10B981] border-[#059669]'
                            : bug.status === 'FIXED'
                            ? 'bg-[#2563EB]/20 text-[#60A5FA] border-[#2563EB]'
                            : 'bg-[#DC2626]/20 text-[#EF4444] border-[#DC2626]'
                        }`}
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="FIXED">FIXED</option>
                        <option value="VERIFIED">VERIFIED</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#22262E] align-top">
                      <div className="text-[#EDEDED] font-bold">{bug.moduleName}</div>
                      <div className="text-[9.5px] text-[#60A5FA] break-all">{bug.featureUrl}</div>
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#22262E] align-top">
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[9.5px] font-bold rounded-[2px] border ${
                          bug.severity === 'CRITICAL'
                            ? 'bg-[#DC2626]/25 text-[#EF4444] border-[#EF4444]'
                            : bug.severity === 'MAJOR'
                            ? 'bg-[#D97706]/20 text-[#F59E0B] border-[#D97706]'
                            : 'bg-[#2563EB]/20 text-[#60A5FA] border-[#2563EB]'
                        }`}
                      >
                        {bug.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#22262E] align-top font-sans">
                      <div className="text-[#EDEDED] font-semibold text-[11.5px]">{bug.title}</div>
                      <ol className="text-[10px] text-[#A1A1A1] mt-1 pl-3.5 list-decimal space-y-0.5">
                        {bug.stepsToReproduce.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ol>
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#22262E] align-top font-sans text-[10.5px] space-y-1">
                      <div>
                        <span className="text-[#10B981] font-mono font-bold text-[9.5px]">EXPECTED: </span>
                        <span className="text-[#EDEDED]">{bug.expectedResult}</span>
                      </div>
                      <div>
                        <span className="text-[#EF4444] font-mono font-bold text-[9.5px]">ACTUAL: </span>
                        <span className="text-[#F87171]">{bug.actualResult}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 align-top space-y-1">
                      <code className="block text-[9.5px] text-[#38BDF8] bg-[#0B0C0E] p-1.5 border border-[#22262E] rounded-[2px] break-all">
                        {bug.technicalEvidence}
                      </code>
                      <div className="text-[10px] text-[#10B981] font-sans">Fix: {bug.recommendedFix}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 4: E2E & UAT Sign-Off Matrix */}
      {activeWorkbookTab === 'UAT_SIGNOFF' && (
        <div className="flex-1 overflow-auto bg-[#0E1015] p-3 space-y-2.5">
          {filteredUats.map((uat) => {
            const matchedModSurface = featureModules.find(
              (fm) => fm.moduleId === uat.moduleId || fm.moduleName === uat.moduleName || fm.routePath === uat.routePath
            );
            return (
            <div key={uat.uatId} className="bg-[#111317] border border-[#22262E] rounded-[3px] p-3 space-y-2.5 font-mono text-[11px]">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#22262E]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#3B82F6]">{uat.uatId}</span>
                  <span className="font-bold text-[#EDEDED]">{uat.moduleName}</span>
                  <span className="text-[10px] text-[#60A5FA] bg-[#0B0C0E] px-1.5 py-0.5 border border-[#22262E] rounded-[2px]">
                    {uat.routePath}
                  </span>
                  <span className="text-[10px] text-[#707070]">{uat.userRole}</span>
                </div>
                <select
                  aria-label={`UAT status for ${uat.uatId}`}
                  value={uat.uatStatus}
                  onChange={(e) => onUpdateUat?.(uat.uatId, e.target.value as UatFeatureFlow['uatStatus'], uat.testerNotes)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-[2px] border outline-none cursor-pointer ${
                    uat.uatStatus === 'ACCEPTED'
                      ? 'bg-[#059669]/20 text-[#10B981] border-[#059669]'
                      : uat.uatStatus === 'ACCEPTED_WITH_NOTES'
                      ? 'bg-[#D97706]/20 text-[#F59E0B] border-[#D97706]'
                      : 'bg-[#DC2626]/20 text-[#EF4444] border-[#DC2626]'
                  }`}
                >
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="ACCEPTED_WITH_NOTES">ACCEPTED_WITH_NOTES</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 font-sans">
                <div className={`${matchedModSurface?.screenshotDataUrl ? 'lg:col-span-4' : 'lg:col-span-6'} bg-[#0B0C0E] border border-[#22262E] p-2.5 rounded-[2px] space-y-1`}>
                  <div className="font-mono text-[10px] text-[#707070] uppercase font-bold">{copy.step04.uatJourneyHeader}</div>
                  <div className="text-[#EDEDED] font-semibold text-[11.5px]">{uat.businessScenarioTitle}</div>
                  <div className="space-y-0.5 text-[10.5px] text-[#A1A1A1] pt-1">
                    {uat.endToEndJourneySteps.map((st, idx) => (
                      <div key={idx}>{st}</div>
                    ))}
                  </div>
                </div>

                <div className={`${matchedModSurface?.screenshotDataUrl ? 'lg:col-span-5' : 'lg:col-span-6'} bg-[#0B0C0E] border border-[#22262E] p-2.5 rounded-[2px] space-y-1.5`}>
                  <div className="font-mono text-[10px] text-[#707070] uppercase font-bold">{copy.step04.uatCriteriaHeader}</div>
                  {uat.acceptanceCriteria.map((ac, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-2 text-[10.5px] border-b border-[#22262E]/60 pb-1 last:border-b-0">
                      <div className="min-w-0">
                        <div className="text-[#EDEDED] font-medium">{ac.criterion}</div>
                        <div className="text-[10px] text-[#A1A1A1]">
                          Exp: {ac.expected} · <span className={ac.passed ? 'text-[#10B981]' : 'text-[#EF4444]'}>Actual: {ac.actual}</span>
                        </div>
                      </div>
                      <span
                        className={`px-1.5 py-0.2 rounded-[2px] text-[9px] font-mono font-bold shrink-0 ${
                          ac.passed ? 'bg-[#059669]/20 text-[#10B981]' : 'bg-[#DC2626]/20 text-[#EF4444]'
                        }`}
                      >
                        {ac.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  ))}
                </div>

                {matchedModSurface?.screenshotDataUrl && (
                  <div className="lg:col-span-3 bg-[#0B0C0E] border border-[#22262E] p-2 rounded-[2px] flex flex-col gap-1.5">
                    <div className="font-mono text-[9.5px] text-[#10B981] uppercase font-bold flex items-center gap-1">
                      <Camera className="h-3 w-3" />
                      <span>{isId ? 'Bukti Visual UAT' : 'UAT Visual Proof'}</span>
                    </div>
                    <ModuleScreenshot
                      src={matchedModSurface.screenshotDataUrl}
                      blueprintDataUrl={buildFeatureModuleBlueprintSvgDataUrl({
                        moduleName: matchedModSurface.moduleName,
                        routePath: matchedModSurface.routePath,
                        pageHeading: matchedModSurface.moduleName,
                      })}
                      alt={uat.moduleName}
                      className="w-full h-28 object-cover object-top rounded-[2px] border border-[#22262E] bg-[#0F172A]"
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-[10.5px] text-[#A1A1A1] font-sans">
                <strong className="font-mono text-[10px] text-[#707070] shrink-0">{copy.step04.uatTesterNotes}</strong>
                <input
                  type="text"
                  aria-label={`Tester notes for ${uat.uatId}`}
                  value={uat.testerNotes}
                  onChange={(e) => onUpdateUat?.(uat.uatId, uat.uatStatus, e.target.value)}
                  className="flex-1 bg-[#0B0C0E] border border-[#22262E] focus:border-[#3B82F6] text-[#EDEDED] px-2 py-1 rounded-[2px] outline-none text-[11px] select-text"
                />
              </div>
            </div>
          );
          })}
        </div>
      )}

      {/* Grid Footer Status Bar */}
      <div className="min-h-[26px] py-1 bg-[#16191F] border-t border-[#22262E] px-3 flex items-center justify-between gap-3 text-[10px] font-mono text-[#707070] shrink-0">
        <div className="flex items-center gap-3 tabular-nums whitespace-nowrap shrink-0">
          <span>ISO/IEC/IEEE 29119-3:2022</span>
          <span>{copy.step04.modulesStat} <strong className="text-[#3B82F6]">{moduleOptions.length}</strong> · {copy.step04.defectsStat} <strong className={filteredBugs.length > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}>{filteredBugs.length}</strong></span>
        </div>
        <div className="truncate text-right">
          <span>{copy.step04.footerHint}</span>
        </div>
      </div>
    </div>
  );
}
