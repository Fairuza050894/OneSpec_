'use client';

import React from 'react';
import type { Measured, Provenance } from '@/types/provenance';
import { EvidenceChip } from './EvidenceChip';

export interface MetricValueProps {
  metric?: Measured<number> | null;
  value?: number | string | null;
  unit?: string;
  provenance?: Provenance | string | null;
  format?: (val: number) => string;
  label?: string;
  className?: string;
  valueClassName?: string;
  hasPlaywrightTrace?: boolean;
}

export function MetricValue({
  metric,
  value,
  unit,
  provenance,
  format,
  label,
  className = '',
  valueClassName = '',
  hasPlaywrightTrace = false,
}: MetricValueProps) {
  const effValue = metric !== undefined ? metric?.value : value;
  const effUnit = metric?.unit || unit || '';
  const effProv = metric?.provenance || provenance || (effValue == null ? 'NOT_RUN' : 'INFERRED');

  if (effValue == null) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        {label && <span className="text-zinc-400 text-xs font-normal">{label}:</span>}
        <span className={`font-mono tabular-nums text-zinc-500 font-medium ${valueClassName}`}>—</span>
        <EvidenceChip provenance="NOT_RUN" />
      </div>
    );
  }

  const formattedValue =
    typeof effValue === 'number' && format ? format(effValue) : String(effValue);

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {label && <span className="text-zinc-400 text-xs font-normal">{label}:</span>}
      <span className={`font-mono tabular-nums text-zinc-100 font-semibold ${valueClassName}`}>
        {formattedValue}
        {effUnit ? <span className="text-xs text-zinc-400 font-normal ml-0.5">{effUnit}</span> : null}
      </span>
      <EvidenceChip provenance={effProv} hasPlaywrightTrace={hasPlaywrightTrace} />
    </div>
  );
}
