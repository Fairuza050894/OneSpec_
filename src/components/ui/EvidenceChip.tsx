'use client';

import React from 'react';
import { type Provenance, migrateLegacyProvenance } from '@/types/provenance';

export interface EvidenceChipProps {
  provenance?: Provenance | string | null;
  hasPlaywrightTrace?: boolean;
  className?: string;
}

interface ProvenanceConfig {
  label: string;
  colorClass: string;
  ariaLabel: string;
}

const PROVENANCE_MAP: Record<Provenance, ProvenanceConfig> = {
  MEASURED_K6: {
    label: 'k6',
    colorClass: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
    ariaLabel: 'Alat ukur nyata: k6 pengujian beban',
  },
  MEASURED_PLAYWRIGHT: {
    label: 'E2E',
    colorClass: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
    ariaLabel: 'Alat ukur nyata: Playwright pengujian fungsional E2E',
  },
  MEASURED_HTTP_PROBE: {
    label: 'Probe HTTP',
    colorClass: 'text-sky-400 bg-sky-950/60 border-sky-800/60',
    ariaLabel: 'Probe konkurensi HTTP ringan (bukan beban k6)',
  },
  STATIC_ANALYSIS: {
    label: 'Statik',
    colorClass: 'text-violet-300 bg-violet-950/60 border-violet-800/60',
    ariaLabel: 'Analisis statik AST, kode, atau skema',
  },
  OBSERVED_TRAFFIC: {
    label: 'Teramati',
    colorClass: 'text-indigo-300 bg-indigo-950/60 border-indigo-800/60',
    ariaLabel: 'Teramati langsung dari rekaman trafik HAR atau crawl',
  },
  INFERRED: {
    label: 'Inferensi',
    colorClass: 'text-amber-300 bg-amber-950/60 border-amber-800/60',
    ariaLabel: 'Inferensi heuristik sistem',
  },
  ESTIMATED: {
    label: 'Estimasi',
    colorClass: 'text-amber-300 bg-amber-950/60 border-amber-800/60',
    ariaLabel: 'Estimasi rumus atau asumsi',
  },
  SIMULATED: {
    label: 'Simulasi',
    colorClass: 'text-purple-300 bg-purple-950/60 border-purple-800/60',
    ariaLabel: 'Simulasi atau contoh ilustratif',
  },
  NOT_RUN: {
    label: 'Belum dijalankan',
    colorClass: 'text-zinc-400 bg-zinc-800/60 border-zinc-700/60',
    ariaLabel: 'Belum dijalankan',
  },
};

export function EvidenceChip({
  provenance,
  hasPlaywrightTrace = false,
  className = '',
}: EvidenceChipProps) {
  const normProv: Provenance = migrateLegacyProvenance(provenance, hasPlaywrightTrace);
  const cfg = PROVENANCE_MAP[normProv] || PROVENANCE_MAP.NOT_RUN;

  return (
    <span
      role="status"
      aria-label={cfg.ariaLabel}
      title={cfg.ariaLabel}
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono border uppercase tracking-wider font-semibold select-none ${cfg.colorClass} ${className}`}
    >
      {cfg.label}
    </span>
  );
}
