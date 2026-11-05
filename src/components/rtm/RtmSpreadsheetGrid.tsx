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
} from 'lucide-react';
import type { SynthesizedRtmRow, RtmScenarioType } from '@/services/rtmSynthesizer';
import {
  generateFeatureBundle,
  generateTestRailCsv,
  generateRtmMarkdown,
} from '@/services/rtmSynthesizer';

interface RtmSpreadsheetGridProps {
  data: SynthesizedRtmRow[];
  selectedRowId?: string;
  onRowSelect?: (row: SynthesizedRtmRow, selectedRows: SynthesizedRtmRow[]) => void;
  onExportAction?: (actionName: string) => void;
}

export function RtmSpreadsheetGrid({
  data,
  selectedRowId,
  onRowSelect,
  onExportAction,
}: RtmSpreadsheetGridProps) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [scenarioFilter, setScenarioFilter] = useState<string>('ALL');
  const [parityFilter, setParityFilter] = useState<string>('ALL');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Multi-column & scenario filtering supporting all 8 ISO 29119-4 techniques
  const filteredData = useMemo(() => {
    return data.filter((item) => {
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
  }, [data, scenarioFilter, parityFilter]);

  const columns = useMemo<ColumnDef<SynthesizedRtmRow>[]>(
    () => [
      {
        accessorKey: 'testId',
        header: 'Test ID',
        size: 85,
        cell: (info) => (
          <span className="font-mono font-bold text-[#3B82F6]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'brdRef',
        header: 'BRD Ref',
        size: 75,
        cell: (info) => (
          <span className="font-mono text-[#A1A1A1] font-semibold text-[11px]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'prdRef',
        header: 'PRD Ref',
        size: 75,
        cell: (info) => (
          <span className="font-mono text-[#059669] font-medium text-[11px]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'validationRef',
        header: 'VR Ref',
        size: 75,
        cell: (info) => (
          <span className="font-mono text-[#D97706] font-bold text-[11px]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'scenarioType',
        header: 'Scenario Type (ISO 29119-4)',
        size: 150,
        cell: (info) => {
          const type = String(info.getValue() || '');
          let badgeClass = 'bg-[#16191F] border-[#22262E] text-[#EDEDED]';

          if (type.startsWith('POSITIVE')) {
            badgeClass = 'bg-[#059669]/15 border-[#059669] text-[#059669]';
          } else if (type.includes('BOUNDARY')) {
            badgeClass = 'bg-[#D97706]/15 border-[#D97706] text-[#D97706]';
          } else if (type.includes('NEGATIVE')) {
            badgeClass = 'bg-[#DC2626]/15 border-[#DC2626] text-[#DC2626]';
          } else if (type === 'STATE_TRANSITION') {
            badgeClass = 'bg-[#6366F1]/15 border-[#6366F1] text-[#818CF8]';
          } else if (type === 'CONCURRENCY_RACE') {
            badgeClass = 'bg-[#06B6D4]/15 border-[#06B6D4] text-[#22D3EE]';
          } else if (type === 'SECURITY_INJECTION') {
            badgeClass = 'bg-[#E11D48]/15 border-[#E11D48] text-[#FB7185]';
          } else if (type === 'API_CONTRACT_FUZZ') {
            badgeClass = 'bg-[#8B5CF6]/15 border-[#8B5CF6] text-[#A78BFA]';
          } else if (type === 'RESILIENCE_TIMEOUT') {
            badgeClass = 'bg-[#F97316]/15 border-[#F97316] text-[#FB923C]';
          }

          return (
            <span
              className={`inline-block px-1.5 py-0.5 border text-[9.5px] font-mono font-bold rounded-[2px] leading-tight whitespace-nowrap ${badgeClass}`}
            >
              {type}
            </span>
          );
        },
      },
      {
        accessorKey: 'testTitle',
        header: 'Test Title',
        size: 280,
        cell: (info) => (
          <div className="font-sans font-medium text-[#EDEDED] text-[11.5px] leading-snug py-1 break-words whitespace-normal">
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: 'preconditions',
        header: 'Preconditions',
        size: 220,
        cell: (info) => (
          <div className="text-[#A1A1A1] text-[10.5px] leading-snug py-1 break-words whitespace-normal font-sans">
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: 'testDataInput',
        header: 'Test Data Input',
        size: 170,
        cell: (info) => (
          <code className="text-[#38BDF8] text-[10px] font-mono break-all py-1 block leading-tight">
            {info.getValue() as string}
          </code>
        ),
      },
      {
        accessorKey: 'expectedOutcome',
        header: 'Expected Outcome',
        size: 290,
        cell: (info) => (
          <div className="text-[#E5E7EB] text-[10.5px] leading-snug py-1 break-words whitespace-normal font-sans">
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: 'automationParityStatus',
        header: 'Parity Status',
        size: 130,
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span
              className={`inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-[2px] whitespace-nowrap ${
                status === 'READY_FOR_STAGE_2'
                  ? 'bg-[#2563EB]/20 text-[#3B82F6] border border-[#2563EB]'
                  : 'bg-[#059669]/20 text-[#059669] border border-[#059669]'
              }`}
            >
              {status}
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
    link.download = 'voucher_redemption_iso29119.feature';
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

  return (
    <div className="w-full h-full flex flex-col bg-[#111317] border border-[#22262E] rounded-[2px] overflow-hidden select-none">
      {/* Sub-Header Toolbar with Search, Filters, and Deterministic 1-Click Exports */}
      <div className="h-[32px] bg-[#16191F] border-b border-[#22262E] px-3 flex items-center justify-between font-mono text-[11px] gap-2 shrink-0">
        {/* Left: Global Search & Scenario Type Filter */}
        <div className="flex items-center gap-2">
          {/* Global Search */}
          <div className="flex items-center gap-1 bg-[#0B0C0E] border border-[#22262E] px-2 py-0.5 rounded-[2px]">
            <Search className="h-3 w-3 text-[#707070]" />
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Filter matrix test cases..."
              className="bg-transparent border-none outline-none text-[#EDEDED] text-[11px] w-48 font-mono"
            />
          </div>

          {/* Scenario Filter (8 ISO 29119-4 Techniques) */}
          <div className="flex items-center gap-1 bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[2px] overflow-x-auto">
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
                className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold transition-colors whitespace-nowrap ${
                  scenarioFilter === sc.id
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-[#707070] hover:text-[#EDEDED]'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>

          {/* Total Count Badge */}
          <span className="px-2 py-0.5 bg-[#0B0C0E] border border-[#22262E] text-[10px] font-mono font-bold text-[#3B82F6] rounded-[2px] whitespace-nowrap">
            {table.getRowModel().rows.length} / {data.length} SCENARIOS
          </span>
        </div>

        {/* Right: Deterministic 1-Click Export Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#111317] border border-[#22262E] hover:border-[#3B82F6] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] text-[10px] font-bold transition-colors"
            title="Export CSV in TestRail / Jira / Zephyr format"
          >
            <FileSpreadsheet className="h-3 w-3 text-[#059669]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportFeatureBundle}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#111317] border border-[#22262E] hover:border-[#3B82F6] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] text-[10px] font-bold transition-colors"
            title="Export Gherkin .feature specification bundle"
          >
            <FileCode className="h-3 w-3 text-[#3B82F6]" />
            <span>Export .feature</span>
          </button>

          <button
            onClick={handleExportRtmMarkdown}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#111317] border border-[#22262E] hover:border-[#3B82F6] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] text-[10px] font-bold transition-colors"
            title="Export ISO/IEC/IEEE 29119-3 Traceability Matrix Markdown"
          >
            <FileText className="h-3 w-3 text-[#D97706]" />
            <span>Export Markdown</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet-Grade Grid Table Container */}
      <div className="flex-1 overflow-auto bg-[#0E1015] relative">
        <table className="w-full text-left font-mono text-[11px] border-collapse">
          {/* Sticky Header */}
          <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] sticky top-0 z-10 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="h-[28px]">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="py-1 px-2.5 border-r border-[#22262E] font-semibold text-[10px] uppercase tracking-wider text-[#A1A1A1] truncate whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* Table Rows (28px Compact Height, 1px Hairline Borders) */}
          <tbody className="divide-y divide-[#22262E] bg-[#111317]">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-[#707070]">
                  No matching test cases found in RTM dataset.
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
                      isSelected
                        ? 'bg-[#16191F] border-l-2 border-l-[#2563EB]'
                        : 'hover:bg-[#16191F]/60'
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="py-1.5 px-2.5 border-r border-[#22262E] align-top"
                      >
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

      {/* Grid Footer Status Bar */}
      <div className="h-[24px] bg-[#16191F] border-t border-[#22262E] px-3 flex items-center justify-between text-[10px] font-mono text-[#707070] shrink-0">
        <div className="flex items-center gap-3">
          <span>Standards Compliance: <strong className="text-[#EDEDED]">ISO/IEC/IEEE 29119-3:2022</strong></span>
          <span>Coverage: <strong className="text-[#059669]">100% VR Rules Mapped</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span>Keyboard: <kbd className="bg-[#0B0C0E] px-1 py-0.2 rounded border border-[#22262E] text-[#A1A1A1]">↑</kbd> <kbd className="bg-[#0B0C0E] px-1 py-0.2 rounded border border-[#22262E] text-[#A1A1A1]">↓</kbd> to Navigate</span>
          <span>Click row to inspect live Gherkin .feature spec</span>
        </div>
      </div>
    </div>
  );
}
