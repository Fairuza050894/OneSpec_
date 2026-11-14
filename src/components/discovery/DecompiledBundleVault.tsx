'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  FileCode,
  ShieldAlert,
  Download,
  Copy,
  Check,
  Eye,
  EyeOff,
  Folder,
  Key,
} from 'lucide-react';
import {
  deepBundleUnpackerService,
  type DeepUnpackResult,
  type ReconstructedSourceFile,
} from '@/services/deepBundleUnpackerService';
import type { DiscoveredApiEndpoint } from '@/types/sdlc';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center font-mono text-[11px] text-[#707070] bg-[#0E1015]">
      Loading Monaco Decompiled Source Viewer...
    </div>
  ),
});

interface DecompiledBundleVaultProps {
  appName?: string;
  targetUrl: string;
  discoveredJsChunks?: string[];
  extractedApis?: DiscoveredApiEndpoint[];
  initialResult?: DeepUnpackResult;
  onAppendLog?: (msg: string) => void;
}

export function DecompiledBundleVault({
  appName = 'Active Application',
  targetUrl,
  discoveredJsChunks = [],
  extractedApis = [],
  initialResult,
  onAppendLog,
}: DecompiledBundleVaultProps) {
  const [activeSubTab, setActiveSubTab] = useState<'SOURCE_TREE' | 'LEAKED_SECRETS' | 'SHADOW_ENDPOINTS' | 'REPORT'>('SOURCE_TREE');
  const [selectedFile, setSelectedFile] = useState<ReconstructedSourceFile | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Compute Unpacked Result (preferring pre-compiled initialResult if provided)
  const unpackResult: DeepUnpackResult = useMemo(() => {
    if (initialResult) return initialResult;
    return deepBundleUnpackerService.decompileAndUnpackBundle({
      appName,
      targetUrl,
      discoveredJsChunks,
      extractedApis,
    });
  }, [initialResult, appName, targetUrl, discoveredJsChunks, extractedApis]);

  const activeFile = selectedFile || unpackResult.reconstructedFiles[0] || null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleRevealSecret = (id: string) => {
    setRevealedSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDownloadReport = () => {
    const slug = appName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const blob = new Blob([unpackResult.reportMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DECOMPILED_BUNDLE_AUDIT_${slug}.md`;
    link.click();
    URL.revokeObjectURL(url);
    if (onAppendLog) {
      onAppendLog(`[BUNDLE UNPACKER] Exported decompiled bundle & leaked secret audit report for ${appName}.`);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0B0C0E] border border-[#22262E] rounded-[4px] overflow-hidden min-h-0">
      {/* Top Header Toolbar */}
      <div className="h-[40px] min-h-[40px] bg-[#16191F] border-b border-[#22262E] px-4 flex items-center justify-between text-[11px] font-mono shrink-0 select-none">
        <div className="flex items-center gap-2.5 truncate">
          <FileCode className="h-4 w-4 text-[#38BDF8] shrink-0" />
          <span className="text-[#EDEDED] font-bold uppercase tracking-wide truncate">
            {appName} · Decompiled Bundle &amp; Leaked Secret Vault
          </span>
          <span
            className={`badge-tag px-1.5 py-0.2 rounded font-bold text-[9px] ${
              unpackResult.highestSeverity === 'CRITICAL'
                ? 'bg-[#DC2626]/20 text-[#EF4444]'
                : unpackResult.highestSeverity === 'HIGH'
                ? 'bg-[#F97316]/20 text-[#F97316]'
                : 'bg-[#059669]/20 text-[#10B981]'
            }`}
          >
            THREAT: {unpackResult.highestSeverity}
          </span>
          <span className="badge-tag px-1.5 py-0.2 bg-[#2563EB]/20 text-[#3B82F6] font-bold text-[9.5px]">
            {unpackResult.reconstructedFiles.length} Source Files Recovered
          </span>
        </div>

        {/* Sub-View Switchers */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[3px] text-[10.5px]">
            <button
              onClick={() => setActiveSubTab('SOURCE_TREE')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeSubTab === 'SOURCE_TREE'
                  ? 'bg-[#2563EB] text-white font-bold'
                  : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              Source Tree ({unpackResult.reconstructedFiles.length})
            </button>
            <button
              onClick={() => setActiveSubTab('LEAKED_SECRETS')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeSubTab === 'LEAKED_SECRETS'
                  ? 'bg-[#2563EB] text-white font-bold'
                  : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              Leaked Secrets ({unpackResult.leakedSecrets.length})
            </button>
            <button
              onClick={() => setActiveSubTab('SHADOW_ENDPOINTS')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeSubTab === 'SHADOW_ENDPOINTS'
                  ? 'bg-[#2563EB] text-white font-bold'
                  : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              Shadow Routes ({unpackResult.shadowEndpoints.length})
            </button>
            <button
              onClick={() => setActiveSubTab('REPORT')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeSubTab === 'REPORT' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              Audit Report (.md)
            </button>
          </div>

          <div className="h-4 w-px bg-[#22262E] mx-1" />

          <button
            onClick={handleDownloadReport}
            className="px-2.5 py-1 bg-[#22262E] hover:bg-[#2A2E39] text-[#EDEDED] font-mono text-[11px] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* Top Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0 font-mono text-[11px]">
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Scanned Chunks</span>
            <span className="text-[18px] font-bold text-[#EDEDED] tabular-nums">
              {unpackResult.totalChunksScanned}
            </span>
            <span className="text-[9.5px] text-[#A1A1A1]">Client Bundles</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Unpacked Files</span>
            <span className="text-[18px] font-bold text-[#3B82F6] tabular-nums">
              {unpackResult.reconstructedFiles.length}
            </span>
            <span className="text-[9.5px] text-[#10B981]">Virtual Source Tree</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Leaked Secrets</span>
            <span className="text-[18px] font-bold text-[#EF4444] tabular-nums">
              {unpackResult.leakedSecrets.length}
            </span>
            <span className="text-[9.5px] text-[#EF4444]">High-Entropy Tokens</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Shadow Routes</span>
            <span className="text-[18px] font-bold text-[#F97316] tabular-nums">
              {unpackResult.shadowEndpoints.length}
            </span>
            <span className="text-[9.5px] text-[#F97316]">Internal / Admin APIs</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Source Maps</span>
            <span className="text-[16px] font-bold text-[#10B981]">RECOVERED</span>
            <span className="text-[9.5px] text-[#A1A1A1]">AST Reconstructed</span>
          </div>
        </div>

        {/* =========================================================================
         * SUB-VIEW 1: RECONSTRUCTED SOURCE TREE
         * ========================================================================= */}
        {activeSubTab === 'SOURCE_TREE' && (
          <div className="grid grid-cols-12 gap-3 h-[600px] min-h-[600px] font-mono text-[11px]">
            {/* File List Tree (col-span-4) */}
            <div className="col-span-12 md:col-span-4 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col overflow-hidden">
              <div className="p-2.5 bg-[#16191F] border-b border-[#22262E] flex items-center justify-between text-[#EDEDED] font-bold text-[10.5px]">
                <div className="flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5 text-[#3B82F6]" />
                  <span>Virtual Project Tree</span>
                </div>
                <span className="text-[#707070] text-[10px]">{unpackResult.reconstructedFiles.length} Files</span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {unpackResult.reconstructedFiles.map((file) => {
                  const isSelected = activeFile?.filePath === file.filePath;
                  return (
                    <button
                      key={file.filePath}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full p-2 rounded-[2px] text-left transition-colors cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#16191F] text-[#38BDF8] border-l-2 border-l-[#2563EB] font-bold'
                          : 'text-[#A1A1A1] hover:text-[#EDEDED] hover:bg-[#16191F]/50 border-l-2 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FileCode className="h-3.5 w-3.5 shrink-0 text-[#707070]" />
                        <span className="truncate">{file.filePath}</span>
                      </div>
                      <span className="text-[9.5px] text-[#707070] tabular-nums shrink-0">
                        {(file.sizeBytes / 1024).toFixed(1)} KB
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Monaco Viewer for Active Reconstructed File (col-span-8) */}
            <div className="col-span-12 md:col-span-8 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col overflow-hidden">
              <div className="h-[36px] bg-[#16191F] border-b border-[#22262E] px-4 flex items-center justify-between text-[11px] font-mono shrink-0 select-none">
                <span className="text-[#38BDF8] font-bold">{activeFile?.filePath}</span>
                <button
                  onClick={() => activeFile && handleCopy(activeFile.content, 'code')}
                  className="px-2 py-0.5 bg-[#0B0C0E] border border-[#22262E] hover:border-[#3B82F6] text-[#EDEDED] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                >
                  {copiedKey === 'code' ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3" />}
                  <span>Copy Source</span>
                </button>
              </div>

              <div className="flex-1 min-h-0">
                <MonacoEditor
                  height="100%"
                  language={activeFile?.language || 'typescript'}
                  theme="vs-dark"
                  value={activeFile?.content || '// No source file selected'}
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
          </div>
        )}

        {/* =========================================================================
         * SUB-VIEW 2: LEAKED SECRETS VAULT
         * ========================================================================= */}
        {activeSubTab === 'LEAKED_SECRETS' && (
          <div className="space-y-4 font-mono text-[11px]">
            <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#22262E]">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-[#EF4444]" />
                  <span className="text-[#EDEDED] font-bold text-[12px]">
                    Shannon Entropy Leaked Secret &amp; Credential Hunter
                  </span>
                </div>
                <span className="badge-tag px-2 py-0.5 bg-[#DC2626]/20 text-[#EF4444] font-bold text-[10px]">
                  {unpackResult.leakedSecrets.length} TOKENS DETECTED
                </span>
              </div>
              <p className="text-[11px] text-[#A1A1A1] font-sans">
                Algorithmic scanning using Shannon Entropy ($H \ge 4.3$ bits/char) identifies high-randomness cryptographic secrets, cloud credentials, and sensitive private endpoints left in public client chunks.
              </p>
            </div>

            <div className="border border-[#22262E] rounded-[3px] overflow-hidden">
              <table className="w-full border-collapse text-left text-[11px]">
                <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5 w-24 border-r border-[#22262E]">Secret ID</th>
                    <th className="p-2.5 w-44 border-r border-[#22262E]">Token Classification</th>
                    <th className="p-2.5 w-28 border-r border-[#22262E]">Severity</th>
                    <th className="p-2.5 w-32 border-r border-[#22262E]">Entropy (H)</th>
                    <th className="p-2.5 w-72 border-r border-[#22262E]">Detected Secret Value</th>
                    <th className="p-2.5">Remediation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22262E] bg-[#0B0C0E]">
                  {unpackResult.leakedSecrets.map((sec) => {
                    const isRevealed = !!revealedSecrets[sec.id];
                    return (
                      <tr key={sec.id} className="hover:bg-[#16191F] transition-colors">
                        <td className="p-2.5 font-bold text-[#3B82F6] border-r border-[#22262E]">{sec.id}</td>
                        <td className="p-2.5 border-r border-[#22262E]">
                          <div className="text-[#EDEDED] font-bold">{sec.type.replace(/_/g, ' ')}</div>
                          <div className="text-[9.5px] text-[#707070] truncate max-w-[180px]">{sec.sourceChunkUrl}</div>
                        </td>
                        <td className="p-2.5 border-r border-[#22262E]">
                          <span
                            className={`badge-tag px-1.5 py-0.2 rounded font-bold text-[9px] ${
                              sec.severity === 'CRITICAL'
                                ? 'bg-[#DC2626]/20 text-[#EF4444]'
                                : sec.severity === 'HIGH'
                                ? 'bg-[#F97316]/20 text-[#F97316]'
                                : 'bg-[#D97706]/20 text-[#F59E0B]'
                            }`}
                          >
                            {sec.severity}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-[10.5px] text-[#38BDF8] border-r border-[#22262E] tabular-nums font-bold">
                          {sec.entropyScore} bits
                        </td>
                        <td className="p-2.5 border-r border-[#22262E]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] text-[#EF4444] truncate max-w-[200px]">
                              {isRevealed ? sec.rawSnippet : sec.maskedValue}
                            </span>
                            <button
                              onClick={() => toggleRevealSecret(sec.id)}
                              className="text-[#707070] hover:text-[#EDEDED] p-1 cursor-pointer"
                              title={isRevealed ? 'Mask Token' : 'Reveal Raw Token'}
                            >
                              {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </button>
                          </div>
                        </td>
                        <td className="p-2.5 text-[#A1A1A1] text-[10.5px] font-sans">
                          {sec.remediationAdvice}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
         * SUB-VIEW 3: SHADOW ENDPOINTS
         * ========================================================================= */}
        {activeSubTab === 'SHADOW_ENDPOINTS' && (
          <div className="space-y-4 font-mono text-[11px]">
            <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#22262E]">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-[#F97316]" />
                  <span className="text-[#EDEDED] font-bold text-[12px]">
                    Shadow Internal Endpoints &amp; Admin Interfaces
                  </span>
                </div>
                <span className="badge-tag px-2 py-0.5 bg-[#F97316]/20 text-[#F97316] font-bold text-[10px]">
                  {unpackResult.shadowEndpoints.length} UNDOCUMENTED ROUTES
                </span>
              </div>
              <p className="text-[11px] text-[#A1A1A1] font-sans">
                Endpoints discovered statically embedded in client code that are not surfaced on visible UI buttons or forms. These represent potential shadow APIs, privileged management interfaces, or debug routes.
              </p>
            </div>

            <div className="border border-[#22262E] rounded-[3px] overflow-hidden">
              <table className="w-full border-collapse text-left text-[11px]">
                <thead className="bg-[#16191F] text-[#707070] border-b border-[#22262E] uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5 w-28 border-r border-[#22262E]">Endpoint ID</th>
                    <th className="p-2.5 w-60 border-r border-[#22262E]">Target Path</th>
                    <th className="p-2.5 w-24 border-r border-[#22262E]">Method</th>
                    <th className="p-2.5 w-32 border-r border-[#22262E]">Type</th>
                    <th className="p-2.5 w-28 border-r border-[#22262E]">Severity</th>
                    <th className="p-2.5">Security Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22262E] bg-[#0B0C0E]">
                  {unpackResult.shadowEndpoints.map((ep) => (
                    <tr key={ep.id} className="hover:bg-[#16191F] transition-colors">
                      <td className="p-2.5 font-bold text-[#3B82F6] border-r border-[#22262E]">{ep.id}</td>
                      <td className="p-2.5 font-bold text-[#38BDF8] border-r border-[#22262E] font-mono">{ep.path}</td>
                      <td className="p-2.5 font-bold text-[#10B981] border-r border-[#22262E]">{ep.methodGuess}</td>
                      <td className="p-2.5 border-r border-[#22262E]">
                        <span
                          className={`badge-tag px-1.5 py-0.2 rounded font-bold text-[9px] ${
                            ep.isInternalAdmin
                              ? 'bg-[#DC2626]/20 text-[#EF4444]'
                              : 'bg-[#D97706]/20 text-[#F59E0B]'
                          }`}
                        >
                          {ep.isInternalAdmin ? 'INTERNAL_ADMIN' : 'UNDOCUMENTED'}
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-[#22262E]">
                        <span
                          className={`badge-tag px-1.5 py-0.2 rounded font-bold text-[9px] ${
                            ep.severity === 'CRITICAL'
                              ? 'bg-[#DC2626]/20 text-[#EF4444]'
                              : 'bg-[#F97316]/20 text-[#F97316]'
                          }`}
                        >
                          {ep.severity}
                        </span>
                      </td>
                      <td className="p-2.5 text-[#A1A1A1] text-[10.5px] font-sans">
                        {ep.riskDescription}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
         * SUB-VIEW 4: AUDIT REPORT
         * ========================================================================= */}
        {activeSubTab === 'REPORT' && (
          <div className="bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col overflow-hidden min-h-0">
            <div className="h-[38px] bg-[#16191F] border-b border-[#22262E] px-4 flex items-center justify-between text-[11px] font-mono shrink-0 select-none">
              <span className="font-bold text-[#EDEDED]">
                DECOMPILED_BUNDLE_AUDIT_{(appName || 'APP').replace(/[^a-zA-Z0-9]/g, '_')}.md
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(unpackResult.reportMarkdown, 'rpt')}
                  className="px-2.5 py-1 bg-[#22262E] hover:bg-[#2A2E39] text-[#EDEDED] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedKey === 'rpt' ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3" />}
                  <span>Copy Report</span>
                </button>
                <button
                  onClick={handleDownloadReport}
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
                value={unpackResult.reportMarkdown}
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
