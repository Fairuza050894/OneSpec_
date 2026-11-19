'use client';

import React from 'react';
import {
  RotateCw,
  Zap,
  Cpu,
  Check,
  FileText,
  Globe,
  GitBranch,
  Folder,
  Search,
  ShieldCheck,
  CheckCircle2,
  EyeOff,
  Eye,
  MousePointer,
  AlertCircle,
  X,
  Lock,
  Link2,
  Layers,
  Upload,
} from 'lucide-react';
import type {
  LoginSurfaceProbeResult,
  BrdMatrixRow,
  ValidationRuleContract,
} from '@/types/sdlc';
import type { UpstreamLinkedProjectInfo } from '@/services/architectureDeconstructor';
import { detectEnvironment } from '@/lib/environmentDetector';
import type { useStudioLocale } from '@/lib/i18n';

export interface ExtractedEntity {
  id: string;
  type: 'ACTOR' | 'BUSINESS_RULE' | 'CONSTRAINT' | 'KPI';
  identifier: string;
  label: string;
  sourceText: string;
  status: 'EXTRACTED' | 'VALIDATED';
}

export interface InteractiveSessionState {
  isRunning: boolean;
  status: 'LOGIN_WAIT' | 'ROBOT_EXPLORING' | 'READY_TO_FINISH' | 'COMPLETED';
  pagesCount: number;
  apisCount: number;
  inputsCount: number;
  tablesCount: number;
}

export interface Step01IngestionWorkbenchProps {
  displayMode?: 'EXECUTIVE' | 'TECHNICAL';
  copy: ReturnType<typeof useStudioLocale>['copy'];
  locale: 'en' | 'id';
  isAnalyzingSource: boolean;
  isBlindCrawling: boolean;
  handleAnalyzeSourceAndBuildPipeline: () => void;
  interactiveSession: InteractiveSessionState;
  handleTriggerRobotExploration: () => void;
  handleFinishInteractiveSession: () => void;
  step1SourceTab: 'WEB_URL' | 'GIT_REPO' | 'ZIP_FOLDER' | 'STAKEHOLDER_MOM';
  setStep1SourceTab: (tab: 'WEB_URL' | 'GIT_REPO' | 'ZIP_FOLDER' | 'STAKEHOLDER_MOM') => void;
  blindTargetUrl: string;
  setBlindTargetUrl: (url: string) => void;
  targetUrlInputRef?: React.RefObject<HTMLInputElement | null>;
  interactiveNotice: { type: 'error' | 'warning' | 'success' | 'info'; text: string } | null;
  setInteractiveNotice: (notice: { type: 'error' | 'warning' | 'success' | 'info'; text: string } | null) => void;
  handleProbeLoginSurface: () => void;
  isProbingSurface: boolean;
  loginSurfaceProbe: LoginSurfaceProbeResult | null;
  dynamicFieldValues: Record<string, string>;
  setDynamicFieldValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  loginAccessType: string;
  setLoginAccessType: (type: string) => void;
  loginUsername: string;
  setLoginUsername: (u: string) => void;
  loginPassword: string;
  setLoginPassword: (p: string) => void;
  showLoginPassword: boolean;
  setShowLoginPassword: React.Dispatch<React.SetStateAction<boolean>>;
  isMaskSensitiveData: boolean;
  handleRunAutoRobot: () => void;
  isRunningAutoRobot: boolean;
  handleStartHumanSession: () => void;
  isStartingInteractive: boolean;
  gitProvider: 'github' | 'gitlab' | 'bitbucket' | 'self-hosted';
  setGitProvider: (p: 'github' | 'gitlab' | 'bitbucket' | 'self-hosted') => void;
  gitRepoUrl: string;
  setGitRepoUrl: (u: string) => void;
  gitBranch: string;
  setGitBranch: (b: string) => void;
  gitAuthToken: string;
  setGitAuthToken: (t: string) => void;
  localFolderPath: string;
  setLocalFolderPath: (p: string) => void;
  appendTerminalLog: (msg: string) => void;
  greenfieldProjectName: string;
  setGreenfieldProjectName: (n: string) => void;
  linkedUpstreamProject: UpstreamLinkedProjectInfo | null;
  selectedIntegrationTargetId: string;
  setSelectedIntegrationTargetId: (id: string) => void;
  vaultProjects: Array<{ projectId: string; projectName: string; latestApisCount: number }>;
  activeVaultProjectId: string;
  handleLinkVaultIntegrationProject: () => void;
  isLinkingIntegration: boolean;
  rawMoMNotes: string;
  setRawMoMNotes: (notes: string) => void;
  extractedEntities: ExtractedEntity[];
  brdMatrixRows: BrdMatrixRow[];
  validationRules: ValidationRuleContract[];
  openInspectorForEntity: (id: string) => void;
  selectedEntityId: string;
  maskSensitiveText: (text: string) => string;
}

