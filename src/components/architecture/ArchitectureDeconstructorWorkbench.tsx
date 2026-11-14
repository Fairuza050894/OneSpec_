'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Layers,
  Cpu,
  Database,
  Network,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Activity,
  Code2,
  Lock,
  GitBranch,
  Printer,
  FileText,
  Eye,
} from 'lucide-react';
import {
  architectureDeconstructorService,
  type DeconstructedArchitecture,
  type ArchitectureDeconstructionInput,
  type LowLevelComponentTrace,
  type UpstreamLinkedProjectInfo,
} from '@/services/architectureDeconstructor';
import { VerifiedSequenceDiagramCanvas } from './VerifiedSequenceDiagramCanvas';
import { VerifiedArchitectureMapCanvas } from './VerifiedArchitectureMapCanvas';
import { useStudioLocale } from '@/lib/i18n';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center font-mono text-[11px] text-[#707070] bg-[#0E1015]">
      Loading Monaco Architecture Blueprint View...
    </div>
  ),
});

interface ArchitectureDeconstructorWorkbenchProps {
  input: ArchitectureDeconstructionInput;
  initialMode?: 'HLA' | 'LLA' | 'BLUEPRINT';
  upstreamLinkedProject?: UpstreamLinkedProjectInfo | null;
}

export function ArchitectureDeconstructorWorkbench({
  input,
  initialMode = 'HLA',
  upstreamLinkedProject,
}: ArchitectureDeconstructorWorkbenchProps) {
  const { locale } = useStudioLocale();
  const isId = locale === 'id';
  const [activeTab, setActiveTab] = useState<'HLA' | 'LLA' | 'BLUEPRINT'>(initialMode);
  const [c4ViewMode, setC4ViewMode] = useState<'VISUAL' | 'MERMAID'>('VISUAL');
  const [llaViewMode, setLlaViewMode] = useState<'VISUAL' | 'MERMAID'>('VISUAL');
  const [blueprintViewMode, setBlueprintViewMode] = useState<'FORMAL_DOC' | 'MARKDOWN_SPEC'>('FORMAL_DOC');
  const [selectedTrace, setSelectedTrace] = useState<LowLevelComponentTrace | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Deconstruct architecture strictly from active project input
  const deconstructed: DeconstructedArchitecture = useMemo(() => {
    const res = architectureDeconstructorService.deconstruct(input);
    if (upstreamLinkedProject) {
      res.integrationHandoffKit.upstreamLinkedProject = upstreamLinkedProject;
    }
    return res;
  }, [input, upstreamLinkedProject]);
  const blueprintMarkdown = useMemo(() => {
    return architectureDeconstructorService.generateArchitectureBlueprintMarkdown(deconstructed);
  }, [deconstructed]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadBlueprint = () => {
    const slug = (deconstructed.hla.systemName || 'Architecture').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const blob = new Blob([blueprintMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ARCHITECTURE_BLUEPRINT_${slug}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const handleDownloadDrawio = () => {
    const xml = architectureDeconstructorService.generateDrawioXml(deconstructed);
    const slug = (deconstructed.hla.systemName || 'Architecture').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OneSpec_Architecture_${slug}.drawio`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintDocument = () => {
    window.print();
  };

  const { hla, lla } = deconstructed;

  return (
    <div className="w-full h-full flex flex-col bg-[#0B0C0E] border border-[#22262E] rounded-[4px] overflow-hidden min-h-0">
      {/* Top Architecture Toolbar */}
      <div className="h-[40px] min-h-[40px] bg-[#16191F] border-b border-[#22262E] px-4 flex items-center justify-between text-[11px] font-mono shrink-0 select-none">
        <div className="flex items-center gap-2.5 truncate">
          <Layers className="h-4 w-4 text-[#3B82F6] shrink-0" />
          <span className="text-[#EDEDED] font-bold uppercase tracking-wide truncate">
            {hla.systemName} · Architecture Deconstructor
          </span>
          <span className="badge-tag px-1.5 py-0.2 bg-[#2563EB]/20 text-[#3B82F6] font-bold text-[9.5px]">
            ISO/IEC/IEEE 42010 &amp; IEEE 1016
          </span>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[3px] text-[11px] font-mono">
            <button
              onClick={() => setActiveTab('HLA')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeTab === 'HLA' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              {isId ? 'Arsitektur Tingkat Tinggi (HLA)' : 'High-Level (HLA)'}
            </button>
            <button
              onClick={() => setActiveTab('LLA')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeTab === 'LLA' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              {isId ? 'Arsitektur Tingkat Rendah (LLA)' : 'Low-Level (LLA)'}
            </button>
            <button
              onClick={() => setActiveTab('BLUEPRINT')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeTab === 'BLUEPRINT' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              {isId ? 'Cetak Biru Arsitektur' : 'Architecture Blueprint'}
            </button>
          </div>

          <div className="h-4 w-px bg-[#22262E] mx-1" />

          <button
            onClick={handleDownloadDrawio}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#111317] border border-[#22262E] hover:border-[#F59E0B] text-[#F59E0B] rounded-[2px] cursor-pointer transition-colors"
            title="Export Architecture Topology to Draw.io (.drawio)"
          >
            <Network className="h-3 w-3" />
            <span className="hidden sm:inline">Draw.io (.drawio)</span>
          </button>

          <button
            onClick={handleDownloadBlueprint}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#111317] border border-[#22262E] hover:border-[#3B82F6] text-[#EDEDED] rounded-[2px] cursor-pointer transition-colors"
            title="Download Formal Architecture Blueprint"
          >
            <Download className="h-3 w-3 text-[#3B82F6]" />
            <span className="hidden sm:inline">{isId ? 'Unduh Cetak Biru' : 'Download Blueprint'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* =========================================================================
         * SUB-VIEW 1: HIGH-LEVEL ARCHITECTURE (HLA)
         * ========================================================================= */}
        {activeTab === 'HLA' && (
          <div className="space-y-4 font-mono text-[11px]">
            {deconstructed.integrationHandoffKit?.upstreamLinkedProject && (
              <div className="p-3.5 bg-[#111317] border border-[#8B5CF6]/60 rounded-[3px] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-[#22262E]">
                  <span className="text-[#A78BFA] font-bold uppercase text-[11px]">
                    {isId ? 'Peta Integrasi Lintas-Proyek Terhubung' : 'Cross-Project Integration Bridge'}: {deconstructed.integrationHandoffKit.upstreamLinkedProject.projectName}
                  </span>
                  <span className="text-[10px] text-[#707070]">{deconstructed.integrationHandoffKit.upstreamLinkedProject.targetUrl}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {deconstructed.integrationHandoffKit.upstreamLinkedProject.linkedContracts.slice(0, 6).map((c) => (
                    <div key={c.contractId} className="p-2 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] text-[10.5px] space-y-0.5">
                      <div className="text-[#10B981] font-bold">{c.method} {c.endpoint}</div>
                      <div className="text-[#EDEDED] font-sans">{c.moduleName}</div>
                      <div className="text-[#A1A1A1] text-[9.5px]">{c.authMethod}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Tech Stack Ingress Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
              <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
                <span className="text-[10px] text-[#707070] uppercase font-bold">Client Tier</span>
                <span className="text-[#EDEDED] font-bold truncate mt-1">Web DOM / Forms</span>
                <span className="text-[9.5px] text-[#3B82F6] truncate">{hla.techStackSummary.clientRuntime}</span>
              </div>
              <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
                <span className="text-[10px] text-[#707070] uppercase font-bold">API Ingress</span>
                <span className="text-[#EDEDED] font-bold truncate mt-1">Gateway Router</span>
                <span className="text-[9.5px] text-[#8B5CF6] truncate">{hla.techStackSummary.gatewayFramework}</span>
              </div>
              <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
                <span className="text-[10px] text-[#707070] uppercase font-bold">Domain Engine</span>
                <span className="text-[#EDEDED] font-bold truncate mt-1">Invariant Logic</span>
                <span className="text-[9.5px] text-[#10B981] truncate">{hla.techStackSummary.serviceLanguage}</span>
              </div>
              <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
                <span className="text-[10px] text-[#707070] uppercase font-bold">Persistence</span>
                <span className="text-[#EDEDED] font-bold truncate mt-1">ACID Relational DB</span>
                <span className="text-[9.5px] text-[#F59E0B] truncate">{hla.techStackSummary.databaseEngine}</span>
              </div>
              <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
                <span className="text-[10px] text-[#707070] uppercase font-bold">Protocols</span>
                <span className="text-[#EDEDED] font-bold truncate mt-1">HTTP / Stream</span>
                <span className="text-[9.5px] text-[#A1A1A1] truncate">{hla.techStackSummary.protocols.join(', ')}</span>
              </div>
            </div>

            {/* C4 Model Diagrams Section with Visual / Mermaid Toggle */}
            <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#22262E]">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-[#3B82F6]" />
                  <span className="text-[#EDEDED] font-bold text-[12px]">
                    C4 Architecture Model: Level 1 System Context &amp; Level 2 Container Topology
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[2px] text-[10px]">
                    <button
                      onClick={() => setC4ViewMode('VISUAL')}
                      className={`px-2.5 py-0.5 rounded-[2px] transition-colors cursor-pointer ${
                        c4ViewMode === 'VISUAL' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#707070] hover:text-[#EDEDED]'
                      }`}
                    >
                      Visual Architecture Map
                    </button>
                    <button
                      onClick={() => setC4ViewMode('MERMAID')}
                      className={`px-2.5 py-0.5 rounded-[2px] transition-colors cursor-pointer ${
                        c4ViewMode === 'MERMAID' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#707070] hover:text-[#EDEDED]'
                      }`}
                    >
                      Mermaid Code Spec
                    </button>
                  </div>

                  <button
                    onClick={() => handleCopy(hla.c4ContainerMermaid, 'c4')}
                    className="flex items-center gap-1 text-[10px] text-[#707070] hover:text-[#EDEDED] cursor-pointer"
                  >
                    {copiedKey === 'c4' ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3" />}
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              {c4ViewMode === 'VISUAL' ? (
                <div className="space-y-4">
                  {/* Verified Interactive Vector Architecture Map (9-Gate Validated + Reachability Trace + SVG/PNG Export) */}
                  <VerifiedArchitectureMapCanvas architecture={deconstructed} />

                  {/* C4 Level 2 Visual Container Topology */}
                  <div className="p-4 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] space-y-3">
                    <div className="text-[10px] text-[#707070] uppercase font-bold">
                      C4 Level 2: Container Topology (Multi-Tier Execution Path)
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {hla.tiers.map((tier, idx) => (
                        <div key={tier.tierName} className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-2">
                          <div className="flex items-center justify-between pb-1 border-b border-[#22262E]">
                            <span className="text-[#EDEDED] font-bold text-[11px] truncate">
                              Tier {idx + 1}: {tier.role}
                            </span>
                            <span className="text-[9px] text-[#707070]">T{idx + 1}</span>
                          </div>
                          <div className="space-y-1">
                            {tier.components.map((comp, compIdx) => (
                              <div key={`${tier.tierName}-c4-${comp.name}-${compIdx}`} className="p-1.5 bg-[#0B0C0E] border border-[#22262E]/70 rounded-[2px]">
                                <div className="text-[#EDEDED] font-semibold text-[10.5px] truncate">{comp.name}</div>
                                <div className="text-[9px] text-[#707070] truncate">{comp.identifier}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] space-y-2">
                    <div className="text-[10px] text-[#707070] uppercase font-bold">C4 Level 1: System Context Mermaid</div>
                    <pre className="text-[10px] text-[#38BDF8] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {hla.c4ContextMermaid}
                    </pre>
                  </div>
                  <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] space-y-2">
                    <div className="text-[10px] text-[#707070] uppercase font-bold">C4 Level 2: Container Topology Mermaid</div>
                    <pre className="text-[10px] text-[#10B981] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {hla.c4ContainerMermaid}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* 4 Multi-Tier Component Inventory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hla.tiers.map((tier, idx) => (
                <div key={tier.tierName} className="p-4 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-3 font-mono text-[11px]">
                  <div className="flex items-center justify-between pb-2 border-b border-[#22262E]">
                    <div className="flex items-center gap-2">
                      {idx === 0 ? (
                        <Cpu className="h-4 w-4 text-[#3B82F6]" />
                      ) : idx === 1 ? (
                        <Network className="h-4 w-4 text-[#8B5CF6]" />
                      ) : idx === 2 ? (
                        <ShieldCheck className="h-4 w-4 text-[#10B981]" />
                      ) : (
                        <Database className="h-4 w-4 text-[#F59E0B]" />
                      )}
                      <span className="text-[#EDEDED] font-bold">{tier.tierName}</span>
                    </div>
                    <span className="text-[10px] text-[#707070]">{tier.role}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {tier.technologies.map((tech) => (
                      <span key={tech} className="px-1.5 py-0.5 bg-[#16191F] border border-[#22262E] text-[#A1A1A1] rounded-[2px]">
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="text-[9.5px] text-[#707070] uppercase font-bold">Discovered Components:</div>
                    {tier.components.map((c, cIdx) => (
                      <div key={`${tier.tierName}-${c.name}-${cIdx}`} className="p-2 bg-[#0B0C0E] border border-[#22262E]/70 rounded-[2px] space-y-0.5">
                        <div className="flex items-center justify-between text-[#EDEDED] font-semibold">
                          <span className="truncate">{c.name}</span>
                          <code className="text-[#38BDF8] text-[9.5px]">{c.identifier}</code>
                        </div>
                        <p className="text-[10.5px] text-[#A1A1A1] font-sans">{c.responsibility}</p>
                        {c.sourcePath && (
                          <div className="text-[9.5px] text-[#707070] font-mono truncate pt-0.5">
                            Source: {c.sourcePath}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
         * SUB-VIEW 2: LOW-LEVEL ARCHITECTURE (LLA)
         * ========================================================================= */}
        {activeTab === 'LLA' && (
          <div className="space-y-4 font-mono text-[11px]">
            {/* End-to-End Component Call Chain Table */}
            <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#22262E]">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#3B82F6]" />
                  <span className="text-[#EDEDED] font-bold text-[12px]">
                    Low-Level Component Call Chain Trace (UI ➔ Gateway ➔ Logic ➔ Database)
                  </span>
                </div>
                <span className="badge-tag px-1.5 py-0.2 bg-[#059669]/20 text-[#10B981] font-bold text-[9.5px]">
                  {lla.componentTraces.length} DISCOVERED CHAINS
                </span>
              </div>

              <div className="overflow-x-auto border border-[#22262E] rounded-[2px]">
                <table className="w-full border-collapse text-left text-[11px]">
                  <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5 w-24 border-r border-[#22262E]">Trace ID</th>
                      <th className="p-2.5 w-44 border-r border-[#22262E]">UI Surface Element</th>
                      <th className="p-2.5 w-52 border-r border-[#22262E]">API Gateway Route</th>
                      <th className="p-2.5 w-56 border-r border-[#22262E]">Controller Source</th>
                      <th className="p-2.5 border-r border-[#22262E]">Domain Invariant (VR)</th>
                      <th className="p-2.5 w-44">Target DB Table</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#22262E] bg-[#0B0C0E]">
                    {lla.componentTraces.map((tr) => (
                      <tr
                        key={tr.traceId}
                        onClick={() => setSelectedTrace(tr)}
                        className={`hover:bg-[#16191F] cursor-pointer transition-colors ${
                          selectedTrace?.traceId === tr.traceId ? 'bg-[#16191F]' : ''
                        }`}
                      >
                        <td className="p-2.5 font-bold text-[#3B82F6] border-r border-[#22262E]">{tr.traceId}</td>
                        <td className="p-2.5 border-r border-[#22262E]">
                          <div className="text-[#EDEDED] font-semibold">{tr.uiSurface.componentName}</div>
                          <div className="text-[9.5px] text-[#707070] truncate">{tr.uiSurface.selector}</div>
                        </td>
                        <td className="p-2.5 font-bold text-[#8B5CF6] border-r border-[#22262E]">
                          {tr.apiGateway.route}
                        </td>
                        <td className="p-2.5 border-r border-[#22262E] text-[#10B981]">
                          <div className="truncate">{tr.apiGateway.controllerFile}:{tr.apiGateway.lineNumber}</div>
                          <div className="text-[9.5px] text-[#707070]">{tr.apiGateway.handlerSymbol}()</div>
                        </td>
                        <td className="p-2.5 border-r border-[#22262E] text-[#EDEDED]">
                          <div className="text-[#D97706] font-semibold">{tr.domainLogic.ruleId}</div>
                          <div className="text-[9.5px] text-[#A1A1A1] truncate">{tr.domainLogic.constraintExpr}</div>
                        </td>
                        <td className="p-2.5 text-[#F59E0B] font-semibold">{tr.persistenceLayer.targetTable}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sequence Diagram & Security Invariants with Toggle */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Sequence Diagram */}
              <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#22262E]">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-[#3B82F6]" />
                    <span className="text-[#EDEDED] font-bold">Component Interaction Sequence</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[2px] text-[10px]">
                      <button
                        onClick={() => setLlaViewMode('VISUAL')}
                        className={`px-2 py-0.5 rounded-[2px] transition-colors cursor-pointer ${
                          llaViewMode === 'VISUAL' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#707070] hover:text-[#EDEDED]'
                        }`}
                      >
                        Visual Flow
                      </button>
                      <button
                        onClick={() => setLlaViewMode('MERMAID')}
                        className={`px-2 py-0.5 rounded-[2px] transition-colors cursor-pointer ${
                          llaViewMode === 'MERMAID' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#707070] hover:text-[#EDEDED]'
                        }`}
                      >
                        Mermaid Code
                      </button>
                    </div>
                    <button
                      onClick={() => handleCopy(lla.sequenceDiagramMermaid, 'seq')}
                      className="flex items-center gap-1 text-[10px] text-[#707070] hover:text-[#EDEDED] cursor-pointer"
                    >
                      {copiedKey === 'seq' ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                {llaViewMode === 'VISUAL' ? (
                  <VerifiedSequenceDiagramCanvas
                    systemName={hla.systemName}
                    selectedTrace={selectedTrace || lla.componentTraces[0]}
                    authProtocol={lla.securityTopology.authProtocol}
                  />
                ) : (
                  <pre className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] text-[10px] text-[#38BDF8] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {lla.sequenceDiagramMermaid}
                  </pre>
                )}
              </div>

              {/* Security & Concurrency Topology */}
              <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#22262E]">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-[#10B981]" />
                    <span className="text-[#EDEDED] font-bold">Security &amp; Concurrency Architecture</span>
                  </div>
                  <span className="text-[10px] text-[#707070]">ACID &amp; Ingress Defense</span>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] space-y-0.5">
                    <span className="text-[10px] text-[#707070] uppercase font-bold block">Auth Protocol:</span>
                    <span className="text-[#EDEDED] font-semibold">{lla.securityTopology.authProtocol}</span>
                  </div>
                  <div className="p-2.5 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] space-y-0.5">
                    <span className="text-[10px] text-[#707070] uppercase font-bold block">Token Lifecycle:</span>
                    <span className="text-[#A1A1A1] font-sans">{lla.securityTopology.tokenLifecycle}</span>
                  </div>
                  <div className="p-2.5 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] space-y-0.5">
                    <span className="text-[10px] text-[#707070] uppercase font-bold block">Concurrency Isolation:</span>
                    <span className="text-[#10B981] font-sans">{lla.securityTopology.concurrencyIsolation}</span>
                  </div>
                  <div className="p-2.5 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] space-y-0.5">
                    <span className="text-[10px] text-[#707070] uppercase font-bold block">Rate-Limiting Policy:</span>
                    <span className="text-[#38BDF8] font-sans">{lla.securityTopology.rateLimitingPolicy}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Storage Architecture & Schema Details */}
            <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#22262E]">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-[#F59E0B]" />
                  <span className="text-[#EDEDED] font-bold">
                    Storage Architecture &amp; Database Entity Relational Model ({lla.storageArchitecture.totalEntities} Entities)
                  </span>
                </div>
                <span className="text-[10px] text-[#707070]">B-Tree Indexing &amp; PK/FK Constraints</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {lla.storageArchitecture.entitySchemas.map((tbl, tblIdx) => (
                  <div key={`table-schema-${tbl.tableName}-${tblIdx}`} className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-[#22262E]">
                      <span className="text-[#EDEDED] font-bold text-[12px]">{tbl.tableName}</span>
                      <span className="text-[9.5px] text-[#F59E0B]">PK: {tbl.primaryKeys.join(', ') || 'id'}</span>
                    </div>
                    <div className="space-y-1">
                      {tbl.columns.map((c, colIdx) => (
                        <div key={`col-${tbl.tableName}-${c.name}-${colIdx}`} className="flex items-center justify-between text-[10.5px]">
                          <span className="text-[#A1A1A1]">{c.name}</span>
                          <span className="text-[#707070]">
                            {c.type} {c.isForeignKey ? '[FK]' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                    {tbl.indexes.length > 0 && (
                      <div className="pt-1 border-t border-[#22262E]/60 text-[9.5px] text-[#10B981] truncate">
                        Index: {tbl.indexes.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
         * SUB-VIEW 3: ARCHITECTURE BLUEPRINT (FORMAL DOCUMENT & MARKDOWN SPEC)
         * ========================================================================= */}
        {activeTab === 'BLUEPRINT' && (
          <div className="bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col overflow-hidden min-h-0">
            {/* Blueprint Mode Switcher Toolbar */}
            <div className="h-[40px] bg-[#16191F] border-b border-[#22262E] px-4 flex items-center justify-between text-[11px] font-mono shrink-0 select-none">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#3B82F6]" />
                <span className="font-bold text-[#EDEDED]">
                  ARCHITECTURE_BLUEPRINT_{hla.systemName.replace(/[^a-zA-Z0-9]/g, '_')}.md
                </span>
                <span className="badge-tag px-1.5 py-0.2 bg-[#059669]/20 text-[#10B981] font-bold text-[9.5px]">
                  EXECUTIVE READY
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[2px] text-[10px]">
                  <button
                    onClick={() => setBlueprintViewMode('FORMAL_DOC')}
                    className={`px-2.5 py-1 rounded-[2px] transition-colors cursor-pointer flex items-center gap-1 ${
                      blueprintViewMode === 'FORMAL_DOC'
                        ? 'bg-[#2563EB] text-white font-bold'
                        : 'text-[#707070] hover:text-[#EDEDED]'
                    }`}
                  >
                    <Eye className="h-3 w-3" />
                    <span>Formal Document View</span>
                  </button>
                  <button
                    onClick={() => setBlueprintViewMode('MARKDOWN_SPEC')}
                    className={`px-2.5 py-1 rounded-[2px] transition-colors cursor-pointer flex items-center gap-1 ${
                      blueprintViewMode === 'MARKDOWN_SPEC'
                        ? 'bg-[#2563EB] text-white font-bold'
                        : 'text-[#707070] hover:text-[#EDEDED]'
                    }`}
                  >
                    <Code2 className="h-3 w-3" />
                    <span>Raw Markdown Spec</span>
                  </button>
                </div>

                <div className="h-4 w-px bg-[#22262E] mx-1" />

                <button
                  onClick={handlePrintDocument}
                  className="px-2.5 py-1 bg-[#111317] border border-[#22262E] hover:border-[#3B82F6] text-[#EDEDED] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1"
                  title="Print or Save as PDF"
                >
                  <Printer className="h-3 w-3 text-[#A1A1A1]" />
                  <span className="hidden sm:inline">Print / PDF</span>
                </button>

                <button
                  onClick={() => handleCopy(blueprintMarkdown, 'bp')}
                  className="px-2.5 py-1 bg-[#22262E] hover:bg-[#2A2E39] text-[#EDEDED] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedKey === 'bp' ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3" />}
                  <span>Copy</span>
                </button>

                <button
                  onClick={handleDownloadBlueprint}
                  className="px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-[2px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  <span>Download .md</span>
                </button>
              </div>
            </div>

            {/* Document Render Body */}
            {blueprintViewMode === 'FORMAL_DOC' ? (
              <div className="p-8 max-w-4xl mx-auto w-full space-y-8 bg-[#0B0C0E] text-[#EDEDED] font-sans min-h-[700px] overflow-y-auto">
                {/* Executive Document Cover Header */}
                <div className="border-b border-[#22262E] pb-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-[#3B82F6] font-bold">
                      ISO/IEC/IEEE 42010:2011 &amp; IEEE STD 1016-2009 ARCHITECTURE BLUEPRINT
                    </span>
                    <span className="font-mono text-[10px] text-[#707070]">
                      DOC-ARCH-{(hla.systemName || 'SYS').toUpperCase()}-001
                    </span>
                  </div>

                  <h1 className="text-[26px] font-bold text-[#EDEDED] tracking-tight">
                    {hla.systemName} — Formal Architecture Specification (HLA &amp; LLA)
                  </h1>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-[11px]">
                    <div className="p-2.5 bg-[#111317] border border-[#22262E] rounded-[2px]">
                      <span className="text-[#707070] text-[9.5px] block uppercase font-bold">Ingress Target</span>
                      <span className="text-[#EDEDED] font-semibold truncate block mt-0.5">{hla.targetEnvironment}</span>
                    </div>
                    <div className="p-2.5 bg-[#111317] border border-[#22262E] rounded-[2px]">
                      <span className="text-[#707070] text-[9.5px] block uppercase font-bold">Architecture Style</span>
                      <span className="text-[#3B82F6] font-semibold truncate block mt-0.5">Multi-Tier SOA</span>
                    </div>
                    <div className="p-2.5 bg-[#111317] border border-[#22262E] rounded-[2px]">
                      <span className="text-[#707070] text-[9.5px] block uppercase font-bold">Persistence</span>
                      <span className="text-[#F59E0B] font-semibold truncate block mt-0.5">{hla.techStackSummary.databaseEngine}</span>
                    </div>
                    <div className="p-2.5 bg-[#111317] border border-[#22262E] rounded-[2px]">
                      <span className="text-[#707070] text-[9.5px] block uppercase font-bold">Status</span>
                      <span className="text-[#10B981] font-semibold block mt-0.5">NORMATIVE APPROVED</span>
                    </div>
                  </div>
                </div>

                {/* Section 1: Executive Architectural Summary */}
                <div className="space-y-3">
                  <h2 className="text-[16px] font-bold text-[#EDEDED] flex items-center gap-2 border-b border-[#22262E]/60 pb-2">
                    <span className="text-[#3B82F6] font-mono text-[14px]">1.0</span>
                    <span>Executive Architectural Summary &amp; Technology Stack</span>
                  </h2>
                  <p className="text-[13px] text-[#A1A1A1] leading-relaxed">
                    This formal Software Design Description (SDD) establishes normative system structures, component interfaces,
                    and persistence models governing <strong className="text-[#EDEDED]">{hla.systemName}</strong>. The architecture
                    enforces strict layer segregation across client ingress, gateway routing, invariant validation, and ACID storage.
                  </p>

                  <div className="border border-[#22262E] rounded-[2px] overflow-hidden font-mono text-[11.5px]">
                    <table className="w-full border-collapse text-left">
                      <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E]">
                        <tr>
                          <th className="p-2.5 border-r border-[#22262E] w-52">Architectural Layer</th>
                          <th className="p-2.5 border-r border-[#22262E] w-60">Verified Technology Stack</th>
                          <th className="p-2.5">Engineering Responsibility</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#22262E] bg-[#111317]">
                        <tr>
                          <td className="p-2.5 font-bold text-[#3B82F6] border-r border-[#22262E]">Client Presentation Tier</td>
                          <td className="p-2.5 border-r border-[#22262E]">{hla.techStackSummary.clientRuntime}</td>
                          <td className="p-2.5 text-[#A1A1A1]">DOM event capture, form pre-validation, token storage</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-[#8B5CF6] border-r border-[#22262E]">API Ingress Gateway</td>
                          <td className="p-2.5 border-r border-[#22262E]">{hla.techStackSummary.gatewayFramework}</td>
                          <td className="p-2.5 text-[#A1A1A1]">Route dispatch, bearer JWT authentication, schema DTO parsing</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-[#10B981] border-r border-[#22262E]">Domain Invariant Engine</td>
                          <td className="p-2.5 border-r border-[#22262E]">{hla.techStackSummary.serviceLanguage}</td>
                          <td className="p-2.5 text-[#A1A1A1]">ISO 29148 RFC-2119 business logic and constraint enforcement</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-[#F59E0B] border-r border-[#22262E]">Persistence Store</td>
                          <td className="p-2.5 border-r border-[#22262E]">{hla.techStackSummary.databaseEngine}</td>
                          <td className="p-2.5 text-[#A1A1A1]">ACID row-level concurrency locking and B-Tree indexed queries</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 2: End-to-End Component Call Chain */}
                <div className="space-y-3">
                  <h2 className="text-[16px] font-bold text-[#EDEDED] flex items-center gap-2 border-b border-[#22262E]/60 pb-2">
                    <span className="text-[#3B82F6] font-mono text-[14px]">2.0</span>
                    <span>Low-Level Component Call Chain Traceability Matrix</span>
                  </h2>

                  <div className="border border-[#22262E] rounded-[2px] overflow-x-auto font-mono text-[11px]">
                    <table className="w-full border-collapse text-left">
                      <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E]">
                        <tr>
                          <th className="p-2.5 border-r border-[#22262E] w-24">Trace ID</th>
                          <th className="p-2.5 border-r border-[#22262E] w-48">Client UI Selector</th>
                          <th className="p-2.5 border-r border-[#22262E] w-48">API Ingress Route</th>
                          <th className="p-2.5 border-r border-[#22262E]">Domain Rule</th>
                          <th className="p-2.5 w-40">Target DB Table</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#22262E] bg-[#111317]">
                        {lla.componentTraces.map((tr) => (
                          <tr key={tr.traceId}>
                            <td className="p-2.5 font-bold text-[#3B82F6] border-r border-[#22262E]">{tr.traceId}</td>
                            <td className="p-2.5 border-r border-[#22262E] text-[#EDEDED]">{tr.uiSurface.selector}</td>
                            <td className="p-2.5 font-bold text-[#8B5CF6] border-r border-[#22262E]">{tr.apiGateway.route}</td>
                            <td className="p-2.5 border-r border-[#22262E] text-[#A1A1A1]">{tr.domainLogic.ruleId}: {tr.domainLogic.constraintExpr}</td>
                            <td className="p-2.5 text-[#F59E0B] font-semibold">{tr.persistenceLayer.targetTable}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 3: Security & Concurrency Topology */}
                <div className="space-y-3">
                  <h2 className="text-[16px] font-bold text-[#EDEDED] flex items-center gap-2 border-b border-[#22262E]/60 pb-2">
                    <span className="text-[#3B82F6] font-mono text-[14px]">3.0</span>
                    <span>Security, Invariant &amp; Concurrency Architecture</span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                    <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[2px] space-y-1">
                      <span className="text-[10px] text-[#707070] uppercase font-bold block">Authentication &amp; Ingress Scheme:</span>
                      <span className="text-[#EDEDED] font-semibold">{lla.securityTopology.authProtocol}</span>
                    </div>
                    <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[2px] space-y-1">
                      <span className="text-[10px] text-[#707070] uppercase font-bold block">Token Retention &amp; Expiry:</span>
                      <span className="text-[#A1A1A1] font-sans">{lla.securityTopology.tokenLifecycle}</span>
                    </div>
                    <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[2px] space-y-1">
                      <span className="text-[10px] text-[#707070] uppercase font-bold block">ACID Concurrency Locking:</span>
                      <span className="text-[#10B981] font-sans">{lla.securityTopology.concurrencyIsolation}</span>
                    </div>
                    <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[2px] space-y-1">
                      <span className="text-[10px] text-[#707070] uppercase font-bold block">Rate-Limiting Protection:</span>
                      <span className="text-[#38BDF8] font-sans">{lla.securityTopology.rateLimitingPolicy}</span>
                    </div>
                  </div>
                </div>

                {/* Section 4: Data Schema & Storage Architecture */}
                <div className="space-y-3 pb-8">
                  <h2 className="text-[16px] font-bold text-[#EDEDED] flex items-center gap-2 border-b border-[#22262E]/60 pb-2">
                    <span className="text-[#3B82F6] font-mono text-[14px]">4.0</span>
                    <span>Data Persistence &amp; Storage Architecture ({lla.storageArchitecture.totalEntities} Relational Entities)</span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                    {lla.storageArchitecture.entitySchemas.map((tbl, tblIdx) => (
                      <div key={`doc-table-${tbl.tableName}-${tblIdx}`} className="p-3 bg-[#111317] border border-[#22262E] rounded-[2px] space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-[#22262E]">
                          <span className="text-[#EDEDED] font-bold text-[12px]">{tbl.tableName}</span>
                          <span className="text-[#F59E0B] text-[10px]">PK: {tbl.primaryKeys.join(', ')}</span>
                        </div>
                        <div className="space-y-1 text-[10px]">
                          {tbl.columns.map((c, colIdx) => (
                            <div key={`doc-col-${tbl.tableName}-${c.name}-${colIdx}`} className="flex items-center justify-between">
                              <span className="text-[#A1A1A1]">{c.name}</span>
                              <span className="text-[#707070]">{c.type} {c.isForeignKey ? '[FK]' : ''}</span>
                            </div>
                          ))}
                        </div>
                        {tbl.indexes.length > 0 && (
                          <div className="text-[9.5px] text-[#10B981] pt-1 border-t border-[#22262E]/60 truncate">
                            Index: {tbl.indexes.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[700px] min-h-[700px]">
                <MonacoEditor
                  height="100%"
                  language="markdown"
                  theme="vs-dark"
                  value={blueprintMarkdown}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
