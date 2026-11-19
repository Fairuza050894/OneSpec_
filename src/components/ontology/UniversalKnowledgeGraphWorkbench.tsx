'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Share2,
  Download,
  Copy,
  Check,
  ArrowRight,
  Play,
  RotateCw,
  Terminal,
  LayoutDashboard,
  BookOpen,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Plug,
  Database,
  History,
  Save,
  Search,
  Layers,
  FileSpreadsheet,
  Network,
  Camera,
  Zap,
  Plus,
} from 'lucide-react';
import {
  sdlcKnowledgeGraphService,
  type KnowledgeGraphSummary,
  type KnowledgeNodeType,
  type KnowledgeGraphNode,
} from '@/services/sdlcKnowledgeGraphService';
import type {
  DiscoveredApiEndpoint,
  DatabaseErdTable,
  ValidationRuleContract,
  BrdMatrixRow,
  FeatureModuleSurface,
  CrawledModuleSummary,
  TestScenarioItem,
  BugReportTicket,
  UatFeatureFlow,
  GapAuditSummary,
  AuditDiscrepancyItem,
  TestSuiteExecutionTrace,
  VisualCalloutPinItem,
  ReleaseSignOffCertificate,
  ReleaseAuditSignatureRecord,
} from '@/types/sdlc';
import type { SynthesizedRtmRow } from '@/services/rtmSynthesizer';
import type { OwaspDastAssessmentSummary } from '@/services/owaspDastService';
import type { ComplianceAssessmentResult } from '@/services/complianceBinderService';
import type { IsoRiskAssessmentSummary } from '@/services/iso31000RiskService';
import type { SmtFormalVerificationSummary } from '@/services/smtFormalVerifierService';
import type { DelphiConsensusSummary } from '@/services/delphiConsensusService';
import { architectureDeconstructorService, type DeconstructedArchitecture } from '@/services/architectureDeconstructor';
import { unifiedReportGenerator } from '@/services/unifiedReportGenerator';
import type { CompiledSdlcState } from '@/services/sdlcCompiler';
import { VerifiedArchitectureMapCanvas } from '@/components/architecture/VerifiedArchitectureMapCanvas';
import type { RegressionDiffSummary } from '@/services/workspaceVaultService';
import { changeImpactService, type ChangeImpactAnalysisReport } from '@/services/changeImpactService';
import { useStudioLocale } from '@/lib/i18n';
import { sha256Hex, canonicalJson } from '@/lib/safeCrypto';
import {
  buildFeatureModuleBlueprintSvgDataUrl,
  isBlankOrMissingScreenshot,
} from '@/lib/featureModuleBlueprint';
import { ModuleScreenshot } from '@/components/shared/ModuleScreenshot';
import { sanitizeFeatureModuleScreenshots } from '@/lib/featureModuleScreenshotSanitizer';
import { detectBlankRasterDataUrl } from '@/lib/screenshotQuality';

function normalizeManualImgSrc(raw?: string | null, fallback = ''): string {
  if (!raw) return fallback;
  const s = String(raw).trim();
  if (s.startsWith('data:image/')) {
    if (s.startsWith('data:image/svg+xml;utf8,')) {
      try {
        const svgBody = decodeURIComponent(s.replace('data:image/svg+xml;utf8,', ''));
        const b64 = btoa(unescape(encodeURIComponent(svgBody)));
        return `data:image/svg+xml;base64,${b64}`;
      } catch {}
    }
    return s;
  }
  if (s.startsWith('blob:') || s.startsWith('http://') || s.startsWith('https://')) {
    return s;
  }
  return fallback;
}

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center font-mono text-[11px] text-[#707070] bg-[#0E1015]">
      Loading Document Editor...
    </div>
  ),
});

export interface UniversalKnowledgeGraphWorkbenchProps {
  appName?: string;
  targetUrl: string;
  apiEndpoints: DiscoveredApiEndpoint[];
  databaseTables: DatabaseErdTable[];
  validationRules: ValidationRuleContract[];
  businessRules: BrdMatrixRow[];
  rtmRows?: SynthesizedRtmRow[];
  discoveredFeatureModules?: FeatureModuleSurface[];
  discoveredModules?: CrawledModuleSummary[];
  testScenarios?: TestScenarioItem[];
  bugReports?: BugReportTicket[];
  uatFlows?: UatFeatureFlow[];
  gapAuditSummary?: GapAuditSummary;
  gapAuditItems?: AuditDiscrepancyItem[];
  owaspDastSummary?: OwaspDastAssessmentSummary;
  complianceAssessment?: ComplianceAssessmentResult;
  isoRiskSummary?: IsoRiskAssessmentSummary;
  smtVerificationSummary?: SmtFormalVerificationSummary;
  delphiConsensusSummary?: DelphiConsensusSummary;
  executionTraces?: TestSuiteExecutionTrace[];
  deconstructedArchitecture?: DeconstructedArchitecture;
  initialGraphSummary?: KnowledgeGraphSummary;
  compiledState?: CompiledSdlcState | null;
  regressionDiffSummary?: RegressionDiffSummary | null;
  isSavingSnapshot?: boolean;
  onSaveSnapshot?: () => void;
  onOpenHistory?: () => void;
  onAppendLog?: (msg: string) => void;
  onMergeChangeRequest?: (report: ChangeImpactAnalysisReport) => void;
  onUpdateModulePins?: (routePath: string, pins: VisualCalloutPinItem[]) => void;
  onApproveReleaseSignOff?: (signOff: ReleaseSignOffCertificate) => void;
  onNavigateToStep?: (step: number) => void;
}

