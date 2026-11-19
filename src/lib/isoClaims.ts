/**
 * OneSpec SDLC Workbench - Centralized ISO & Regulatory Claims Registry
 * Standards: ISO/IEC/IEEE 29148, 29119, 26514, 27001, 31000, 9001, 25010, 5055
 * Ticket: T-15 (F-21, F-22)
 *
 * Core Principle:
 * All standard references must use honest phrasing: "mengacu pada" (refers to)
 * or "selaras dengan" (aligned with), NEVER "memenuhi / certified / comply"
 * unless independent third-party certification is proven.
 */

export interface IsoClaimDefinition {
  id: string;
  code: string;
  title: string;
  domain: string;
  allowedWording: string[];
  forbiddenWording: string[];
  assessmentNote: string;
  totalStandardControls?: number;
  evaluatedControlsCount?: number;
  disclaimer: string;
}

export const ISO_CLAIMS: Record<string, IsoClaimDefinition> = {
  ISO_29148: {
    id: 'ISO_29148',
    code: 'ISO/IEC/IEEE 29148:2018',
    title: 'Systems and software engineering — Life cycle processes — Requirements engineering',
    domain: 'Requirements Engineering & Specification Syntax',
    allowedWording: [
      'mengacu pada sintaks ISO/IEC/IEEE 29148:2018',
      'selaras dengan struktur persyaratan ISO 29148',
      'aligned with ISO/IEC/IEEE 29148 requirements syntax',
    ],
    forbiddenWording: [
      'memenuhi ISO 29148',
      'tersertifikasi ISO 29148',
      'ISO 29148 compliant',
      '100% ISO 29148 certified',
    ],
    assessmentNote:
      'OneSpec memverifikasi struktur atomik kalimat persyaratan (Shall/Should), kriteria penerimaan, dan ketertelusuran RTM secara sintaktis.',
    disclaimer:
      'Template dan verifikasi sintaksis mengacu pada ISO/IEC/IEEE 29148:2018 dan bukan merupakan sertifikasi proses rekayasa organisasi.',
  },

  ISO_29119: {
    id: 'ISO_29119',
    code: 'ISO/IEC/IEEE 29119-3:2021',
    title: 'Software and systems engineering — Software testing — Part 3: Test documentation',
    domain: 'Software Testing & Quality Gating',
    allowedWording: [
      'mengacu pada dokumentasi pengujian ISO/IEC/IEEE 29119-3',
      'selaras dengan hierarki pengujian ISO 29119',
      'aligned with ISO/IEC/IEEE 29119-3 test documentation structure',
    ],
    forbiddenWording: [
      'memenuhi ISO 29119',
      'tersertifikasi ISO 29119',
      'ISO 29119 compliant',
      '100% ISO 29119 certified',
    ],
    assessmentNote:
      'OneSpec mengotomatisasi penataan test cases, test execution logs, dan kalkulasi release gate verdict berdasarkan hasil tes nyata.',
    disclaimer:
      'Metrik pengujian dan release gate dievaluasi berdasarkan eksekusi test runner internal yang selaras dengan panduan ISO/IEC/IEEE 29119-3.',
  },

  ISO_26514: {
    id: 'ISO_26514',
    code: 'ISO/IEC/IEEE 26514:2022',
    title: 'Systems and software engineering — Design and development of information for users',
    domain: 'User Documentation & Operation Manuals',
    allowedWording: [
      'mengacu pada struktur panduan pengguna ISO/IEC/IEEE 26514',
      'selaras dengan standar dokumentasi pengguna ISO 26514',
      'aligned with ISO/IEC/IEEE 26514 user information design',
    ],
    forbiddenWording: [
      'memenuhi ISO 26514',
      'tersertifikasi ISO 26514',
      'ISO 26514 compliant',
      'certified ISO 26514 manual',
    ],
    assessmentNote:
      'OneSpec menghasilkan dokumentasi pengguna 9-bagian dwibahasa dengan visual callout pin 1:1 dan prosedur berorientasi tugas (SOP).',
    disclaimer:
      'Struktur manual pengguna disusun mengacu pada ISO/IEC/IEEE 26514:2022 untuk kemudahan penggunaan operator sistem.',
  },

  ISO_27001: {
    id: 'ISO_27001',
    code: 'ISO/IEC 27001:2022',
    title: 'Information security, cybersecurity and privacy protection — Information security management systems',
    domain: 'Information Security & SDLC Safeguards',
    allowedWording: [
      'mengacu pada Kontrol A.8 ISO/IEC 27001:2022',
      'selaras dengan pengujian keamanan siklus hidup A.8.25/A.8.26',
      'aligned with ISO/IEC 27001:2022 Control A.8 SDLC safeguards',
    ],
    forbiddenWording: [
      'memenuhi ISO 27001',
      'tersertifikasi ISO 27001',
      'ISO 27001 certified',
      'ISO 27001 100%',
      '100% ISO 27001',
    ],
    totalStandardControls: 93,
    evaluatedControlsCount: 2,
    assessmentNote:
      'OneSpec hanya menguji 2 kontrol teknis spesifik siklus hidup aplikasi (A.8.25 Secure Development Lifecycle dan A.8.26 Application Security Testing) dari total 93 kontrol Annex A ISO/IEC 27001:2022.',
    disclaimer:
      'Pengujian otomatis 2 kontrol teknis ini BUKAN merupakan audit sertifikasi ISMS ISO/IEC 27001 organisasi.',
  },

  ISO_31000: {
    id: 'ISO_31000',
    code: 'ISO 31000:2018',
    title: 'Risk management — Guidelines',
    domain: 'Risk Assessment & Threat Modeling',
    allowedWording: [
      'mengacu pada matriks dampak-kemungkinan ISO 31000:2018',
      'selaras dengan taksonomi risiko ISO 31000',
      'aligned with ISO 31000:2018 5x5 risk evaluation matrix',
    ],
    forbiddenWording: [
      'memenuhi ISO 31000',
      'tersertifikasi ISO 31000',
      'ISO 31000 certified',
      '100% ISO 31000',
    ],
    assessmentNote:
      'OneSpec memetakan profil risiko teknis aplikasi ke dalam matriks konsekuensi/probabilitas 5x5 (Inherent vs Residual).',
    disclaimer:
      'Register risiko teknis OneSpec mengacu pada ISO 31000:2018 dan melengkapi proses manajemen risiko enterprise organisasi.',
  },

  ISO_9001: {
    id: 'ISO_9001',
    code: 'ISO 9001:2015',
    title: 'Quality management systems — Requirements',
    domain: 'Document Control & Audit Ledgers (Clause 7.5)',
    allowedWording: [
      'mengacu pada prinsip pengendalian informasi terdokumentasi ISO 9001:2015 Klausul 7.5',
      'selaras dengan kontrol dokumen ISO 9001',
      'aligned with ISO 9001:2015 Clause 7.5 documented information practices',
    ],
    forbiddenWording: [
      'tersertifikasi ISO 9001',
      'memenuhi ISO 9001',
      'ISO 9001 certified',
      '100% ISO 9001',
    ],
    assessmentNote:
      'OneSpec menyediakan lembar kendali dokumen formal, riwayat revisi otomatis, dan pencatatan tanda tangan audit.',
    disclaimer:
      'Fitur kontrol dokumen mengacu pada prinsip ISO 9001:2015 Klausul 7.5 untuk keterlacakan audit rekayasa.',
  },

  ISO_25010: {
    id: 'ISO_25010',
    code: 'ISO/IEC 25010:2023',
    title: 'Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — Product quality model',
    domain: 'Software Product Quality Characteristics',
    allowedWording: [
      'mengacu pada karakteristik kualitas ISO/IEC 25010:2023',
      'selaras dengan model kualitas produk ISO 25010',
      'aligned with ISO/IEC 25010 quality characteristics',
    ],
    forbiddenWording: [
      'memenuhi ISO 25010',
      'tersertifikasi ISO 25010',
      'ISO 25010 certified',
    ],
    assessmentNote:
      'OneSpec mengevaluasi karakteristik fungsional, performa, reliabilitas, dan keamanan aplikasi.',
    disclaimer:
      'Model evaluasi kualitas perangkat lunak mengacu pada taksonomi ISO/IEC 25010:2023.',
  },

  ISO_5055: {
    id: 'ISO_5055',
    code: 'ISO/IEC 5055:2021',
    title: 'Information technology — Software measurement — Software quality measurement — Automated source code quality measures',
    domain: 'Automated Source Code Structural Quality (Not SRE Readiness)',
    allowedWording: [
      'mengacu pada ukuran kualitas kode sumber otomatis ISO/IEC 5055:2021 (jika analisis AST struktural dijalankan)',
      'aligned with ISO/IEC 5055 source code structural quality measures',
    ],
    forbiddenWording: [
      'ISO 5055 SRE Readiness Score',
      'iso5055_SreReadinessScore',
      'memenuhi ISO 5055',
      'tersertifikasi ISO 5055',
    ],
    assessmentNote:
      'CATATAN PERUNTUKAN RESMI: ISO/IEC 5055 mengukur kelemahan struktural kode sumber otomatis (Security, Reliability, Performance Efficiency, Maintainability). ISO 5055 BUKAN ukuran kesiapan SRE (SRE Readiness). Skor kesiapan operasional OneSpec adalah "Skor Kesiapan Produksi Internal OneSpec", bukan ISO 5055.',
    disclaimer:
      'OneSpec secara eksplisit TIDAK mengaitkan metrik operasional/SRE dengan standar ISO/IEC 5055.',
  },

  PCI_DSS: {
    id: 'PCI_DSS',
    code: 'PCI-DSS v4.0.1',
    title: 'Payment Card Industry Data Security Standard',
    domain: 'Payment Card & Web Session Security Controls',
    allowedWording: [
      'mengacu pada kontrol teknis spesifik PCI-DSS v4.0 (Req 6.4 & Req 8.3)',
      'selaras dengan pengujian keamanan aplikasi PCI-DSS',
      'aligned with PCI-DSS v4.0 technical web application requirements',
    ],
    forbiddenWording: [
      'PCI-DSS compliant',
      'tersertifikasi PCI-DSS',
      '100% PCI-DSS',
      'PCI-DSS certified',
    ],
    totalStandardControls: 300,
    evaluatedControlsCount: 2,
    assessmentNote:
      'OneSpec hanya menguji 2 kontrol teknis spesifik terkait web application protection (Req 6.4) dan session authentication (Req 8.3) dari ratusan persyaratan PCI-DSS.',
    disclaimer:
      'Pengujian otomatis kontrol aplikasi ini BUKAN merupakan sertifikasi kepatuhan PCI-DSS (RoC/SAQ).',
  },

  OWASP_ASVS: {
    id: 'OWASP_ASVS',
    code: 'OWASP ASVS v4.0.3 & OWASP API Top 10 (2023)',
    title: 'OWASP Application Security Verification Standard & API Security',
    domain: 'Application Security Verification',
    allowedWording: [
      'mengacu pada panduan pengujian OWASP ASVS v4.0.3 / OWASP API Security Top 10 (2023)',
      'selaras dengan kontrol verifikasi keamanan OWASP ASVS',
    ],
    forbiddenWording: [
      'bersertifikat OWASP',
      'memenuhi 100% OWASP',
      'OWASP certified',
    ],
    assessmentNote:
      'OneSpec melakukan audit keamanan aktif terhadap header HTTP, proteksi BOLA/BFLA, dan sanitasi input.',
    disclaimer:
      'Pengujian keamanan otomatis memberikan verifikasi empiris tanpa menggantikan penetration testing manual mendalam.',
  },

  UU_PDP: {
    id: 'UU_PDP',
    code: 'UU No. 27 Tahun 2022',
    title: 'Undang-Undang Perlindungan Data Pribadi Republik Indonesia',
    domain: 'Personal Data Protection (Indonesia)',
    allowedWording: [
      'mengacu pada kewajiban pelindungan data pribadi UU PDP No. 27/2022',
      'selaras dengan perlindungan kerahasiaan data pribadi UU PDP',
    ],
    forbiddenWording: [
      'memenuhi 100% UU PDP',
      'tersertifikasi UU PDP',
    ],
    assessmentNote:
      'OneSpec memverifikasi masking PII pada input form, payload API, dan visual screenshot.',
    disclaimer:
      'Evaluasi kepatuhan teknis OneSpec mendukung tata kelola perlindungan data dan bukan opini legal resmi.',
  },

  POJK_BI: {
    id: 'POJK_BI',
    code: 'POJK 11/POJK.03/2022 & PADG PBI No. 23/2021',
    title: 'Ketahanan Siber dan Penyelenggaraan Teknologi Informasi Bank Umum / PBI',
    domain: 'Banking & Financial Technology Controls (Indonesia)',
    allowedWording: [
      'mengacu pada kontrol ketahanan siber POJK 11/2022 & PADG PBI',
      'selaras dengan persyaratan keamanan teknologi informasi finansial',
    ],
    forbiddenWording: [
      'memenuhi 100% POJK',
      'disetujui OJK / BI',
    ],
    assessmentNote:
      'OneSpec menguji proteksi autentikasi, integritas transaksi, dan audit trail log.',
    disclaimer:
      'Evaluasi teknis OneSpec selaras dengan panduan POJK/PBI dan tidak mewakili akreditasi dari regulator.',
  },
};

