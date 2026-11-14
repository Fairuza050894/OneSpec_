'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  FileCode,
  Layers,
  Code2,
  ExternalLink,
  Copy,
  Check,
  Download,
  Search,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Play,
  RotateCw,
  AlertTriangle,
} from 'lucide-react';
import type { DiscoveredApiEndpoint } from '@/types/sdlc';

// Dynamic import of Scalar to prevent SSR issues
const ApiReferenceReact = dynamic(
  () => import('@scalar/api-reference-react').then((mod) => mod.ApiReferenceReact),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center font-mono text-[11px] text-[#707070]">
        Loading Scalar API Reference Engine...
      </div>
    ),
  }
);

interface ApiContractExplorerProps {
  endpoints: DiscoveredApiEndpoint[];
  openApiSpec: Record<string, unknown>;
  targetUrl?: string;
  onEndpointSelect?: (endpoint: DiscoveredApiEndpoint) => void;
  onAppendLog?: (msg: string) => void;
  selectedEndpointId?: string;
}

export function ApiContractExplorer({
  endpoints,
  openApiSpec,
  targetUrl = 'http://127.0.0.1:3000',
  onEndpointSelect,
  onAppendLog,
  selectedEndpointId,
}: ApiContractExplorerProps) {
  const [viewMode, setViewMode] = useState<'SPLIT_INSPECTOR' | 'SCALAR_VIEW' | 'RAW_SPEC'>('SPLIT_INSPECTOR');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEndpointId, setActiveEndpointId] = useState<string>(
    selectedEndpointId || endpoints[0]?.id || 'EP-001'
  );
  const [copiedSpec, setCopiedSpec] = useState(false);

  const [sandboxQuery, setSandboxQuery] = useState('');
  const [sandboxBody, setSandboxBody] = useState('{\n  "sample": true\n}');
  const [useSavedAuth, setUseSavedAuth] = useState(true);
  const [isSendingReq, setIsSendingReq] = useState(false);
  const [sandboxResponse, setSandboxResponse] = useState<{
    status: number;
    statusText: string;
    latencyMs: number;
    authApplied: boolean;
    requestUrl: string;
    responseBody: string;
    schemaDrift?: { hasDrift: boolean; missingKeys: string[] };
  } | null>(null);
  // Sync selectedEndpointId
  useEffect(() => {
    if (selectedEndpointId) {
      setActiveEndpointId(selectedEndpointId);
    }
  }, [selectedEndpointId]);

  const activeEndpoint = endpoints.find((ep) => ep.id === activeEndpointId) || endpoints[0];

  useEffect(() => {
    setSandboxResponse(null);
    setSandboxQuery('');
    if (activeEndpoint?.requestBodySchema) {
      setSandboxBody(JSON.stringify(activeEndpoint.requestBodySchema, null, 2));
    } else {
      setSandboxBody('{\n  "query": "test"\n}');
    }
  }, [activeEndpoint?.id]);

  const handleSendLiveRequest = async () => {
    if (!activeEndpoint || isSendingReq) return;
    setIsSendingReq(true);
    try {
      const resp200 = activeEndpoint.responseSchemas?.['200'] as { schema?: { properties?: Record<string, unknown> } } | undefined;
      const expectedKeys = resp200?.schema?.properties ? Object.keys(resp200.schema.properties) : [];
      const res = await fetch('/api/discovery/proxy-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          method: activeEndpoint.method,
          endpointPath: activeEndpoint.path,
          queryString: sandboxQuery,
          requestBody: ['POST', 'PUT', 'PATCH'].includes(activeEndpoint.method.toUpperCase()) ? sandboxBody : undefined,
          useSavedAuth,
          expectedResponseKeys: expectedKeys,
        }),
      });
      const data = await res.json();
      setSandboxResponse(data);
      onAppendLog?.(`[API SANDBOX] ${activeEndpoint.method} ${data.requestUrl || activeEndpoint.path} -> HTTP ${data.status} (${data.latencyMs}ms)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSandboxResponse({
        status: 502,
        statusText: 'Proxy Error',
        latencyMs: 0,
        authApplied: false,
        requestUrl: activeEndpoint.path,
        responseBody: msg,
      });
    } finally {
      setIsSendingReq(false);
    }
  };
  const filteredEndpoints = endpoints.filter(
    (ep) =>
      ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.controllerPath.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMethodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-[#2563EB]/15 text-[#3B82F6] border-[#2563EB]/40';
      case 'POST':
        return 'bg-[#059669]/15 text-[#059669] border-[#059669]/40';
      case 'PUT':
      case 'PATCH':
        return 'bg-[#D97706]/15 text-[#D97706] border-[#D97706]/40';
      case 'DELETE':
        return 'bg-[#DC2626]/15 text-[#DC2626] border-[#DC2626]/40';
      default:
        return 'bg-[#707070]/15 text-[#A1A1A1] border-[#707070]/40';
    }
  };

  const handleCopySpec = () => {
    navigator.clipboard.writeText(JSON.stringify(openApiSpec, null, 2));
    setCopiedSpec(true);
    setTimeout(() => setCopiedSpec(false), 2000);
  };

  const handleDownloadSpec = () => {
    const blob = new Blob([JSON.stringify(openApiSpec, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'openapi-3.1-discovered.json';
    link.click();
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#111317] border border-[#22262E] rounded-[2px] overflow-hidden select-none">
      {/* Sub-Header Toolbar */}
      <div className="h-[32px] bg-[#16191F] border-b border-[#22262E] px-3 flex items-center justify-between font-mono text-[11px] shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[2px]">
            <button
              onClick={() => setViewMode('SPLIT_INSPECTOR')}
              className={`px-2.5 py-0.5 rounded-[2px] text-[10px] font-bold transition-colors ${
                viewMode === 'SPLIT_INSPECTOR'
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#707070] hover:text-[#EDEDED]'
              }`}
            >
              Split Contract Inspector
            </button>
            <button
              onClick={() => setViewMode('SCALAR_VIEW')}
              className={`px-2.5 py-0.5 rounded-[2px] text-[10px] font-bold transition-colors ${
                viewMode === 'SCALAR_VIEW'
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#707070] hover:text-[#EDEDED]'
              }`}
            >
              Scalar Reference View (@scalar)
            </button>
            <button
              onClick={() => setViewMode('RAW_SPEC')}
              className={`px-2.5 py-0.5 rounded-[2px] text-[10px] font-bold transition-colors ${
                viewMode === 'RAW_SPEC'
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#707070] hover:text-[#EDEDED]'
              }`}
            >
              OpenAPI 3.1 JSON
            </button>
          </div>

          <span className="text-[10px] text-[#707070] tabular-nums">
            {endpoints.length} Endpoints Discovered
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopySpec}
            className="flex items-center gap-1 px-2 py-0.5 bg-[#0B0C0E] border border-[#22262E] hover:border-[#3B82F6] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] text-[10px] font-bold"
            title="Copy OpenAPI 3.1 JSON"
          >
            {copiedSpec ? <Check className="h-3 w-3 text-[#059669]" /> : <Copy className="h-3 w-3" />}
            <span>{copiedSpec ? 'Copied' : 'Copy Spec'}</span>
          </button>
          <button
            onClick={handleDownloadSpec}
            className="flex items-center gap-1 px-2 py-0.5 bg-[#0B0C0E] border border-[#22262E] hover:border-[#3B82F6] text-[#A1A1A1] hover:text-[#EDEDED] rounded-[2px] text-[10px] font-bold"
            title="Download OpenAPI 3.1 specification"
          >
            <Download className="h-3 w-3 text-[#3B82F6]" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Main Work Area */}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'SPLIT_INSPECTOR' && (
          <div className="w-full h-full grid grid-cols-12 divide-x divide-[#22262E]">
            {/* Left Column: Discovered Endpoints Master List */}
            <div className="col-span-5 flex flex-col bg-[#0E1015] overflow-hidden">
              <div className="p-2 border-b border-[#22262E] bg-[#16191F]">
                <div className="flex items-center gap-1.5 bg-[#0B0C0E] border border-[#22262E] px-2 py-1 rounded-[2px]">
                  <Search className="h-3 w-3 text-[#707070]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search routes, controllers, methods..."
                    className="bg-transparent border-none outline-none text-[#EDEDED] text-[11px] w-full font-mono"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-[#22262E]">
                {filteredEndpoints.map((ep) => {
                  const isSelected = ep.id === activeEndpoint?.id;
                  return (
                    <div
                      key={ep.id}
                      onClick={() => {
                        setActiveEndpointId(ep.id);
                        onEndpointSelect?.(ep);
                      }}
                      className={`p-2.5 cursor-pointer transition-colors font-mono text-[11px] ${
                        isSelected
                          ? 'bg-[#16191F] border-l-2 border-l-[#2563EB]'
                          : 'hover:bg-[#16191F]/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`badge-tag px-1.5 py-0.2 border text-[9px] font-bold rounded-[2px] ${getMethodBadgeClass(
                              ep.method
                            )}`}
                          >
                            {ep.method}
                          </span>
                          <span className="font-bold text-[#EDEDED] truncate max-w-[210px]" title={ep.path}>
                            {ep.path}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#707070]">{ep.id}</span>
                      </div>

                      <div className="text-[10px] text-[#A1A1A1] truncate mb-1" title={ep.summary}>
                        {ep.summary}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#707070]">
                        <span className="truncate max-w-[200px]" title={ep.controllerPath}>
                          <code>{ep.controllerPath}:{ep.lineNumber}</code>
                        </span>
                        <div className="flex items-center gap-1">
                          {ep.linkedTestCaseIds?.slice(0, 50).map((tc) => (
                            <span
                              key={tc}
                              className="badge-tag px-1 py-0.2 bg-[#2563EB]/15 text-[#3B82F6] border border-[#2563EB]/30 text-[9px] font-bold"
                            >
                              {tc}
                            </span>
                          ))}
                          {ep.linkedTestCaseIds?.length > 2 && (
                            <span className="text-[9px] text-[#707070]">
                              +{ep.linkedTestCaseIds.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Detailed Endpoint Contract & Payload Schemas */}
            <div className="col-span-7 flex flex-col bg-[#111317] overflow-y-auto p-4 space-y-4 font-mono text-[11px]">
              {activeEndpoint ? (
                <>
                  {/* Endpoint Header Card */}
                  <div className="border border-[#22262E] rounded-[2px] bg-[#0B0C0E] p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`badge-tag px-2 py-0.5 border text-[11px] font-bold rounded-[2px] ${getMethodBadgeClass(
                            activeEndpoint.method
                          )}`}
                        >
                          {activeEndpoint.method}
                        </span>
                        <span className="text-[13px] font-bold text-[#EDEDED]">
                          {activeEndpoint.path}
                        </span>
                        {activeEndpoint.featureModule && (
                          <span className="badge-tag px-2 py-0.5 bg-[#2563EB]/15 text-[#60A5FA] border border-[#2563EB]/30 text-[10px] font-bold">
                            {activeEndpoint.featureModule}
                          </span>
                        )}
                      </div>
                      <span className="badge-tag px-2 py-0.5 bg-[#059669]/15 text-[#059669] border border-[#059669]/30 text-[10px] font-bold">
                        OPENAPI 3.1
                      </span>
                    </div>

                    <div className="text-[11px] text-[#A1A1A1]">
                      {activeEndpoint.description || activeEndpoint.summary}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#22262E] text-[10px]">
                      <div>
                        <span className="text-[#707070]">Controller Source: </span>
                        <code className="text-[#3B82F6] font-bold">
                          {activeEndpoint.controllerPath}:{activeEndpoint.lineNumber}
                        </code>
                      </div>
                      <div>
                        <span className="text-[#707070]">Handler Symbol: </span>
                        <code className="text-[#EDEDED]">
                          {activeEndpoint.handlerName || 'anonymousHandler'}
                        </code>
                      </div>
                      <div>
                        <span className="text-[#707070]">Linked StRS / SyRS: </span>
                        <strong className="text-[#059669]">{activeEndpoint.linkedRequirementId}</strong>
                      </div>
                      <div>
                        <span className="text-[#707070]">Linked RTM Tests: </span>
                        <span className="text-[#3B82F6] font-bold">
                          {activeEndpoint.linkedTestCaseIds.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Live API Sandbox / Try-It-Out Request Executor */}
                  <div className="border border-[#3B82F6]/50 rounded-[2px] bg-[#0B0C0E] p-3 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-[#22262E]">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#60A5FA] uppercase">
                        <Play className="h-3.5 w-3.5" />
                        <span>Live API Sandbox (Try It Out)</span>
                      </div>
                      <label className="flex items-center gap-1.5 text-[10px] text-[#A1A1A1] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useSavedAuth}
                          onChange={(e) => setUseSavedAuth(e.target.checked)}
                          className="accent-[#2563EB] cursor-pointer"
                        />
                        <span>Attach Saved Session (.onespec-auth-state.json)</span>
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-1 border rounded-[2px] text-[10.5px] font-bold ${getMethodBadgeClass(activeEndpoint.method)}`}>
                        {activeEndpoint.method}
                      </span>
                      <span className="px-2 py-1 bg-[#111317] border border-[#22262E] rounded-[2px] text-[#EDEDED] truncate max-w-[260px]">
                        {activeEndpoint.path}
                      </span>
                      <input
                        type="text"
                        value={sandboxQuery}
                        onChange={(e) => setSandboxQuery(e.target.value)}
                        placeholder="?page=1&limit=10"
                        className="flex-1 min-w-[120px] h-7 px-2 bg-[#111317] border border-[#22262E] focus:border-[#3B82F6] text-[#EDEDED] rounded-[2px] outline-none text-[10.5px] select-text"
                      />
                      <button
                        type="button"
                        onClick={handleSendLiveRequest}
                        disabled={isSendingReq}
                        className="h-7 px-3 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-bold rounded-[2px] cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        {isSendingReq ? <RotateCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                        <span>{isSendingReq ? 'Sending...' : 'Send Live Request'}</span>
                      </button>
                    </div>

                    {['POST', 'PUT', 'PATCH'].includes(activeEndpoint.method.toUpperCase()) && (
                      <textarea
                        value={sandboxBody}
                        onChange={(e) => setSandboxBody(e.target.value)}
                        rows={4}
                        className="w-full p-2 bg-[#111317] border border-[#22262E] focus:border-[#3B82F6] text-[#EDEDED] rounded-[2px] outline-none font-mono text-[10.5px] select-text"
                      />
                    )}

                    {sandboxResponse && (
                      <div className="space-y-1.5 pt-1 border-t border-[#22262E]">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded-[2px] font-bold border tabular-nums ${
                                sandboxResponse.status >= 200 && sandboxResponse.status < 300
                                  ? 'bg-[#059669]/20 text-[#10B981] border-[#059669]/50'
                                  : 'bg-[#DC2626]/20 text-[#EF4444] border-[#DC2626]/50'
                              }`}
                            >
                              HTTP {sandboxResponse.status} {sandboxResponse.statusText}
                            </span>
                            <span className="text-[#A1A1A1] tabular-nums">{sandboxResponse.latencyMs}ms</span>
                            {sandboxResponse.authApplied && (
                              <span className="text-[#8B5CF6] font-bold">Session Cookie Attached</span>
                            )}
                          </div>
                          {sandboxResponse.schemaDrift?.hasDrift ? (
                            <span className="text-[#F59E0B] flex items-center gap-1 font-bold">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Schema Drift: missing [{sandboxResponse.schemaDrift.missingKeys.join(', ')}]</span>
                            </span>
                          ) : (
                            <span className="text-[#10B981] flex items-center gap-1 font-bold">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Contract Matched</span>
                            </span>
                          )}
                        </div>
                        <pre className="p-2.5 bg-[#111317] border border-[#22262E] rounded-[2px] text-[10.5px] text-[#D4D4D8] max-h-44 overflow-auto whitespace-pre-wrap">
                          {sandboxResponse.responseBody}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Query Parameters Schema */}
                  {activeEndpoint.queryParameters && Object.keys(activeEndpoint.queryParameters).length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#A1A1A1]">
                        <span>Query Parameters Contract (URL Search Params)</span>
                        <span className="text-[#10B981]">OpenAPI 3.1 Parameters</span>
                      </div>
                      <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] overflow-x-auto text-[11px]">
                        <pre className="text-[#EDEDED] leading-relaxed">
                          {JSON.stringify(activeEndpoint.queryParameters, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Request Payload Schema */}
                  {activeEndpoint.requestBodySchema && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#A1A1A1]">
                        <span>Request Body DTO Schema (application/json)</span>
                        <span className="text-[#3B82F6]">JSON Schema Draft 2020-12</span>
                      </div>
                      <div className="p-3 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] overflow-x-auto text-[11px]">
                        <pre className="text-[#EDEDED] leading-relaxed">
                          {JSON.stringify(activeEndpoint.requestBodySchema, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* HTTP Response Codes & Schemas */}
                  {activeEndpoint.responseSchemas && (
                    <div className="space-y-2">
                      <div className="text-[10px] uppercase font-bold text-[#A1A1A1]">
                        Response Status Contracts (ISO/IEC/IEEE 29148 SyRS)
                      </div>
                      <div className="space-y-2">
                        {Object.entries(activeEndpoint.responseSchemas).map(([status, schema]: [string, any]) => {
                          const isSuccess = status.startsWith('2');
                          return (
                            <div
                              key={status}
                              className="border border-[#22262E] rounded-[2px] bg-[#0B0C0E] p-2.5 space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`badge-tag px-1.5 py-0.2 border text-[10px] font-bold ${
                                      isSuccess
                                        ? 'bg-[#059669]/15 text-[#059669] border-[#059669]'
                                        : 'bg-[#DC2626]/15 text-[#DC2626] border-[#DC2626]'
                                    }`}
                                  >
                                    HTTP {status}
                                  </span>
                                  <span className="text-[#EDEDED] font-semibold">
                                    {schema.description || 'Response Contract'}
                                  </span>
                                </div>
                              </div>
                              <pre className="text-[10px] text-[#A1A1A1] bg-[#111317] p-2 border border-[#22262E] rounded-[2px] overflow-x-auto">
                                {JSON.stringify(schema.schema || schema, null, 2)}
                              </pre>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-[#707070]">
                  Select an endpoint from the left list to view contract details.
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'SCALAR_VIEW' && (
          <div className="w-full h-full overflow-y-auto bg-[#0B0C0E]">
            <ApiReferenceReact
              configuration={{
                spec: {
                  content: openApiSpec,
                },
                theme: 'kepler',
                darkMode: true,
                hideDownloadButton: true,
                showSidebar: true,
              }}
            />
          </div>
        )}

        {viewMode === 'RAW_SPEC' && (
          <div className="w-full h-full p-3 bg-[#0B0C0E] overflow-auto">
            <pre className="font-mono text-[11px] text-[#EDEDED] leading-relaxed">
              {JSON.stringify(openApiSpec, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="h-[24px] bg-[#16191F] border-t border-[#22262E] px-3 flex items-center justify-between text-[10px] font-mono text-[#707070] shrink-0">
        <div className="flex items-center gap-3">
          <span>Engine: <strong className="text-[#EDEDED]">morluto/rea static AST &amp; Playwright HAR</strong></span>
          <span>Spec: <strong className="text-[#059669]">OpenAPI 3.1.0 Validated</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span>Target: <code className="text-[#A1A1A1]">{String((openApiSpec.servers as any)?.[0]?.url || '127.0.0.1:8080')}</code></span>
        </div>
      </div>
    </div>
  );
}
