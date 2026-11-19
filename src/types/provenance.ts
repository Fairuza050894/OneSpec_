/**
 * ONESPEC SDLC STUDIO — PROVENANCE MODEL & EVIDENCE INTEGRITY
 * Standards: ISO/IEC/IEEE 29119-3:2022 & ISO/IEC 25010 Quality Model
 */

export type Provenance =
  | 'MEASURED_K6'          // k6 nyata dijalankan, summary-export dibaca
  | 'MEASURED_PLAYWRIGHT'  // Playwright nyata dijalankan
  | 'MEASURED_HTTP_PROBE'  // probe HTTP ringan (BUKAN beban k6)
  | 'STATIC_ANALYSIS'      // dari kode/AST/skema yang benar-benar dibaca
  | 'OBSERVED_TRAFFIC'     // dari HAR/crawl
  | 'INFERRED'             // kesimpulan heuristik
  | 'ESTIMATED'            // rumus/asumsi
  | 'SIMULATED'            // contoh/ilustrasi, bukan hasil sistem
  | 'NOT_RUN';             // belum dijalankan

export interface Measured<T = number> {
  value: T | null;          // null bila NOT_RUN
  unit?: string;
  provenance: Provenance;
  measuredAt?: string;      // ISO timestamp
  evidenceRef?: string;     // id artefak: run id, file path, HAR id
  note?: string;            // mis. "dibatasi 20 VU / 5 dtk oleh keamanan"
}

export const isMeasured = (p: Provenance): boolean =>
  p === 'MEASURED_K6' || p === 'MEASURED_PLAYWRIGHT' || p === 'MEASURED_HTTP_PROBE';

/**
 * Migration helper from legacy provenance string literals
 * 'EMPIRICAL' -> 'MEASURED_PLAYWRIGHT' only if Playwright traces exist; otherwise 'INFERRED'.
 */
export function migrateLegacyProvenance(
  legacyValue: string | null | undefined,
  hasPlaywrightTrace: boolean = false
): Provenance {
  if (!legacyValue || legacyValue === 'NOT_RUN') return 'NOT_RUN';
  if (legacyValue === 'EMPIRICAL' || legacyValue === 'EMPIRICAL_PLAYWRIGHT') {
    return hasPlaywrightTrace ? 'MEASURED_PLAYWRIGHT' : 'INFERRED';
  }
  if (legacyValue === 'EMPIRICAL_K6' || legacyValue === 'MEASURED_K6') return 'MEASURED_K6';
  if (legacyValue === 'HTTP_CONCURRENCY_PROBE' || legacyValue === 'PROBE' || legacyValue === 'MEASURED_HTTP_PROBE') {
    return 'MEASURED_HTTP_PROBE';
  }
  if (legacyValue === 'STATIC_AST' || legacyValue === 'STATIC_ANALYSIS') return 'STATIC_ANALYSIS';
  if (legacyValue === 'OBSERVED_TRAFFIC') return 'OBSERVED_TRAFFIC';
  if (legacyValue === 'INFERRED' || legacyValue === 'RULE_BASED') return 'INFERRED';
  if (legacyValue === 'ESTIMATED') return 'ESTIMATED';
  if (legacyValue === 'SIMULATED') return 'SIMULATED';
  return 'INFERRED';
}
