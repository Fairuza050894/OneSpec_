'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Code2,
  Send,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';
import type { CompiledSdlcState } from '@/services/sdlcCompiler';
import { unifiedReportGenerator } from '@/services/unifiedReportGenerator';

export interface QuickExportToolbarProps {
  compiledState: CompiledSdlcState | null;
  activeVaultProjectId?: string;
  locale?: 'en' | 'id';
  className?: string;
}

export function QuickExportToolbar({
  compiledState,
  activeVaultProjectId,
  locale = 'id',
  className = '',
}: QuickExportToolbarProps) {
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

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
    <div
      className={`flex items-center flex-wrap gap-1.5 p-1.5 bg-[#0B0C0E] border border-[#22262E] rounded-[4px] font-mono text-[11px] select-none ${className}`}
    >
      <span className="text-[#707070] text-[10px] font-bold uppercase tracking-wider px-1.5 shrink-0">
        {locale === 'id' ? 'Ekspor Cepat:' : 'Quick Export:'}
      </span>

      {/* 1. Excel QA Workbook (.xlsx) */}
      <button
        type="button"
        onClick={handleDownloadXlsx}
        disabled={isExportingXlsx || !compiledState}
        className="h-7 px-2.5 bg-[#111317] hover:bg-[#16191F] border border-[#22262E] hover:border-[#10B981] disabled:opacity-40 text-[#EDEDED] rounded-[3px] flex items-center gap-1.5 cursor-pointer transition-colors"
        title="Download 16-Sheet Comprehensive QA Workbook (.xlsx)"
      >
        {isExportingXlsx ? (
          <RotateCw className="h-3 w-3 animate-spin text-[#10B981]" />
        ) : (
          <FileSpreadsheet className="h-3.5 w-3.5 text-[#10B981]" />
        )}
        <span>Excel QA Workbook (.xlsx)</span>
      </button>

      {/* 2. Word User Manual (.docx) */}
      <button
        type="button"
        onClick={handleDownloadDocx}
        disabled={isExportingDocx || !compiledState}
        className="h-7 px-2.5 bg-[#111317] hover:bg-[#16191F] border border-[#22262E] hover:border-[#3B82F6] disabled:opacity-40 text-[#EDEDED] rounded-[3px] flex items-center gap-1.5 cursor-pointer transition-colors"
        title="Download 9-Section ISO/IEC/IEEE 26514 User Manual (.docx)"
      >
        {isExportingDocx ? (
          <RotateCw className="h-3 w-3 animate-spin text-[#3B82F6]" />
        ) : (
          <FileText className="h-3.5 w-3.5 text-[#3B82F6]" />
        )}
        <span>Word User Manual (.docx)</span>
      </button>

      {/* 3. Playwright (.spec.ts) */}
      <a
        href={`/api/sdlc/automation-bundle?format=playwright${projectParam}`}
        download={`${slug}-e2e.spec.ts`}
        className="h-7 px-2.5 bg-[#111317] hover:bg-[#16191F] border border-[#22262E] hover:border-[#F59E0B] text-[#EDEDED] rounded-[3px] flex items-center gap-1.5 cursor-pointer transition-colors"
        title="Download Executable Playwright E2E Test Suite (.spec.ts)"
      >
        <Code2 className="h-3.5 w-3.5 text-[#F59E0B]" />
        <span>Playwright (.spec.ts)</span>
      </a>

      {/* 4. Postman v2.1 (.json) */}
      <a
        href={`/api/sdlc/automation-bundle?format=postman${projectParam}`}
        download={`${slug}-postman-v2.1.json`}
        className="h-7 px-2.5 bg-[#111317] hover:bg-[#16191F] border border-[#22262E] hover:border-[#EC4899] text-[#EDEDED] rounded-[3px] flex items-center gap-1.5 cursor-pointer transition-colors"
        title="Download Postman Collection v2.1 (.json)"
      >
        <Send className="h-3.5 w-3.5 text-[#EC4899]" />
        <span>Postman v2.1 (.json)</span>
      </a>

      {/* 5. RBAC Matrix (JSON) */}
      <a
        href={`/api/sdlc/automation-bundle?format=rbac${projectParam}`}
        download={`${slug}-rbac-matrix.json`}
        className="h-7 px-2.5 bg-[#111317] hover:bg-[#16191F] border border-[#22262E] hover:border-[#8B5CF6] text-[#EDEDED] rounded-[3px] flex items-center gap-1.5 cursor-pointer transition-colors"
        title="Download Multi-Persona RBAC Differential Matrix (JSON)"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-[#8B5CF6]" />
        <span>RBAC Matrix (JSON)</span>
      </a>
    </div>
  );
}