/**
 * Returns the official standard claim definition by identifier key.
 */
export function getIsoClaim(standardKey: string): IsoClaimDefinition | undefined {
  return ISO_CLAIMS[standardKey];
}

/**
 * Formats control coverage honestly without deceptive "100%" claims.
 * Ticket T-15 (F-22): Displays "2 dari N kontrol yang berlaku dinilai"
 * with optional standard-wide denominator context.
 */
export function formatControlCoverage(
  evaluated: number,
  totalApplicable: number,
  standardTotal?: number
): string {
  if (standardTotal && standardTotal > totalApplicable) {
    return `${evaluated} dari ${totalApplicable} kontrol yang berlaku dinilai (cakupan terbatas: ${evaluated} dari total ${standardTotal} kontrol standar)`;
  }
  return `${evaluated} dari ${totalApplicable} kontrol yang berlaku dinilai`;
}

/**
 * Validates text to ensure no forbidden/deceptive standard claims are made.
 */
export function validateClaimWording(text: string): { isValid: boolean; violations: string[] } {
  const violations: string[] = [];

  // Check for unqualified 100% ISO 27001 / PCI-DSS claims
  const deceptivePatterns = [
    { regex: /ISO\s*27001\s*100%/i, msg: 'Klaim "ISO 27001 100%" dilarang tanpa menyebut pembilang/penyebut cakupan kontrol nyata.' },
    { regex: /100%\s*(?:controls?\s*)?(?:untuk\s*)?ISO\s*27001/i, msg: 'Klaim 100% ISO 27001 menyiratkan kepatuhan penuh yang tidak valid.' },
    { regex: /PCI[\s-]*DSS\s*100%/i, msg: 'Klaim "PCI-DSS 100%" dilarang tanpa menyebut pembilang/penyebut cakupan kontrol nyata.' },
    { regex: /iso5055_SreReadinessScore/i, msg: 'ISO/IEC 5055 bukan skor kesiapan SRE. Gunakan skor internal OneSpec.' },
    { regex: /ISO\s*5055\s*SRE/i, msg: 'ISO 5055 tidak boleh dikaitkan dengan skor kesiapan SRE.' },
    { regex: /tersertifikasi\s+ISO/i, msg: 'Frasa "tersertifikasi ISO" dilarang. Gunakan "mengacu pada" atau "selaras dengan".' },
    { regex: /ISO\s+certified/i, msg: 'Phrase "ISO certified" is forbidden. Use "aligned with" or "refers to".' },
  ];

  for (const { regex, msg } of deceptivePatterns) {
    if (regex.test(text)) {
      violations.push(msg);
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}
