'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Code2,
  Send,
  ShieldCheck,
  RotateCw,
  Archive,
  ChevronDown,
  Sparkles,
  Smartphone,
  Cpu,
  Layers,
  FileCode,
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
  const [isEcosystemOpen, setIsEcosystemOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsEcosystemOpen(false);
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

      {/* 6. Self-Healing Git Patch (.patch) */}
      <a
        href={`/api/sdlc/automation-bundle?format=git-patch${projectParam}`}
        download={`${slug}-self-healing-remediation.patch`}
        className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900/80 transition flex items-center gap-1"
        title="Download Autonomous Self-Healing Unified Git Patch (.patch)"
      >
        <span>🩹</span>
        <span>Git Patch (.patch)</span>
      </a>

      {/* 7. Master ISO Handover Bundle (.zip) */}
      <a
        href={`/api/sdlc/export-all-bundle?format=zip${projectParam}&locale=${locale}`}
        download={`OneSpec_Master_ISO_Bundle_${slug}.zip`}
        className="h-7 px-2.5 bg-[#2563EB]/15 hover:bg-[#2563EB]/25 border border-[#2563EB]/60 hover:border-[#3B82F6] text-[#60A5FA] font-bold rounded-[3px] flex items-center gap-1.5 cursor-pointer transition-colors"
        title="Download Complete 1-Click Master ISO Audit & Handover Bundle (.zip)"
      >
        <Archive className="h-3.5 w-3.5 text-[#60A5FA]" />
        <span>Master ISO Bundle (.zip)</span>
      </a>

      {/* 8. 16-Tool AI QA & Automation Ecosystem Hub Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsEcosystemOpen(!isEcosystemOpen)}
          className={`h-7 px-2.5 rounded-[3px] border flex items-center gap-1.5 cursor-pointer transition-colors font-bold ${
            isEcosystemOpen
              ? 'bg-[#1E1B4B] border-[#6366F1] text-[#A5B4FC]'
              : 'bg-[#111317] hover:bg-[#16191F] border-[#312E81] hover:border-[#6366F1] text-[#C7D2FE]'
          }`}
          title="16-Tool AI QA Ecosystem Hub: Cypress, Selenium, Appium, REST-assured, Jira, TestRail, Promptfoo, Allure & AI Blueprint"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#818CF8]" />
          <span>⚡ AI QA & 16-Tool Hub</span>
          <ChevronDown
            className={`h-3 w-3 text-[#818CF8] transition-transform duration-150 ${
              isEcosystemOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isEcosystemOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-80 bg-[#0E1015] border border-[#2A2E39] rounded-[4px] shadow-2xl p-2 z-50 flex flex-col gap-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#1F2430] px-1">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                16-Tool Enterprise Ecosystem
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
                ISO 29119-5
              </span>
            </div>

            {/* Group 1: Web & Mobile E2E */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold text-[#64748B] px-1">
                WEB & MOBILE E2E
              </span>
              <div className="grid grid-cols-1 gap-1">
                <a
                  href={`/api/sdlc/automation-bundle?format=cypress${projectParam}`}
                  download={`${slug}-cypress.e2e.cy.ts`}
                  onClick={() => setIsEcosystemOpen(false)}
                  className="px-2 py-1 rounded bg-[#13161C] hover:bg-[#1C212B] border border-[#232834] hover:border-[#06B6D4] text-[#E2E8F0] text-[10px] flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <FileCode className="h-3 w-3 text-[#06B6D4]" />
                    <span>Cypress E2E Suite</span>
                  </span>
                  <span className="text-[9px] text-[#94A3B8]">.cy.ts</span>
                </a>
                <a
                  href={`/api/sdlc/automation-bundle?format=selenium${projectParam}`}
                  download={`${slug}-selenium.webdriver.spec.ts`}
                  onClick={() => setIsEcosystemOpen(false)}
                  className="px-2 py-1 rounded bg-[#13161C] hover:bg-[#1C212B] border border-[#232834] hover:border-[#10B981] text-[#E2E8F0] text-[10px] flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Code2 className="h-3 w-3 text-[#10B981]" />
                    <span>Selenium WebDriver</span>
                  </span>
                  <span className="text-[9px] text-[#94A3B8]">.spec.ts</span>
                </a>
                <a
                  href={`/api/sdlc/automation-bundle?format=appium${projectParam}`}
                  download={`${slug}-appium.mobile.spec.ts`}
                  onClick={() => setIsEcosystemOpen(false)}
                  className="px-2 py-1 rounded bg-[#13161C] hover:bg-[#1C212B] border border-[#232834] hover:border-[#F43F5E] text-[#E2E8F0] text-[10px] flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="h-3 w-3 text-[#F43F5E]" />
                    <span>Appium Mobile Touch</span>
                  </span>
                  <span className="text-[9px] text-[#94A3B8]">.spec.ts</span>
                </a>
              </div>
            </div>

            {/* Group 2: API & Contract Testing */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold text-[#64748B] px-1">
                API & CONTRACT
              </span>
              <a
                href={`/api/sdlc/automation-bundle?format=rest-assured${projectParam}`}
                download="ApiContractTest.java"
                onClick={() => setIsEcosystemOpen(false)}
                className="px-2 py-1 rounded bg-[#13161C] hover:bg-[#1C212B] border border-[#232834] hover:border-[#EAB308] text-[#E2E8F0] text-[10px] flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Cpu className="h-3 w-3 text-[#EAB308]" />
                  <span>REST-assured JUnit 5</span>
                </span>
                <span className="text-[9px] text-[#94A3B8]">.java</span>
              </a>
            </div>

            {/* Group 3: Issue Tracking & TMS */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold text-[#64748B] px-1">
                ISSUE TRACKING & TMS
              </span>
              <div className="grid grid-cols-2 gap-1">
                <a
                  href={`/api/sdlc/automation-bundle?format=jira${projectParam}`}
                  download={`${slug}-jira-issues.csv`}
                  onClick={() => setIsEcosystemOpen(false)}
                  className="px-2 py-1 rounded bg-[#13161C] hover:bg-[#1C212B] border border-[#232834] hover:border-[#38BDF8] text-[#E2E8F0] text-[10px] flex items-center justify-between transition-colors"
                >
                  <span className="truncate">Jira Import</span>
                  <span className="text-[9px] text-[#94A3B8]">.csv</span>
                </a>
                <a
                  href={`/api/sdlc/automation-bundle?format=testrail${projectParam}`}
                  download={`${slug}-testrail-cases.csv`}
                  onClick={() => setIsEcosystemOpen(false)}
                  className="px-2 py-1 rounded bg-[#13161C] hover:bg-[#1C212B] border border-[#232834] hover:border-[#A855F7] text-[#E2E8F0] text-[10px] flex items-center justify-between transition-colors"
                >
                  <span className="truncate">TestRail Import</span>
                  <span className="text-[9px] text-[#94A3B8]">.csv</span>
                </a>
              </div>
            </div>

            {/* Group 4: AI Guardrails & CI/CD */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold text-[#64748B] px-1">
                AI GUARDRAILS & CI/CD
              </span>
              <div className="grid grid-cols-1 gap-1">
                <a
                  href={`/api/sdlc/automation-bundle?format=promptfoo${projectParam}`}
                  download="promptfooconfig.yaml"
                  onClick={() => setIsEcosystemOpen(false)}
                  className="px-2 py-1 rounded bg-[#13161C] hover:bg-[#1C212B] border border-[#232834] hover:border-[#818CF8] text-[#E2E8F0] text-[10px] flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-[#818CF8]" />
                    <span>Promptfoo LLM Eval</span>
                  </span>
                  <span className="text-[9px] text-[#94A3B8]">.yaml</span>
                </a>
                <a
                  href={`/api/sdlc/automation-bundle?format=allure${projectParam}`}
                  download={`${slug}-onespec-devops-ci-bundle.json`}
                  onClick={() => setIsEcosystemOpen(false)}
                  className="px-2 py-1 rounded bg-[#13161C] hover:bg-[#1C212B] border border-[#232834] hover:border-[#F97316] text-[#E2E8F0] text-[10px] flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="h-3 w-3 text-[#F97316]" />
                    <span>Allure & DevOps CI Bundle</span>
                  </span>
                  <span className="text-[9px] text-[#94A3B8]">.json</span>
                </a>
                <a
                  href={`/api/sdlc/automation-bundle?format=ai-qa${projectParam}`}
                  download={`${slug}-ai-augmented-qa-architecture.json`}
                  onClick={() => setIsEcosystemOpen(false)}
                  className="px-2 py-1 rounded bg-[#13161C] hover:bg-[#1C212B] border border-[#232834] hover:border-[#EC4899] text-[#E2E8F0] text-[10px] flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-[#EC4899]" />
                    <span>AI QA Blueprint & 5 Guardrails</span>
                  </span>
                  <span className="text-[9px] text-[#94A3B8]">.json</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