export function Step01IngestionWorkbench({
  displayMode = 'TECHNICAL',
  copy,
  locale,
  isAnalyzingSource,
  isBlindCrawling,
  handleAnalyzeSourceAndBuildPipeline,
  interactiveSession,
  handleTriggerRobotExploration,
  handleFinishInteractiveSession,
  step1SourceTab,
  setStep1SourceTab,
  blindTargetUrl,
  setBlindTargetUrl,
  targetUrlInputRef,
  interactiveNotice,
  setInteractiveNotice,
  handleProbeLoginSurface,
  isProbingSurface,
  loginSurfaceProbe,
  dynamicFieldValues,
  setDynamicFieldValues,
  loginAccessType,
  setLoginAccessType,
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  showLoginPassword,
  setShowLoginPassword,
  isMaskSensitiveData,
  handleRunAutoRobot,
  isRunningAutoRobot,
  handleStartHumanSession,
  isStartingInteractive,
  gitProvider,
  setGitProvider,
  gitRepoUrl,
  setGitRepoUrl,
  gitBranch,
  setGitBranch,
  gitAuthToken,
  setGitAuthToken,
  localFolderPath,
  setLocalFolderPath,
  appendTerminalLog,
  greenfieldProjectName,
  setGreenfieldProjectName,
  linkedUpstreamProject,
  selectedIntegrationTargetId,
  setSelectedIntegrationTargetId,
  vaultProjects,
  activeVaultProjectId,
  handleLinkVaultIntegrationProject,
  isLinkingIntegration,
  rawMoMNotes,
  setRawMoMNotes,
  extractedEntities,
  brdMatrixRows,
  validationRules,
  openInspectorForEntity,
  selectedEntityId,
  maskSensitiveText,
}: Step01IngestionWorkbenchProps) {
  const isAutonomousZeroDoc =
    rawMoMNotes.trim().startsWith('# [AUTONOMOUS ZERO-DOC') ||
    rawMoMNotes.trim().startsWith('[AUTONOMOUS ZERO-DOC');

  const [activeNotesMode, setActiveNotesMode] = React.useState<'HUMAN_MOM' | 'AUTONOMOUS_SUMMARY'>(
    isAutonomousZeroDoc ? 'AUTONOMOUS_SUMMARY' : 'HUMAN_MOM'
  );
  const [humanNotes, setHumanNotes] = React.useState<string>(
    isAutonomousZeroDoc ? '' : rawMoMNotes
  );
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (isAutonomousZeroDoc) {
      if (activeNotesMode === 'HUMAN_MOM' && !humanNotes) {
        setActiveNotesMode('AUTONOMOUS_SUMMARY');
      }
    } else if (rawMoMNotes.length > 0 && activeNotesMode === 'HUMAN_MOM') {
      setHumanNotes(rawMoMNotes);
    }
  }, [rawMoMNotes, isAutonomousZeroDoc]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.docx')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
          const matches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
          if (matches && matches.length > 0) {
            const extractedText = matches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ');
            setHumanNotes(extractedText);
            setRawMoMNotes(extractedText);
            setActiveNotesMode('HUMAN_MOM');
          } else {
            const fallback = `[Imported from ${file.name}]\nDocument uploaded. Please paste notes if formatted.`;
            setHumanNotes(fallback);
            setRawMoMNotes(fallback);
            setActiveNotesMode('HUMAN_MOM');
          }
        } catch (err) {
          console.error('Failed to parse docx:', err);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        setHumanNotes(text);
        setRawMoMNotes(text);
        setActiveNotesMode('HUMAN_MOM');
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-full flex flex-col space-y-3">
      {/* Canvas Header & Primary Action Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2.5 border-b border-[#22262E] shrink-0">
        <div>
          <h1 className="text-[17px] font-bold text-[#EDEDED] tracking-tight">
            {copy.step01.title}
          </h1>
          <p className="text-[11.5px] text-[#707070] font-mono mt-0.5">
            {copy.step01.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAnalyzeSourceAndBuildPipeline}
            disabled={isAnalyzingSource || isBlindCrawling}
            className="h-8 px-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-[11.5px] font-mono font-bold rounded-[3px] flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            title={copy.step01.primaryCta}
          >
            {isAnalyzingSource || isBlindCrawling ? (
              <>
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
                <span>{copy.step01.primaryCtaBusy}</span>
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5 fill-current text-[#FBBF24]" />
                <span>{copy.step01.primaryCta}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Human Recording Status Panel in Step 01 */}
      {interactiveSession.isRunning && (
        <div className="bg-[#111317] border border-[#059669]/50 p-3 rounded-[4px] font-mono text-[11.5px] flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-[#10B981] animate-ping shrink-0" />
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[#34D399] flex items-center gap-2">
                  <span>
                    {copy.step01.liveSessionTitle} — Pages:{' '}
                    <span className="tabular-nums">{interactiveSession.pagesCount}</span> | APIs:{' '}
                    <span className="tabular-nums">{interactiveSession.apisCount}</span> | Controls:{' '}
                    <span className="tabular-nums">
                      {interactiveSession.inputsCount + interactiveSession.tablesCount}
                    </span>
                  </span>
                </span>
              </div>
              <span className="text-[10.5px] text-[#A1A1A1] mt-0.5">
                {interactiveSession.status === 'ROBOT_EXPLORING'
                  ? copy.step01.liveSessionExploring
                  : copy.step01.liveSessionPassive}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleTriggerRobotExploration}
              disabled={interactiveSession.status === 'ROBOT_EXPLORING'}
              className="h-8 px-3 bg-[#1E293B] hover:bg-[#334155] disabled:opacity-50 text-[#F59E0B] border border-[#F59E0B]/40 rounded-[3px] font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>{copy.step01.autoTraverseBtn}</span>
            </button>

            <button
              type="button"
              onClick={handleFinishInteractiveSession}
              className="h-8 px-3 bg-[#059669] hover:bg-[#047857] text-white rounded-[3px] font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{copy.step01.finishCompileBtn}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4 Unified Source Selection Tabs (Aligned with SDLC Lifecycle) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 bg-[#111317] border border-[#22262E] p-1 rounded-[4px] font-mono text-[11px] shrink-0">
        <button
          onClick={() => setStep1SourceTab('STAKEHOLDER_MOM')}
          className={`px-2.5 py-1.5 rounded-[3px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 truncate ${
            step1SourceTab === 'STAKEHOLDER_MOM'
              ? 'bg-[#8B5CF6] text-white font-bold'
              : 'text-[#A1A1A1] hover:text-[#EDEDED]'
          }`}
        >
          <FileText className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{copy.step01.tabNotes}</span>
        </button>
        <button
          onClick={() => setStep1SourceTab('WEB_URL')}
          className={`px-2.5 py-1.5 rounded-[3px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 truncate ${
            step1SourceTab === 'WEB_URL'
              ? 'bg-[#D97706] text-white font-bold'
              : 'text-[#A1A1A1] hover:text-[#EDEDED]'
          }`}
        >
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{copy.step01.tabWebUrl}</span>
        </button>
        <button
          onClick={() => setStep1SourceTab('GIT_REPO')}
          className={`px-2.5 py-1.5 rounded-[3px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 truncate ${
            step1SourceTab === 'GIT_REPO'
              ? 'bg-[#2563EB] text-white font-bold'
              : 'text-[#A1A1A1] hover:text-[#EDEDED]'
          }`}
        >
          <GitBranch className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{copy.step01.tabGitRepo}</span>
        </button>
        <button
          onClick={() => setStep1SourceTab('ZIP_FOLDER')}
          className={`px-2.5 py-1.5 rounded-[3px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 truncate ${
            step1SourceTab === 'ZIP_FOLDER'
              ? 'bg-[#059669] text-white font-bold'
              : 'text-[#A1A1A1] hover:text-[#EDEDED]'
          }`}
        >
          <Folder className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{copy.step01.tabZipFolder}</span>
        </button>
      </div>

      {/* Tab 1: Live Web URL */}
      {step1SourceTab === 'WEB_URL' && (
        <div className="bg-[#111317] border border-[#22262E] p-3 rounded-[4px] font-mono text-[11.5px] space-y-2.5 shrink-0">
          <div className="text-[11px] text-[#A1A1A1] flex items-center justify-between pb-1.5 border-b border-[#22262E] gap-2">
            <span className="font-bold text-[#EDEDED]">{copy.step01.scannerTitle}</span>
            <span className="text-[#3B82F6] truncate">{copy.step01.scannerHint}</span>
          </div>

          {/* STEP 1: Top URL Bar + Scan Button */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-[#707070] text-[11px] whitespace-nowrap shrink-0">
                {copy.step01.targetUrlLabel}
              </span>
              <input
                ref={targetUrlInputRef}
                type="text"
                value={blindTargetUrl}
                onChange={(e) => {
                  setBlindTargetUrl(e.target.value);
                  if (interactiveNotice) setInteractiveNotice(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleProbeLoginSurface();
                  }
                }}
                placeholder="http://10.10.15.75:3100/ or https://app.example.com"
                className={`flex-1 min-w-0 h-9 px-3 bg-[#0B0C0E] border text-[#EDEDED] rounded-[3px] outline-none select-text ${
                  interactiveNotice?.type === 'warning'
                    ? 'border-[#D97706] focus:border-[#F59E0B]'
                    : 'border-[#22262E] focus:border-[#3B82F6]'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={() => handleProbeLoginSurface()}
              disabled={isProbingSurface}
              className="h-9 px-4 bg-[#16191F] hover:bg-[#1E242E] border border-[#3B82F6]/60 disabled:opacity-50 text-[#EDEDED] font-bold text-[11.5px] rounded-[3px] flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              {isProbingSurface ? (
                <>
                  <RotateCw className="h-3.5 w-3.5 animate-spin text-[#60A5FA]" />
                  <span>{copy.step01.scanBtnBusy}</span>
                </>
              ) : (
                <>
                  <Search className="h-3.5 w-3.5 text-[#3B82F6]" />
                  <span>{copy.step01.scanBtn}</span>
                </>
              )}
            </button>
          </div>

          {/* STEP 2: Surface Configuration & Authentication Credential Inputs (Always Visible) */}
          <div className="bg-[#0B0C0E] border border-[#22262E] p-3 rounded-[3px] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px] pb-2 border-b border-[#22262E]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#3B82F6]" />
                <span className="font-bold text-[#EDEDED] uppercase tracking-wider">
                  {loginSurfaceProbe
                    ? `${copy.step01.detectedSurface}: ${loginSurfaceProbe.pageTitle}`
                    : 'Surface Configuration & Authentication Credentials'}
                </span>
              </div>
              <span className="text-[#707070] truncate max-w-[360px]">
                {maskSensitiveText(loginSurfaceProbe?.targetUrl || blindTargetUrl || 'http://localhost:3000')}
              </span>
            </div>

            {loginSurfaceProbe && !loginSurfaceProbe.requiresLogin && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#059669]/15 border border-[#059669]/40 text-[#34D399] rounded-[3px] text-[11px] font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>{copy.step01.publicPageBanner}</span>
              </div>
            )}

            {/* Check if probed tabs already cover Access/Role (Pancaran / External) */}
            {(() => {
              const hasTabAccessControl = Boolean(
                loginSurfaceProbe?.detectedTabs?.some(
                  (t) =>
                    t.options.some((opt) =>
                      /pancaran|eksternal|external|internal|domain|role|tenant/i.test(opt)
                    ) || /access|role|domain|tipe|tenant/i.test(t.label || '')
                )
              );

              return (
                <>
                  {/* Detected Role / Access Switcher Tabs if probed */}
                  {loginSurfaceProbe?.detectedTabs && loginSurfaceProbe.detectedTabs.length > 0 && (
                    <div className="space-y-2">
                      {loginSurfaceProbe.detectedTabs.map((tabGroup) => (
                        <div key={tabGroup.selector} className="space-y-1">
                          <label className="text-[10px] text-[#707070] uppercase font-bold block">
                            {tabGroup.label}
                          </label>
                          <div className="flex flex-wrap items-center gap-1.5 bg-[#111317] border border-[#22262E] p-1 rounded-[3px]">
                            {tabGroup.options.map((opt) => {
                              const isSelected =
                                dynamicFieldValues[tabGroup.selector] === opt ||
                                loginAccessType.toLowerCase() === opt.toLowerCase();
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => {
                                    setDynamicFieldValues((prev) => ({
                                      ...prev,
                                      [tabGroup.selector]: opt,
                                      access_type: opt,
                                      accessRoleOrTenant: opt,
                                    }));
                                    setLoginAccessType(opt);
                                  }}
                                  className={`px-3 py-1.5 rounded-[2px] text-[11px] transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#2563EB] text-white font-bold'
                                      : 'text-[#A1A1A1] hover:text-[#EDEDED] hover:bg-[#16191F]'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Guaranteed Inputs: Username, Password, and Access Type */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                    {/* 1. Username / User ID */}
                    <div
                      className={`${
                        hasTabAccessControl ? 'md:col-span-6' : 'md:col-span-4'
                      } flex flex-col gap-1 min-w-0`}
                    >
                      <label className="text-[10px] text-[#A1A1A1] uppercase font-bold truncate flex items-center gap-1">
                        <span>Username / User ID *</span>
                      </label>
                      <input
                        type="text"
                        value={isMaskSensitiveData ? maskSensitiveText(loginUsername) : loginUsername}
                        readOnly={isMaskSensitiveData}
                        onChange={(e) => {
                          if (isMaskSensitiveData) return;
                          const val = e.target.value;
                          setLoginUsername(val);
                          if (loginSurfaceProbe) {
                            const userInp = loginSurfaceProbe.detectedInputs.find((i) =>
                              /user|email|login/i.test(`${i.name} ${i.label}`)
                            );
                            if (userInp) {
                              setDynamicFieldValues((prev) => ({ ...prev, [userInp.selector]: val }));
                            }
                          }
                        }}
                        placeholder="Username / NIP / Email..."
                        className="w-full min-w-0 h-9 px-2.5 bg-[#111317] border border-[#22262E] focus:border-[#3B82F6] text-[#EDEDED] rounded-[3px] outline-none select-text text-[11.5px]"
                      />
                    </div>

                    {/* 2. Password / Kata Sandi */}
                    <div
                      className={`${
                        hasTabAccessControl ? 'md:col-span-6' : 'md:col-span-4'
                      } flex flex-col gap-1 min-w-0`}
                    >
                      <label className="text-[10px] text-[#A1A1A1] uppercase font-bold truncate flex items-center gap-1">
                        <span>Password / Kata Sandi *</span>
                      </label>
                      <div className="relative w-full min-w-0 flex items-center">
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLoginPassword(val);
                            if (loginSurfaceProbe) {
                              const passInp = loginSurfaceProbe.detectedInputs.find(
                                (i) => i.type === 'password' || /pass/i.test(i.name)
                              );
                              if (passInp) {
                                setDynamicFieldValues((prev) => ({ ...prev, [passInp.selector]: val }));
                              }
                            }
                          }}
                          placeholder={locale === 'id' ? 'Masukkan kata sandi...' : 'Enter password...'}
                          className="w-full min-w-0 h-9 px-2.5 pr-8 bg-[#111317] border border-[#22262E] focus:border-[#3B82F6] text-[#EDEDED] rounded-[3px] outline-none select-text text-[11.5px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((prev) => !prev)}
                          className="absolute right-2 text-[#707070] hover:text-[#EDEDED] cursor-pointer"
                          aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                        >
                          {showLoginPassword ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 3. Tipe Akses / Domain Otorisasi (Pancaran / Eksternal) */}
                    {!hasTabAccessControl && (
                      <div className="md:col-span-4 flex flex-col gap-1 min-w-0">
                        <label className="text-[10px] text-[#A1A1A1] uppercase font-bold truncate flex items-center gap-1">
                          <span>Tipe Akses / Domain *</span>
                        </label>
                        <select
                          value={loginAccessType}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLoginAccessType(val);
                            setDynamicFieldValues((prev) => ({
                              ...prev,
                              access_type: val,
                              accessRoleOrTenant: val,
                            }));
                            if (loginSurfaceProbe) {
                              const sel = loginSurfaceProbe.detectedSelects.find((s) =>
                                /pancaran|eksternal|role|domain|access/i.test(`${s.name} ${s.label}`)
                              );
                              if (sel) {
                                setDynamicFieldValues((prev) => ({ ...prev, [sel.selector]: val }));
                              }
                            }
                          }}
                          className="w-full min-w-0 h-9 px-2.5 bg-[#111317] border border-[#22262E] focus:border-[#3B82F6] text-[#EDEDED] rounded-[3px] outline-none cursor-pointer text-[11.5px]"
                        >
                          <option value="Pancaran">Pancaran (Internal Domain)</option>
                          <option value="Eksternal">Eksternal (Partner / Vendor Domain)</option>
                          {loginSurfaceProbe?.detectedSelects
                            ?.flatMap((s) => s.options)
                            ?.filter(
                              (o) =>
                                o.value !== 'Pancaran' &&
                                o.value !== 'Eksternal' &&
                                o.value &&
                                o.value.trim() !== ''
                            )
                            ?.map((o, idx) => (
                              <option key={`${o.value}-${idx}`} value={o.value}>
                                {o.label || o.value}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    {/* Extra detected inputs */}
                    {loginSurfaceProbe?.detectedInputs
                      ?.filter(
                        (inp) =>
                          inp.type !== 'password' &&
                          !/user|email|login|username|nip|nik/i.test(
                            `${inp.name} ${inp.label} ${inp.placeholder}`
                          )
                      )
                      ?.map((inp) => (
                        <div key={inp.selector} className="md:col-span-4 flex flex-col gap-1 min-w-0">
                          <label className="text-[10px] text-[#707070] uppercase font-bold truncate">
                            {inp.label || inp.placeholder || inp.name}
                            {inp.required ? ' *' : ''}
                          </label>
                          <input
                            type={inp.type}
                            value={dynamicFieldValues[inp.selector] || ''}
                            onChange={(e) =>
                              setDynamicFieldValues((prev) => ({
                                ...prev,
                                [inp.selector]: e.target.value,
                              }))
                            }
                            placeholder={inp.placeholder || inp.label || inp.name}
                            className="w-full min-w-0 h-9 px-2.5 bg-[#111317] border border-[#22262E] focus:border-[#3B82F6] text-[#EDEDED] rounded-[3px] outline-none select-text text-[11.5px]"
                          />
                        </div>
                      ))}
                  </div>
                </>
              );
            })()}
          </div>

          {/* STEP 3: Dual Execution Modes (Side-by-Side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {/* MODE A: Autonomous Discovery */}
            <div className="bg-[#0B0C0E] border border-[#22262E] p-2.5 rounded-[3px] flex flex-col justify-between gap-2">
              <div className="space-y-0.5">
                <div className="text-[11px] font-bold text-[#EDEDED]">{copy.step01.modeATitle}</div>
                <p className="text-[10.5px] text-[#A1A1A1] font-sans leading-snug">
                  {copy.step01.modeADesc}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunAutoRobot}
                disabled={isRunningAutoRobot || isBlindCrawling}
                className="w-full h-8 px-3 bg-[#D97706] hover:bg-[#B45309] disabled:opacity-50 text-white font-bold text-[11px] rounded-[3px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isRunningAutoRobot || isBlindCrawling ? (
                  <>
                    <RotateCw className="h-3.5 w-3.5 animate-spin" />
                    <span>{copy.step01.modeABtnBusy}</span>
                  </>
                ) : (
                  <>
                    <Cpu className="h-3.5 w-3.5 shrink-0" />
                    <span>{copy.step01.modeABtn}</span>
                  </>
                )}
              </button>
            </div>

            {/* MODE B: Guided Browser Session */}
            <div className="bg-[#0B0C0E] border border-[#22262E] p-2.5 rounded-[3px] flex flex-col justify-between gap-2">
              <div className="space-y-0.5">
                <div className="text-[11px] font-bold text-[#EDEDED]">{copy.step01.modeBTitle}</div>
                <p className="text-[10.5px] text-[#A1A1A1] font-sans leading-snug">
                  {copy.step01.modeBDesc}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStartHumanSession()}
                  disabled={isStartingInteractive}
                  className="flex-1 h-8 px-3 bg-[#16191F] hover:bg-[#1E242E] border border-[#3B82F6]/60 disabled:opacity-50 text-[#EDEDED] font-bold text-[11px] rounded-[3px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isStartingInteractive ? (
                    <>
                      <RotateCw className="h-3.5 w-3.5 animate-spin text-[#60A5FA]" />
                      <span>{copy.step01.modeBBtnBusy}</span>
                    </>
                  ) : (
                    <>
                      <MousePointer className="h-3.5 w-3.5 text-[#3B82F6] shrink-0" />
                      <span>{copy.step01.modeBBtn}</span>
                    </>
                  )}
                </button>

                {interactiveSession.isRunning && (
                  <button
                    type="button"
                    onClick={handleFinishInteractiveSession}
                    className="h-8 px-3 bg-[#059669] hover:bg-[#047857] text-white font-bold text-[11px] rounded-[3px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    title="Complete guided harvest and compile all 12 Steps"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Complete Guided Harvest</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Inline Notice / Validation Feedback Banner */}
          {interactiveNotice && (
            <div
              role="alert"
              className={`px-3 py-2 rounded-[3px] border text-[11px] flex items-center justify-between gap-2 ${
                interactiveNotice.type === 'error'
                  ? 'bg-[#DC2626]/10 border-[#DC2626]/50 text-[#FCA5A5]'
                  : interactiveNotice.type === 'warning'
                  ? 'bg-[#D97706]/10 border-[#D97706]/50 text-[#FBBF24]'
                  : interactiveNotice.type === 'success'
                  ? 'bg-[#059669]/10 border-[#059669]/50 text-[#34D399]'
                  : 'bg-[#2563EB]/10 border-[#2563EB]/50 text-[#93C5FD]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate whitespace-normal">{interactiveNotice.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setInteractiveNotice(null)}
                className="text-current opacity-70 hover:opacity-100 cursor-pointer shrink-0"
                aria-label="Dismiss notice"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Environment Classification & Mutation Guard */}
          <div className="pt-2 border-t border-[#22262E] flex flex-wrap items-center justify-between gap-2 text-[10.5px] font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[#707070] uppercase font-bold">{copy.step01.safetyGuardLabel}</span>
              {detectEnvironment(blindTargetUrl).mode === 'SANDBOX_AUTONOMOUS' ? (
                <span className="badge-tag px-2 py-0.5 bg-[#059669]/20 text-[#10B981] font-bold text-[10px] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                  <span>{copy.step01.safetySandbox}</span>
                </span>
              ) : (
                <span className="badge-tag px-2 py-0.5 bg-[#F97316]/20 text-[#F97316] font-bold text-[10px] flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  <span>{copy.step01.safetyProduction}</span>
                </span>
              )}
            </div>
            <span
              className="text-[10px] text-[#707070] truncate max-w-[520px]"
              title={detectEnvironment(blindTargetUrl).reason}
            >
              {detectEnvironment(blindTargetUrl).reason}
            </span>
          </div>
        </div>
      )}

      {/* Tab 2: Git Repository Connect */}
      {step1SourceTab === 'GIT_REPO' && (
        <div className="bg-[#111317] border border-[#22262E] p-4 rounded-[4px] font-mono text-[12px] space-y-4 shrink-0">
          <div className="text-[11px] text-[#A1A1A1] flex items-center justify-between pb-2 border-b border-[#22262E]">
            <span className="font-bold text-[#EDEDED]">
              Real Git Clone &amp; Multi-Framework Static AST Scanner
            </span>
            <span className="text-[#2563EB]">
              Isolated Temp Sandbox · Next.js / Fastify / Express / Go / Python / Prisma / SQL
            </span>
          </div>
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-12 md:col-span-2">
              <select
                value={gitProvider}
                onChange={(e) => setGitProvider(e.target.value as any)}
                className="w-full h-9 px-2 bg-[#0B0C0E] border border-[#22262E] focus:border-[#3B82F6] text-[#EDEDED] rounded-[3px] outline-none cursor-pointer"
              >
                <option value="github">GitHub</option>
                <option value="gitlab">GitLab</option>
                <option value="bitbucket">Bitbucket</option>
                <option value="self-hosted">Self-Hosted Git</option>
              </select>
            </div>
            <div className="col-span-12 md:col-span-5 flex items-center gap-2">
              <span className="text-[#707070] text-[11px] whitespace-nowrap">REPO URL:</span>
              <input
                type="text"
                value={gitRepoUrl}
                onChange={(e) => setGitRepoUrl(e.target.value)}
                placeholder="https://github.com/org/repo.git"
                className="flex-1 h-9 px-3 bg-[#0B0C0E] border border-[#22262E] focus:border-[#3B82F6] text-[#EDEDED] rounded-[3px] outline-none"
              />
            </div>
            <div className="col-span-6 md:col-span-2 flex items-center gap-2">
              <span className="text-[#707070] text-[11px] whitespace-nowrap">BRANCH:</span>
              <input
                type="text"
                value={gitBranch}
                onChange={(e) => setGitBranch(e.target.value)}
                placeholder="main"
                className="w-full h-9 px-2.5 bg-[#0B0C0E] border border-[#22262E] focus:border-[#3B82F6] text-[#EDEDED] rounded-[3px] outline-none"
              />
            </div>
            <div className="col-span-6 md:col-span-3 flex items-center gap-2">
              <span className="text-[#707070] text-[11px] whitespace-nowrap">TOKEN:</span>
              <input
                type="password"
                value={gitAuthToken}
                onChange={(e) => setGitAuthToken(e.target.value)}
                placeholder="Personal Access Token (optional)"
                className="w-full h-9 px-2.5 bg-[#0B0C0E] border border-[#22262E] focus:border-[#3B82F6] text-[#EDEDED] rounded-[3px] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Upload .ZIP Archive / Local Folder */}
      {step1SourceTab === 'ZIP_FOLDER' && (
        <div className="bg-[#111317] border border-[#22262E] p-4 rounded-[4px] font-mono text-[12px] space-y-4 shrink-0">
          <div className="text-[11px] text-[#A1A1A1] flex items-center justify-between pb-2 border-b border-[#22262E]">
            <span className="font-bold text-[#EDEDED]">Device Archive / Local Workspace Ingestion</span>
            <span className="text-[#059669]">Direct Filesystem AST Inspection &amp; Route DTO Extraction</span>
          </div>
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-12 md:col-span-7 flex items-center gap-2">
              <span className="text-[#707070] text-[11px] whitespace-nowrap">LOCAL PATH:</span>
              <input
                type="text"
                value={localFolderPath}
                onChange={(e) => setLocalFolderPath(e.target.value)}
                placeholder="/Users/username/Projects/my-app"
                className="flex-1 h-9 px-3 bg-[#0B0C0E] border border-[#22262E] focus:border-[#3B82F6] text-[#EDEDED] rounded-[3px] outline-none"
              />
            </div>
            <div className="col-span-12 md:col-span-5 flex items-center gap-2">
              <span className="text-[#707070] text-[11px] whitespace-nowrap">OR UPLOAD:</span>
              <input
                type="file"
                accept=".zip,.tar.gz"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setLocalFolderPath(file.name);
                    appendTerminalLog(
                      `[UPLOAD] Selected archive: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
                    );
                  }
                }}
                className="flex-1 text-[11px] text-[#A1A1A1] file:mr-2 file:py-1 file:px-2.5 file:rounded-[2px] file:border-0 file:text-[11px] file:bg-[#16191F] file:text-[#EDEDED] file:cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Greenfield Stakeholder MoM / New Project From Zero */}
      {step1SourceTab === 'STAKEHOLDER_MOM' && (
        <div className="bg-[#111317] border border-[#8B5CF6]/40 p-3.5 rounded-[4px] font-mono text-[11.5px] space-y-2.5 shrink-0">
          <div className="text-[11px] text-[#A1A1A1] flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-[#22262E]">
            <span className="font-bold text-[#EDEDED]">{copy.step01.greenfieldNameLabel}</span>
            <span className="text-[#A78BFA]">{copy.step01.greenfieldHint}</span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <input
              type="text"
              value={greenfieldProjectName}
              onChange={(e) => setGreenfieldProjectName(e.target.value)}
              placeholder={copy.step01.greenfieldNamePlaceholder}
              className="flex-1 h-9 px-3 bg-[#0B0C0E] border border-[#22262E] focus:border-[#8B5CF6] text-[#EDEDED] rounded-[3px] outline-none select-text"
            />
            <button
              type="button"
              onClick={handleAnalyzeSourceAndBuildPipeline}
              disabled={isAnalyzingSource}
              className="h-9 px-4 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white font-bold text-[11.5px] rounded-[3px] flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0"
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span>{isAnalyzingSource ? copy.step01.primaryCtaBusy : copy.step01.primaryCta}</span>
            </button>
          </div>
        </div>
      )}

      {/* Part 3: Cross-Project Vault Integration Linker Bar in Step 01 */}
      <div className="bg-[#111317] border border-[#22262E] p-3 rounded-[4px] font-mono text-[11px] flex flex-col md:flex-row md:items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Link2 className="h-3.5 w-3.5 text-[#A78BFA] shrink-0" />
          <span className="font-bold text-[#EDEDED] whitespace-nowrap">
            {locale === 'id'
              ? 'Integrasikan dengan Proyek Lain di Vault (Opsional):'
              : 'Link Integration Target from Vault (Optional):'}
          </span>
          {linkedUpstreamProject && (
            <span className="px-2 py-0.5 bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#A78BFA] rounded-[2px] text-[10px] font-bold truncate">
              {linkedUpstreamProject.projectName} ({linkedUpstreamProject.linkedContracts.length} APIs)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            aria-label="Link Integration Target from Saved Vault Projects"
            value={selectedIntegrationTargetId}
            onChange={(e) => setSelectedIntegrationTargetId(e.target.value)}
            className="h-8 px-2.5 bg-[#0B0C0E] border border-[#22262E] focus:border-[#8B5CF6] text-[#EDEDED] rounded-[3px] outline-none text-[11px] cursor-pointer min-w-[200px]"
          >
            <option value="">
              {locale === 'id' ? 'Pilih Proyek dari Vault...' : 'Select Project from Vault...'}
            </option>
            {vaultProjects
              .filter((p) => p.projectId !== activeVaultProjectId)
              .map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.projectName} ({p.latestApisCount} APIs)
                </option>
              ))}
          </select>
          <button
            type="button"
            onClick={() => handleLinkVaultIntegrationProject()}
            disabled={!selectedIntegrationTargetId || isLinkingIntegration}
            className="h-8 px-3 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-40 text-white font-bold rounded-[3px] flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
          >
            <Link2 className="h-3.5 w-3.5" />
            <span>
              {locale === 'id' ? 'Sambungkan Kontrak Integrasi' : 'Link Integration Contracts'}
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 min-h-[280px]">
        {/* Left Column: Raw Stakeholder MoM & Notes / Autonomous Discovery Summary */}
        {displayMode !== 'EXECUTIVE' && (
          <div className="col-span-12 lg:col-span-5 flex flex-col bg-[#111317] border border-[#22262E] rounded-[4px] p-3 space-y-2.5 min-h-[280px]">
            {/* Header with Dual Tabs: Human Notes vs Autonomous Summary */}
            <div className="flex flex-wrap items-center justify-between pb-1.5 border-b border-[#22262E] gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[3px]">
                <button
                  type="button"
                  onClick={() => setActiveNotesMode('HUMAN_MOM')}
                  className={`px-2 py-0.5 text-[11px] font-mono rounded-[2px] transition-colors cursor-pointer ${
                    activeNotesMode === 'HUMAN_MOM'
                      ? 'bg-[#2563EB] text-white font-bold'
                      : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                  }`}
                >
                  {copy.step01.humanNotesTitle}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveNotesMode('AUTONOMOUS_SUMMARY')}
                  className={`px-2 py-0.5 text-[11px] font-mono rounded-[2px] transition-colors cursor-pointer flex items-center gap-1 ${
                    activeNotesMode === 'AUTONOMOUS_SUMMARY'
                      ? 'bg-[#D97706] text-white font-bold'
                      : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                  }`}
                >
                  <span>{copy.step01.discoverySummaryTitle}</span>
                  {isAutonomousZeroDoc && (
                    <span className="px-1 py-0.2 bg-black/40 text-[9px] rounded uppercase font-bold text-amber-200">
                      CRAWL
                    </span>
                  )}
                </button>
              </div>

              {activeNotesMode === 'HUMAN_MOM' ? (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".md,.txt,.docx,.vtt,text/plain,text/markdown"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2 py-0.5 bg-[#16191F] border border-[#22262E] hover:border-[#3B82F6] text-[#EDEDED] text-[10.5px] font-mono rounded-[2px] transition-colors cursor-pointer"
                    title={copy.step01.uploadNotesBtn}
                  >
                    <Upload className="h-3 w-3 text-[#3B82F6]" />
                    <span>{copy.step01.uploadNotesBtn}</span>
                  </button>
                </div>
              ) : (
                <span className="text-[10px] font-mono text-[#F59E0B] uppercase font-bold">
                  {locale === 'id' ? 'Hasil Discovery Otomatis' : 'Autonomous Discovery'}
                </span>
              )}
            </div>

            {activeNotesMode === 'HUMAN_MOM' ? (
              <textarea
                value={humanNotes}
                onChange={(e) => {
                  setHumanNotes(e.target.value);
                  setRawMoMNotes(e.target.value);
                }}
                placeholder={copy.step01.humanNotesPlaceholder}
                className="flex-1 w-full min-h-[160px] bg-[#0B0C0E] border border-[#22262E] rounded-[3px] p-2.5 text-[12px] font-mono leading-[1.55] text-[#EDEDED] resize-none outline-none focus:border-[#3B82F6]"
              />
            ) : (
              <div className="flex-1 flex flex-col space-y-2 min-h-[160px] overflow-hidden">
                <div className="px-2 py-1 bg-[#1F1608] border border-[#F59E0B]/30 rounded text-[10.5px] font-mono text-[#FBBF24]">
                  {locale === 'id'
                    ? 'Ringkasan ini dihasilkan dari penelusuran as-built tanpa dokumen sumber. Unggah atau tempel notulen manusia di tab sebelah untuk menghasilkan BRD normatif.'
                    : 'This summary was compiled from as-built discovery without source documents. Upload or paste human notes in the other tab to generate normative BRD.'}
                </div>
                <textarea
                  readOnly
                  value={rawMoMNotes}
                  className="flex-1 w-full min-h-[130px] bg-[#0B0C0E] border border-[#22262E] rounded-[3px] p-2.5 text-[11px] font-mono leading-[1.5] text-[#A1A1A1] resize-none outline-none cursor-default"
                />
              </div>
            )}

            <div className="px-2.5 py-1.5 bg-[#0B0C0E] border border-[#22262E] rounded-[3px] text-[11px] text-[#A1A1A1] font-mono flex items-center justify-between gap-2 shrink-0">
              <span className="whitespace-nowrap">{copy.step01.activeScopeLabel}</span>
              <strong className="text-[#059669] tabular-nums truncate">
                {brdMatrixRows.length} {copy.step01.rulesUnit} · {validationRules.length}{' '}
                {copy.step01.contractsUnit}
              </strong>
            </div>
          </div>
        )}

        {/* Right Column: Extracted Entities, Actors & Constraints (Expanded to full width in Executive Mode) */}
        <div className={`col-span-12 ${displayMode === 'EXECUTIVE' ? 'lg:col-span-12' : 'lg:col-span-7'} flex flex-col bg-[#111317] border border-[#22262E] rounded-[4px] p-3 space-y-2.5 min-h-[280px] overflow-hidden`}>
          <div className="flex items-center justify-between pb-1.5 border-b border-[#22262E] shrink-0">
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-[#059669]" />
              <span className="text-[12.5px] font-bold text-[#EDEDED]">
                {copy.step01.entitiesCardTitle}
              </span>
            </div>
            <span className="badge-tag px-2 py-0.5 bg-[#059669]/20 text-[#059669] font-bold tabular-nums text-[10px]">
              {extractedEntities.length} {copy.step01.extractedBadge}
            </span>
          </div>

          <div className="flex-1 overflow-auto border border-[#22262E] rounded-[3px] min-h-[180px]">
            <table className="w-full table-fixed border-collapse text-left text-[12px]">
              <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] sticky top-0 font-mono text-[10.5px] uppercase z-10">
                <tr>
                  <th className="py-2.5 px-3 w-[124px] border-r border-[#22262E]">
                    {copy.step01.colType}
                  </th>
                  <th className="py-2.5 px-3 w-[128px] border-r border-[#22262E]">
                    {copy.step01.colId}
                  </th>
                  <th className="py-2.5 px-3 border-r border-[#22262E]">
                    {copy.step01.colStatement}
                  </th>
                  <th className="py-2.5 px-3 w-[26%]">{copy.step01.colExcerpt}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22262E] bg-[#111317]">
                {extractedEntities.map((ent) => (
                  <tr
                    key={ent.id}
                    onClick={() => openInspectorForEntity(ent.identifier)}
                    className={`hover:bg-[#16191F] cursor-pointer transition-colors ${
                      selectedEntityId === ent.identifier ? 'bg-[#16191F]' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 border-r border-[#22262E] whitespace-nowrap">
                      <span
                        className={`badge-tag px-1.5 py-0.5 font-bold text-[10px] ${
                          ent.type === 'ACTOR'
                            ? 'bg-[#2563EB]/20 text-[#3B82F6]'
                            : ent.type === 'BUSINESS_RULE'
                            ? 'bg-[#059669]/20 text-[#059669]'
                            : ent.type === 'CONSTRAINT'
                            ? 'bg-[#D97706]/20 text-[#D97706]'
                            : 'bg-[#8B5CF6]/20 text-[#A78BFA]'
                        }`}
                      >
                        {ent.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#EDEDED] border-r border-[#22262E] break-all text-[11.5px]">
                      {ent.identifier}
                    </td>
                    <td className="py-2.5 px-3 text-[#EDEDED] leading-relaxed border-r border-[#22262E] break-words">
                      {ent.label}
                    </td>
                    <td className="py-2.5 px-3 text-[#707070] text-[11.5px] font-mono italic break-words">
                      &ldquo;{ent.sourceText}&rdquo;
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-[11px] font-mono text-[#707070]">
            {copy.step01.entitiesTip}
          </div>
        </div>
      </div>
    </div>
  );
}
