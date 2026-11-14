'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Layers,
  Download,
  Copy,
  Check,
  ShieldAlert,
  ArrowRight,
  Database,
  Cpu,
  User,
} from 'lucide-react';
import {
  dfdReverseService,
  type ReverseDfdResult,
  type DfdLevel,
  type DfdNode,
} from '@/services/dfdReverseService';
import { VerifiedDfdDiagramCanvas } from './VerifiedDfdDiagramCanvas';
import type {
  DiscoveredApiEndpoint,
  DatabaseErdTable,
  ValidationRuleContract,
  BrdMatrixRow,
} from '@/types/sdlc';
import { useStudioLocale } from '@/lib/i18n';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center font-mono text-[11px] text-[#707070] bg-[#0E1015]">
      Loading Monaco DFD Data Specification...
    </div>
  ),
});

interface ReverseDfdWorkbenchProps {
  appName?: string;
  targetUrl: string;
  apiEndpoints: DiscoveredApiEndpoint[];
  databaseTables: DatabaseErdTable[];
  validationRules: ValidationRuleContract[];
  businessRules: BrdMatrixRow[];
  initialResult?: ReverseDfdResult;
  onAppendLog?: (msg: string) => void;
}

export function ReverseDfdWorkbench({
  appName = 'Active Application',
  targetUrl,
  apiEndpoints,
  databaseTables,
  validationRules,
  businessRules,
  initialResult,
  onAppendLog,
}: ReverseDfdWorkbenchProps) {
  const { locale } = useStudioLocale();
  const isId = locale === 'id';
  const [selectedLevel, setSelectedLevel] = useState<DfdLevel>('LEVEL_1');
  const [activeTab, setActiveTab] = useState<'VISUAL_CANVAS' | 'FLOW_MATRIX' | 'DOCUMENTATION'>('VISUAL_CANVAS');
  const [filterPiiOnly, setFilterPiiOnly] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<DfdNode | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Compute DFD Result (preferring pre-compiled initialResult if provided)
  const dfdResult: ReverseDfdResult = useMemo(() => {
    if (initialResult) return initialResult;
    return dfdReverseService.generateReverseDfd({
      appName,
      targetUrl,
      apiEndpoints,
      databaseTables,
      validationRules,
      businessRules,
    });
  }, [appName, targetUrl, apiEndpoints, databaseTables, validationRules, businessRules]);

  const activeLevelData = useMemo(() => {
    if (selectedLevel === 'LEVEL_0') return dfdResult.level0;
    if (selectedLevel === 'LEVEL_1') return dfdResult.level1;
    return dfdResult.level2;
  }, [dfdResult, selectedLevel]);

  const displayedFlows = useMemo(() => {
    if (!filterPiiOnly) return activeLevelData.flows;
    return activeLevelData.flows.filter((f) => f.piiClassification === 'PII_CRITICAL' || f.piiClassification === 'PII_STANDARD');
  }, [activeLevelData.flows, filterPiiOnly]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const dfdMarkdown = useMemo(() => {
    return dfdReverseService.generateDfdDocumentation(appName, dfdResult);
  }, [appName, dfdResult]);

  const handleDownloadMarkdown = () => {
    const slug = appName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const blob = new Blob([dfdMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IEEE1016_DFD_${slug}.md`;
    link.click();
    URL.revokeObjectURL(url);
    if (onAppendLog) {
      onAppendLog(`[DFD] Exported IEEE 1016 Data Flow Diagram documentation for ${appName}.`);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0B0C0E] border border-[#22262E] rounded-[4px] overflow-hidden min-h-0">
      {/* Top Header Toolbar */}
      <div className="h-[40px] min-h-[40px] bg-[#16191F] border-b border-[#22262E] px-4 flex items-center justify-between text-[11px] font-mono shrink-0 select-none">
        <div className="flex items-center gap-2.5 truncate">
          <Layers className="h-4 w-4 text-[#3B82F6] shrink-0" />
          <span className="text-[#EDEDED] font-bold uppercase tracking-wide truncate">
            {appName} · Reverse DFD (IEEE 1016 / Gane-Sarson)
          </span>
          <span className="badge-tag px-1.5 py-0.2 bg-[#2563EB]/20 text-[#3B82F6] font-bold text-[9.5px]">
            {selectedLevel}
          </span>
          <span className="badge-tag px-1.5 py-0.2 bg-[#EF4444]/20 text-[#EF4444] font-bold text-[9.5px]">
            {dfdResult.piiFlowsCount} {isId ? 'Aliran PII Diaudit' : 'PII Flows Audited'}
          </span>
        </div>

        {/* Level & Sub-View Switchers */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Level Switcher */}
          <div className="flex items-center bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[3px] text-[10.5px]">
            {(['LEVEL_0', 'LEVEL_1', 'LEVEL_2'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setSelectedLevel(lvl);
                  setSelectedNode(null);
                }}
                className={`px-2.5 py-1 rounded-[2px] transition-colors cursor-pointer ${
                  selectedLevel === lvl
                    ? 'bg-[#2563EB] text-white font-bold'
                    : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                }`}
              >
                {lvl === 'LEVEL_0' ? (isId ? 'Level 0 (Konteks)' : 'Level 0 (Context)') : lvl === 'LEVEL_1' ? (isId ? 'Level 1 (Proses)' : 'Level 1 (Processes)') : (isId ? 'Level 2 (Penyimpanan)' : 'Level 2 (Storage)')}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-[#22262E] mx-1" />

          {/* Mode Switcher */}
          <div className="flex items-center bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[3px] text-[10.5px]">
            <button
              onClick={() => setActiveTab('VISUAL_CANVAS')}
              className={`px-2.5 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeTab === 'VISUAL_CANVAS' ? 'bg-[#16191F] text-[#EDEDED] font-bold border border-[#3B82F6]' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              {isId ? 'Kanvas Aliran Visual' : 'Visual Flow Canvas'}
            </button>
            <button
              onClick={() => setActiveTab('FLOW_MATRIX')}
              className={`px-2.5 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeTab === 'FLOW_MATRIX' ? 'bg-[#16191F] text-[#EDEDED] font-bold border border-[#3B82F6]' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              {isId ? 'Matriks Aliran' : 'Flow Matrix'} ({displayedFlows.length})
            </button>
            <button
              onClick={() => setActiveTab('DOCUMENTATION')}
              className={`px-2.5 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeTab === 'DOCUMENTATION' ? 'bg-[#16191F] text-[#EDEDED] font-bold border border-[#3B82F6]' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              {isId ? 'Dokumen IEEE 1016 (.md)' : 'IEEE 1016 Doc (.md)'}
            </button>
          </div>

          <div className="h-4 w-px bg-[#22262E] mx-1" />

          <button
            onClick={() => setFilterPiiOnly(!filterPiiOnly)}
            className={`px-2.5 py-1 rounded-[2px] text-[10.5px] font-bold transition-colors cursor-pointer border ${
              filterPiiOnly
                ? 'bg-[#DC2626]/20 text-[#EF4444] border-[#DC2626]'
                : 'bg-[#111317] text-[#A1A1A1] border-[#22262E] hover:text-[#EDEDED]'
            }`}
          >
            {filterPiiOnly ? (isId ? '✓ Khusus Sensitif PII' : '✓ PII Sensitive Only') : (isId ? 'Filter PII' : 'Filter PII')}
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="px-2.5 py-1 bg-[#22262E] hover:bg-[#2A2E39] text-[#EDEDED] font-mono text-[11px] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>{isId ? 'Ekspor DFD' : 'Export DFD'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* Top Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0 font-mono text-[11px]">
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Current Level</span>
            <span className="text-[16px] font-bold text-[#3B82F6]">{selectedLevel}</span>
            <span className="text-[9.5px] text-[#A1A1A1]">Gane-Sarson View</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Processes</span>
            <span className="text-[18px] font-bold text-[#EDEDED] tabular-nums">
              {activeLevelData.nodes.filter((n) => n.type === 'PROCESS').length}
            </span>
            <span className="text-[9.5px] text-[#10B981]">Active Transformers</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Data Stores</span>
            <span className="text-[18px] font-bold text-[#8B5CF6] tabular-nums">
              {activeLevelData.nodes.filter((n) => n.type === 'DATA_STORE').length}
            </span>
            <span className="text-[9.5px] text-[#A1A1A1]">Persistent Storage</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">External Entities</span>
            <span className="text-[18px] font-bold text-[#F59E0B] tabular-nums">
              {activeLevelData.nodes.filter((n) => n.type === 'EXTERNAL_ENTITY').length}
            </span>
            <span className="text-[9.5px] text-[#A1A1A1]">Ingress / Egress</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Data Flows</span>
            <span className="text-[18px] font-bold text-[#38BDF8] tabular-nums">
              {displayedFlows.length}
            </span>
            <span className="text-[9.5px] text-[#A1A1A1]">Traversals</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">PII Security</span>
            <span className="text-[18px] font-bold text-[#EF4444] tabular-nums">
              {dfdResult.piiFlowsCount}
            </span>
            <span className="text-[9.5px] text-[#EF4444]">UU PDP Sensitive</span>
          </div>
        </div>

        {/* =========================================================================
         * SUB-VIEW 1: VISUAL FLOW CANVAS (Gane-Sarson Diagram Representation)
         * ========================================================================= */}
        {activeTab === 'VISUAL_CANVAS' && (
          <div className="space-y-4 font-mono text-[11px]">
            {/* Interactive Vector Gane-Sarson DFD Canvas */}
            <VerifiedDfdDiagramCanvas
              appName={appName}
              levelTitle={activeLevelData.title}
              nodes={activeLevelData.nodes}
              flows={displayedFlows}
              selectedNodeId={selectedNode?.id}
              onSelectNode={(n) => setSelectedNode(n)}
            />

            {/* Visual Flow Topology Container */}
            <div className="p-5 bg-[#0E1015] border border-[#22262E] rounded-[3px] space-y-6">
              {/* Gane-Sarson Nodes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeLevelData.nodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const connectedFlows = activeLevelData.flows.filter(
                    (f) => f.fromNodeId === node.id || f.toNodeId === node.id
                  );

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3 rounded-[3px] transition-all cursor-pointer border ${
                        node.type === 'EXTERNAL_ENTITY'
                          ? 'bg-[#111317] border-double border-4 border-[#F59E0B]' // Double line rectangle for Gane-Sarson Entity
                          : node.type === 'PROCESS'
                          ? 'bg-[#16191F] border border-[#3B82F6] rounded-[8px]' // Rounded box for Process
                          : 'bg-[#111317] border-y-2 border-x-0 border-[#8B5CF6]' // Open-ended horizontal bar for Data Store
                      } ${isSelected ? 'ring-2 ring-white scale-102' : 'hover:border-[#EDEDED]'}`}
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#22262E]">
                        <div className="flex items-center gap-1.5">
                          {node.type === 'EXTERNAL_ENTITY' && <User className="h-3.5 w-3.5 text-[#F59E0B]" />}
                          {node.type === 'PROCESS' && <Cpu className="h-3.5 w-3.5 text-[#3B82F6]" />}
                          {node.type === 'DATA_STORE' && <Database className="h-3.5 w-3.5 text-[#8B5CF6]" />}
                          <span className="text-[#38BDF8] font-bold text-[10.5px]">{node.id}</span>
                        </div>
                        <span
                          className={`badge-tag px-1 py-0.2 rounded text-[8.5px] font-bold ${
                            node.type === 'EXTERNAL_ENTITY'
                              ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                              : node.type === 'PROCESS'
                              ? 'bg-[#3B82F6]/20 text-[#3B82F6]'
                              : 'bg-[#8B5CF6]/20 text-[#8B5CF6]'
                          }`}
                        >
                          {node.type.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="pt-2 space-y-1">
                        <div className="text-[#EDEDED] font-bold text-[11px]">{node.name}</div>
                        <div className="text-[10px] text-[#A1A1A1] font-sans line-clamp-2">
                          {node.description}
                        </div>
                        {node.systemOwner && (
                          <div className="text-[9px] text-[#707070] pt-1">
                            Owner: <span className="text-[#EDEDED]">{node.systemOwner}</span>
                          </div>
                        )}
                        {node.piiFlag && (
                          <div className="flex items-center gap-1 pt-1 text-[9px] text-[#EF4444] font-bold">
                            <ShieldAlert className="h-3 w-3" />
                            <span>Stores Sensitive PII (UU PDP Pasal 35)</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 text-[9.5px] text-[#707070] flex items-center justify-between border-t border-[#22262E] mt-2">
                        <span>Connected Flows:</span>
                        <span className="text-[#38BDF8] font-bold">{connectedFlows.length}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Data Flows Sequence Connector View */}
              <div className="space-y-2 pt-2 border-t border-[#22262E]">
                <div className="text-[11px] font-bold text-[#EDEDED] flex items-center gap-2">
                  <span>Data Flows &amp; Egress Traversals ({displayedFlows.length})</span>
                  <span className="text-[9.5px] text-[#707070]">Directional Data Boundaries</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {displayedFlows.map((flow) => (
                    <div
                      key={flow.id}
                      className="p-2.5 bg-[#111317] border border-[#22262E] hover:border-[#3B82F6] rounded-[2px] flex items-center justify-between text-[10.5px] transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#38BDF8]">{flow.id}:</span>
                          <span className="text-[#EDEDED] font-semibold">{flow.dataLabel}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[#707070]">
                          <span className="text-[#A1A1A1]">{flow.fromNodeId}</span>
                          <ArrowRight className="h-3 w-3 text-[#3B82F6]" />
                          <span className="text-[#A1A1A1]">{flow.toNodeId}</span>
                          <span className="text-[#707070] ml-2">({flow.protocol})</span>
                        </div>
                        <div className="text-[9px] text-[#38BDF8] font-mono">
                          Attrs: {flow.dataAttributes.join(', ')}
                        </div>
                      </div>

                      <span
                        className={`badge-tag px-1.5 py-0.2 rounded font-bold text-[9px] shrink-0 ml-2 ${
                          flow.piiClassification === 'PII_CRITICAL'
                            ? 'bg-[#DC2626]/20 text-[#EF4444] border border-[#DC2626]/50'
                            : flow.piiClassification === 'PII_STANDARD'
                            ? 'bg-[#F97316]/20 text-[#F97316]'
                            : 'bg-[#059669]/20 text-[#10B981]'
                        }`}
                      >
                        {flow.piiClassification.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Inspector Card if node selected */}
            {selectedNode && (
              <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-[#22262E]">
                  <span className="font-bold text-[#EDEDED] text-[12px]">
                    [{selectedNode.id}] {selectedNode.name}
                  </span>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-[10px] text-[#707070] hover:text-[#EDEDED] cursor-pointer"
                  >
                    Close Inspector
                  </button>
                </div>
                <p className="text-[11px] text-[#A1A1A1] font-sans">{selectedNode.description}</p>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
         * SUB-VIEW 2: FLOW MATRIX
         * ========================================================================= */}
        {activeTab === 'FLOW_MATRIX' && (
          <div className="space-y-4 font-mono text-[11px]">
            <div className="border border-[#22262E] rounded-[3px] overflow-hidden">
              <table className="w-full border-collapse text-left text-[11px]">
                <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5 w-24 border-r border-[#22262E]">Flow ID</th>
                    <th className="p-2.5 w-52 border-r border-[#22262E]">Origin $\to$ Destination</th>
                    <th className="p-2.5 w-64 border-r border-[#22262E]">Data Label</th>
                    <th className="p-2.5 border-r border-[#22262E]">Data Attributes</th>
                    <th className="p-2.5 w-32 border-r border-[#22262E]">Protocol</th>
                    <th className="p-2.5 w-32">PII Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22262E] bg-[#0B0C0E]">
                  {displayedFlows.map((f) => (
                    <tr key={f.id} className="hover:bg-[#16191F] transition-colors">
                      <td className="p-2.5 font-bold text-[#3B82F6] border-r border-[#22262E]">{f.id}</td>
                      <td className="p-2.5 border-r border-[#22262E] font-semibold text-[#EDEDED]">
                        {f.fromNodeId} $\to$ {f.toNodeId}
                      </td>
                      <td className="p-2.5 border-r border-[#22262E] font-bold text-[#EDEDED]">{f.dataLabel}</td>
                      <td className="p-2.5 border-r border-[#22262E] text-[#38BDF8] text-[10px] font-mono">
                        {f.dataAttributes.join(', ')}
                      </td>
                      <td className="p-2.5 border-r border-[#22262E] text-[#A1A1A1] text-[10px]">{f.protocol}</td>
                      <td className="p-2.5">
                        <span
                          className={`badge-tag px-1.5 py-0.2 rounded font-bold text-[9px] ${
                            f.piiClassification === 'PII_CRITICAL'
                              ? 'bg-[#DC2626]/20 text-[#EF4444]'
                              : f.piiClassification === 'PII_STANDARD'
                              ? 'bg-[#F97316]/20 text-[#F97316]'
                              : 'bg-[#059669]/20 text-[#10B981]'
                          }`}
                        >
                          {f.piiClassification.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
         * SUB-VIEW 3: DOCUMENTATION EXPORT
         * ========================================================================= */}
        {activeTab === 'DOCUMENTATION' && (
          <div className="bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col overflow-hidden min-h-0">
            <div className="h-[38px] bg-[#16191F] border-b border-[#22262E] px-4 flex items-center justify-between text-[11px] font-mono shrink-0 select-none">
              <span className="font-bold text-[#EDEDED]">
                IEEE1016_DFD_{(appName || 'APP').replace(/[^a-zA-Z0-9]/g, '_')}.md
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(dfdMarkdown, 'doc')}
                  className="px-2.5 py-1 bg-[#22262E] hover:bg-[#2A2E39] text-[#EDEDED] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedKey === 'doc' ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3" />}
                  <span>Copy Markdown</span>
                </button>
                <button
                  onClick={handleDownloadMarkdown}
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
                value={dfdMarkdown}
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
    </div>
  );
}
