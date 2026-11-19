'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Code2,
  Send,
  ShieldCheck,
  Archive,
  RotateCw,
} from 'lucide-react';
import type { CompiledSdlcState } from '@/services/sdlcCompiler';
import { unifiedReportGenerator } from '@/services/unifiedReportGenerator';

export interface ExportBundleDropdownProps {
  compiledState: CompiledSdlcState | null;
  activeVaultProjectId?: string;
  locale?: 'en' | 'id';
  className?: string;
  isStale?: boolean;
}

export function ExportBundleDropdown({
  compiledState,
  activeVaultProjectId,
  locale = 'id',
  className = '',
  isStale = false,
}: ExportBundleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const appName = compiledState?.appName || 'OneSpec_Project';
  const slug = appName.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'onespec';
  const targetUrl = compiledState?.targetUrl || 'http://localhost:3000/';

  // 1. Download Excel QA Workbook (.xlsx)
  const handleDownloadXlsx = async () => {
    if (!compiledState) return;
    setIsExportingXlsx(true);
    try {
      const xlsxBuffer = unifiedReportGenerator.generateExcelQaWorkbookXlsx({
        appName,
        targetUrl,
        testScenarios: compiledState.testScenarios || [],
        rtmRows: compiledState.rtmRows || [],
        bugReports: compiledState.bugReports || [],
        uatFlows: compiledState.uatFlows || [],
        dataDictionary:
          compiledState.knowledgeGraphSummary?.azDocumentationLibrary?.book2BusinessAnalyst
            ?.masterDataDictionary || [],
        compiledState,
        locale,
      });

      const blob = new Blob([xlsxBuffer as unknown as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `OneSpec_QA_Workbook_${slug}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export Excel QA Workbook:', err);
    } finally {
      setIsExportingXlsx(false);
    }
  };

  // 2. Download Word User Manual (.docx)
  const handleDownloadDocx = async () => {
    if (!compiledState) return;
    setIsExportingDocx(true);
    try {
      const res = await fetch('/api/export/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'docx',
          compiledState,
          locale,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} from document exporter`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `OneSpec_User_Manual_${slug}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export Word manual:', err);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const projectParam = activeVaultProjectId ? `&projectId=${encodeURIComponent(activeVaultProjectId)}` : '';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 h-7 bg-[#101217] border border-white/[0.08] hover:border-zinc-500 text-zinc-300 hover:text-white rounded-[4px] text-[11px] font-medium transition-colors cursor-pointer select-none"
        title={locale === 'id' ? 'Ekspor Bundle Laporan & Otomasi SDLC' : 'Export Reports & SDLC Automation Bundle'}
      >
        <Download className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
        <span>{locale === 'id' ? 'Export Bundle' : 'Export Bundle'}</span>
        <ChevronDown
          className={`w-3 h-3 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={1.5}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#101217] border border-white/[0.1] rounded-[6px] shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 text-[11.5px] select-none">
          <div className="px-2 py-1 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
            {locale === 'id' ? 'Semua Artefak (1-Click)' : 'All Artifacts (1-Click)'}
          </div>
          {isStale ? (
            <div
              className="flex items-center justify-between px-2.5 py-1.5 rounded-[4px] text-zinc-500 opacity-60 cursor-not-allowed select-none"
              title={locale === 'id' ? 'Nonaktif: Data dikompilasi dengan engine lama (basi). Jalankan ulang pipeline.' : 'Disabled: Data compiled with older engine (stale). Re-run pipeline.'}
            >
              <div className="flex items-center gap-2">
                <Archive className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                <span>Unified Bundle (.zip)</span>
              </div>
              <span className="text-[10px] text-amber-500 font-mono">Basi (Nonaktif)</span>
            </div>
          ) : (
            <a
              href={`/api/sdlc/export-all-bundle?format=zip${projectParam}`}
              download={`${slug}_enterprise_sdlc_bundle.zip`}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-[4px] hover:bg-white/[0.06] text-zinc-200 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Archive className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200" strokeWidth={1.5} />
                <span>Unified Bundle (.zip)</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">17 Files</span>
            </a>
          )}

          <div className="h-px bg-white/[0.06] my-1" />

          <div className="px-2 py-1 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
            {locale === 'id' ? 'Dokumen & Spreadsheet' : 'Documents & Reports'}
          </div>
          <button
            type="button"
            onClick={() => {
              handleDownloadXlsx();
              setIsOpen(false);
            }}
            disabled={isExportingXlsx || !compiledState}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-[4px] hover:bg-white/[0.06] text-zinc-200 transition-colors cursor-pointer text-left w-full group disabled:opacity-40"
          >
            <div className="flex items-center gap-2">
              {isExportingXlsx ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin text-zinc-400" strokeWidth={1.5} />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200" strokeWidth={1.5} />
              )}
              <span>QA Workbook (.xlsx)</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">16 Sheets</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleDownloadDocx();
              setIsOpen(false);
            }}
            disabled={isExportingDocx || !compiledState}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-[4px] hover:bg-white/[0.06] text-zinc-200 transition-colors cursor-pointer text-left w-full group disabled:opacity-40"
          >
            <div className="flex items-center gap-2">
              {isExportingDocx ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin text-zinc-400" strokeWidth={1.5} />
              ) : (
                <FileText className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200" strokeWidth={1.5} />
              )}
              <span>User Manual (.docx)</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">ISO 26514</span>
          </button>

          <div className="h-px bg-white/[0.06] my-1" />

          <div className="px-2 py-1 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
            {locale === 'id' ? 'Otomasi & Kode' : 'Automation & Code'}
          </div>
          <a
            href={`/api/sdlc/automation-bundle?format=playwright${projectParam}`}
            download={`${slug}.spec.ts`}
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-[4px] hover:bg-white/[0.06] text-zinc-200 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200" strokeWidth={1.5} />
              <span>Playwright (.spec.ts)</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">E2E</span>
          </a>

          <a
            href={`/api/sdlc/automation-bundle?format=postman${projectParam}`}
            download={`${slug}.postman_collection.json`}
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-[4px] hover:bg-white/[0.06] text-zinc-200 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200" strokeWidth={1.5} />
              <span>Postman Collection</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">v2.1</span>
          </a>

          <a
            href={`/api/sdlc/automation-bundle?format=git-patch${projectParam}`}
            download={`${slug}-contoh-patch-ilustratif.patch`}
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-[4px] hover:bg-white/[0.06] text-zinc-200 transition-colors cursor-pointer group"
            title="Contoh Patch (ilustratif, tidak untuk diterapkan)"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200" strokeWidth={1.5} />
              <span>Contoh Patch (ilustratif, tidak untuk diterapkan)</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">.patch</span>
          </a>
        </div>
      )}
    </div>
  );
}