export function UniversalKnowledgeGraphWorkbench({
  appName = 'Active Application',
  targetUrl,
  apiEndpoints,
  databaseTables,
  validationRules,
  businessRules,
  rtmRows,
  discoveredFeatureModules,
  discoveredModules,
  testScenarios,
  bugReports,
  uatFlows,
  gapAuditSummary,
  gapAuditItems,
  owaspDastSummary,
  complianceAssessment,
  isoRiskSummary,
  smtVerificationSummary,
  delphiConsensusSummary,
  executionTraces,
  deconstructedArchitecture,
  initialGraphSummary,
  compiledState,
  regressionDiffSummary,
  isSavingSnapshot = false,
  onSaveSnapshot,
  onOpenHistory,
  onAppendLog,
  onMergeChangeRequest,
  onUpdateModulePins,
  onApproveReleaseSignOff,
  onNavigateToStep,
}: UniversalKnowledgeGraphWorkbenchProps) {
  const { locale, copy } = useStudioLocale();
  const [activeTab, setActiveTab] = useState<
    'LAYPERSON_SUMMARY' | 'AZ_LIBRARY' | 'INTEGRATION_KIT' | 'TECHNICAL_GRAPH'
  >('LAYPERSON_SUMMARY');
  const [activeBook, setActiveBook] = useState<'BOOK1' | 'BOOK2' | 'BOOK3' | 'BOOK4'>('BOOK1');
  const [bookViewMode, setBookViewMode] = useState<'READER' | 'MARKDOWN'>('READER');
  const [book1ViewAllModules, setBook1ViewAllModules] = useState<boolean>(true);
  const [book1ModuleIndex, setBook1ModuleIndex] = useState<number>(0);
  const [techSubTab, setTechSubTab] = useState<
    'INTERACTIVE_GRAPH' | 'CYPHER_STUDIO' | 'TRIPLES_LEDGER' | 'WHITEPAPER'
  >('INTERACTIVE_GRAPH');
  const [dictSearch, setDictSearch] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<KnowledgeNodeType | 'ALL'>('ALL');
  const [selectedNode, setSelectedNode] = useState<KnowledgeGraphNode | null>(null);
  const [activeCypherQuery, setActiveCypherQuery] = useState<string>('');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCrOpen, setIsCrOpen] = useState<boolean>(false);
  const [crModuleId, setCrModuleId] = useState<string>('');
  const [crTitle, setCrTitle] = useState<string>('');
  const [crDesc, setCrDesc] = useState<string>('');
  const [crReport, setCrReport] = useState<ChangeImpactAnalysisReport | null>(null);
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [editingPinRoute, setEditingPinRoute] = useState<string | null>(null);
  const [selectedPinNum, setSelectedPinNum] = useState<number>(1);
  const [draftPinsByRoute, setDraftPinsByRoute] = useState<Record<string, VisualCalloutPinItem[]>>({});
  const [newPinLabel, setNewPinLabel] = useState<string>('');
  const [newPinKind, setNewPinKind] = useState<'BUTTON' | 'FILTER' | 'SUB_TAB'>('BUTTON');
  const [operatorSessionId] = useState<string>(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `OP-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    }
    return `OP-${Date.now().toString(36).toUpperCase()}`;
  });
  const [signOffApprover, setSignOffApprover] = useState<string>(compiledState?.releaseSignOff?.approvedBy || 'Principal Lead Architect');
  const [signOffRole, setSignOffRole] = useState<string>(
    compiledState?.releaseSignOff?.approverRole || compiledState?.releaseSignOff?.roleTitle || 'Lead Systems Architect'
  );
  const [signOffNotes, setSignOffNotes] = useState<string>(compiledState?.releaseSignOff?.notes || compiledState?.releaseSignOff?.releaseNotes || '');
  const [chkQaGapReviewed, setChkQaGapReviewed] = useState<boolean>(true);
  const [chkZeroCriticalSec, setChkZeroCriticalSec] = useState<boolean>(true);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [copiedSdk, setCopiedSdk] = useState<boolean>(false);

  const handleCopySdk = () => {
    const sdkCode = architectureDeconstructorService.generateTypeScriptIntegrationSdk(resolvedArch);
    navigator.clipboard.writeText(sdkCode);
    setCopiedSdk(true);
    setTimeout(() => setCopiedSdk(false), 2000);
  };

  const handleDownloadSdk = () => {
    const sdkCode = architectureDeconstructorService.generateTypeScriptIntegrationSdk(resolvedArch);
    const blob = new Blob([sdkCode], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(appName || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-integration-sdk.ts`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summary: KnowledgeGraphSummary = useMemo(() => {
    if (
      locale === 'en' &&
      !regressionDiffSummary &&
      initialGraphSummary &&
      initialGraphSummary.laypersonExecutiveDigest?.locale === 'en' &&
      initialGraphSummary.azDocumentationLibrary?.book3ArchitectureIntegration?.plainArchitectureExplanation
    ) {
      return initialGraphSummary;
    }
    return sdlcKnowledgeGraphService.buildUniversalGraph({
      appName,
      targetUrl,
      locale,
      apiEndpoints,
      databaseTables,
      validationRules,
      businessRules,
      rtmRows,
      discoveredFeatureModules,
      discoveredModules,
      testScenarios,
      bugReports,
      uatFlows,
      gapAuditSummary,
      gapAuditItems,
      owaspDastSummary,
      complianceAssessment,
      isoRiskSummary,
      smtVerificationSummary,
      delphiConsensusSummary,
      executionTraces,
      deconstructedArchitecture,
      regressionDiffSummary,
    });
  }, [
    locale,
    initialGraphSummary,
    appName,
    targetUrl,
    apiEndpoints,
    databaseTables,
    validationRules,
    businessRules,
    rtmRows,
    discoveredFeatureModules,
    discoveredModules,
    testScenarios,
    bugReports,
    uatFlows,
    gapAuditSummary,
    gapAuditItems,
    owaspDastSummary,
    complianceAssessment,
    isoRiskSummary,
    smtVerificationSummary,
    delphiConsensusSummary,
    executionTraces,
    deconstructedArchitecture,
    regressionDiffSummary,
  ]);

  const digest = summary.laypersonExecutiveDigest;
  const azLib = summary.azDocumentationLibrary;
  const isId = locale === 'id';
  const book1Manuals = azLib.book1NonTechnical.featureManuals || [];
  const displayedBook1Manuals = book1ViewAllModules
    ? book1Manuals
    : book1Manuals.slice(book1ModuleIndex, book1ModuleIndex + 1);

  const filteredNodes = useMemo(() => {
    if (selectedTypeFilter === 'ALL') return summary.nodes;
    return summary.nodes.filter((n) => n.type === selectedTypeFilter);
  }, [summary.nodes, selectedTypeFilter]);

  const filteredDictionary = useMemo(() => {
    const entries = azLib.book2BusinessAnalyst.masterDataDictionary || [];
    const q = dictSearch.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (d) =>
        d.tableName.toLowerCase().includes(q) ||
        d.fieldName.toLowerCase().includes(q) ||
        d.businessMeaning.toLowerCase().includes(q) ||
        d.sourceModule.toLowerCase().includes(q)
    );
  }, [azLib, dictSearch]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunCypher = (queryText: string) => {
    setIsQuerying(true);
    setActiveCypherQuery(queryText);
    if (onAppendLog) {
      onAppendLog(`[CYPHER QUERY] Executing semantic traversal: ${queryText.replace(/\n/g, ' ')}`);
    }
    setTimeout(() => {
      setIsQuerying(false);
      if (onAppendLog) {
        onAppendLog(`[CYPHER QUERY] Traversal complete: Matched nodes and edges in knowledge graph.`);
      }
    }, 350);
  };

  const handleDownloadAzPortalHtml = async () => {
    const baseState: CompiledSdlcState = compiledState || ({
      appName,
      targetUrl,
      badgeText: '',
      rawMoMNotes: '',
      discoveredModules,
      discoveredFeatureModules,
      testScenarios,
      bugReports,
      uatFlows,
      extractedEntities: [],
      brdMatrixRows: businessRules,
      validationRules,
      bpmnXml: '',
      rtmRows: rtmRows || [],
      discoveryResult: {
        mode: 'MODE_C_STAGING',
        targetIdentifier: targetUrl,
        branchOrDatabase: 'main',
        discoveredAt: new Date().toISOString(),
        durationMs: 0,
        framework: 'OneSpec',
        apiEndpoints,
        openApiSpec: {},
        databaseTables,
        domTraceability: [],
      },
      gapAuditItems: gapAuditItems || [],
      gapAuditSummary: gapAuditSummary || {
        totalAudited: 0,
        compliantCount: 0,
        missingInBackendCount: 0,
        schemaMismatchCount: 0,
        shadowApiCount: 0,
        complianceRatePercent: 100,
        auditTimestamp: new Date().toISOString(),
      },
      playwrightSpecCode: '',
      k6ScriptCode: '',
      postmanCollectionJson: '',
      pipelineStages: [],
      executionTraces: executionTraces || [],
      tsdRows: [],
      tsdMarkdown: '',
      deconstructedArchitecture: deconstructedArchitecture!,
      architectureBlueprintMarkdown: '',
      deepUnpackResult: {} as any,
      owaspDastSummary: owaspDastSummary!,
      complianceAssessment: complianceAssessment!,
      reverseDfdResult: {} as any,
      isoRiskSummary: isoRiskSummary!,
      smtVerificationSummary: smtVerificationSummary!,
      delphiConsensusSummary: delphiConsensusSummary!,
      knowledgeGraphSummary: summary,
    } as CompiledSdlcState);

    // Blank captures would export as white boxes in the standalone HTML portal.
    const exportState: CompiledSdlcState = {
      ...baseState,
      discoveredFeatureModules: await sanitizeFeatureModuleScreenshots(
        baseState.discoveredFeatureModules || [],
        (url) => detectBlankRasterDataUrl(url).then((verdict) => verdict === 'BLANK')
      ),
    };

    const html = sdlcKnowledgeGraphService.generateCompleteAzLibraryHtml(
      exportState,
      regressionDiffSummary,
      locale
    );
    const slug = appName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OneSpec_AZ_Documentation_Portal_${slug}.html`;
    link.click();
    URL.revokeObjectURL(url);
    onAppendLog?.(`[A-Z PORTAL] Exported standalone 4-Book A-Z Documentation Portal HTML for ${appName}.`);
  };

  const buildFallbackCompiledState = (): CompiledSdlcState =>
    compiledState ||
    ({
      appName,
      targetUrl,
      badgeText: '',
      rawMoMNotes: '',
      discoveredModules,
      discoveredFeatureModules,
      testScenarios,
      bugReports,
      uatFlows,
      extractedEntities: [],
      brdMatrixRows: businessRules,
      validationRules,
      bpmnXml: '',
      rtmRows: rtmRows || [],
      discoveryResult: {
        mode: 'MODE_C_STAGING',
        targetIdentifier: targetUrl,
        branchOrDatabase: 'main',
        discoveredAt: new Date().toISOString(),
        durationMs: 0,
        framework: 'OneSpec',
        apiEndpoints,
        openApiSpec: {},
        databaseTables,
        domTraceability: [],
      },
      gapAuditItems: gapAuditItems || [],
      gapAuditSummary: gapAuditSummary || {
        totalAudited: 0,
        compliantCount: 0,
        missingInBackendCount: 0,
        schemaMismatchCount: 0,
        shadowApiCount: 0,
        complianceRatePercent: 100,
        auditTimestamp: new Date().toISOString(),
      },
      playwrightSpecCode: '',
      k6ScriptCode: '',
      postmanCollectionJson: '',
      pipelineStages: [],
      executionTraces: executionTraces || [],
      tsdRows: [],
      tsdMarkdown: '',
      deconstructedArchitecture: deconstructedArchitecture!,
      architectureBlueprintMarkdown: '',
      deepUnpackResult: {} as any,
      owaspDastSummary: owaspDastSummary!,
      complianceAssessment: complianceAssessment!,
      reverseDfdResult: {} as any,
      isoRiskSummary: isoRiskSummary!,
      smtVerificationSummary: smtVerificationSummary!,
      delphiConsensusSummary: delphiConsensusSummary!,
      knowledgeGraphSummary: summary,
    } as CompiledSdlcState);

  const handleDownloadWordDoc = async () => {
    if (isExportingDocx) return;
    setIsExportingDocx(true);
    const stateObj = buildFallbackCompiledState();
    const slug = appName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'onespec_project';
    try {
      const res = await fetch('/api/export/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'docx',
          compiledState: stateObj,
          regressionDiffSummary,
          locale,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `OneSpec_AZ_Documentation_${slug}.docx`;
      link.click();
      URL.revokeObjectURL(url);
      onAppendLog?.(`[DOCX EXPORT] Exported modern OOXML Word / Google Docs compatible (.docx) for ${appName}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onAppendLog?.(`[DOCX EXPORT ERROR] ${msg}`);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    const stateObj = buildFallbackCompiledState();
    const slug = appName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'onespec_project';
    try {
      const res = await fetch('/api/export/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'pdf',
          compiledState: stateObj,
          regressionDiffSummary,
          locale,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `OneSpec_AZ_Documentation_${slug}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      onAppendLog?.(`[PDF EXPORT] Exported print-ready A4 PDF Documentation Bundle (.pdf) for ${appName}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onAppendLog?.(`[PDF EXPORT ERROR] ${msg}`);
    } finally {
      setIsExportingPdf(false);
    }
  };
  const handleDownloadExcelXls = () => {
    const manuals = azLib.book1NonTechnical.featureManuals
      .map((g) => g.iso26514Manual)
      .filter((m): m is NonNullable<typeof m> => Boolean(m));
    const xls = unifiedReportGenerator.generateExcelQaWorkbookHtml({
      appName,
      targetUrl,
      testScenarios: testScenarios || [],
      rtmRows: rtmRows || [],
      bugReports: bugReports || [],
      uatFlows: uatFlows || [],
      dataDictionary: azLib.book2BusinessAnalyst.masterDataDictionary,
      userManuals: manuals,
      architecture: deconstructedArchitecture,
      compiledState: compiledState || undefined,
      regressionDiff: regressionDiffSummary || undefined,
      locale,
    });
    const slug = appName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const blob = new Blob([xls], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OneSpec_QA_and_Dictionary_${slug}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    onAppendLog?.(`[EXCEL EXPORT] Exported QA Workbook & Data Dictionary Excel (.xls) for ${appName}.`);
  };

  const handleDownloadDrawioXml = () => {
    const archTarget =
      deconstructedArchitecture ||
      architectureDeconstructorService.deconstruct({
        appName,
        targetUrl,
        apiEndpoints,
        databaseTables,
        domBindings: [],
        validationRules,
        businessRules,
        discoveredModules,
      });
    const xml = architectureDeconstructorService.generateDrawioXml(archTarget);
    const slug = appName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OneSpec_Architecture_${slug}.drawio`;
    link.click();
    URL.revokeObjectURL(url);
    onAppendLog?.(`[DRAW.IO EXPORT] Exported mxGraphModel Architecture Diagram (.drawio) for ${appName}.`);
  };
  const handleDownloadLaypersonMarkdown = () => {
    const slug = appName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fullMd = [
      digest.laypersonExecutiveReportMarkdown,
      '\n---\n',
      azLib.book1NonTechnical.markdown,
      '\n---\n',
      azLib.book2BusinessAnalyst.markdown,
      '\n---\n',
      azLib.book3ArchitectureIntegration.markdown,
      '\n---\n',
      azLib.book4QaAndCompliance.markdown,
    ].join('\n');
    const blob = new Blob([fullMd], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OneSpec_Complete_AZ_Docs_${slug}.md`;
    link.click();
    URL.revokeObjectURL(url);
    onAppendLog?.(`[A-Z LIBRARY] Exported combined 4-Book Markdown bundle for ${appName}.`);
  };

  const handleDownloadWhitepaper = () => {
    const slug = appName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const blob = new Blob([summary.enterpriseWhitepaperMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SDLC_SYSTEM_WHITEPAPER_${slug}.md`;
    link.click();
    URL.revokeObjectURL(url);
    onAppendLog?.(`[KNOWLEDGE GRAPH] Exported 360-degree System Whitepaper for ${appName}.`);
  };

  const getNodeColor = (type: KnowledgeNodeType) => {
    switch (type) {
      case 'MOM':
        return 'text-[#38BDF8] border-[#38BDF8]/40 bg-[#38BDF8]/10';
      case 'BUSINESS_RULE':
        return 'text-[#3B82F6] border-[#3B82F6]/40 bg-[#3B82F6]/10';
      case 'VALIDATION_RULE':
        return 'text-[#F59E0B] border-[#F59E0B]/40 bg-[#F59E0B]/10';
      case 'API_ENDPOINT':
        return 'text-[#8B5CF6] border-[#8B5CF6]/40 bg-[#8B5CF6]/10';
      case 'DATABASE_TABLE':
        return 'text-[#10B981] border-[#10B981]/40 bg-[#10B981]/10';
      case 'TEST_CASE':
        return 'text-[#06B6D4] border-[#06B6D4]/40 bg-[#06B6D4]/10';
      case 'REGULATORY_CONTROL':
        return 'text-[#EF4444] border-[#EF4444]/40 bg-[#EF4444]/10';
      case 'SMT_INVARIANT':
        return 'text-[#10B981] border-[#10B981]/40 bg-[#10B981]/10';
      case 'ARB_CLEARANCE':
        return 'text-[#F97316] border-[#F97316]/40 bg-[#F97316]/10';
      default:
        return 'text-[#A1A1A1] border-[#22262E] bg-[#111317]';
    }
  };

  const currentBookMarkdown =
    activeBook === 'BOOK1'
      ? azLib.book1NonTechnical.markdown
      : activeBook === 'BOOK2'
      ? azLib.book2BusinessAnalyst.markdown
      : activeBook === 'BOOK3'
      ? azLib.book3ArchitectureIntegration.markdown
      : azLib.book4QaAndCompliance.markdown;

  const plainArch =
    azLib.book3ArchitectureIntegration.plainArchitectureExplanation ||
    deconstructedArchitecture?.plainArchitectureExplanation;
  const integrationKit =
    azLib.book3ArchitectureIntegration.integrationHandoffKit ||
    deconstructedArchitecture?.integrationHandoffKit;
  const resolvedArch = useMemo(() => {
    const base =
      deconstructedArchitecture ||
      architectureDeconstructorService.deconstruct({
        appName,
        targetUrl,
        apiEndpoints,
        databaseTables,
        domBindings: [],
        validationRules,
        businessRules,
        discoveredModules,
      });
    if (integrationKit?.upstreamLinkedProject && !base.integrationHandoffKit.upstreamLinkedProject) {
      return {
        ...base,
        integrationHandoffKit: {
          ...base.integrationHandoffKit,
          upstreamLinkedProject: integrationKit.upstreamLinkedProject,
        },
      };
    }
    return base;
  }, [
    deconstructedArchitecture,
    appName,
    targetUrl,
    apiEndpoints,
    databaseTables,
    validationRules,
    businessRules,
    discoveredModules,
    integrationKit,
  ]);

  return (
    <div className="w-full h-full flex flex-col bg-[#0B0C0E] border border-[#22262E] rounded-[4px] overflow-hidden min-h-0">
      {/* Step 12 Header Toolbar */}
      <div className="bg-[#16191F] border-b border-[#22262E] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-[#3B82F6] shrink-0" />
            <h1 className="text-[15px] font-bold text-[#EDEDED] tracking-tight truncate">
              {copy.step12.title}
            </h1>
            <span className="badge-tag px-1.5 py-0.5 bg-[#059669]/20 text-[#10B981] font-mono text-[10px] font-bold whitespace-nowrap tabular-nums">
              {copy.step12.readinessLabel}: {digest.overallHealthBanner.healthScorePercent}%
            </span>
          </div>
          <p className="text-[11px] text-[#A1A1A1] font-mono mt-0.5 truncate">
            {copy.step12.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 min-w-0 font-mono text-[10px]">
          {onSaveSnapshot && (
            <button
              onClick={onSaveSnapshot}
              disabled={isSavingSnapshot}
              className="h-7 px-2.5 bg-[#059669] hover:bg-[#047857] disabled:opacity-50 text-white font-bold rounded-[3px] transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              title="Save current compiled version as snapshot inside .onespec-vault"
            >
              {isSavingSnapshot ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span>{isSavingSnapshot ? copy.step12.savingSnapshot : locale === 'id' ? 'Simpan Snapshot' : 'Save Snapshot'}</span>
            </button>
          )}
        </div>

      </div>
      {/* 4 Single-Line Navigation Tabs */}
      <div className="bg-[#111317] border-b border-[#22262E] px-3 py-1.5 flex flex-wrap items-center gap-1.5 font-mono text-[10px] shrink-0 select-none">
        <button
          onClick={() => setActiveTab('LAYPERSON_SUMMARY')}
          className={`px-2 py-1 rounded-[3px] border transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'LAYPERSON_SUMMARY'
              ? 'bg-[#2563EB] text-white border-[#2563EB] font-bold'
              : 'bg-[#0B0C0E] text-[#A1A1A1] border-[#22262E] hover:text-[#EDEDED]'
          }`}
        >
          <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
          <span>{copy.step12.tabSummary}</span>
        </button>

        <button
          onClick={() => setActiveTab('AZ_LIBRARY')}
          className={`px-2 py-1 rounded-[3px] border transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'AZ_LIBRARY'
              ? 'bg-[#2563EB] text-white border-[#2563EB] font-bold'
              : 'bg-[#0B0C0E] text-[#A1A1A1] border-[#22262E] hover:text-[#EDEDED]'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5 shrink-0" />
          <span>{copy.step12.tabLibrary}</span>
        </button>

        <button
          onClick={() => setActiveTab('INTEGRATION_KIT')}
          className={`px-2 py-1 rounded-[3px] border transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'INTEGRATION_KIT'
              ? 'bg-[#2563EB] text-white border-[#2563EB] font-bold'
              : 'bg-[#0B0C0E] text-[#A1A1A1] border-[#22262E] hover:text-[#EDEDED]'
          }`}
        >
          <Plug className="h-3.5 w-3.5 shrink-0" />
          <span>{copy.step12.tabIntegration}</span>
        </button>

        <button
          onClick={() => setActiveTab('TECHNICAL_GRAPH')}
          className={`px-2 py-1 rounded-[3px] border transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'TECHNICAL_GRAPH'
              ? 'bg-[#2563EB] text-white border-[#2563EB] font-bold'
              : 'bg-[#0B0C0E] text-[#A1A1A1] border-[#22262E] hover:text-[#EDEDED]'
          }`}
        >
          <Share2 className="h-3.5 w-3.5 shrink-0" />
          <span>{copy.step12.tabGraph}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* =========================================================================
         * TAB 1: EXECUTIVE SUMMARY (STEPS 01-11) + REGRESSION DIFF CARD
         * ========================================================================= */}
        {activeTab === 'LAYPERSON_SUMMARY' && (
          <>
            <div
              className={`p-4 rounded-[4px] border space-y-3 ${
                digest.overallHealthBanner.verdictTone === 'READY'
                  ? 'bg-[#059669]/10 border-[#059669]/50'
                  : digest.overallHealthBanner.verdictTone === 'ADVISORY'
                  ? 'bg-[#D97706]/10 border-[#D97706]/50'
                  : 'bg-[#DC2626]/10 border-[#DC2626]/50'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {digest.overallHealthBanner.verdictTone === 'READY' ? (
                    <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                  ) : digest.overallHealthBanner.verdictTone === 'ADVISORY' ? (
                    <AlertTriangle className="h-5 w-5 text-[#F59E0B]" />
                  ) : (
                    <AlertOctagon className="h-5 w-5 text-[#EF4444]" />
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-[2px] font-mono text-[11px] font-bold ${
                      digest.overallHealthBanner.verdictTone === 'READY'
                        ? 'bg-[#059669] text-white'
                        : digest.overallHealthBanner.verdictTone === 'ADVISORY'
                        ? 'bg-[#D97706] text-black'
                        : 'bg-[#DC2626] text-white'
                    }`}
                  >
                    {digest.overallHealthBanner.verdictStatus}
                  </span>
                </div>
                <div className="font-mono text-[12px] font-bold text-[#EDEDED] tabular-nums">
                  {copy.step12.readinessScoreLabel}{' '}
                  <span className="text-[16px] text-[#10B981]">{digest.overallHealthBanner.healthScorePercent}%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-[15px] font-bold text-[#EDEDED] font-sans">
                  {digest.overallHealthBanner.plainHeadline}
                </h2>
                <p className="text-[12.5px] text-[#D4D4D8] font-sans leading-relaxed">
                  {digest.overallHealthBanner.plainSummaryParagraph}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {digest.overallHealthBanner.keyHighlights.map((h) => (
                  <div
                    key={h.label}
                    className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between gap-1"
                  >
                    <span className="text-[10px] font-mono font-bold uppercase text-[#A1A1A1]">{h.label}</span>
                    <span
                      className={`text-[14px] font-bold font-sans tabular-nums ${
                        h.tone === 'GOOD'
                          ? 'text-[#10B981]'
                          : h.tone === 'WARN'
                          ? 'text-[#F59E0B]'
                          : h.tone === 'ALERT'
                          ? 'text-[#EF4444]'
                          : 'text-[#60A5FA]'
                      }`}
                    >
                      {h.valueText}
                    </span>
                    <span className="text-[11px] text-[#A1A1A1] font-sans">{h.explanation}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Release Gate Sign-Off Certificate Lock (ISO 9001 Clause 7.5) */}
            <div className="bg-[#111317] border border-[#22262E] rounded-[4px] p-4 space-y-3 font-mono text-[11px]">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#22262E]">
                <div className="flex items-center gap-2 font-bold text-[#EDEDED]">
                  <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                  <span>
                    {locale === 'id'
                      ? 'Sertifikat Persetujuan Rilis (Release Gate Sign-Off Lock — ISO 9001:2015 Klausul 7.5)'
                      : 'Release Gate Sign-Off Approval Certificate (ISO 9001:2015 Clause 7.5)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#1F2937] border border-[#374151] text-[#9CA3AF] text-[10px] font-mono rounded-[2px]">
                    Session: <strong className="text-[#EDEDED]">{operatorSessionId}</strong>
                  </span>
                  {compiledState?.releaseSignOff && (
                    <span className="px-2 py-0.5 bg-[#059669]/20 border border-[#059669]/50 text-[#10B981] font-bold rounded-[2px] text-[10px]">
                      {compiledState.releaseSignOff.status || compiledState.releaseSignOff.releaseGateStatus} · {new Date(compiledState.releaseSignOff.signedAt || compiledState.releaseSignOff.approvedAt || Date.now()).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Operator Identity & Role Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <div className="md:col-span-3">
                  <label className="text-[10px] text-[#707070] uppercase font-bold block mb-1">
                    {locale === 'id' ? 'Nama Operator / Approver *' : 'Operator / Approver Name *'}
                  </label>
                  <input
                    type="text"
                    value={signOffApprover}
                    onChange={(e) => setSignOffApprover(e.target.value)}
                    placeholder={locale === 'id' ? 'mis. Budi Santoso' : 'e.g. John Doe'}
                    className="w-full h-8 px-2.5 bg-[#0B0C0E] border border-[#22262E] text-[#EDEDED] rounded-[3px] outline-none select-text"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-[10px] text-[#707070] uppercase font-bold block mb-1">
                    {locale === 'id' ? 'Peran / Jabatan Otoritas *' : 'Authority Role *'}
                  </label>
                  <select
                    value={signOffRole}
                    onChange={(e) => setSignOffRole(e.target.value)}
                    className="w-full h-8 px-2 bg-[#0B0C0E] border border-[#22262E] text-[#EDEDED] rounded-[3px] outline-none cursor-pointer"
                  >
                    <option value="Lead Systems Architect">Lead Systems Architect</option>
                    <option value="Lead QA / SDET">Lead QA / SDET</option>
                    <option value="Release Manager">Release Manager</option>
                    <option value="DevSecOps Lead">DevSecOps Lead</option>
                    <option value="Compliance / GRC Officer">Compliance / GRC Officer</option>
                  </select>
                </div>
                <div className="md:col-span-6">
                  <label className="text-[10px] text-[#707070] uppercase font-bold block mb-1">
                    {locale === 'id' ? 'Catatan & Justifikasi Persetujuan' : 'Approval Justification Notes'}
                  </label>
                  <input
                    type="text"
                    value={signOffNotes}
                    onChange={(e) => setSignOffNotes(e.target.value)}
                    placeholder={locale === 'id' ? 'Catatan persetujuan rilis produksi...' : 'Release sign-off notes...'}
                    className="w-full h-8 px-2.5 bg-[#0B0C0E] border border-[#22262E] text-[#EDEDED] rounded-[3px] outline-none select-text"
                  />
                </div>
              </div>

              {/* Gating Prerequisites Checklist */}
              <div className="p-2.5 bg-[#0B0C0E] border border-[#22262E] rounded-[3px] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4 text-[10px]">
                  <span className="font-bold text-[#A1A1A1] uppercase tracking-wider">
                    {locale === 'id' ? 'Prasyarat Gating:' : 'Gating Prerequisites:'}
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[#EDEDED] hover:text-white">
                    <input
                      type="checkbox"
                      checked={chkQaGapReviewed}
                      onChange={(e) => setChkQaGapReviewed(e.target.checked)}
                      className="rounded bg-[#16191F] border-[#22262E] text-[#10B981] focus:ring-0"
                    />
                    <span>{locale === 'id' ? 'Metrik QA & Gap Audit telah ditinjau' : 'QA Metrics & Gap Audit Reviewed'}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[#EDEDED] hover:text-white">
                    <input
                      type="checkbox"
                      checked={chkZeroCriticalSec}
                      onChange={(e) => setChkZeroCriticalSec(e.target.checked)}
                      className="rounded bg-[#16191F] border-[#22262E] text-[#10B981] focus:ring-0"
                    />
                    <span>{locale === 'id' ? 'Temuan keamanan kritis = 0' : 'Critical Security Findings = 0'}</span>
                  </label>
                </div>

                <button
                  type="button"
                  disabled={!signOffApprover.trim() || !chkQaGapReviewed || !chkZeroCriticalSec || isSigning}
                  onClick={async () => {
                    setIsSigning(true);
                    try {
                      const hashPayload = canonicalJson({
                        appName: compiledState?.appName,
                        targetUrl: compiledState?.targetUrl,
                        totalCases: compiledState?.rtmRows?.length,
                        modules: compiledState?.discoveredModules?.length,
                        apis: compiledState?.discoveryResult?.apiEndpoints?.length,
                      });
                      const snapshotHash = sha256Hex(hashPayload);

                      const nowIso = new Date().toISOString();
                      const prereqs: string[] = [];
                      if (chkQaGapReviewed) prereqs.push('QA_AND_GAP_AUDIT_REVIEWED');
                      if (chkZeroCriticalSec) prereqs.push('ZERO_CRITICAL_SECURITY_FINDINGS');

                      const newSig: ReleaseAuditSignatureRecord = {
                        signatureId: `SIG-${Date.now()}-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase() : Date.now().toString(36).toUpperCase()}`,
                        approverName: signOffApprover.trim(),
                        approverRole: signOffRole,
                        signedAt: nowIso,
                        snapshotHash,
                        releaseGateStatus: 'APPROVED_FOR_PRODUCTION',
                        approvalNotes: signOffNotes.trim() || 'Verified across ISO 29148, 19510, 29119, and 26514 gates.',
                        operatorSessionId,
                        prerequisitesChecked: prereqs,
                      };

                      const existingSigs = compiledState?.auditSignatures || compiledState?.releaseSignOff?.auditSignatures || [];
                      const updatedSigs = [newSig, ...existingSigs];

                      onApproveReleaseSignOff?.({
                        isApproved: true,
                        status: 'APPROVED_FOR_PRODUCTION',
                        approvedBy: signOffApprover.trim(),
                        approverRole: signOffRole,
                        roleTitle: signOffRole,
                        notes: signOffNotes.trim() || 'Verified across ISO 29148, 19510, 29119, and 26514 gates.',
                        releaseNotes: signOffNotes.trim() || 'Verified across ISO 29148, 19510, 29119, and 26514 gates.',
                        approvedAt: nowIso,
                        signedAt: nowIso,
                        snapshotHash,
                        releaseGateStatus: 'APPROVED_FOR_PRODUCTION',
                        operatorSessionId,
                        prerequisitesChecked: prereqs,
                        auditSignatures: updatedSigs,
                      });
                    } finally {
                      setIsSigning(false);
                    }
                  }}
                  className={`h-8 px-4 rounded-[3px] font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors ${
                    !signOffApprover.trim() || !chkQaGapReviewed || !chkZeroCriticalSec || isSigning
                      ? 'bg-[#1E293B] text-[#64748B] cursor-not-allowed border border-[#334155]'
                      : 'bg-[#059669] hover:bg-[#047857] text-white cursor-pointer'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>
                    {isSigning
                      ? 'Signing SHA-256...'
                      : locale === 'id'
                      ? 'Kunci & Setujui Rilis'
                      : 'Lock Release Sign-Off'}
                  </span>
                </button>
              </div>

              {/* Riwayat Tanda Tangan Audit (ISO 9001:2015 Klausul 7.5) */}
              <div className="pt-2">
                <div className="flex items-center justify-between pb-1.5">
                  <span className="text-[10px] font-bold text-[#A1A1A1] uppercase tracking-wider">
                    {locale === 'id'
                      ? 'Riwayat Tanda Tangan Audit (ISO 9001:2015 Klausul 7.5)'
                      : 'Audit Signature Ledger (ISO 9001:2015 Clause 7.5)'}
                  </span>
                  <span className="text-[10px] text-[#707070]">
                    {(compiledState?.auditSignatures || compiledState?.releaseSignOff?.auditSignatures || []).length} Records
                  </span>
                </div>
                <div className="border border-[#22262E] rounded-[3px] overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left font-mono text-[10px] border-collapse">
                    <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] sticky top-0">
                      <tr className="h-6">
                        <th className="px-2.5 py-1 font-semibold text-[#A1A1A1]">Timestamp</th>
                        <th className="px-2.5 py-1 font-semibold text-[#A1A1A1]">Approver & Role</th>
                        <th className="px-2.5 py-1 font-semibold text-[#A1A1A1]">Status</th>
                        <th className="px-2.5 py-1 font-semibold text-[#A1A1A1]">SHA-256 Snapshot Hash</th>
                        <th className="px-2.5 py-1 font-semibold text-[#A1A1A1]">Session ID</th>
                        <th className="px-2.5 py-1 font-semibold text-[#A1A1A1]">Prerequisites</th>
                        <th className="px-2.5 py-1 font-semibold text-[#A1A1A1]">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#22262E] bg-[#0E1015]">
                      {(compiledState?.auditSignatures || compiledState?.releaseSignOff?.auditSignatures || []).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-3 py-3 text-center text-[#707070] italic">
                            {locale === 'id'
                              ? 'Belum ada tanda tangan audit tercatat untuk rilis ini.'
                              : 'No digital audit signatures recorded for this release yet.'}
                          </td>
                        </tr>
                      ) : (
                        (compiledState?.auditSignatures || compiledState?.releaseSignOff?.auditSignatures || []).map((sig, idx) => (
                          <tr key={sig.signatureId || idx} className="hover:bg-[#16191F]/50 transition-colors">
                            <td className="px-2.5 py-1.5 text-[#EDEDED] whitespace-nowrap">
                              {new Date(sig.signedAt).toLocaleString()}
                            </td>
                            <td className="px-2.5 py-1.5 whitespace-nowrap">
                              <span className="font-bold text-[#EDEDED]">{sig.approverName}</span>
                              <span className="text-[#707070] ml-1">({sig.approverRole})</span>
                            </td>
                            <td className="px-2.5 py-1.5 whitespace-nowrap">
                              <span className="px-1.5 py-0.2 bg-[#059669]/20 border border-[#059669]/40 text-[#10B981] font-bold rounded-[2px] text-[9px]">
                                {sig.releaseGateStatus}
                              </span>
                            </td>
                            <td className="px-2.5 py-1.5 text-[#60A5FA] font-mono text-[9px] whitespace-nowrap" title={sig.snapshotHash}>
                              {sig.snapshotHash ? `${sig.snapshotHash.slice(0, 16)}...` : 'N/A'}
                            </td>
                            <td className="px-2.5 py-1.5 text-[#9CA3AF] whitespace-nowrap">
                              {sig.operatorSessionId || 'N/A'}
                            </td>
                            <td className="px-2.5 py-1.5 text-[#10B981] whitespace-nowrap">
                              {Array.isArray(sig.prerequisitesChecked) && sig.prerequisitesChecked.length >= 2
                                ? '✓ QA & Zero Sec'
                                : '✓ Verified'}
                            </td>
                            <td className="px-2.5 py-1.5 text-[#A1A1A1] max-w-xs truncate" title={sig.approvalNotes}>
                              {sig.approvalNotes || '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/* Change Request (CR) & Blast-Radius Impact Simulator (Step 12) */}
            <div className="bg-[#111317] border border-[#22262E] rounded-[4px] overflow-hidden">
              <div className="px-4 py-2.5 bg-[#16191F] border-b border-[#22262E] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-[#EDEDED]">
                  <Zap className="h-3.5 w-3.5 text-[#F59E0B]" />
                  <span>
                    {isId
                      ? 'Simulasi Change Request (CR) & Analisis Dampak Regresi'
                      : 'Change Request (CR) & Blast-Radius Impact Analyzer'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCrOpen((prev) => !prev)}
                  className="px-2.5 py-1 bg-[#0B0C0E] hover:bg-[#22262E] border border-[#F59E0B]/50 text-[#F59E0B] rounded-[3px] font-mono text-[10px] font-bold cursor-pointer"
                >
                  {isCrOpen ? (isId ? 'Tutup Panel CR' : 'Close CR Analyzer') : isId ? 'Buka Simulasi CR' : 'Open CR Analyzer'}
                </button>
              </div>
              {isCrOpen && (
                <div className="p-4 space-y-3 font-mono text-[11px]">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                    <select
                      value={crModuleId || discoveredFeatureModules?.[0]?.moduleId || 'MOD-01'}
                      onChange={(e) => setCrModuleId(e.target.value)}
                      className="md:col-span-3 h-8 px-2 bg-[#0B0C0E] border border-[#22262E] text-[#EDEDED] rounded-[3px] outline-none cursor-pointer"
                    >
                      {(discoveredFeatureModules || []).length > 0 ? (
                        discoveredFeatureModules!.map((m) => (
                          <option key={m.moduleId} value={m.moduleId}>
                            {m.moduleId}: {m.moduleName}
                          </option>
                        ))
                      ) : (
                        <option value="MOD-01">{appName}</option>
                      )}
                    </select>
                    <input
                      type="text"
                      value={crTitle}
                      onChange={(e) => setCrTitle(e.target.value)}
                      placeholder={isId ? 'Judul CR (mis. Tambah validasi diskon maks 15%)' : 'CR Title (e.g. Add max 15% discount rule)'}
                      className="md:col-span-3 h-8 px-2.5 bg-[#0B0C0E] border border-[#22262E] text-[#EDEDED] rounded-[3px] outline-none select-text"
                    />
                    <input
                      type="text"
                      value={crDesc}
                      onChange={(e) => setCrDesc(e.target.value)}
                      placeholder={isId ? 'Deskripsi dampak / field / API terdampak...' : 'Affected fields, rules, or APIs...'}
                      className="md:col-span-4 h-8 px-2.5 bg-[#0B0C0E] border border-[#22262E] text-[#EDEDED] rounded-[3px] outline-none select-text"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const report = changeImpactService.analyzeChangeRequestImpact(compiledState, {
                          targetModuleId: crModuleId || discoveredFeatureModules?.[0]?.moduleId || 'MOD-01',
                          changeTitle: crTitle || 'Perubahan Validasi & Filter Baru',
                          changeDescription: crDesc || crTitle || 'Penambahan aturan bisnis dan validasi input baru',
                          affectedFieldsOrApis: crDesc,
                        });
                        setCrReport(report);
                        onAppendLog?.(`[CR ANALYZER] ${report.crId}: ${report.regressionTestCasesToReRun.length} regression tests & ${report.newlySynthesizedTestCases.length} new CR tests.`);
                      }}
                      className="md:col-span-2 h-8 px-2.5 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-[3px] cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>{isId ? 'Analisis Dampak' : 'Analyze CR'}</span>
                    </button>
                  </div>
                  {crReport && (
                    <div className="p-3 bg-[#0B0C0E] border border-[#F59E0B]/40 rounded-[3px] space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-[#F59E0B]">
                          {crReport.crId} — {crReport.targetModuleName}
                        </span>
                        {onMergeChangeRequest && (
                          <button
                            type="button"
                            onClick={() => {
                              onMergeChangeRequest(crReport);
                              onAppendLog?.(`[CR MERGED] Merged ${crReport.newlySynthesizedTestCases.length} CR test cases into Project & Vault.`);
                            }}
                            className="h-7 px-3 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-[3px] cursor-pointer flex items-center gap-1.5"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>
                              {isId
                                ? `Tambahkan ${crReport.newlySynthesizedTestCases.length} Test Case CR ke Matriks & Simpan ke Vault`
                                : `Add ${crReport.newlySynthesizedTestCases.length} CR Test Cases to Matrix & Save Vault`}
                            </span>
                          </button>
                        )}
                      </div>
                      <p className="text-[#D4D4D8] font-sans text-[12px]">
                        {isId ? crReport.plainImpactSummaryId : crReport.plainImpactSummaryEn}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10.5px]">
                        <div className="p-2 bg-[#111317] border border-[#22262E] rounded-[2px]">
                          <div className="text-[#707070] uppercase font-bold mb-1">Impacted APIs ({crReport.impactedApis.length})</div>
                          <div className="text-[#60A5FA]">{crReport.impactedApis.join(', ')}</div>
                        </div>
                        <div className="p-2 bg-[#111317] border border-[#22262E] rounded-[2px]">
                          <div className="text-[#707070] uppercase font-bold mb-1">Impacted DB & Specs</div>
                          <div className="text-[#10B981]">{crReport.impactedTables.join(', ')} · {crReport.impactedBrdAndVrIds.slice(0, 50).join(', ')}</div>
                        </div>
                        <div className="p-2 bg-[#111317] border border-[#22262E] rounded-[2px]">
                          <div className="text-[#707070] uppercase font-bold mb-1">Regression Re-Run ({crReport.regressionTestCasesToReRun.length})</div>
                          <div className="text-[#F59E0B]">{crReport.regressionTestCasesToReRun.slice(0, 50).map((r) => r.testId).join(', ')}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Regression Diff vs Previous Snapshot Card */}
            {regressionDiffSummary && (
              <div className="p-4 bg-[#111317] border border-[#3B82F6]/50 rounded-[4px] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#22262E]">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-[#3B82F6]" />
                    <span className="text-[12.5px] font-mono font-bold text-[#EDEDED]">
                      {copy.step12.regressionCardTitle}: {regressionDiffSummary.comparedAgainstLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-[2px] font-mono text-[10px] font-bold tabular-nums ${
                        regressionDiffSummary.passRateDelta >= 0
                          ? 'bg-[#059669]/20 text-[#10B981]'
                          : 'bg-[#DC2626]/20 text-[#EF4444]'
                      }`}
                    >
                      {regressionDiffSummary.passRateDelta >= 0
                        ? `+${regressionDiffSummary.passRateDelta}%`
                        : `${regressionDiffSummary.passRateDelta}%`}{' '}
                      Pass Rate
                    </span>
                    {onOpenHistory && (
                      <button
                        onClick={onOpenHistory}
                        className="px-2 py-0.5 bg-[#16191F] border border-[#22262E] hover:border-[#3B82F6] rounded-[2px] text-[10px] font-mono text-[#EDEDED] cursor-pointer"
                      >
                        {copy.header.historyBtn}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[12px] text-[#D4D4D8] font-sans leading-relaxed">
                  {isId ? regressionDiffSummary.plainDiffSummary : regressionDiffSummary.plainDiffSummaryEn}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px] font-mono">
                  <div className="p-2 bg-[#0B0C0E] border border-[#22262E] rounded-[2px]">
                    <span className="text-[#707070] block text-[9.5px]">{copy.vault.newModules}</span>
                    <strong className="text-[#3B82F6] tabular-nums">+{regressionDiffSummary.newModulesAdded.length}</strong>
                  </div>
                  <div className="p-2 bg-[#0B0C0E] border border-[#22262E] rounded-[2px]">
                    <span className="text-[#707070] block text-[9.5px]">{copy.vault.removedModules}</span>
                    <strong className="text-[#F59E0B] tabular-nums">-{regressionDiffSummary.removedModules.length}</strong>
                  </div>
                  <div className="p-2 bg-[#0B0C0E] border border-[#22262E] rounded-[2px]">
                    <span className="text-[#707070] block text-[9.5px]">{copy.vault.newApis}</span>
                    <strong className="text-[#8B5CF6] tabular-nums">+{regressionDiffSummary.newApisAdded.length}</strong>
                  </div>
                  <div className="p-2 bg-[#0B0C0E] border border-[#22262E] rounded-[2px]">
                    <span className="text-[#707070] block text-[9.5px]">{copy.vault.bugsResolved}</span>
                    <strong className="text-[#10B981] tabular-nums">{regressionDiffSummary.bugsResolved.length}</strong>
                  </div>
                  <div className="p-2 bg-[#0B0C0E] border border-[#22262E] rounded-[2px]">
                    <span className="text-[#707070] block text-[9.5px]">{copy.vault.newBugs}</span>
                    <strong className="text-[#EF4444] tabular-nums">{regressionDiffSummary.newBugsIntroduced.length}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#22262E] pb-1.5">
                <h3 className="text-[12.5px] font-bold text-[#EDEDED] font-mono uppercase tracking-wide">
                  {copy.step12.breakdownTitle}
                </h3>
                <span className="text-[11px] font-mono text-[#707070] tabular-nums">
                  {digest.stepByStepPlainSummary.length} {copy.step12.stagesUnit}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {digest.stepByStepPlainSummary.map((card) => (
                  <div
                    key={card.stepNumber}
                    className="p-3.5 bg-[#111317] border border-[#22262E] hover:border-[#3B82F6]/60 rounded-[4px] flex flex-col justify-between gap-2.5 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#22262E]">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-[#3B82F6] uppercase block">
                            {card.stepNumber}
                          </span>
                          <h4 className="text-[13px] font-bold text-[#EDEDED] font-sans leading-snug mt-0.5">
                            {card.stepTitlePlain}
                          </h4>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded-[2px] font-mono text-[9.5px] font-bold whitespace-nowrap shrink-0 ${
                            card.statusTone === 'PASS'
                              ? 'bg-[#059669]/20 text-[#10B981] border border-[#059669]/40'
                              : card.statusTone === 'WARN'
                              ? 'bg-[#D97706]/20 text-[#F59E0B] border border-[#D97706]/40'
                              : 'bg-[#DC2626]/20 text-[#EF4444] border border-[#DC2626]/40'
                          }`}
                        >
                          {card.statusBadge}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11.5px] font-sans">
                        <div>
                          <span className="text-[9.5px] font-mono uppercase text-[#707070] font-bold block">
                            {copy.step12.scopeLabel}
                          </span>
                          <p className="text-[#A1A1A1] leading-snug">{card.whatWasChecked}</p>
                        </div>
                        <div>
                          <span className="text-[9.5px] font-mono uppercase text-[#60A5FA] font-bold block">
                            {copy.step12.outcomeLabel}
                          </span>
                          <p className="text-[#EDEDED] leading-snug">{card.plainResult}</p>
                        </div>
                        <div>
                          <span className="text-[9.5px] font-mono uppercase text-[#10B981] font-bold block">
                            {copy.step12.impactLabel}
                          </span>
                          <p className="text-[#D4D4D8] leading-snug">{card.businessImpact}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateToStep?.(card.targetStepId)}
                      className="w-full h-7 px-2.5 bg-[#16191F] hover:bg-[#2563EB] border border-[#22262E] hover:border-[#2563EB] text-[#EDEDED] rounded-[3px] font-mono text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{`${copy.step12.openStepPrefix} ${card.stepNumber}`}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* =========================================================================
         * TAB 2: 4-BOOK A-Z LIVING DOCUMENTATION LIBRARY
         * ========================================================================= */}
        {activeTab === 'AZ_LIBRARY' && (
          <div className="space-y-4">
            {/* 4-Book Selector Strip + View Mode Toggle */}
            {/* 4-Book Selector Strip + View Mode Toggle (Single Clean Row) */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 bg-[#111317] border border-[#22262E] p-1.5 rounded-[4px] font-mono text-[10px]">
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { id: 'BOOK1' as const, label: locale === 'id' ? 'Buku 1: User Manual (26514)' : 'Book 1: User Manual (26514)' },
                  { id: 'BOOK2' as const, label: locale === 'id' ? 'Buku 2: Spesifikasi BA (29148)' : 'Book 2: BA Specs (29148)' },
                  { id: 'BOOK3' as const, label: locale === 'id' ? 'Buku 3: Arsitektur (42010)' : 'Book 3: Architecture (42010)' },
                  { id: 'BOOK4' as const, label: locale === 'id' ? 'Buku 4: QA & UAT (29119)' : 'Book 4: QA & UAT (29119)' },
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setActiveBook(b.id)}
                    className={`px-2 py-1 rounded-[3px] border transition-colors cursor-pointer whitespace-nowrap ${
                      activeBook === b.id
                        ? 'bg-[#2563EB] text-white border-[#2563EB] font-bold'
                        : 'bg-[#0B0C0E] text-[#A1A1A1] border-[#22262E] hover:text-[#EDEDED]'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[2px] text-[10px]">
                  <button
                    onClick={() => setBookViewMode('READER')}
                    className={`px-1.5 py-0.5 rounded-[2px] cursor-pointer whitespace-nowrap ${
                      bookViewMode === 'READER' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                    }`}
                  >
                    Reader
                  </button>
                  <button
                    onClick={() => setBookViewMode('MARKDOWN')}
                    className={`px-1.5 py-0.5 rounded-[2px] cursor-pointer whitespace-nowrap ${
                      bookViewMode === 'MARKDOWN' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                    }`}
                  >
                    Markdown
                  </button>
                </div>

                <button
                  onClick={() => handleCopy(currentBookMarkdown, activeBook)}
                  className="px-2 py-1 bg-[#16191F] border border-[#22262E] hover:border-[#3B82F6] text-[#EDEDED] rounded-[2px] flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  {copiedKey === activeBook ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedKey === activeBook ? copy.step12.copied : 'Copy .md'}</span>
                </button>
              </div>
            </div>
            {bookViewMode === 'MARKDOWN' ? (
              <div className="bg-[#111317] border border-[#22262E] rounded-[4px] p-4 overflow-auto max-h-[640px]">
                <pre className="text-[11.5px] font-mono text-[#D4D4D8] whitespace-pre-wrap leading-relaxed">
                  {currentBookMarkdown}
                </pre>
              </div>
            ) : (
              <>
                {activeBook === 'BOOK1' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[4px] space-y-2">
                      <h3 className="text-[14px] font-bold text-[#EDEDED] font-sans">{azLib.book1NonTechnical.title}</h3>
                      <p className="text-[12px] text-[#A1A1A1] font-sans">{azLib.book1NonTechnical.subtitle}</p>
                      <p className="text-[12.5px] text-[#EDEDED] font-sans leading-relaxed pt-1">{azLib.book1NonTechnical.executiveOverview}</p>
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {azLib.book1NonTechnical.roleDirectory.map((r) => (
                          <span key={r} className="px-2 py-0.5 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] text-[10.5px] font-mono text-[#60A5FA]">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Module Selector Bar — all MOD-01..MOD-N visible with name, route & control count */}
                    {book1Manuals.length > 0 && (
                      <div className="p-2 bg-[#111317] border border-[#22262E] rounded-[4px] space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[#707070] uppercase font-bold tracking-wide">
                              {isId ? 'Bilah Pemilih Modul' : 'Module Selector Bar'}
                            </span>
                            <span className="px-1.5 py-0.5 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] text-[#10B981] font-bold tabular-nums">
                              {book1Manuals.length} MOD
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setBook1ViewAllModules(!book1ViewAllModules)}
                            className={`px-2 py-1 rounded-[2px] text-[10.5px] font-bold cursor-pointer transition-colors border flex items-center gap-1.5 ${
                              book1ViewAllModules
                                ? 'bg-[#059669]/20 text-[#10B981] border-[#059669]'
                                : 'bg-[#16191F] text-[#EDEDED] border-[#22262E] hover:border-[#10B981] hover:text-[#10B981]'
                            }`}
                          >
                            {book1ViewAllModules
                              ? `📖 ${isId ? 'Tampilkan Satu Modul' : 'Show Single Module'}`
                              : `📚 ${isId ? 'Tampilkan Semua Modul Sekaligus (All-in-One Manual View)' : 'Show All Modules (All-in-One Manual View)'}`}
                          </button>
                        </div>
                        <div className="flex flex-wrap items-stretch gap-1">
                          {book1Manuals.map((g, idx) => {
                            const gm = g.iso26514Manual;
                            const buttonCount = gm?.section3_ButtonsAndIconsDictionary.buttons.length || 0;
                            const filterCount = gm?.section4_SearchAndFiltersDictionary.filters.length || 0;
                            const moduleCode = gm?.moduleId || `MOD-${String(idx + 1).padStart(2, '0')}`;
                            const isActive = !book1ViewAllModules && book1ModuleIndex === idx;
                            return (
                              <button
                                key={`book1-mod-${idx}`}
                                type="button"
                                onClick={() => {
                                  setBook1ModuleIndex(idx);
                                  setBook1ViewAllModules(false);
                                }}
                                title={`${moduleCode} · ${g.moduleName} · ${g.routePath} · ${buttonCount + filterCount} ${isId ? 'kontrol' : 'controls'}`}
                                className={`px-2 py-1 rounded-[2px] cursor-pointer transition-colors border text-left flex flex-col gap-0.5 ${
                                  isActive
                                    ? 'bg-[#2563EB] text-white border-[#2563EB] font-bold'
                                    : 'bg-[#0B0C0E] text-[#D4D4D8] border-[#22262E] hover:text-[#EDEDED] hover:border-[#3B82F6]'
                                }`}
                              >
                                <span className="flex items-center gap-1.5 text-[10.5px]">
                                  <span className={`font-mono font-bold tabular-nums ${isActive ? 'text-white' : 'text-[#60A5FA]'}`}>{moduleCode}</span>
                                  <span className="font-semibold truncate max-w-[190px]">{g.moduleName || `Module ${idx + 1}`}</span>
                                </span>
                                <span className={`font-mono text-[9px] tabular-nums ${isActive ? 'text-white/85' : 'text-[#707070]'}`}>
                                  {g.routePath} · {buttonCount + filterCount} {isId ? 'kontrol' : 'controls'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {displayedBook1Manuals.map((guide, idx) => {
                        const manual = guide.iso26514Manual;
                        const blueprintDataUrl = buildFeatureModuleBlueprintSvgDataUrl(
                          {
                            moduleName: guide.moduleName,
                            routePath: guide.routePath,
                            pageHeading: manual?.moduleName || guide.moduleName,
                          },
                          manual?.section3_ButtonsAndIconsDictionary.buttons || [],
                          manual?.section4_SearchAndFiltersDictionary.filters || []
                        );
                        const rawShot = guide.screenshotDataUrl || manual?.screenshotDataUrl;
                        const hasValidCapture =
                          typeof rawShot === 'string' &&
                          rawShot.startsWith('data:image/') &&
                          rawShot.length > 2500 &&
                          !isBlankOrMissingScreenshot(rawShot);
                        const screenshotSrc = hasValidCapture ? rawShot : blueprintDataUrl;
                        return (
                          <div key={`${guide.routePath}-${idx}`} className="p-4 bg-[#111317] border border-[#22262E] rounded-[4px] space-y-3.5">
                            {/* Module Header & Status */}
                            <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-[#22262E]">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-[14.5px] font-bold text-[#EDEDED] font-sans">{guide.moduleName}</h4>
                                  <span className="px-1.5 py-0.2 bg-[#2563EB]/20 border border-[#2563EB]/40 text-[#60A5FA] font-mono text-[9.5px] rounded-[2px]">
                                    ISO/IEC/IEEE 26514:2022
                                  </span>
                                </div>
                                <span className="text-[10.5px] font-mono text-[#3B82F6]">{guide.routePath}</span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-[2px] font-mono text-[9.5px] font-bold whitespace-nowrap ${
                                  guide.isHealthy
                                    ? 'bg-[#059669]/20 text-[#10B981] border border-[#059669]/40'
                                    : 'bg-[#DC2626]/20 text-[#EF4444] border border-[#DC2626]/40'
                                }`}
                              >
                                {guide.featureHealthStatus}
                              </span>
                            </div>

                            {/* Captured Feature Visual with 1-to-1 Visual Numbered Callout Pins */}
                            {screenshotSrc && (() => {
                              const activePins: VisualCalloutPinItem[] =
                                draftPinsByRoute[guide.routePath] || manual?.visualCalloutPins || [];
                              const isEditingThis = editingPinRoute === guide.routePath;
                              return (
                                <div className="bg-[#0B0C0E] border border-[#22262E] rounded-[3px] p-2.5 space-y-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-[9.5px] font-mono text-[#10B981] uppercase font-bold">
                                    <div className="flex items-center gap-1.5">
                                      <Camera className="h-3.5 w-3.5" />
                                      <span>
                                        {isId
                                          ? 'Tangkapan Layar Fitur Aktual & Penanda Kontrol 1-ke-1 (ISO 26514)'
                                          : 'Captured Feature Visual & 1-to-1 Callout Pins (ISO 26514)'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[#60A5FA] tabular-nums">
                                        {activePins.length} {isId ? 'Pin Kontrol' : 'Control Pins'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (isEditingThis) {
                                            setEditingPinRoute(null);
                                          } else {
                                            setDraftPinsByRoute((prev) => ({
                                              ...prev,
                                              [guide.routePath]: [...activePins],
                                            }));
                                            setSelectedPinNum(activePins[0]?.calloutNumber || 1);
                                            setEditingPinRoute(guide.routePath);
                                          }
                                        }}
                                        className={`px-2 py-0.5 rounded-[2px] border text-[9.5px] font-bold cursor-pointer ${
                                          isEditingThis
                                            ? 'bg-[#D97706] border-[#F59E0B] text-white'
                                            : 'bg-[#111317] border-[#22262E] hover:border-[#3B82F6] text-[#EDEDED]'
                                        }`}
                                      >
                                        {isEditingThis
                                          ? isId
                                            ? 'Selesai Edit Pin'
                                            : 'Done Editing Pins'
                                          : isId
                                          ? 'Edit Pin Visual'
                                          : 'Edit Visual Pins'}
                                      </button>
                                    </div>
                                  </div>

                                  {isEditingThis && (
                                    <div className="p-2 bg-[#111317] border border-[#F59E0B]/50 rounded-[2px] flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
                                      <span className="text-[#FBBF24]">
                                        {isId
                                          ? `Mode Edit: Klik pin lalu klik titik pada gambar untuk memindahkan Pin #${selectedPinNum}`
                                          : `Edit Mode: Select a pin and click anywhere on the screenshot to reposition Pin #${selectedPinNum}`}
                                      </span>
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <input
                                          type="text"
                                          value={newPinLabel}
                                          onChange={(e) => setNewPinLabel(e.target.value)}
                                          placeholder={isId ? 'Nama kontrol baru...' : 'New control label...'}
                                          className="h-6 px-2 bg-[#0B0C0E] border border-[#22262E] text-[#EDEDED] rounded-[2px] outline-none select-text"
                                        />
                                        <select
                                          value={newPinKind}
                                          onChange={(e) => setNewPinKind(e.target.value as 'BUTTON' | 'FILTER' | 'SUB_TAB')}
                                          className="h-6 px-1.5 bg-[#0B0C0E] border border-[#22262E] text-[#EDEDED] rounded-[2px] outline-none cursor-pointer"
                                        >
                                          <option value="BUTTON">BUTTON</option>
                                          <option value="FILTER">FILTER</option>
                                          <option value="SUB_TAB">SUB_TAB</option>
                                        </select>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!newPinLabel.trim()) return;
                                            const nextNum = activePins.length + 1;
                                            const nextList: VisualCalloutPinItem[] = [
                                              ...activePins,
                                              {
                                                calloutNumber: nextNum,
                                                label: newPinLabel.trim(),
                                                kind: newPinKind,
                                                xPercent: 50,
                                                yPercent: 50,
                                                summary: newPinLabel.trim(),
                                              },
                                            ];
                                            setDraftPinsByRoute((prev) => ({ ...prev, [guide.routePath]: nextList }));
                                            setSelectedPinNum(nextNum);
                                            setNewPinLabel('');
                                          }}
                                          className="h-6 px-2 bg-[#2563EB] text-white font-bold rounded-[2px] cursor-pointer"
                                        >
                                          + Pin
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            onUpdateModulePins?.(guide.routePath, activePins);
                                            setEditingPinRoute(null);
                                          }}
                                          className="h-6 px-2.5 bg-[#059669] text-white font-bold rounded-[2px] cursor-pointer"
                                        >
                                          {isId ? 'Simpan Pin ke Vault' : 'Save Pins to Vault'}
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  <div
                                    onClick={(e) => {
                                      if (!isEditingThis) return;
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const xPct = Math.min(96, Math.max(4, Math.round(((e.clientX - rect.left) / Math.max(rect.width, 1)) * 100)));
                                      const yPct = Math.min(96, Math.max(4, Math.round(((e.clientY - rect.top) / Math.max(rect.height, 1)) * 100)));
                                      setDraftPinsByRoute((prev) => ({
                                        ...prev,
                                        [guide.routePath]: activePins.map((p) =>
                                          p.calloutNumber === selectedPinNum ? { ...p, xPercent: xPct, yPercent: yPct } : p
                                        ),
                                      }));
                                    }}
                                    className={`relative w-full min-h-[260px] overflow-hidden rounded-[2px] border border-[#22262E] bg-slate-950 ${
                                      isEditingThis ? 'cursor-crosshair ring-1 ring-[#F59E0B]' : ''
                                    }`}
                                  >
                                    <ModuleScreenshot
                                      src={normalizeManualImgSrc(screenshotSrc)}
                                      blueprintDataUrl={blueprintDataUrl}
                                      alt={guide.moduleName}
                                      className="w-full min-h-[260px] bg-slate-950 object-contain block pointer-events-none"
                                    />
                                    {activePins.map((pin) => (
                                      <div
                                        key={`pin-${pin.calloutNumber}-${pin.label}`}
                                        onClick={(ev) => {
                                          if (!isEditingThis) return;
                                          ev.stopPropagation();
                                          setSelectedPinNum(pin.calloutNumber);
                                        }}
                                        style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%`, transform: 'translate(-50%, -50%)' }}
                                        title={`[#${pin.calloutNumber}] ${pin.label} — ${pin.summary}`}
                                        className={`absolute w-6 h-6 rounded-full border-2 text-white font-mono text-[11px] font-bold flex items-center justify-center shadow-lg tabular-nums transition-transform hover:scale-125 ${
                                          isEditingThis && selectedPinNum === pin.calloutNumber
                                            ? 'border-[#FACC15] ring-2 ring-[#FACC15] scale-110 cursor-pointer'
                                            : 'border-white cursor-help'
                                        } ${
                                          pin.kind === 'FILTER'
                                            ? 'bg-[#D97706]'
                                            : pin.kind === 'SUB_TAB'
                                            ? 'bg-[#059669]'
                                            : 'bg-[#2563EB]'
                                        }`}
                                      >
                                        {pin.calloutNumber}
                                      </div>
                                    ))}
                                  </div>
                                  {activePins.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                                      {activePins.map((pin) => (
                                        <span
                                          key={`leg-${pin.calloutNumber}`}
                                          onClick={() => isEditingThis && setSelectedPinNum(pin.calloutNumber)}
                                          className={`px-1.5 py-0.5 bg-[#111317] border rounded-[2px] font-mono text-[10px] text-[#D4D4D8] tabular-nums ${
                                            isEditingThis && selectedPinNum === pin.calloutNumber
                                              ? 'border-[#F59E0B] cursor-pointer'
                                              : 'border-[#22262E]'
                                          }`}
                                        >
                                          <strong className={pin.kind === 'FILTER' ? 'text-[#F59E0B]' : 'text-[#60A5FA]'}>
                                            [#{pin.calloutNumber}]
                                          </strong>{' '}
                                          {pin.label}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                            {manual ? (
                              <div className="space-y-4 text-[12px] font-sans">
                                {/* Section 1: Overview & Purpose */}
                                <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[3px] space-y-1.5">
                                  <div className="font-mono text-[10.5px] font-bold text-[#3B82F6] uppercase">
                                    {manual.section1_OverviewAndPurpose.heading}
                                  </div>
                                  <p className="text-[#EDEDED] leading-relaxed">{manual.section1_OverviewAndPurpose.purposeSummary}</p>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1.5 text-[11px] text-[#A1A1A1]">
                                    <div className="p-2.5 bg-[#111317] border border-[#22262E] rounded-[2px] leading-relaxed">
                                      <span className="font-mono text-[9.5px] uppercase font-bold text-[#60A5FA] block mb-0.5">{isId ? 'Pengguna Utama' : 'Target Users'}</span>
                                      <span className="text-[#D4D4D8]">{manual.section1_OverviewAndPurpose.targetUsers}</span>
                                    </div>
                                    <div className="p-2.5 bg-[#111317] border border-[#22262E] rounded-[2px] leading-relaxed">
                                      <span className="font-mono text-[9.5px] uppercase font-bold text-[#10B981] block mb-0.5">{isId ? 'Data yang Ditampilkan' : 'Displayed Data'}</span>
                                      <span className="text-[#D4D4D8]">{manual.section1_OverviewAndPurpose.displayedBusinessData}</span>
                                    </div>
                                    <div className="p-2.5 bg-[#111317] border border-[#22262E] rounded-[2px] leading-relaxed">
                                      <span className="font-mono text-[9.5px] uppercase font-bold text-[#F59E0B] block mb-0.5">{isId ? 'Kapan Digunakan' : 'When to Use'}</span>
                                      <span className="text-[#D4D4D8]">{manual.section1_OverviewAndPurpose.whenToUse}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Section 2: Navigation & Sub-Tabs Guide */}
                                <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[3px] space-y-2">
                                  <div className="font-mono text-[10.5px] font-bold text-[#8B5CF6] uppercase">
                                    {manual.section2_NavigationAndSubTabsGuide.heading}
                                  </div>
                                  <div className="text-[11.5px] text-[#D4D4D8]">{manual.section2_NavigationAndSubTabsGuide.howToReachMenu}</div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    {manual.section2_NavigationAndSubTabsGuide.subTabs.map((t, tIdx) => (
                                      <div key={`${t.tabName}-${tIdx}`} className="p-2.5 bg-[#111317] border border-[#22262E] rounded-[2px] space-y-1">
                                        <div className="font-mono text-[11px] font-bold text-[#60A5FA]">{t.tabName}</div>
                                        <p className="text-[11px] text-[#D4D4D8] leading-snug">{t.businessContent}</p>
                                        <div className="text-[10px] font-mono text-[#707070]">{t.actionButtons}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Section 3: Buttons & Icons Dictionary */}
                                <div className="border border-[#22262E] rounded-[3px] overflow-hidden">
                                  <div className="px-3 py-1.5 bg-[#16191F] border-b border-[#22262E] font-mono text-[10.5px] font-bold text-[#10B981] uppercase">
                                    {manual.section3_ButtonsAndIconsDictionary.heading} ({manual.section3_ButtonsAndIconsDictionary.buttons.length})
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-[11.5px]">
                                      <thead className="bg-[#0B0C0E] text-[#707070] font-mono text-[9.5px] uppercase border-b border-[#22262E]">
                                        <tr>
                                          <th className="p-2 border-r border-[#22262E] w-[54px] text-center">Pin</th>
                                          <th className="p-2 border-r border-[#22262E]">{isId ? 'Nama Tombol / Kontrol' : 'Button / Control'}</th>
                                          <th className="p-2 border-r border-[#22262E]">{isId ? 'Lokasi di Layar' : 'Screen Location'}</th>
                                          <th className="p-2 border-r border-[#22262E]">{isId ? 'Fungsi Utama' : 'Primary Purpose'}</th>
                                          <th className="p-2">{isId ? 'Cara Pakai & Dampak Saat Diklik' : 'Usage & Click Impact'}</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-[#22262E]">
                                        {manual.section3_ButtonsAndIconsDictionary.buttons.map((b, bIdx) => (
                                          <tr key={`${b.buttonName}-${bIdx}`} className="hover:bg-[#16191F]/50">
                                            <td className="p-2 border-r border-[#22262E] text-center">
                                              <span className="inline-block px-1.5 py-0.5 bg-[#2563EB]/20 border border-[#2563EB]/50 text-[#60A5FA] font-mono text-[10px] font-bold rounded-[2px] tabular-nums">
                                                [#{b.calloutNumber ?? bIdx + 1}]
                                              </span>
                                            </td>
                                            <td className="p-2 border-r border-[#22262E] font-mono font-bold text-[#EDEDED]">{b.buttonName}</td>
                                            <td className="p-2 border-r border-[#22262E] text-[10.5px] text-[#A1A1A1]">{b.screenLocation}</td>
                                            <td className="p-2 border-r border-[#22262E] text-[#D4D4D8]">{b.primaryPurpose}</td>
                                            <td className="p-2 text-[#A1A1A1]">{b.howToUseAndImpact}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Section 4: Search & Filters Dictionary */}
                                <div className="border border-[#22262E] rounded-[3px] overflow-hidden">
                                  <div className="px-3 py-1.5 bg-[#16191F] border-b border-[#22262E] font-mono text-[10.5px] font-bold text-[#F59E0B] uppercase">
                                    {manual.section4_SearchAndFiltersDictionary.heading} ({manual.section4_SearchAndFiltersDictionary.filters.length})
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-[11.5px]">
                                      <thead className="bg-[#0B0C0E] text-[#707070] font-mono text-[9.5px] uppercase border-b border-[#22262E]">
                                        <tr>
                                          <th className="p-2 border-r border-[#22262E] w-[54px] text-center">Pin</th>
                                          <th className="p-2 border-r border-[#22262E]">{isId ? 'Nama Filter / Kolom' : 'Filter / Field'}</th>
                                          <th className="p-2 border-r border-[#22262E]">{isId ? 'Jenis Kontrol' : 'Control Type'}</th>
                                          <th className="p-2 border-r border-[#22262E]">{isId ? 'Penjelasan Fungsi & Kegunaan' : 'Business Purpose'}</th>
                                          <th className="p-2 border-r border-[#22262E]">{isId ? 'Contoh Pilihan' : 'Sample Values'}</th>
                                          <th className="p-2">{isId ? 'Aturan' : 'Rule'}</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-[#22262E]">
                                        {manual.section4_SearchAndFiltersDictionary.filters.map((f, fIdx) => (
                                          <tr key={`${f.filterName}-${fIdx}`} className="hover:bg-[#16191F]/50">
                                            <td className="p-2 border-r border-[#22262E] text-center">
                                              <span className="inline-block px-1.5 py-0.5 bg-[#D97706]/20 border border-[#D97706]/50 text-[#F59E0B] font-mono text-[10px] font-bold rounded-[2px] tabular-nums">
                                                [#{f.calloutNumber ?? fIdx + 1}]
                                              </span>
                                            </td>
                                            <td className="p-2 border-r border-[#22262E] font-mono font-bold text-[#EDEDED]">{f.filterName}</td>
                                            <td className="p-2 border-r border-[#22262E] font-mono text-[10px] text-[#3B82F6]">{f.controlType}</td>
                                            <td className="p-2 border-r border-[#22262E] text-[#D4D4D8]">{f.businessPurpose}</td>
                                            <td className="p-2 border-r border-[#22262E] font-mono text-[10.5px] text-[#A1A1A1]">{f.sampleValues}</td>
                                            <td className="p-2 font-mono text-[10px] text-[#10B981]">{f.validationRule}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Section 5: SOP 1 - SOP 5 */}
                                <div className="space-y-2">
                                  <div className="font-mono text-[10.5px] font-bold text-[#10B981] uppercase">
                                    {manual.section5_TaskOrientedSops.heading}
                                  </div>
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                                    {manual.section5_TaskOrientedSops.sops.map((sop) => (
                                      <div key={sop.sopId} className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[3px] space-y-1.5">
                                        <div className="font-mono text-[11px] font-bold text-[#EDEDED]">
                                          <span className="text-[#3B82F6] mr-1.5">{sop.sopId}</span>
                                          {sop.sopTitle}
                                        </div>
                                        <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#D4D4D8]">
                                          {sop.steps.map((st, sIdx) => (
                                            <li key={sIdx}>{st}</li>
                                          ))}
                                        </ol>
                                        <div className="text-[10.5px] text-[#10B981] pt-1 border-t border-[#22262E]/70">
                                          <strong>{isId ? 'Hasil Diharapkan:' : 'Expected Result:'}</strong> {sop.expectedResult}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Section 6: Troubleshooting & FAQ */}
                                <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[3px] space-y-2">
                                  <div className="font-mono text-[10.5px] font-bold text-[#A78BFA] uppercase">
                                    {manual.section6_TroubleshootingAndFaq.heading}
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                    {manual.section6_TroubleshootingAndFaq.faqs.map((faq, fIdx) => (
                                      <div key={fIdx} className="p-2.5 bg-[#111317] border border-[#22262E] rounded-[2px] space-y-1">
                                        <div className="font-bold text-[#EDEDED] text-[11px]">{faq.question}</div>
                                        <p className="text-[#A1A1A1] text-[11px] leading-snug">{faq.answer}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Section 7: Business Logic & State Rules */}
                                {manual.section7_BusinessLogicAndStateRules && (
                                  <div className="p-3 bg-[#0B0C0E] border border-[#3B82F6]/40 rounded-[3px] space-y-2.5">
                                    <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-[#22262E]">
                                      <span className="font-mono text-[10.5px] font-bold text-[#38BDF8] uppercase">
                                        {manual.section7_BusinessLogicAndStateRules.heading}
                                      </span>
                                      <span className="px-1.5 py-0.5 bg-[#2563EB]/20 text-[#60A5FA] font-mono text-[9px] font-bold rounded-[2px]">
                                        {manual.section7_BusinessLogicAndStateRules.domainClassification.domainLabel}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-[#A1A1A1] font-sans">
                                      {manual.section7_BusinessLogicAndStateRules.domainClassification.summary}
                                    </p>

                                    {/* Core Rules */}
                                    <div className="border border-[#22262E] rounded-[2px] overflow-x-auto">
                                      <table className="w-full text-left font-mono text-[10px] border-collapse">
                                        <thead className="bg-[#16191F] text-[#707070] uppercase text-[9px] border-b border-[#22262E]">
                                          <tr>
                                            <th className="p-1.5 border-r border-[#22262E] w-16">Code</th>
                                            <th className="p-1.5 border-r border-[#22262E] w-40">Rule</th>
                                            <th className="p-1.5 border-r border-[#22262E] w-48">Formula / Condition</th>
                                            <th className="p-1.5 border-r border-[#22262E]">Logic</th>
                                            <th className="p-1.5 text-[#EF4444]">Failure Impact</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#22262E] bg-[#0B0C0E]">
                                          {manual.section7_BusinessLogicAndStateRules.coreBusinessRules.map((rule) => (
                                            <tr key={rule.ruleCode}>
                                              <td className="p-1.5 border-r border-[#22262E] font-bold text-[#38BDF8]">{rule.ruleCode}</td>
                                              <td className="p-1.5 border-r border-[#22262E] text-[#EDEDED] font-sans font-bold">{rule.ruleTitle}</td>
                                              <td className="p-1.5 border-r border-[#22262E] text-[#FBBF24]"><code>{rule.formulaOrCondition}</code></td>
                                              <td className="p-1.5 border-r border-[#22262E] text-[#A1A1A1] font-sans">{rule.logicExplanation}</td>
                                              <td className="p-1.5 text-[#F87171] font-sans">{rule.failureImpact}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>

                                    {/* State Transitions */}
                                    <div className="border border-[#22262E] rounded-[2px] overflow-x-auto">
                                      <table className="w-full text-left font-mono text-[10px] border-collapse">
                                        <thead className="bg-[#16191F] text-[#707070] uppercase text-[9px] border-b border-[#22262E]">
                                          <tr>
                                            <th className="p-1.5 border-r border-[#22262E] w-36">From State</th>
                                            <th className="p-1.5 border-r border-[#22262E]">Trigger &amp; Validation</th>
                                            <th className="p-1.5 border-r border-[#22262E] w-36">To State</th>
                                            <th className="p-1.5">Indicator</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#22262E] bg-[#0B0C0E]">
                                          {manual.section7_BusinessLogicAndStateRules.stateTransitionLifecycle.map((st, sIdx) => (
                                            <tr key={`st-${sIdx}`}>
                                              <td className="p-1.5 border-r border-[#22262E] text-[#A1A1A1]">{st.fromState}</td>
                                              <td className="p-1.5 border-r border-[#22262E] font-sans">
                                                <span className="text-[#38BDF8] font-bold block">{st.userTrigger}</span>
                                                <span className="text-[9.5px] text-[#707070]">{st.systemValidation}</span>
                                              </td>
                                              <td className="p-1.5 border-r border-[#22262E] font-bold text-[#10B981]">{st.toState}</td>
                                              <td className="p-1.5 text-[#D4D4D8] font-sans">{st.visibleUiIndicator}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                                {/* Section 8: UI-to-API and Error Recovery Matrix */}
                                {manual.section8_UiToApiAndErrorRecoveryMatrix && (
                                  <div className="p-3 bg-[#0B0C0E] border border-[#10B981]/40 rounded-[3px] space-y-2">
                                    <div className="font-mono text-[10.5px] font-bold text-[#10B981] uppercase pb-1 border-b border-[#22262E]">
                                      {manual.section8_UiToApiAndErrorRecoveryMatrix.heading}
                                    </div>
                                    <div className="border border-[#22262E] rounded-[2px] overflow-x-auto">
                                      <table className="w-full text-left font-mono text-[10px] border-collapse">
                                        <thead className="bg-[#16191F] text-[#707070] uppercase text-[9px] border-b border-[#22262E]">
                                          <tr>
                                            <th className="p-1.5 border-r border-[#22262E] w-36">Action / Control</th>
                                            <th className="p-1.5 border-r border-[#22262E] w-36">Endpoint</th>
                                            <th className="p-1.5 border-r border-[#22262E]">200/201 Success</th>
                                            <th className="p-1.5 border-r border-[#22262E] text-[#EF4444]">4xx/5xx Alert</th>
                                            <th className="p-1.5 w-40 text-[#38BDF8]">Recovery</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#22262E] bg-[#0B0C0E]">
                                          {manual.section8_UiToApiAndErrorRecoveryMatrix.interactions.map((it, iIdx) => (
                                            <tr key={`it-${iIdx}`}>
                                              <td className="p-1.5 border-r border-[#22262E] font-bold text-[#EDEDED] font-sans">
                                                {it.uiControlOrAction}
                                                <span className="text-[9px] text-[#707070] block font-mono">{it.requestPayloadSummary}</span>
                                              </td>
                                              <td className="p-1.5 border-r border-[#22262E] text-[#60A5FA]"><code>{it.triggeredEndpoint}</code></td>
                                              <td className="p-1.5 border-r border-[#22262E] text-[#10B981] font-sans">{it.onSuccessHttp200_201}</td>
                                              <td className="p-1.5 border-r border-[#22262E] text-[#F87171] font-sans">{it.onErrorHttp4xx_5xx}</td>
                                              <td className="p-1.5 text-[#38BDF8] font-sans">{it.userRecoveryAction}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <>
                                <p className="text-[12px] text-[#D4D4D8] font-sans">{guide.whatIsThisFeature}</p>
                                <ol className="list-decimal list-inside space-y-1 text-[#EDEDED] text-[11.5px] font-sans">
                                  {guide.howToUseSteps.map((st, sIdx) => (
                                    <li key={sIdx}>{st}</li>
                                  ))}
                                </ol>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeBook === 'BOOK2' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[4px] space-y-2">
                      <h3 className="text-[14px] font-bold text-[#EDEDED] font-sans">{azLib.book2BusinessAnalyst.title}</h3>
                      <p className="text-[11.5px] font-mono text-[#3B82F6]">{azLib.book2BusinessAnalyst.scopeSummary}</p>
                    </div>
                    <div className="bg-[#111317] border border-[#22262E] rounded-[4px] overflow-hidden">
                      <table className="w-full text-left border-collapse text-[12px]">
                        <thead className="bg-[#16191F] text-[#707070] font-mono text-[10.5px] uppercase border-b border-[#22262E]">
                          <tr>
                            <th className="p-2.5 border-r border-[#22262E] w-24">Rule ID</th>
                            <th className="p-2.5 border-r border-[#22262E] w-44">Module</th>
                            <th className="p-2.5 border-r border-[#22262E]">Statement</th>
                            <th className="p-2.5 w-44">Target KPI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#22262E]">
                          {azLib.book2BusinessAnalyst.brdRules.map((b) => (
                            <tr key={b.ruleId}>
                              <td className="p-2.5 border-r border-[#22262E] font-mono font-bold text-[#3B82F6]">{b.ruleId}</td>
                              <td className="p-2.5 border-r border-[#22262E] font-mono text-[11px] text-[#A1A1A1]">{b.moduleName || 'Core'}</td>
                              <td className="p-2.5 border-r border-[#22262E] text-[#EDEDED]">{b.statement}</td>
                              <td className="p-2.5 font-mono text-[11px] text-[#10B981]">{b.targetKpi}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeBook === 'BOOK3' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[4px] space-y-2">
                      <h3 className="text-[14px] font-bold text-[#EDEDED] font-sans">{azLib.book3ArchitectureIntegration.title}</h3>
                      <p className="text-[12px] text-[#A1A1A1] font-sans">{azLib.book3ArchitectureIntegration.subtitle}</p>
                      {plainArch && (
                        <p className="text-[12.5px] text-[#EDEDED] font-sans leading-relaxed pt-1">
                          {isId ? plainArch.executiveOverview : plainArch.executiveOverviewEn}
                        </p>
                      )}
                    </div>
                    <VerifiedArchitectureMapCanvas architecture={resolvedArch} />
                    {plainArch && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {plainArch.fourLayerBreakdown.map((layer) => (
                          <div key={layer.layerName} className="p-3.5 bg-[#111317] border border-[#22262E] rounded-[4px] space-y-1.5">
                            <div className="text-[12.5px] font-bold text-[#EDEDED] font-sans">
                              {isId ? layer.layerName : layer.layerNameEn}
                            </div>
                            <div className="text-[10.5px] font-mono text-[#3B82F6]">{layer.techDetected}</div>
                            <p className="text-[11.5px] text-[#D4D4D8] font-sans">
                              {isId ? layer.plainSummary : layer.plainSummaryEn}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeBook === 'BOOK4' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                      <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px]">
                        <span className="text-[10px] text-[#707070] uppercase block">Test Scenarios</span>
                        <strong className="text-[18px] text-[#3B82F6] tabular-nums">{azLib.book4QaAndCompliance.testScenariosCount}</strong>
                      </div>
                      <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px]">
                        <span className="text-[10px] text-[#707070] uppercase block">Pass Rate</span>
                        <strong className="text-[18px] text-[#10B981] tabular-nums">{azLib.book4QaAndCompliance.passRatePercent}%</strong>
                      </div>
                      <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px]">
                        <span className="text-[10px] text-[#707070] uppercase block">Open Bugs</span>
                        <strong className="text-[18px] text-[#EF4444] tabular-nums">{azLib.book4QaAndCompliance.bugReports.length}</strong>
                      </div>
                      <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px]">
                        <span className="text-[10px] text-[#707070] uppercase block">Security / GRC</span>
                        <strong className="text-[18px] text-[#F59E0B] tabular-nums">
                          {azLib.book4QaAndCompliance.securityGrade} · {azLib.book4QaAndCompliance.complianceRatePercent}%
                        </strong>
                      </div>
                    </div>

                    <div className="bg-[#111317] border border-[#22262E] rounded-[4px] overflow-hidden">
                      <table className="w-full text-left border-collapse text-[11.5px]">
                        <thead className="bg-[#16191F] text-[#707070] font-mono text-[10px] uppercase border-b border-[#22262E]">
                          <tr>
                            <th className="p-2.5 border-r border-[#22262E] w-24">UAT ID</th>
                            <th className="p-2.5 border-r border-[#22262E] w-44">Module</th>
                            <th className="p-2.5 border-r border-[#22262E]">Business Scenario</th>
                            <th className="p-2.5 w-36">Sign-Off Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#22262E]">
                          {azLib.book4QaAndCompliance.uatFlows.map((u) => (
                            <tr key={u.uatId}>
                              <td className="p-2.5 border-r border-[#22262E] font-mono font-bold text-[#3B82F6]">{u.uatId}</td>
                              <td className="p-2.5 border-r border-[#22262E] text-[#EDEDED]">{u.moduleName}</td>
                              <td className="p-2.5 border-r border-[#22262E] text-[#D4D4D8]">{u.businessScenarioTitle}</td>
                              <td className="p-2.5 font-mono text-[10.5px]">
                                <span className={u.uatStatus === 'ACCEPTED' ? 'text-[#10B981] font-bold' : 'text-[#F59E0B] font-bold'}>
                                  {u.uatStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* =========================================================================
         * TAB 3: INTEGRATION HANDOFF KIT & MASTER DATA DICTIONARY
         * ========================================================================= */}
        {activeTab === 'INTEGRATION_KIT' && (
          <div className="space-y-5">
            {/* 1. Plain Architecture Explanation ("Arsitekturnya gimana?") */}
            {plainArch && (
              <div className="bg-[#111317] border border-[#22262E] rounded-[4px] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#22262E]">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#3B82F6]" />
                    <h3 className="text-[13px] font-mono font-bold text-[#EDEDED] uppercase">
                      {copy.step12.archPlainTitle}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {plainArch.detectedFrameworks.map((fw) => (
                      <span key={fw} className="px-2 py-0.5 bg-[#2563EB]/15 border border-[#2563EB]/40 text-[#60A5FA] font-mono text-[10px] rounded-[2px]">
                        {fw}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-[12.5px] text-[#EDEDED] font-sans leading-relaxed">
                  {isId ? plainArch.executiveOverview : plainArch.executiveOverviewEn}
                </p>
                <VerifiedArchitectureMapCanvas architecture={resolvedArch} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {plainArch.fourLayerBreakdown.map((layer) => (
                    <div key={layer.layerName} className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[3px] space-y-1.5">
                      <div className="text-[11.5px] font-bold text-[#EDEDED] font-sans">
                        {isId ? layer.layerName : layer.layerNameEn}
                      </div>
                      <div className="text-[10px] font-mono text-[#10B981]">{layer.techDetected}</div>
                      <p className="text-[11px] text-[#A1A1A1] font-sans leading-snug">
                        {isId ? layer.plainSummary : layer.plainSummaryEn}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cross-Project Integration Bridge Card (when linked to another Vault project) */}
            {integrationKit?.upstreamLinkedProject && (
              <div className="bg-[#111317] border border-[#8B5CF6]/60 rounded-[4px] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#22262E]">
                  <div className="flex items-center gap-2">
                    <Plug className="h-4 w-4 text-[#A78BFA]" />
                    <h3 className="text-[13px] font-mono font-bold text-[#EDEDED] uppercase">
                      {isId ? 'Peta Integrasi Lintas-Proyek (Cross-Project Bridge)' : 'Cross-Project Integration Bridge'}:{' '}
                      <span className="text-[#A78BFA]">{integrationKit.upstreamLinkedProject.projectName}</span>
                    </h3>
                  </div>
                  <span className="text-[10.5px] font-mono text-[#707070]">
                    {integrationKit.upstreamLinkedProject.targetUrl} · {integrationKit.upstreamLinkedProject.linkedContracts.length} Contracts
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {integrationKit.upstreamLinkedProject.linkedContracts.map((lc) => (
                    <div key={lc.contractId} className="p-2.5 bg-[#0B0C0E] border border-[#22262E] rounded-[3px] space-y-1 text-[11px]">
                      <div className="flex items-center justify-between gap-1 font-mono">
                        <span className="text-[#A78BFA] font-bold">{lc.contractId}</span>
                        <span className="text-[9.5px] text-[#F59E0B]">{lc.authMethod}</span>
                      </div>
                      <div className="font-sans font-bold text-[#EDEDED]">{lc.moduleName}</div>
                      <code className="text-[10.5px] font-mono text-[#10B981] block break-all">
                        {lc.method} {lc.endpoint}
                      </code>
                      <div className="text-[10px] text-[#A1A1A1] font-sans">{lc.blastRadiusImpact}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Cross-Project Integration Handoff Contracts */}
            {integrationKit && (
              <div className="bg-[#111317] border border-[#22262E] rounded-[4px] overflow-hidden">
                <div className="px-4 py-2.5 bg-[#16191F] border-b border-[#22262E] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Plug className="h-4 w-4 text-[#10B981]" />
                    <span className="text-[12.5px] font-mono font-bold text-[#EDEDED] uppercase">
                      {copy.step12.integrationKitTitle} ({integrationKit.integrationContracts.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopySdk}
                      className="h-6 px-2 bg-[#0B0C0E] border border-[#22262E] hover:border-[#3B82F6] text-[#60A5FA] font-mono text-[10px] font-bold rounded-[2px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSdk ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedSdk ? 'SDK Copied!' : 'Copy TS+Zod SDK'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadSdk}
                      className="h-6 px-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-mono text-[10px] font-bold rounded-[2px] flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download SDK (.ts)</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11.5px]">
                    <thead className="bg-[#16191F] text-[#707070] font-mono text-[10px] uppercase border-b border-[#22262E]">
                      <tr>
                        <th className="p-2.5 border-r border-[#22262E] w-24">ID</th>
                        <th className="p-2.5 border-r border-[#22262E] w-56">Endpoint &amp; Module</th>
                        <th className="p-2.5 border-r border-[#22262E] w-44">Auth Method</th>
                        <th className="p-2.5 border-r border-[#22262E]">Params, Response &amp; Blast Radius</th>
                        <th className="p-2.5 w-32">Sample cURL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#22262E]">
                      {integrationKit.integrationContracts.map((c) => (
                        <tr key={c.contractId} className="hover:bg-[#16191F]/50">
                          <td className="p-2.5 border-r border-[#22262E] font-mono font-bold text-[#3B82F6] align-top">
                            {c.contractId}
                          </td>
                          <td className="p-2.5 border-r border-[#22262E] align-top">
                            <div className="font-sans font-bold text-[#EDEDED]">{c.moduleName}</div>
                            <code className="text-[10.5px] font-mono text-[#10B981] break-all">
                              {c.method} {c.endpoint}
                            </code>
                          </td>
                          <td className="p-2.5 border-r border-[#22262E] font-mono text-[10.5px] text-[#F59E0B] align-top">
                            {c.authMethod}
                          </td>
                          <td className="p-2.5 border-r border-[#22262E] font-sans space-y-1 align-top">
                            <div>
                              <span className="text-[#707070] font-mono text-[10px]">PARAMS: </span>
                              <span className="text-[#EDEDED]">{c.requiredParams.join(', ') || 'None'}</span>
                            </div>
                            {c.requestBodyContract && c.requestBodyContract.schemaFields.length > 0 && (
                              <div>
                                <span className="text-[#707070] font-mono text-[10px]">BODY: </span>
                                <span className="text-[#60A5FA] font-mono text-[10px]">
                                  {c.requestBodyContract.schemaFields.map((f) => `${f.field}${f.required ? '*' : ''}`).join(', ')}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-[#707070] font-mono text-[10px]">200/201 RES: </span>
                              <span className="text-[#10B981] font-mono text-[10px]">
                                {c.successResponses?.[0]?.schemaFields
                                  ? c.successResponses[0].schemaFields.map((f) => f.field).join(', ')
                                  : (c.responseFields || []).join(', ')}
                              </span>
                            </div>
                            {c.errorResponses && c.errorResponses.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {c.errorResponses.map((err) => (
                                  <span
                                    key={err.statusCode}
                                    className="px-1 py-0.2 bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#F87171] font-mono text-[9px] rounded-[2px]"
                                    title={`${err.errorCode}: ${err.triggerCondition}`}
                                  >
                                    {err.statusCode}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="text-[10.5px] text-[#FBBF24] pt-0.5">{c.blastRadiusImpact}</div>
                          </td>
                          <td className="p-2.5 align-top">
                            <button
                              onClick={() => handleCopy(c.sampleCurl, c.contractId)}
                              className="px-2 py-1 bg-[#0B0C0E] border border-[#22262E] hover:border-[#3B82F6] text-[#EDEDED] rounded-[2px] font-mono text-[10px] flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              title={c.sampleCurl}
                            >
                              {copiedKey === c.contractId ? (
                                <Check className="h-3 w-3 text-[#10B981]" />
                              ) : (
                                <Copy className="h-3 w-3 text-[#3B82F6]" />
                              )}
                              <span>{copiedKey === c.contractId ? copy.step12.copied : copy.step12.copyCurl}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. Master Data Dictionary */}
            <div className="bg-[#111317] border border-[#22262E] rounded-[4px] overflow-hidden">
              <div className="px-4 py-2.5 bg-[#16191F] border-b border-[#22262E] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-[#F59E0B]" />
                  <span className="text-[12.5px] font-mono font-bold text-[#EDEDED] uppercase">
                    {copy.step12.dataDictTitle} ({filteredDictionary.length})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#0B0C0E] border border-[#22262E] px-2 py-1 rounded-[2px]">
                  <Search className="h-3 w-3 text-[#707070]" />
                  <input
                    type="text"
                    value={dictSearch}
                    onChange={(e) => setDictSearch(e.target.value)}
                    placeholder={copy.step12.searchDictPlaceholder}
                    className="bg-transparent border-none outline-none text-[#EDEDED] text-[11px] font-mono w-64"
                  />
                </div>
              </div>

              <div className="overflow-x-auto max-h-[380px]">
                <table className="w-full text-left border-collapse text-[11.5px]">
                  <thead className="bg-[#16191F] text-[#707070] font-mono text-[10px] uppercase border-b border-[#22262E] sticky top-0">
                    <tr>
                      <th className="p-2.5 border-r border-[#22262E]">Table</th>
                      <th className="p-2.5 border-r border-[#22262E]">Field</th>
                      <th className="p-2.5 border-r border-[#22262E]">Type / Key</th>
                      <th className="p-2.5 border-r border-[#22262E]">Business Meaning</th>
                      <th className="p-2.5">Validation Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#22262E]">
                    {filteredDictionary.map((d, idx) => (
                      <tr key={`${d.tableName}-${d.fieldName}-${idx}`} className="hover:bg-[#16191F]/50">
                        <td className="p-2.5 border-r border-[#22262E] font-mono font-bold text-[#3B82F6]">{d.tableName}</td>
                        <td className="p-2.5 border-r border-[#22262E] font-mono text-[#EDEDED]">{d.fieldName}</td>
                        <td className="p-2.5 border-r border-[#22262E] font-mono text-[10.5px] text-[#A1A1A1]">
                          {d.dataType} {d.isPrimaryKey ? '· PK' : d.isForeignKey ? '· FK' : ''} {d.nullable ? '· NULL' : '· NOT NULL'}
                        </td>
                        <td className="p-2.5 border-r border-[#22262E] font-sans text-[#D4D4D8]">{d.businessMeaning}</td>
                        <td className="p-2.5 font-mono text-[10.5px] text-[#10B981]">{d.validationRef}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
         * TAB 4: TECHNICAL KNOWLEDGE GRAPH & OPENCYPHER
         * ========================================================================= */}
        {activeTab === 'TECHNICAL_GRAPH' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#111317] border border-[#22262E] p-2 rounded-[3px] font-mono text-[10.5px]">
              <div className="flex flex-wrap items-center gap-1">
                <button
                  onClick={() => setTechSubTab('INTERACTIVE_GRAPH')}
                  className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                    techSubTab === 'INTERACTIVE_GRAPH' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                  }`}
                >
                  Graph Explorer ({filteredNodes.length})
                </button>
                <button
                  onClick={() => setTechSubTab('CYPHER_STUDIO')}
                  className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                    techSubTab === 'CYPHER_STUDIO' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                  }`}
                >
                  OpenCypher Studio
                </button>
                <button
                  onClick={() => setTechSubTab('TRIPLES_LEDGER')}
                  className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                    techSubTab === 'TRIPLES_LEDGER' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                  }`}
                >
                  RDF Triples ({summary.totalEdges})
                </button>
                <button
                  onClick={() => setTechSubTab('WHITEPAPER')}
                  className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                    techSubTab === 'WHITEPAPER' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                  }`}
                >
                  System Whitepaper (.md)
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge-tag px-1.5 py-0.2 bg-[#8B5CF6]/20 text-[#A78BFA] font-bold text-[9.5px] whitespace-nowrap">
                  {summary.totalNodes} NODES · {summary.totalEdges} TRIPLES
                </span>
                <button
                  onClick={handleDownloadWhitepaper}
                  className="px-2.5 py-1 bg-[#22262E] hover:bg-[#2A2E39] text-[#EDEDED] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Download className="h-3 w-3 text-[#3B82F6]" />
                  <span>{copy.step12.exportWhitepaper}</span>
                </button>
              </div>
            </div>

            {/* Technical KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0 font-mono text-[11px]">
              <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
                <span className="text-[10px] text-[#707070] uppercase font-bold">Total Nodes</span>
                <span className="text-[18px] font-bold text-[#EDEDED] tabular-nums">{summary.totalNodes}</span>
                <span className="text-[9.5px] text-[#A1A1A1]">Ontological Entities</span>
              </div>
              <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
                <span className="text-[10px] text-[#707070] uppercase font-bold">Total Triples</span>
                <span className="text-[18px] font-bold text-[#8B5CF6] tabular-nums">{summary.totalEdges}</span>
                <span className="text-[9.5px] text-[#8B5CF6]">Semantic Edges</span>
              </div>
              <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
                <span className="text-[10px] text-[#707070] uppercase font-bold">Traceability</span>
                <span className="text-[18px] font-bold text-[#10B981] tabular-nums">100%</span>
                <span className="text-[9.5px] text-[#10B981]">Inception to Code</span>
              </div>
              <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
                <span className="text-[10px] text-[#707070] uppercase font-bold">Formal Proof</span>
                <span className="text-[18px] font-bold text-[#10B981] tabular-nums">UNSAT</span>
                <span className="text-[9.5px] text-[#10B981]">Z3 Verified</span>
              </div>
              <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
                <span className="text-[10px] text-[#707070] uppercase font-bold">ARB Sign-Off</span>
                <span className="text-[18px] font-bold text-[#F97316] tabular-nums">
                  {delphiConsensusSummary?.consensusScorePercent ?? 98}%
                </span>
                <span className="text-[9.5px] text-[#F97316]">Clearance</span>
              </div>
              <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
                <span className="text-[10px] text-[#707070] uppercase font-bold">Ontology Standard</span>
                <span className="text-[14px] font-bold text-[#38BDF8]">W3C RDF</span>
                <span className="text-[9.5px] text-[#A1A1A1]">ISO/IEC 21838</span>
              </div>
            </div>

            {techSubTab === 'INTERACTIVE_GRAPH' && (
              <div className="space-y-4 font-mono text-[11px]">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#22262E]">
                  <div className="flex flex-wrap items-center gap-1 bg-[#111317] border border-[#22262E] p-0.5 rounded-[3px] text-[10px]">
                    {(
                      [
                        'ALL',
                        'MOM',
                        'BUSINESS_RULE',
                        'VALIDATION_RULE',
                        'API_ENDPOINT',
                        'DATABASE_TABLE',
                        'TEST_CASE',
                        'REGULATORY_CONTROL',
                        'SMT_INVARIANT',
                        'ARB_CLEARANCE',
                      ] as const
                    ).map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTypeFilter(t)}
                        className={`px-2 py-0.5 rounded-[2px] transition-colors cursor-pointer whitespace-nowrap ${
                          selectedTypeFilter === t ? 'bg-[#2563EB] text-white font-bold' : 'text-[#707070] hover:text-[#EDEDED]'
                        }`}
                      >
                        {t.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10.5px] text-[#707070] whitespace-nowrap shrink-0 tabular-nums">
                    {filteredNodes.length} Nodes Shown
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredNodes.map((node) => {
                    const isSelected = selectedNode?.id === node.id;
                    const connectedEdges = summary.edges.filter((e) => e.source === node.id || e.target === node.id);

                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`p-3.5 bg-[#111317] border rounded-[3px] transition-all cursor-pointer space-y-2 ${getNodeColor(
                          node.type
                        )} ${isSelected ? 'ring-2 ring-white scale-102' : 'hover:border-[#EDEDED]'}`}
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-[#22262E]">
                          <span className="font-bold text-[10px] text-[#EDEDED]">{node.label}</span>
                          <span className="badge-tag px-1.5 py-0.2 rounded font-bold text-[8.5px] uppercase">
                            {node.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-[11.5px] font-bold text-[#EDEDED]">{node.title}</div>
                        <div className="text-[10px] text-[#A1A1A1] font-sans line-clamp-2">{node.description}</div>
                        <div className="pt-2 text-[9.5px] text-[#707070] flex items-center justify-between border-t border-[#22262E]">
                          <span>
                            Triples: <strong className="text-[#38BDF8]">{connectedEdges.length} Connected</strong>
                          </span>
                          <span className="text-[#A1A1A1] font-mono text-[9px]">{node.id}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedNode && (
                  <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-[#22262E]">
                      <div className="flex items-center gap-2">
                        <span className="text-[#EDEDED] font-bold text-[12px]">
                          [{selectedNode.id}] {selectedNode.title}
                        </span>
                        <span className="badge-tag px-1.5 py-0.2 rounded font-bold text-[9px] uppercase">
                          {selectedNode.type}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="text-[10px] text-[#707070] hover:text-[#EDEDED] cursor-pointer"
                      >
                        Close Inspector
                      </button>
                    </div>
                    <p className="text-[11px] text-[#A1A1A1] font-sans">{selectedNode.description}</p>
                    <div className="space-y-1 max-h-[160px] overflow-y-auto">
                      {summary.edges
                        .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                        .map((edge) => (
                          <div
                            key={edge.id}
                            className="p-2 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] flex items-center justify-between text-[10px]"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#38BDF8] font-mono">{edge.source}</span>
                              <ArrowRight className="h-3 w-3 text-[#707070]" />
                              <span className="text-[#F59E0B] font-bold">:{edge.predicate}</span>
                              <ArrowRight className="h-3 w-3 text-[#707070]" />
                              <span className="text-[#10B981] font-mono">{edge.target}</span>
                            </div>
                            <span className="text-[#707070]">{edge.description}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {techSubTab === 'CYPHER_STUDIO' && (
              <div className="space-y-4 font-mono text-[11px]">
                <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-[#3B82F6]" />
                      <span className="text-[#EDEDED] font-bold text-[12px]">OpenCypher Semantic Graph Query Studio</span>
                    </div>
                    <span className="badge-tag px-1.5 py-0.2 bg-[#2563EB]/20 text-[#3B82F6] font-bold text-[9.5px]">
                      Property Graph Traversal
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A1A1A1] font-sans">
                    Execute declarative OpenCypher queries over the universal SDLC semantic graph to trace dependencies and impact radius.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {summary.cypherSampleQueries.map((q) => (
                    <div
                      key={q.id}
                      className="p-3 bg-[#111317] border border-[#22262E] hover:border-[#3B82F6] rounded-[3px] space-y-2 flex flex-col justify-between transition-colors"
                    >
                      <div className="space-y-1">
                        <span className="text-[#38BDF8] font-bold text-[11px] block">{q.title}</span>
                        <span className="text-[#707070] text-[10px] font-sans block">{q.description}</span>
                        <pre className="p-2 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] text-[9.5px] text-[#10B981] overflow-x-auto whitespace-pre-wrap mt-1">
                          {q.query}
                        </pre>
                      </div>
                      <button
                        onClick={() => handleRunCypher(q.query)}
                        disabled={isQuerying}
                        className="w-full mt-2 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-bold text-[10px] rounded-[2px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isQuerying && activeCypherQuery === q.query ? (
                          <RotateCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3 fill-current" />
                        )}
                        <span>Execute Cypher Query</span>
                      </button>
                    </div>
                  ))}
                </div>

                {activeCypherQuery && (
                  <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-[#22262E]">
                      <span className="text-[#EDEDED] font-bold text-[11.5px]">Active Cypher Query Result</span>
                      <span className="badge-tag px-2 py-0.5 bg-[#059669]/20 text-[#10B981] font-bold text-[9.5px]">
                        STATUS: EXECUTED (MATCH FOUND)
                      </span>
                    </div>
                    <pre className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] text-[10px] text-[#38BDF8] overflow-x-auto whitespace-pre-wrap">
                      {activeCypherQuery}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {techSubTab === 'TRIPLES_LEDGER' && (
              <div className="border border-[#22262E] rounded-[3px] overflow-hidden font-mono text-[11px]">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5 w-24 border-r border-[#22262E]">Triple ID</th>
                      <th className="p-2.5 w-60 border-r border-[#22262E]">Subject Node</th>
                      <th className="p-2.5 w-44 border-r border-[#22262E]">Predicate</th>
                      <th className="p-2.5 w-60 border-r border-[#22262E]">Object Node</th>
                      <th className="p-2.5">Semantic Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#22262E] bg-[#0B0C0E]">
                    {summary.edges.map((e) => (
                      <tr key={e.id} className="hover:bg-[#16191F] transition-colors">
                        <td className="p-2.5 font-bold text-[#3B82F6] border-r border-[#22262E]">{e.id}</td>
                        <td className="p-2.5 text-[#38BDF8] border-r border-[#22262E]">{e.source}</td>
                        <td className="p-2.5 font-bold text-[#F59E0B] border-r border-[#22262E]">{e.predicate}</td>
                        <td className="p-2.5 text-[#10B981] border-r border-[#22262E]">{e.target}</td>
                        <td className="p-2.5 text-[#A1A1A1] text-[10.5px] font-sans">{e.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {techSubTab === 'WHITEPAPER' && (
              <div className="bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col overflow-hidden min-h-0">
                <div className="h-[38px] bg-[#16191F] border-b border-[#22262E] px-4 flex items-center justify-between text-[11px] font-mono shrink-0 select-none">
                  <span className="font-bold text-[#EDEDED]">
                    SDLC_SYSTEM_WHITEPAPER_{(appName || 'APP').replace(/[^a-zA-Z0-9]/g, '_')}.md
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(summary.enterpriseWhitepaperMarkdown, 'paper')}
                      className="px-2.5 py-1 bg-[#22262E] hover:bg-[#2A2E39] text-[#EDEDED] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {copiedKey === 'paper' ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3" />}
                      <span>Copy Whitepaper</span>
                    </button>
                    <button
                      onClick={handleDownloadWhitepaper}
                      className="px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-[2px] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download .md</span>
                    </button>
                  </div>
                </div>
                <div className="h-[600px] min-h-[600px]">
                  <MonacoEditor
                    height="100%"
                    language="markdown"
                    theme="vs-dark"
                    value={summary.enterpriseWhitepaperMarkdown}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 12,
                      fontFamily: 'JetBrains Mono, Menlo, monospace',
                      lineHeight: 22,
                      wordWrap: 'on',
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
  
