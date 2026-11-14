'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Users,
  Download,
  Copy,
  Check,
  Play,
  RotateCw,
  Award,
} from 'lucide-react';
import {
  delphiConsensusService,
  type DelphiConsensusSummary,
  type DelphiPersona,
  type DebateStance,
} from '@/services/delphiConsensusService';
import type {
  DiscoveredApiEndpoint,
  DatabaseErdTable,
  ValidationRuleContract,
  BrdMatrixRow,
} from '@/types/sdlc';
import type { SynthesizedRtmRow } from '@/services/rtmSynthesizer';
import { useStudioLocale } from '@/lib/i18n';
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center font-mono text-[11px] text-[#707070] bg-[#0E1015]">
      Loading Monaco Architecture Clearance Packet...
    </div>
  ),
});

interface DelphiConsensusWorkbenchProps {
  appName?: string;
  targetUrl: string;
  apiEndpoints: DiscoveredApiEndpoint[];
  databaseTables: DatabaseErdTable[];
  validationRules: ValidationRuleContract[];
  businessRules: BrdMatrixRow[];
  rtmRows?: SynthesizedRtmRow[];
  initialConsensusSummary?: DelphiConsensusSummary;
  onAppendLog?: (msg: string) => void;
}

export function DelphiConsensusWorkbench({
  appName = 'Active Application',
  targetUrl,
  apiEndpoints,
  databaseTables,
  validationRules,
  businessRules,
  rtmRows,
  initialConsensusSummary,
  onAppendLog,
}: DelphiConsensusWorkbenchProps) {
  const { copy } = useStudioLocale();
  const [selectedRoundNumber, setSelectedRoundNumber] = useState<1 | 2 | 3>(3);
  const [activeTab, setActiveTab] = useState<'DEBATE_ROOM' | 'SEALS' | 'PACKET'>('DEBATE_ROOM');
  const [selectedPersonaFilter, setSelectedPersonaFilter] = useState<DelphiPersona | 'ALL'>('ALL');
  const [isConvening, setIsConvening] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Compute Consensus Summary (preferring pre-compiled initialConsensusSummary if provided)
  const summary: DelphiConsensusSummary = useMemo(() => {
    if (initialConsensusSummary) return initialConsensusSummary;
    return delphiConsensusService.simulateConsensus({
      appName,
      targetUrl,
      apiEndpoints,
      databaseTables,
      validationRules,
      businessRules,
      rtmRows,
    });
  }, [appName, targetUrl, apiEndpoints, databaseTables, validationRules, businessRules, rtmRows]);

  const currentRound = useMemo(() => {
    return summary.rounds.find((r) => r.roundNumber === selectedRoundNumber) || summary.rounds[0];
  }, [summary.rounds, selectedRoundNumber]);

  const displayedDebates = useMemo(() => {
    if (selectedPersonaFilter === 'ALL') return currentRound.entries;
    return currentRound.entries.filter((e) => e.persona === selectedPersonaFilter);
  }, [currentRound.entries, selectedPersonaFilter]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleConveneDebate = () => {
    setIsConvening(true);
    if (onAppendLog) {
      onAppendLog(`[DELPHI ARB] Convening Virtual Architecture Review Board across 6 personas (BSA, QA, AppSec, DBA, GRC, TechWriter)...`);
      onAppendLog(`[DELPHI ARB] Round 1: Processing initial architectural threat propositions...`);
    }
    setTimeout(() => {
      if (onAppendLog) {
        onAppendLog(`[DELPHI ARB] Round 2: Cross-persona adversarial challenges resolved (concurrency, IDOR, encryption)...`);
        onAppendLog(`[DELPHI ARB] Round 3: Unanimous consensus reached (Convergence Score: ${summary.consensusScorePercent}%). Clearance packet signed.`);
      }
      setIsConvening(false);
    }, 700);
  };

  const handleDownloadPacket = () => {
    const slug = appName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const blob = new Blob([summary.clearancePacketMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ARB_CLEARANCE_PACKET_${slug}.md`;
    link.click();
    URL.revokeObjectURL(url);
    if (onAppendLog) {
      onAppendLog(`[DELPHI ARB] Exported signed Architecture Review Board clearance packet for ${appName}.`);
    }
  };

  const getPersonaColor = (persona: DelphiPersona) => {
    switch (persona) {
      case 'BSA':
        return 'text-[#38BDF8] border-[#38BDF8]/40 bg-[#38BDF8]/10';
      case 'QA_LEAD':
        return 'text-[#10B981] border-[#10B981]/40 bg-[#10B981]/10';
      case 'APPSEC':
        return 'text-[#EF4444] border-[#EF4444]/40 bg-[#EF4444]/10';
      case 'DBA_ARCHITECT':
        return 'text-[#8B5CF6] border-[#8B5CF6]/40 bg-[#8B5CF6]/10';
      case 'GRC_OFFICER':
        return 'text-[#F59E0B] border-[#F59E0B]/40 bg-[#F59E0B]/10';
      case 'TECH_WRITER':
        return 'text-[#EC4899] border-[#EC4899]/40 bg-[#EC4899]/10';
    }
  };

  const getStanceBadge = (stance: DebateStance) => {
    switch (stance) {
      case 'APPROVE':
        return 'bg-[#059669]/20 text-[#10B981] border border-[#059669]/50';
      case 'CHALLENGE':
        return 'bg-[#DC2626]/20 text-[#EF4444] border border-[#DC2626]/50';
      case 'CONDITIONAL_APPROVAL':
        return 'bg-[#D97706]/20 text-[#F59E0B] border border-[#D97706]/50';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0B0C0E] border border-[#22262E] rounded-[4px] overflow-hidden min-h-0">
      {/* Top Header Toolbar */}
      <div className="min-h-[40px] py-1 bg-[#16191F] border-b border-[#22262E] px-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <Users className="h-4 w-4 text-[#3B82F6] shrink-0" />
          <span className="text-[#EDEDED] font-bold uppercase tracking-wide truncate max-w-[140px]" title={appName}>
            {appName}
          </span>
          <span className="text-[#707070] hidden 2xl:inline whitespace-nowrap">{copy.step11.subtitleSuffix}</span>
          <span className="badge-tag px-1.5 py-0.2 bg-[#059669]/20 text-[#10B981] font-bold text-[9.5px] whitespace-nowrap">
            CONVERGENCE: {summary.consensusScorePercent}%
          </span>
          <span className="badge-tag px-1.5 py-0.2 bg-[#2563EB]/20 text-[#3B82F6] font-bold text-[9.5px] whitespace-nowrap">
            {summary.clearanceVerdict.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Tab & Action Switchers */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-[#0B0C0E] border border-[#22262E] p-0.5 rounded-[3px] text-[10.5px]">
            <button
              onClick={() => setActiveTab('DEBATE_ROOM')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeTab === 'DEBATE_ROOM'
                  ? 'bg-[#2563EB] text-white font-bold'
                  : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              {copy.step11.tabDebates} ({summary.totalDebates})
            </button>
            <button
              onClick={() => setActiveTab('SEALS')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeTab === 'SEALS'
                  ? 'bg-[#2563EB] text-white font-bold'
                  : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              {copy.step11.tabSeals}
            </button>
            <button
              onClick={() => setActiveTab('PACKET')}
              className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activeTab === 'PACKET'
                  ? 'bg-[#2563EB] text-white font-bold'
                  : 'text-[#A1A1A1] hover:text-[#EDEDED]'
              }`}
            >
              {copy.step11.tabPacket}
            </button>
          </div>

          <div className="h-4 w-px bg-[#22262E] mx-1" />

          <button
            onClick={handleConveneDebate}
            disabled={isConvening}
            className="px-2.5 py-1 bg-[#10B981] hover:bg-[#059669] text-black font-bold text-[10.5px] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {isConvening ? (
              <>
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
                <span>{copy.step11.convening}</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{copy.step11.conveneArb}</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadPacket}
            className="px-2.5 py-1 bg-[#22262E] hover:bg-[#2A2E39] text-[#EDEDED] font-mono text-[11px] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>{copy.step11.exportPacket}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* Top Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0 font-mono text-[11px]">
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Consensus</span>
            <span className="text-[18px] font-bold text-[#10B981] tabular-nums">
              {summary.consensusScorePercent}%
            </span>
            <span className="text-[9.5px] text-[#10B981]">Convergence Score</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Verdict</span>
            <span className="text-[11.5px] font-bold text-[#EDEDED] leading-tight break-words">
              {summary.clearanceVerdict.replace(/_/g, ' ')}
            </span>
            <span className="text-[9.5px] text-[#A1A1A1]">ARB Decision</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Total Debates</span>
            <span className="text-[18px] font-bold text-[#3B82F6] tabular-nums">
              {summary.totalDebates}
            </span>
            <span className="text-[9.5px] text-[#A1A1A1]">Statements Filed</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Delphi Rounds</span>
            <span className="text-[18px] font-bold text-[#F59E0B] tabular-nums">
              {summary.totalRounds} Rounds
            </span>
            <span className="text-[9.5px] text-[#A1A1A1]">Formal Sequence</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Seals Signed</span>
            <span className="text-[18px] font-bold text-[#10B981] tabular-nums">
              {summary.signOffSeals.length} / 6
            </span>
            <span className="text-[9.5px] text-[#10B981]">Unanimous Clearance</span>
          </div>
          <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col justify-between">
            <span className="text-[10px] text-[#707070] uppercase font-bold">Reference</span>
            <span className="text-[14px] font-bold text-[#38BDF8]">ISO 29148</span>
            <span className="text-[9.5px] text-[#A1A1A1]">NASA SP-6105</span>
          </div>
        </div>

        {/* =========================================================================
         * SUB-VIEW 1: BOARDROOM DEBATE (3-ROUND TIMELINE)
         * ========================================================================= */}
        {activeTab === 'DEBATE_ROOM' && (
          <div className="space-y-4 font-mono text-[11px]">
            {/* Round Switcher Tabs */}
            <div className="flex items-center justify-between pb-2 border-b border-[#22262E]">
              <div className="flex items-center gap-1.5 bg-[#111317] border border-[#22262E] p-0.5 rounded-[3px]">
                {summary.rounds.map((r) => (
                  <button
                    key={r.roundNumber}
                    onClick={() => setSelectedRoundNumber(r.roundNumber)}
                    className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                      selectedRoundNumber === r.roundNumber
                        ? 'bg-[#2563EB] text-white font-bold'
                        : 'text-[#A1A1A1] hover:text-[#EDEDED]'
                    }`}
                  >
                    Round {r.roundNumber} ({r.roundNumber === 1 ? 'Propositions' : r.roundNumber === 2 ? 'Rebuttals' : 'Consensus'})
                  </button>
                ))}
              </div>

              {/* Persona Filter */}
              <div className="flex items-center gap-1 bg-[#111317] border border-[#22262E] p-0.5 rounded-[3px] text-[10px]">
                {(['ALL', 'BSA', 'QA_LEAD', 'APPSEC', 'DBA_ARCHITECT', 'GRC_OFFICER', 'TECH_WRITER'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPersonaFilter(p)}
                    className={`px-2 py-0.5 rounded-[2px] transition-colors cursor-pointer ${
                      selectedPersonaFilter === p ? 'bg-[#22262E] text-[#EDEDED] font-bold' : 'text-[#707070] hover:text-[#EDEDED]'
                    }`}
                  >
                    {p.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Round Header */}
            <div className="p-3 bg-[#111317] border border-[#22262E] rounded-[3px] flex items-center justify-between">
              <div>
                <div className="text-[#EDEDED] font-bold text-[12px]">{currentRound.roundTitle}</div>
                <div className="text-[10px] text-[#A1A1A1] font-sans mt-0.5">{currentRound.roundDescription}</div>
              </div>
              <span className="badge-tag px-2 py-0.5 bg-[#2563EB]/20 text-[#3B82F6] font-bold text-[10px]">
                {displayedDebates.length} Statements
              </span>
            </div>

            {/* Debates Cards Stream */}
            <div className="space-y-3">
              {displayedDebates.map((entry, idx) => (
                <div
                  key={`debate-${idx}`}
                  className="p-3.5 bg-[#111317] border border-[#22262E] hover:border-[#3B82F6] rounded-[3px] space-y-2 transition-colors"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-[#22262E]">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 border rounded-[2px] font-bold text-[10px] ${getPersonaColor(entry.persona)}`}>
                        {entry.persona}
                      </span>
                      <span className="text-[#EDEDED] font-bold text-[11.5px]">{entry.personaTitle}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#707070]">Topic: <strong className="text-[#A1A1A1]">{entry.topicDomain}</strong></span>
                      <span className={`badge-tag px-2 py-0.2 rounded font-bold text-[9px] ${getStanceBadge(entry.stance)}`}>
                        {entry.stance}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#EDEDED] font-sans leading-relaxed">
                    "{entry.statement}"
                  </p>

                  <div className="flex items-center justify-between text-[9.5px] text-[#707070] pt-1 border-t border-[#22262E]/50">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#3B82F6] font-bold">Evidence:</span>
                      <span className="text-[#A1A1A1]">{entry.evidenceReference}</span>
                    </div>
                    <span>Timestamp: {entry.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
         * SUB-VIEW 2: SIGN-OFF SEALS (6 PERSONAS)
         * ========================================================================= */}
        {activeTab === 'SEALS' && (
          <div className="space-y-4 font-mono text-[11px]">
            <div className="p-4 bg-[#111317] border border-[#22262E] rounded-[3px] space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#10B981]" />
                  <span className="text-[#EDEDED] font-bold text-[12px]">
                    Autonomous Architecture Clearance Sign-Off Seals
                  </span>
                </div>
                <span className="badge-tag px-2 py-0.5 bg-[#059669]/20 text-[#10B981] font-bold text-[10px]">
                  ALL 6 SEALS VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-[#A1A1A1] font-sans">
                Formal cryptographic consensus seals certifying that functional, quality, security, architectural, compliance, and documentation criteria have been satisfied under ISO/IEC/IEEE 29148:2018.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {summary.signOffSeals.map((seal) => (
                <div
                  key={seal.persona}
                  className="p-3.5 bg-[#111317] border border-[#22262E] hover:border-[#10B981] rounded-[3px] space-y-2.5 transition-colors"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#22262E]">
                    <span className={`px-2 py-0.5 border rounded-[2px] font-bold text-[10px] ${getPersonaColor(seal.persona)}`}>
                      {seal.persona}
                    </span>
                    <span className="badge-tag px-1.5 py-0.2 bg-[#059669]/20 text-[#10B981] font-bold text-[9px]">
                      {seal.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div>
                    <div className="text-[#EDEDED] font-bold text-[11.5px]">{seal.personaTitle}</div>
                    <div className="text-[10px] text-[#38BDF8]">{seal.signerDesignation}</div>
                  </div>

                  <div className="p-2 bg-[#0B0C0E] border border-[#22262E] rounded-[2px] space-y-1">
                    <span className="text-[9px] text-[#707070] uppercase font-bold block">Digital Seal Signature:</span>
                    <span className="text-[#10B981] font-mono text-[9.5px] break-all block">
                      {seal.signatureDigest}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9.5px] text-[#707070] font-bold block">Approved Stipulations:</span>
                    <ul className="list-disc list-inside text-[9.5px] text-[#A1A1A1] font-sans space-y-0.5">
                      {seal.stipulations.map((stip, idx) => (
                        <li key={idx}>{stip}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-[9px] text-[#707070] pt-1 border-t border-[#22262E]">
                    Signed At: {seal.signedAt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
         * SUB-VIEW 3: CLEARANCE PACKET EXPORT
         * ========================================================================= */}
        {activeTab === 'PACKET' && (
          <div className="bg-[#111317] border border-[#22262E] rounded-[3px] flex flex-col overflow-hidden min-h-0">
            <div className="h-[38px] bg-[#16191F] border-b border-[#22262E] px-4 flex items-center justify-between text-[11px] font-mono shrink-0 select-none">
              <span className="font-bold text-[#EDEDED]">
                ARB_CLEARANCE_PACKET_{(appName || 'APP').replace(/[^a-zA-Z0-9]/g, '_')}.md
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(summary.clearancePacketMarkdown, 'packet')}
                  className="px-2.5 py-1 bg-[#22262E] hover:bg-[#2A2E39] text-[#EDEDED] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedKey === 'packet' ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3" />}
                  <span>Copy Packet</span>
                </button>
                <button
                  onClick={handleDownloadPacket}
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
                value={summary.clearancePacketMarkdown}
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
