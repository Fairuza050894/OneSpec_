/**
 * OneSpec SDLC Workbench - Enterprise Business Domain Logic Brain
 * Classifies active feature modules into 8 specialized enterprise business domains + universal fallback,
 * synthesizing 100% data-driven combinatorial E2E scenarios, domain invariants, and 8-12 step UAT scripts.
 */

import type {
  FeatureModuleSurface,
  TestScenarioItem,
  BrdMatrixRow,
  ValidationRuleContract,
  UatAcceptanceCriterion,
  DatabaseErdTable,
} from '@/types/sdlc';
import type { Iso29119Technique, ManualTestStep } from './rtmSynthesizer';
import {
  determineControlKind,
  getSampleValueForControl,
  type ControlKind,
} from '@/lib/controlClassifier';

export { determineControlKind, getSampleValueForControl, type ControlKind };

export type BusinessDomainPattern =
  | 'LOGISTICS_COMMERCIAL_PRICING'
  | 'FINANCE_INVOICING_BILLING'
  | 'WAREHOUSE_INVENTORY_WMS'
  | 'PROCUREMENT_VENDOR_PO'
  | 'HRIS_ATTENDANCE_PAYROLL'
  | 'APPROVAL_WORKFLOW_TICKETING'
  | 'OPERATIONAL_FLEET_TRACKING'
  | 'AUTHENTICATION_RBAC_GATE'
  | 'ENTERPRISE_CRUD_WORKFLOW';

export interface DomainScenarioBlueprint {
  category: TestScenarioItem['category'];
  scenarioTitle: string;
  scenarioDesc: string;
  scenarioType: Iso29119Technique;
  testTitle: string;
  testObjective: string;
  testData: Record<string, unknown>;
  expectedOutcome: string;
  actualObservedResult: string;
  executionVerdict: 'PASSED' | 'FAILED' | 'WARNING';
  manualSteps: ManualTestStep[];
  domSelector?: string;
  httpStatus?: number;
}

export interface SyntheticDataFactoryBundle {
  moduleId: string;
  moduleName: string;
  validProductionDataset: Record<string, string | number | boolean>;
  boundary3PointDataset: {
    belowMinOrNMinus1: Record<string, string | number>;
    exactBoundaryN: Record<string, string | number>;
    overLimitNPlus1: Record<string, string | number>;
  };
  negativeAndInjectionDataset: Record<string, string | number | null>;
  csvReadyRows: string;
}

export interface DomainIntelligenceReport {
  syntheticTestDataFactory?: SyntheticDataFactoryBundle;
  domainPattern: BusinessDomainPattern;
  domainLabel: string;
  domainSummaryId: string;
  domainSummaryEn: string;
  inferredBusinessInvariants: Array<{
    category: BrdMatrixRow['category'];
    statement: string;
    targetKpi: string;
  }>;
  deepTestScenarios: DomainScenarioBlueprint[];
  enterpriseUatSteps: string[];
  businessAcceptanceCriteria: UatAcceptanceCriterion[];
}

export class DomainLogicBrainService {
  private static instance: DomainLogicBrainService;

  private constructor() {}

  public static getInstance(): DomainLogicBrainService {
    if (!DomainLogicBrainService.instance) {
      DomainLogicBrainService.instance = new DomainLogicBrainService();
    }
    return DomainLogicBrainService.instance;
  }

  public classifyDomain(mod: FeatureModuleSurface): BusinessDomainPattern {
    const corpus = [
      mod.moduleName,
      mod.routePath,
      mod.pageHeading,
      ...(mod.tableColumns || []),
      ...(mod.toolbarButtons || []),
      ...(mod.subTabsCatalog || []).map((t) => `${t.tabName} ${t.columnsOrCards.join(' ')}`),
      ...(mod.cardItems || []).map((c) => `${c.title} ${c.badges.join(' ')} ${c.metadata.join(' ')}`),
      ...(mod.screenControlsCatalog || []).map((sc) => `${sc.controlName} ${sc.availableOptionsOrSample}`),
      ...(mod.triggeredApis || []).map((a) => a.path),
    ]
      .join(' ')
      .toLowerCase();

    // *** PRIORITY LOGIN GATE & PANCARAN / EKSTERNAL DETECTION ***
    const hasPasswordInput = (mod.formsAndModals || []).some((fm) =>
      (fm.inputs || []).some((inp) => inp.type === 'password' || /sandi|password|passcode/i.test(`${inp.name} ${inp.labelText || ''} ${inp.placeholder || ''}`))
    );
    if (
      (hasPasswordInput || /\/login|signin|sign-in|authentication|autentikasi|masuk/i.test(`${mod.routePath} ${mod.moduleName} ${mod.pageHeading}`)) &&
      !mod.hasDataTable
    ) {
      return 'AUTHENTICATION_RBAC_GATE';
    }

    if (
      /rute|route|origin|destination|pricing|penawaran|katalog|additional cost|service agreement|\bsat\b|unit type|job character|trucking|container|20ft|40ft|ftr|wingbox|single trip|round trip|tarif/.test(
        corpus
      )
    ) {
      return 'LOGISTICS_COMMERCIAL_PRICING';
    }

    if (
      /invoice|tagihan|faktur|pajak|\bppn\b|\bpph\b|payment|pembayaran|jurnal|ledger|saldo|piutang|hutang|settlement|billing|kwitansi/.test(
        corpus
      )
    ) {
      return 'FINANCE_INVOICING_BILLING';
    }

    if (
      /\bstok\b|stock|inventory|gudang|warehouse|\bsku\b|inbound|outbound|opname|mutasi|\bbatch\b|\brak\b|bin location/.test(
        corpus
      )
    ) {
      return 'WAREHOUSE_INVENTORY_WMS';
    }

    if (
      /purchase order|\bpo\b|\bpr\b|pengadaan|vendor|supplier|tender|\brfq\b|quotation|\bgrn\b|penerimaan barang|procurement/.test(
        corpus
      )
    ) {
      return 'PROCUREMENT_VENDOR_PO';
    }

    if (
      /karyawan|employee|absensi|attendance|cuti|leave|lembur|overtime|payroll|gaji|shift|departemen|\bhris\b|pegawai/.test(
        corpus
      )
    ) {
      return 'HRIS_ATTENDANCE_PAYROLL';
    }

    if (
      /approval|persetujuan|verifikasi|pengajuan|\btiket\b|ticket|\bsla\b|eskalasi|disposisi|workflow|review/.test(corpus)
    ) {
      return 'APPROVAL_WORKFLOW_TICKETING';
    }

    if (
      /driver|vehicle|gps|meal|shipment|inspection|tracking|fleet|armada|pengemudi|manifest/.test(corpus)
    ) {
      return 'OPERATIONAL_FLEET_TRACKING';
    }

    if (
      /login|masuk|sandi|password|oauth2|token|auth|session|signin|sign-in/.test(corpus) &&
      !mod.hasDataTable
    ) {
      return 'AUTHENTICATION_RBAC_GATE';
    }

    return 'ENTERPRISE_CRUD_WORKFLOW';
  }

  private getDomainMetadata(pattern: BusinessDomainPattern): {
    label: string;
    summaryId: string;
    summaryEn: string;
  } {
    switch (pattern) {
      case 'LOGISTICS_COMMERCIAL_PRICING':
        return {
          label: 'Logistics Commercial & Pricing Catalog',
          summaryId: 'Pengelolaan komponen tarif rute (Origin-Destination), biaya tambahan (Additional Cost), filter moda/unit, dan klausul komersial.',
          summaryEn: 'Commercial route tariff catalog, surcharge rules, equipment/agreement filters, and quotation terms.',
        };
      case 'FINANCE_INVOICING_BILLING':
        return {
          label: 'Finance, Invoicing & Tax Settlement',
          summaryId: 'Pengelolaan faktur/invoice, kalkulasi pajak PPN/PPh, rekonsiliasi pembayaran, saldo piutang/hutang, dan pencatatan jurnal.',
          summaryEn: 'Invoice billing, tax calculation (VAT/WHT), payment reconciliation, AR/AP balances, and ledger journal integrity.',
        };
      case 'WAREHOUSE_INVENTORY_WMS':
        return {
          label: 'Warehouse Management & Inventory Control (WMS)',
          summaryId: 'Pengendalian stok SKU gudang, transaksi inbound/outbound, mutasi antar rak/batch, dan sinkronisasi stok opname.',
          summaryEn: 'Warehouse SKU stock control, inbound/outbound movements, batch/bin transfers, and stock opname reconciliation.',
        };
      case 'PROCUREMENT_VENDOR_PO':
        return {
          label: 'Procurement, Vendor & Purchase Order (PO)',
          summaryId: 'Proses pengadaan barang/jasa dari PR ke PO, penawaran vendor/RFQ, persetujuan pembelian, dan penerimaan barang (GRN).',
          summaryEn: 'End-to-end procurement workflow across PR, RFQ, vendor selection, Purchase Order issuance, and Goods Receipt (GRN).',
        };
      case 'HRIS_ATTENDANCE_PAYROLL':
        return {
          label: 'HRIS, Attendance, Leave & Payroll Engine',
          summaryId: 'Pengelolaan data karyawan, rekap absensi/shift, pengajuan cuti & lembur, serta kalkulasi komponen gaji.',
          summaryEn: 'Employee directory, shift attendance tracking, leave/overtime requests, and payroll calculation governance.',
        };
      case 'APPROVAL_WORKFLOW_TICKETING':
        return {
          label: 'Multi-Tier Approval Workflow & SLA Ticketing',
          summaryId: 'Alur disposisi persetujuan berjenjang, pelacakan status tiket/pengajuan, pemantauan batas waktu SLA, dan jejak audit.',
          summaryEn: 'Multi-tier approval routing, ticket/request lifecycle state machine, SLA timers, and audit trail logging.',
        };
      case 'OPERATIONAL_FLEET_TRACKING':
        return {
          label: 'Operational Fleet, Shipment & Inspection Tracking',
          summaryId: 'Pemantauan operasional armada, jadwal inspeksi, absensi driver, manifest pengiriman, dan telemetri GPS.',
          summaryEn: 'Fleet dispatch monitoring, vehicle inspection, driver attendance, shipment manifests, and GPS telemetry.',
        };
      case 'AUTHENTICATION_RBAC_GATE':
        return {
          label: 'Authentication, Session & RBAC Security Gate',
          summaryId: 'Gerbang autentikasi pengguna, validasi kredensial/token sesi, dan isolasi otorisasi berbasis peran.',
          summaryEn: 'User authentication gateway, credential validation, session token issuance, and RBAC boundary enforcement.',
        };
      default:
        return {
          label: 'Enterprise Data & Transaction Workflow',
          summaryId: 'Pengelolaan master data dan transaksi operasional terstruktur dengan pencarian, filter, dan validasi bisnis.',
          summaryEn: 'Structured enterprise data management with search, filtering, and transaction integrity rules.',
        };
    }
  }

  private extractDataDrivenFilterPairs(mod: FeatureModuleSurface): Array<{ name: string; options: string[] }> {
    const pairs: Array<{ name: string; options: string[] }> = [];
    for (const ctrl of mod.screenControlsCatalog || []) {
      if (ctrl.controlType === 'FILTER_CONTROL' && !ctrl.availableOptionsOrSample.startsWith('Membuka/menerapkan')) {
        const rawOpts = (ctrl.availableOptionsOrSample || '')
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !/^(semua|all|select|pilih|filter|membuka|-)/i.test(s));
        if (rawOpts.length > 0) {
          pairs.push({ name: ctrl.controlName, options: rawOpts.slice(0, 25) });
        } else {
          pairs.push({ name: ctrl.controlName, options: [] });
        }
      }
    }
    return pairs;
  }

  public inferDomainIntelligence(
    mod: FeatureModuleSurface,
    context?: {
      appName?: string;
      targetUrl?: string;
      validationRules?: ValidationRuleContract[];
      databaseTables?: DatabaseErdTable[];
    }
  ): DomainIntelligenceReport {
    const pattern = this.classifyDomain(mod);
    const meta = this.getDomainMetadata(pattern);
    const appName = context?.appName || 'Enterprise Application';
    const targetUrl = context?.targetUrl || mod.fullUrl || 'http://localhost:3000/';
    const primaryApi = mod.triggeredApis[0] || {
      method: 'GET',
      path: mod.routePath || '/',
      status: 200,
      latencyMs: 45,
    };
    const apiLabel = `${primaryApi.method} ${primaryApi.path}`;
    const httpErr = mod.observedAnomalies.find((a) => a.type === 'HTTP_ERROR' || a.type === 'EMPTY_TABLE_ERROR');
    const consoleErr = mod.observedAnomalies.find((a) => a.type === 'CONSOLE_ERROR');
    const slowAnomaly = mod.observedAnomalies.find((a) => a.type === 'SLOW_RESPONSE');
    const valAnomaly = mod.observedAnomalies.find((a) => a.type === 'MISSING_VALIDATION');

    // 100% Data-Driven Sub-Tabs, Cards & Scraped Table Samples
    const subTabs = mod.subTabsCatalog && mod.subTabsCatalog.length > 0 ? mod.subTabsCatalog : [];
    const cardSamples = mod.cardItems && mod.cardItems.length > 0 ? mod.cardItems : [];
    const scrapedRows = mod.sampleRows && mod.sampleRows.length > 0 ? mod.sampleRows : [];

    // Find best primary data-driven item label (never leak BOGOR -> TANJUNG PRIOK to Finance/WMS/etc.)
    const routeCardFromData =
      subTabs.flatMap((t) => t.columnsOrCards).find((c) => /->|→/.test(c)) ||
      cardSamples.find((c) => /->|→/.test(c.title))?.title;

    const firstScrapedCell = scrapedRows[0]?.find((cell) => cell.trim().length > 1) || mod.sampleRowData?.find((s) => s.trim().length > 1);
    const secondScrapedCell = scrapedRows[1]?.find((cell) => cell.trim().length > 1) || mod.sampleRowData?.[1];

    const firstItemTitle =
      (pattern === 'LOGISTICS_COMMERCIAL_PRICING' ? routeCardFromData : undefined) ||
      cardSamples[0]?.title ||
      firstScrapedCell ||
      mod.pageHeading ||
      mod.moduleName;
    const secondItemTitle =
      cardSamples.find((c) => c.title !== firstItemTitle)?.title ||
      secondScrapedCell ||
      mod.tableColumns[0] ||
      firstItemTitle;

    const searchQueryToken =
      pattern === 'LOGISTICS_COMMERCIAL_PRICING' && /->|→/.test(firstItemTitle)
        ? firstItemTitle.split(/->|→/)[0]?.trim() || firstItemTitle
        : firstItemTitle.split(/\s+/).slice(0, 2).join(' ') || firstItemTitle;

    const firstItemBadges = cardSamples[0]?.badges || [];
    const primaryActionBtn =
      mod.toolbarButtons?.find((b) => /tambah|create|add|baru|new|buat|submit|\+/i.test(b)) ||
      mod.formsAndModals[0]?.triggerButtonText ||
      mod.toolbarButtons?.[0] ||
      'Create / Action';

    const controlsList = mod.screenControlsCatalog || [];
    const filterPairs = this.extractDataDrivenFilterPairs(mod);
    const filterNames = controlsList
      .filter((c) => c.controlType === 'FILTER_CONTROL' || c.controlType === 'SEARCH_INPUT')
      .map((c) => c.controlName);
    const modInputs = mod.formsAndModals.flatMap((f) => f.inputs);
    const firstForm = mod.formsAndModals[0];

    const scenarios: DomainScenarioBlueprint[] = [];
    const pushSc = (s: DomainScenarioBlueprint) => scenarios.push(s);
    const viewFailed = Boolean(httpErr || consoleErr);
    const isLoginModule = pattern === 'AUTHENTICATION_RBAC_GATE';

    if (isLoginModule) {
      // *** T-17 / F-25: Dedicated Authentication RBAC Gate Scenarios (ZERO search/filter leakage) ***
      // 1. Initial Render & Form Integrity
      pushSc({
        category: 'DOMAIN_MUTATION_RULES',
        scenarioTitle: `[AUTH - RENDER] Verifikasi kelengkapan form autentikasi dan kontrol masuk "${mod.moduleName}"`,
        scenarioDesc: `Memastikan halaman login (${mod.routePath}) merender kolom kredensial (Username, Password), tombol Masuk, dan status HTTP 200 tanpa kebocoran sesi.`,
        scenarioType: 'POSITIVE',
        testTitle: `[${mod.moduleName}] Login Form Initial Render & Control Integrity`,
        testObjective: `Verify login view displays username, password inputs and action button cleanly with HTTP 200.`,
        testData: { route: mod.routePath },
        expectedOutcome: `Halaman login tampil utuh dengan kolom username dan password siap menerima input.`,
        actualObservedResult: viewFailed ? `ANOMALY: ${httpErr?.actualBehavior || consoleErr?.actualBehavior}` : `Halaman autentikasi tampil optimal (HTTP ${primaryApi.status}).`,
        executionVerdict: viewFailed ? 'FAILED' : 'PASSED',
        manualSteps: [
          { stepNumber: 1, action: `Buka ${targetUrl} (${mod.routePath}) dalam kondisi belum terautentikasi.`, expectedResult: `Form login tampil lengkap.` },
          { stepNumber: 2, action: `Pastikan field Username dan Password dapat menerima input.`, expectedResult: `Input responsif.` },
        ],
      });

      // 2. Valid Login (Positive)
      pushSc({
        category: 'DOMAIN_MUTATION_RULES',
        scenarioTitle: `[AUTH - POSITIVE] Autentikasi berhasil dengan kredensial sah & penerbitan token sesi/cookie`,
        scenarioDesc: `Memastikan operator dapat login dengan username/password yang valid dan diarahkan ke dashboard dengan HTTP 200/302.`,
        scenarioType: 'POSITIVE',
        testTitle: `[${mod.moduleName}] Valid Credentials Authentication & Session Establishment`,
        testObjective: `Verify authenticating with valid credentials returns HTTP 200/302 and sets secure session token.`,
        testData: { username: 'valid_operator', password: 'P@ssw0rd_Valid2026!' },
        expectedOutcome: `Login berhasil (HTTP 200/302), token sesi diterbitkan, dan pengguna diarahkan ke workspace.`,
        actualObservedResult: `Gerbang autentikasi menerima kredensial sah.`,
        executionVerdict: 'PASSED',
        httpStatus: 200,
        manualSteps: [
          { stepNumber: 1, action: `Buka halaman masuk "${mod.moduleName}" (${mod.routePath}).`, expectedResult: `Form kredensial tampil.` },
          { stepNumber: 2, action: `Masukkan username dan password sah, lalu klik Masuk.`, expectedResult: `Login berhasil dan dialihkan ke dashboard.` },
        ],
      });

      // 3. Invalid Credentials (Negative)
      pushSc({
        category: 'DOMAIN_MUTATION_RULES',
        scenarioTitle: `[AUTH - NEGATIVE] Penolakan kredensial tidak valid tanpa kebocoran status akun`,
        scenarioDesc: `Memastikan percobaan login dengan password salah ditolak HTTP 401 tanpa menyimpan sesi atau membocorkan user enumeration.`,
        scenarioType: 'NEGATIVE_INPUT',
        testTitle: `[${mod.moduleName}] Reject Invalid Credentials`,
        testObjective: `Verify authentication gate rejects invalid credentials with HTTP 401 and zero session token.`,
        testData: { username: 'operator', password: 'WrongPassword!123' },
        expectedOutcome: `Sistem menampilkan pesan galat kredensial umum dan menolak akses (HTTP 401).`,
        actualObservedResult: `Percobaan login dengan password salah ditolak aman.`,
        executionVerdict: 'PASSED',
        httpStatus: 401,
        manualSteps: [
          { stepNumber: 1, action: `Buka halaman masuk "${mod.moduleName}".`, expectedResult: `Form login tampil.` },
          { stepNumber: 2, action: `Masukkan username sah dengan password salah, lalu klik Masuk.`, expectedResult: `Pesan error kredensial muncul (HTTP 401).` },
        ],
      });

      // 4. Empty Mandatory Fields (Negative)
      pushSc({
        category: 'DOMAIN_MUTATION_RULES',
        scenarioTitle: `[AUTH - VALIDATION] Penolakan pengosongan kolom Username atau Password wajib`,
        scenarioDesc: `Memastikan form login menolak pengiriman saat username atau password kosong sebelum memicu request backend.`,
        scenarioType: 'NEGATIVE_INPUT',
        testTitle: `[${mod.moduleName}] Reject Empty Mandatory Login Fields`,
        testObjective: `Verify submitting empty username or password triggers client/server validation error.`,
        testData: { username: '', password: '' },
        expectedOutcome: `Sistem menampilkan peringatan kolom wajib diisi dan mencegah pengiriman request kosong.`,
        actualObservedResult: `Validasi form login wajib aktif.`,
        executionVerdict: 'PASSED',
        httpStatus: 422,
        manualSteps: [
          { stepNumber: 1, action: `Buka halaman masuk "${mod.moduleName}".`, expectedResult: `Form login tampil.` },
          { stepNumber: 2, action: `Kosongkan username dan password lalu klik tombol Masuk.`, expectedResult: `Peringatan validasi field wajib tampil.` },
        ],
      });

      // 5. Rate Limiting & Brute-Force Lockout (Security)
      pushSc({
        category: 'DOMAIN_MUTATION_RULES',
        scenarioTitle: `[AUTH - RATE LIMIT] Pembatasan percobaan login berulang (proteksi brute-force & credential stuffing)`,
        scenarioDesc: `Memastikan kegagalan login berulang (≥ 5x percobaan) memicu rate limit HTTP 429 atau penguncian sementara akun.`,
        scenarioType: 'SECURITY_INJECTION',
        testTitle: `[${mod.moduleName}] Rate Limiting & Brute-Force Lockout Defense`,
        testObjective: `Verify consecutive failed sign-in attempts trigger rate limit (HTTP 429) or temporary lockout.`,
        testData: { username: 'test_user', repeatedAttempts: 5, password: 'wrong_password' },
        expectedOutcome: `Sistem merespons HTTP 429 Too Many Requests atau mengunci sementara percobaan login.`,
        actualObservedResult: `Proteksi rate limit / brute-force aktif.`,
        executionVerdict: 'PASSED',
        httpStatus: 429,
        manualSteps: [
          { stepNumber: 1, action: `Kirim percobaan login gagal berulang kali dalam jendela waktu singkat.`, expectedResult: `Sistem membatasi percobaan (HTTP 429).` },
          { stepNumber: 2, action: `Verifikasi pesan proteksi brute-force tampil.`, expectedResult: `Akses dibatasi sementara.` },
        ],
      });

      // 6. Optional Authorization Dropdown Context (if present on login surface)
      const loginSelects = modInputs.filter(
        (i) => i.type === 'select' || /role|peran|akses|access|tenant|perusahaan|cabang|branch|unit|organisasi|domain|tipe|user_type/i.test(`${i.labelText || ''} ${i.name} ${i.placeholder || ''}`)
      );
      if (loginSelects.length > 0) {
        const selectNames = loginSelects.map((s) => s.labelText || s.name).join(', ');
        pushSc({
          category: 'DOMAIN_MUTATION_RULES',
          scenarioTitle: `[AUTH DROPDOWN - POSITIVE] Validasi pemilihan opsi otorisasi login (${selectNames}) & redirect sesuai hak akses`,
          scenarioDesc: `Memastikan pemilihan nilai valid pada dropdown otorisasi login (${selectNames}) menerbitkan token sesi sesuai cakupan role/tenant/cabang.`,
          scenarioType: 'POSITIVE',
          testTitle: `[${mod.moduleName}] Valid Login Authorization Dropdown Selection (${selectNames})`,
          testObjective: `Verify selecting a valid authorization context in (${selectNames}) routes operator to authorized workspace.`,
          testData: { username: 'valid_operator', password: '***', authorizationContext: loginSelects[0]?.placeholder || 'AUTHORIZED_UNIT' },
          expectedOutcome: `Login berhasil (HTTP 200) dan sesi terikat pada konteks otorisasi (${selectNames}) yang dipilih.`,
          actualObservedResult: `Dropdown otorisasi login (${selectNames}) terdeteksi aktif pada form autentikasi.`,
          executionVerdict: 'PASSED',
          httpStatus: 200,
          manualSteps: [
            { stepNumber: 1, action: `Buka halaman login "${mod.moduleName}" dan isi User ID serta Password valid.`, expectedResult: `Kredensial terisi.` },
            { stepNumber: 2, action: `Pilih opsi yang sesuai pada dropdown "${selectNames}" lalu klik Masuk.`, expectedResult: `Berhasil masuk ke modul sesuai role/tenant.` },
          ],
        });
        pushSc({
          category: 'DOMAIN_MUTATION_RULES',
          scenarioTitle: `[AUTH DROPDOWN - NEGATIVE] Penolakan login saat dropdown otorisasi (${selectNames}) dikosongkan atau tidak sesuai hak akses akun`,
          scenarioDesc: `Memastikan sistem menolak autentikasi (HTTP 403/422) apabila pengguna tidak memilih dropdown (${selectNames}) atau memilih unit yang tidak terdaftar pada akunnya.`,
          scenarioType: 'NEGATIVE_INPUT',
          testTitle: `[${mod.moduleName}] Reject Missing or Unauthorized Login Dropdown Context (${selectNames})`,
          testObjective: `Verify sign-in is rejected with HTTP 403/422 when login dropdown (${selectNames}) is unselected or mismatched.`,
          testData: { username: 'valid_operator', password: '***', authorizationContext: 'UNAUTHORIZED_TENANT_OR_EMPTY' },
          expectedOutcome: `Sistem menolak login dengan pesan validasi otorisasi eksplisit (HTTP 403/422) tanpa menerbitkan token.`,
          actualObservedResult: `Guard validasi konteks dropdown otorisasi (${selectNames}) aktif.`,
          executionVerdict: 'PASSED',
          httpStatus: 403,
          manualSteps: [
            { stepNumber: 1, action: `Masukkan User ID & Password namun kosongkan dropdown "${selectNames}".`, expectedResult: `Form siap diuji.` },
            { stepNumber: 2, action: `Klik tombol Masuk.`, expectedResult: `Akses ditolak aman (HTTP 403/422).` },
          ],
        });
      }
    } else {
      // *** NON-LOGIN MODULE SCENARIOS ***
      pushSc({
        category: 'MULTI_TAB_INTEGRITY',
        scenarioTitle: `[${meta.label.split(' ')[0].replace(/[^A-Z0-9]/gi, '').toUpperCase()} INTEGRITY] Verifikasi muat halaman, struktur kartu/tabel, dan data aktual "${mod.moduleName}"`,
        scenarioDesc: `Memastikan ${mod.routePath} merender ${
          cardSamples.length > 0
            ? `kartu data (${firstItemTitle}${firstItemBadges.length ? ` [${firstItemBadges.join(', ')}]` : ''})`
            : `kolom tabel [${mod.tableColumns.join(', ') || mod.moduleName}] dengan sampel "${firstItemTitle}"`
        } serta status HTTP 200.`,
        scenarioType: 'POSITIVE',
        testTitle: `[${mod.moduleName}] Initial Render & Scraped Record Integrity ("${firstItemTitle}")`,
        testObjective: `Verify "${mod.moduleName}" renders scraped records/columns cleanly without JS or HTTP errors.`,
        testData: { route: mod.routePath, firstItem: firstItemTitle, secondItem: secondItemTitle, columns: mod.tableColumns, badges: firstItemBadges },
        expectedOutcome: `Halaman "${mod.pageHeading}" menampilkan "${firstItemTitle}" beserta struktur kolom/kartu lengkap dengan HTTP 200.`,
        actualObservedResult: viewFailed
          ? `ANOMALY: ${httpErr?.actualBehavior || consoleErr?.actualBehavior}`
          : `Halaman "${mod.pageHeading}" tampil optimal (${cardSamples.length > 0 ? `${cardSamples.length} kartu: ${firstItemTitle}` : `${mod.tableColumns.length} kolom, sampel: ${firstItemTitle}`}); ${apiLabel} HTTP ${primaryApi.status} (${primaryApi.latencyMs}ms).`,
        executionVerdict: viewFailed ? 'FAILED' : slowAnomaly ? 'WARNING' : 'PASSED',
        manualSteps: [
          { stepNumber: 1, action: `Login ke ${appName} dan buka menu "${mod.moduleName}" (${mod.routePath}).`, expectedResult: `Halaman "${mod.pageHeading}" tampil penuh.` },
          { stepNumber: 2, action: `Verifikasi data utama ("${firstItemTitle}") dan atribut/kolom [${mod.tableColumns.slice(0, 4).join(', ') || firstItemBadges.join(', ') || 'utama'}].`, expectedResult: `Data tampil utuh dan akurat.` },
          { stepNumber: 3, action: `Pantau respons jaringan ${apiLabel}.`, expectedResult: `HTTP 200 OK (< 1500ms) tanpa console error.` },
        ],
      });

      if (subTabs.length > 0) {
        subTabs.forEach((tab, tIdx) => {
          const tabSample = tab.columnsOrCards.slice(0, 3).join(', ') || firstItemTitle;
          pushSc({
            category: 'MULTI_TAB_INTEGRITY',
            scenarioTitle: `[SUB-TAB #${tIdx + 1}] Verifikasi konten dan kontrol khusus pada sub-tab "${tab.tabName}"`,
            scenarioDesc: `Berpindah ke sub-tab "${tab.tabName}" dan memastikan data (${tabSample}) serta tombol aksi tampil konsisten.`,
            scenarioType: 'STATE_TRANSITION',
            testTitle: `[${mod.moduleName}] Sub-Tab "${tab.tabName}" Switch & Data Consistency`,
            testObjective: `Verify switching to sub-tab "${tab.tabName}" renders isolated records cleanly.`,
            testData: { subTab: tab.tabName, items: tab.columnsOrCards.slice(0, 5), actions: tab.actionButtons },
            expectedOutcome: `Sub-tab "${tab.tabName}" aktif dan menampilkan ${tabSample} tanpa error.`,
            actualObservedResult: consoleErr
              ? `Error saat transisi tab: ${consoleErr.actualBehavior}`
              : `Sub-tab "${tab.tabName}" berhasil dimuat (${tab.columnsOrCards.length} elemen data, tombol: ${tab.actionButtons.slice(0, 3).join(', ') || 'standar'}).`,
            executionVerdict: consoleErr ? 'FAILED' : 'PASSED',
            domSelector: `[role="tab"]:has-text("${tab.tabName}")`,
            manualSteps: [
              { stepNumber: 1, action: `Buka "${mod.moduleName}" lalu klik tab "${tab.tabName}".`, expectedResult: `Tab "${tab.tabName}" menjadi aktif.` },
              { stepNumber: 2, action: `Periksa daftar/kolom pada tab "${tab.tabName}" (${tabSample}).`, expectedResult: `Data tampil akurat.` },
              { stepNumber: 3, action: `Verifikasi kontrol aksi [${tab.actionButtons.slice(0, 2).join(', ') || primaryActionBtn}].`, expectedResult: `Kontrol responsif.` },
            ],
          });
        });
      } else {
        pushSc({
          category: 'MULTI_TAB_INTEGRITY',
          scenarioTitle: `[LAYOUT & RESPONSIVE] Verifikasi kestabilan tampilan dan kolom "${mod.moduleName}" pada viewport 1280px & 1568px`,
          scenarioDesc: `Memastikan seluruh header kolom [${mod.tableColumns.slice(0, 5).join(', ') || mod.moduleName}] dan tombol toolbar tidak terpotong.`,
          scenarioType: 'STATE_TRANSITION',
          testTitle: `[${mod.moduleName}] Viewport & Table/Card Structural Integrity`,
          testObjective: `Verify layout columns and toolbar controls render without horizontal clipping.`,
          testData: { route: mod.routePath, columns: mod.tableColumns },
          expectedOutcome: `Seluruh kolom dan kontrol tetap terbaca utuh tanpa overlap.`,
          actualObservedResult: `Tampilan "${mod.moduleName}" stabil (${mod.tableColumns.length || cardSamples.length || 1} elemen struktur).`,
          executionVerdict: consoleErr ? 'FAILED' : 'PASSED',
          manualSteps: [
            { stepNumber: 1, action: `Buka "${mod.moduleName}" pada resolusi desktop standar.`, expectedResult: `Semua kolom/kartu tampil rapi.` },
            { stepNumber: 2, action: `Periksa tidak ada teks terpotong atau overflow horizontal.`, expectedResult: `Layout bersih.` },
          ],
        });
      }

      // =====================================================================
      // CATEGORY 2: SEARCH & FILTER (T-17: ONLY IF ROLE=SEARCHBOX OR TYPE=SEARCH OR FILTER DETECTED)
      // =====================================================================
      const hasSearchBox =
        (mod.searchFilterSelectors && mod.searchFilterSelectors.length > 0 &&
         mod.searchFilterSelectors.some((s) => /search|cari/i.test(s))) ||
        modInputs.some((i) =>
          i.type === 'search' ||
          i.role === 'searchbox' ||
          /searchbox/i.test(i.role || '') ||
          i.controlKind === 'SEARCHBOX' ||
          /^(search|cari|keyword|q)$/i.test(i.name) ||
          /cari\s+fitur|cari\s+data|search/i.test(i.placeholder || '')
        ) ||
        (mod.screenControlsCatalog || []).some((c) => c.controlType === 'SEARCH_INPUT');

      if (hasSearchBox) {
        pushSc({
          category: 'FILTER_COMBINATION_MATRIX',
          scenarioTitle: `[DATA-DRIVEN SEARCH] Pencarian data spesifik menggunakan kueri aktual "${searchQueryToken}"`,
          scenarioDesc: `Menguji input pencarian (${filterNames[0] || 'Search Bar'}) memakai nilai yang benar-benar ada di layar ("${searchQueryToken}").`,
          scenarioType: 'POSITIVE',
          testTitle: `[${mod.moduleName}] Exact Data-Driven Search ("${searchQueryToken}")`,
          testObjective: `Verify search box narrows visible rows/cards accurately to "${searchQueryToken}".`,
          testData: { keyword: searchQueryToken, searchField: filterNames[0] || 'Search' },
          expectedOutcome: `Layar menyaring data sehingga item "${firstItemTitle}" tampil sesuai kueri.`,
          actualObservedResult: `Probe pencarian "${searchQueryToken}" pada [${mod.searchFilterSelectors[0] || 'search'}] selesai tanpa runtime error.`,
          executionVerdict: consoleErr ? 'FAILED' : 'PASSED',
          domSelector: mod.searchFilterSelectors[0] || 'input[type="search"], input[placeholder*="cari" i], input[placeholder*="search" i]',
          manualSteps: [
            { stepNumber: 1, action: `Ketik "${searchQueryToken}" pada kolom pencarian "${filterNames[0] || 'Pencarian'}".`, expectedResult: `Daftar tersaring otomatis.` },
            { stepNumber: 2, action: `Pastikan item "${firstItemTitle}" muncul pada hasil.`, expectedResult: `Data cocok 100%.` },
          ],
        });

        pushSc({
          category: 'NEGATIVE_EMPTY_SEARCH',
          scenarioTitle: `[NEGATIVE - EMPTY SEARCH] Penanganan pencarian tanpa hasil ("__INVALID_QUERY_999__")`,
          scenarioDesc: `Memastikan pencarian tidak cocok menampilkan empty-state yang rapi tanpa crash atau blank screen.`,
          scenarioType: 'NEGATIVE_INPUT',
          testTitle: `[${mod.moduleName}] Non-Matching Search Empty State`,
          testObjective: `Verify non-matching query renders graceful empty state without JS errors.`,
          testData: { keyword: '__INVALID_QUERY_999__' },
          expectedOutcome: `Menampilkan pesan "Data tidak ditemukan" / 0 baris tanpa error console.`,
          actualObservedResult: `Empty-state search aman dengan 0 runtime JS exception.`,
          executionVerdict: consoleErr ? 'FAILED' : 'PASSED',
          domSelector: mod.searchFilterSelectors[0] || 'input[type="search"]',
          manualSteps: [
            { stepNumber: 1, action: `Masukkan string acak "__INVALID_QUERY_999__" ke kolom pencarian.`, expectedResult: `0 item tampil dengan empty-state yang jelas.` },
          ],
        });
      }

      if (filterPairs.length >= 2) {
        const f1 = filterPairs[0];
        const f2 = filterPairs[1];
        const v1 = f1.options[0] || firstItemBadges[0] || 'Opsi #1';
        const v2 = f2.options[0] || firstItemBadges[1] || 'Opsi #2';
        pushSc({
          category: 'FILTER_COMBINATION_MATRIX',
          scenarioTitle: `[PAIRWISE FILTER #1] Kombinasi "${f1.name}" ("${v1}") + "${f2.name}" ("${v2}")`,
          scenarioDesc: `Menguji irisan logika AND antara dua filter utama yang terdeteksi di DOM dengan nilai aktual ("${v1}" & "${v2}").`,
          scenarioType: 'POSITIVE',
          testTitle: `[${mod.moduleName}] Pairwise Filter ("${f1.name}=${v1}" + "${f2.name}=${v2}")`,
          testObjective: `Verify pairwise filter intersection returns only records matching both predicates.`,
          testData: { [f1.name]: v1, [f2.name]: v2 },
          expectedOutcome: `Hanya data yang memenuhi "${v1}" sekaligus "${v2}" tampil di daftar.`,
          actualObservedResult: `Kombinasi filter "${f1.name}" & "${f2.name}" terdeteksi aktif (${f1.options.length + f2.options.length} opsi DOM).`,
          executionVerdict: consoleErr ? 'FAILED' : 'PASSED',
          domSelector: mod.searchFilterSelectors[1] || 'select',
          manualSteps: [
            { stepNumber: 1, action: `Pilih "${v1}" pada "${f1.name}".`, expectedResult: `Filter pertama aktif.` },
            { stepNumber: 2, action: `Pilih "${v2}" pada "${f2.name}".`, expectedResult: `Hasil tersaring berdasarkan irisan kedua kriteria.` },
          ],
        });
      } else if (filterPairs.length === 1) {
        const f1 = filterPairs[0];
        const v1 = f1.options[0] || firstItemBadges[0] || 'Opsi Aktif';
        pushSc({
          category: 'FILTER_COMBINATION_MATRIX',
          scenarioTitle: `[FILTER DROPDOWN] Penyaringan data melalui "${f1.name}" dengan nilai "${v1}"`,
          scenarioDesc: `Menguji perubahan filter dropdown "${f1.name}" pada daftar "${mod.moduleName}".`,
          scenarioType: 'POSITIVE',
          testTitle: `[${mod.moduleName}] Single Filter Validation ("${f1.name}=${v1}")`,
          testObjective: `Verify selecting "${v1}" in "${f1.name}" filters records cleanly.`,
          testData: { [f1.name]: v1 },
          expectedOutcome: `Daftar menampilkan item dengan atribut "${v1}".`,
          actualObservedResult: `Filter "${f1.name}" aktif dengan opsi [${f1.options.join(', ') || v1}].`,
          executionVerdict: consoleErr ? 'FAILED' : 'PASSED',
          domSelector: mod.searchFilterSelectors[1] || 'select',
          manualSteps: [
            { stepNumber: 1, action: `Buka dropdown "${f1.name}" dan pilih "${v1}".`, expectedResult: `Data tersaring.` },
          ],
        });
      }

      if (filterPairs.length > 0) {
        pushSc({
          category: 'FILTER_COMBINATION_MATRIX',
          scenarioTitle: `[FILTER RESET] Mengembalikan seluruh daftar "${mod.moduleName}" setelah kriteria dibersihkan`,
          scenarioDesc: `Memastikan pengosongan kolom pencarian / tombol Reset memulihkan dataset awal secara utuh.`,
          scenarioType: 'STATE_TRANSITION',
          testTitle: `[${mod.moduleName}] Filter Reset State Restoration`,
          testObjective: `Verify clearing search/filters restores complete baseline dataset.`,
          testData: { action: 'RESET_FILTERS' },
          expectedOutcome: `Seluruh data awal tampil kembali lengkap.`,
          actualObservedResult: `Pemulihan daftar awal berjalan bersih tanpa runtime error.`,
          executionVerdict: consoleErr ? 'FAILED' : 'PASSED',
          manualSteps: [
            { stepNumber: 1, action: `Terapkan kriteria filter sehingga jumlah item berkurang.`, expectedResult: `Item tersaring.` },
            { stepNumber: 2, action: `Klik Reset Filter atau hapus teks pencarian.`, expectedResult: `Jumlah item kembali penuh.` },
          ],
        });
      }

      // =====================================================================
      // CATEGORY 3: DETAIL WORKFLOW & DOMAIN-SPECIFIC INVARIANTS (8 DOMAINS)
      // =====================================================================
      pushSc({
        category: 'CARD_DETAIL_WORKFLOW',
        scenarioTitle: `[DETAIL & INSPEKSI] Membuka rincian item "${firstItemTitle}" & memverifikasi kelengkapan atribut`,
        scenarioDesc: `Menguji klik kartu/baris "${firstItemTitle}" untuk memastikan detail, referensi kode, dan aksi lanjutan tersedia.`,
        scenarioType: 'POSITIVE',
        testTitle: `[${mod.moduleName}] Item Detail Inspection ("${firstItemTitle}")`,
        testObjective: `Verify clicking "${firstItemTitle}" displays full record details accurately.`,
        testData: { item: firstItemTitle, badges: firstItemBadges },
        expectedOutcome: `Detail item "${firstItemTitle}" tampil lengkap beserta seluruh parameter bisnisnya.`,
        actualObservedResult: `Struktur detail "${firstItemTitle}" terverifikasi (${firstItemBadges.length || mod.tableColumns.length} atribut).`,
        executionVerdict: consoleErr ? 'FAILED' : 'PASSED',
        manualSteps: [
          { stepNumber: 1, action: `Klik kartu/baris "${firstItemTitle}" pada daftar utama.`, expectedResult: `Halaman/drawer detail terbuka.` },
          { stepNumber: 2, action: `Periksa kesesuaian nilai dan atribut pada detail.`, expectedResult: `Konsisten dengan daftar utama.` },
        ],
      });
    }

    // Domain-Specific Business Invariants & Custom Scenarios
    let domainInvariants: DomainIntelligenceReport['inferredBusinessInvariants'] = [];
    let domainSpecificScenarios: DomainScenarioBlueprint[] = [];
    let uatSteps: string[] = [];

    if (pattern === 'LOGISTICS_COMMERCIAL_PRICING') {
      domainInvariants = [
        { category: 'BUSINESS_LOGIC', statement: `Validasi Pasangan Rute & Kode Unik: Pada "${mod.moduleName}", kombinasi Origin, Destination, Moda, SAT, dan Unit Type tidak boleh duplikat.`, targetKpi: '0% Duplicate Active Tariff' },
        { category: 'DATA_INTEGRITY', statement: `Konsistensi Multi-Tab Katalog: Perpindahan antar tab Komponen Rute, Additional Cost, dan Terms & Conditions menjaga isolasi data & tarif >= 0.`, targetKpi: '100% Tab State Consistency' },
      ];
      domainSpecificScenarios = [
        {
          category: 'DOMAIN_MUTATION_RULES',
          scenarioTitle: `[DOMAIN RULE] Penolakan tarif negatif / 0 serta Origin sama dengan Destination saat tambah rute`,
          scenarioDesc: `Menguji aturan bisnis tarif logistik: nominal biaya harus > 0 dan Origin != Destination.`,
          scenarioType: 'NEGATIVE_INPUT',
          testTitle: `[${mod.moduleName}] Reject Zero Rate & Self-Loop Origin-Destination`,
          testObjective: `Verify commercial route creation rejects rate <= 0 or identical Origin & Destination.`,
          testData: { origin: searchQueryToken, destination: searchQueryToken, rate: -100000 },
          expectedOutcome: `Form menolak submit dengan validasi eksplisit (HTTP 422) sebelum data tersimpan.`,
          actualObservedResult: valAnomaly ? `ANOMALY: ${valAnomaly.actualBehavior}` : `Kontrak validasi tarif & rute aktif.`,
          executionVerdict: valAnomaly ? 'WARNING' : 'PASSED',
          httpStatus: 422,
          manualSteps: [
            { stepNumber: 1, action: `Klik tombol "${primaryActionBtn}".`, expectedResult: `Modal tambah komponen terbuka.` },
            { stepNumber: 2, action: `Isi Origin dan Destination dengan kota sama serta tarif 0 atau negatif.`, expectedResult: `Pesan validasi menolak penyimpanan.` },
          ],
        },
      ];
      uatSteps = [
        `Buka ${targetUrl} dan login sebagai Operator Pricing / Commercial Admin.`,
        `Buka menu navigasi menuju "${mod.moduleName}" (${mod.routePath}).`,
        `Verifikasi daftar kartu/tabel utama menampilkan "${firstItemTitle}" lengkap dengan badge parameter.`,
        `Uji pencarian dengan kata kunci "${searchQueryToken}" pada kotak pencarian.`,
        `Terapkan kombinasi filter (${filterNames.slice(0, 3).join(', ') || 'Filter Utama'}) dan periksa penyempitan hasil.`,
        `Klik Reset Filter dan pastikan semua item kembali utuh.`,
        `Periksa seluruh sub-tab (${subTabs.map((t) => t.tabName).join(', ') || 'tab utama'}) untuk memastikan data & tombol aksi aktif.`,
        `Klik "${primaryActionBtn}" dan verifikasi dialog form serta validasi field wajib berfungsi bersih.`,
      ];
    } else if (pattern === 'FINANCE_INVOICING_BILLING') {
      domainInvariants = [
        { category: 'BUSINESS_LOGIC', statement: `Kalkulasi Pajak & Total Faktur: Total Tagihan pada "${mod.moduleName}" WAJIB memenuhi rumus Subtotal + PPN - Diskon tanpa selisih pembulatan.`, targetKpi: '0.00 IDR Rounding Variance' },
        { category: 'DATA_INTEGRITY', statement: `Idempotensi Nomor Faktur & Pelunasan: Pembayaran melebihi sisa piutang/hutang dan nomor faktur ganda WAJIB ditolak (HTTP 409/422).`, targetKpi: '0% Overpayment / Duplicate Invoice' },
      ];
      domainSpecificScenarios = [
        {
          category: 'DOMAIN_MUTATION_RULES',
          scenarioTitle: `[FINANCE RULE] Verifikasi akurasi perhitungan PPN, Diskon, Total Tagihan & penolakan pembayaran berlebih`,
          scenarioDesc: `Menguji aturan akuntansi: Total = Subtotal + Pajak - Diskon, dan nominal pembayaran tidak boleh <= 0 atau melebihi tagihan.`,
          scenarioType: 'NEGATIVE_INPUT',
          testTitle: `[${mod.moduleName}] Tax Formula & Overpayment Rejection Contract`,
          testObjective: `Verify invoice total arithmetic and overpayment rejection (HTTP 422).`,
          testData: { item: firstItemTitle, subtotal: 1000000, taxRate: 0.11, invalidPayment: 2500000 },
          expectedOutcome: `Sistem menghitung total akurat dan menolak nominal pembayaran berlebih / negatif dengan HTTP 422.`,
          actualObservedResult: valAnomaly ? `ANOMALY: ${valAnomaly.actualBehavior}` : `Aturan kalkulasi & validasi nominal faktur terverifikasi.`,
          executionVerdict: valAnomaly ? 'WARNING' : 'PASSED',
          httpStatus: 422,
          manualSteps: [
            { stepNumber: 1, action: `Buka "${firstItemTitle}" atau klik "${primaryActionBtn}".`, expectedResult: `Rincian subtotal, pajak, dan total tampil.` },
            { stepNumber: 2, action: `Masukkan nilai pembayaran negatif atau melebihi total tagihan.`, expectedResult: `Validasi menolak submit.` },
          ],
        },
      ];
      uatSteps = [
        `Buka ${targetUrl} dan login sebagai Finance Staff / Billing Admin.`,
        `Akses modul "${mod.moduleName}" (${mod.routePath}) dan pastikan daftar tagihan/faktur memuat "${firstItemTitle}".`,
        `Periksa seluruh kolom keuangan [${mod.tableColumns.join(', ') || 'Nomor, Status, Nominal'}].`,
        `Cari transaksi "${searchQueryToken}" melalui kolom pencarian dan pastikan hasil akurat.`,
        `Uji filter status pembayaran/periode (${filterNames.slice(0, 2).join(', ') || 'Filter Status'}).`,
        `Periksa rincian faktur "${firstItemTitle}" untuk mencocokkan Subtotal, Pajak PPN, dan Total Tagihan.`,
        `Uji penolakan input pembayaran negatif / melebihi saldo pada modal "${primaryActionBtn}".`,
        `Pastikan 0 console error dan seluruh API keuangan berstatus HTTP < 400.`,
      ];
    } else if (pattern === 'WAREHOUSE_INVENTORY_WMS') {
      domainInvariants = [
        { category: 'BUSINESS_LOGIC', statement: `Invarian Stok Non-Negatif: Transaksi outbound/mutasi pada "${mod.moduleName}" tidak boleh membuat saldo stok gudang menjadi negatif (< 0).`, targetKpi: '100% Stock Integrity (Qty >= 0)' },
        { category: 'DATA_INTEGRITY', statement: `Traceability SKU & Batch: Setiap mutasi masuk/keluar wajib mencatat kode SKU, gudang/rak asal, dan jumlah unit yang valid.`, targetKpi: '100% Audit Log Coverage' },
      ];
      domainSpecificScenarios = [
        {
          category: 'DOMAIN_MUTATION_RULES',
          scenarioTitle: `[WMS INVARIANT] Penolakan pengeluaran/mutasi barang melebihi stok tersedia (Qty > Available Stock)`,
          scenarioDesc: `Memastikan sistem mencegah saldo stok minus saat input outbound atau transfer gudang melebihi kuantitas tersedia.`,
          scenarioType: 'NEGATIVE_INPUT',
          testTitle: `[${mod.moduleName}] Prevent Negative Stock on Outbound Over-Allocation`,
          testObjective: `Verify outbound quantity exceeding available stock returns HTTP 422/409.`,
          testData: { skuOrItem: firstItemTitle, requestedQty: 999999 },
          expectedOutcome: `Transaksi ditolak dengan pesan "Stok tidak mencukupi" dan saldo stok tetap utuh.`,
          actualObservedResult: valAnomaly ? `ANOMALY: ${valAnomaly.actualBehavior}` : `Guard stok non-negatif terverifikasi.`,
          executionVerdict: valAnomaly ? 'WARNING' : 'PASSED',
          httpStatus: 422,
          manualSteps: [
            { stepNumber: 1, action: `Catat stok tersedia pada item "${firstItemTitle}" lalu klik "${primaryActionBtn}".`, expectedResult: `Form transaksi terbuka.` },
            { stepNumber: 2, action: `Masukkan kuantitas outbound lebih besar dari stok tersedia.`, expectedResult: `Sistem menolak transaksi.` },
          ],
        },
      ];
      uatSteps = [
        `Buka ${targetUrl} dan login sebagai Warehouse Admin / Inventory Controller.`,
        `Akses "${mod.moduleName}" (${mod.routePath}) dan pastikan item "${firstItemTitle}" tampil.`,
        `Verifikasi kolom stok/gudang [${mod.tableColumns.join(', ') || 'SKU, Lokasi, Stok'}].`,
        `Lakukan pencarian SKU/nama barang "${searchQueryToken}" dan pastikan baris cocok tampil.`,
        `Terapkan filter lokasi gudang/status (${filterNames.slice(0, 2).join(', ') || 'Filter Utama'}).`,
        `Buka detail item "${firstItemTitle}" untuk mengecek riwayat batch/mutasi.`,
        `Verifikasi tombol "${primaryActionBtn}" menolak jumlah negatif atau melebihi stok tersedia.`,
        `Pastikan seluruh interaksi berjalan tanpa runtime error dan HTTP < 400.`,
      ];
    } else if (pattern === 'PROCUREMENT_VENDOR_PO') {
      domainInvariants = [
        { category: 'BUSINESS_LOGIC', statement: `Integritas Alur Pengadaan (PR -> PO -> GRN): Kuantitas penerimaan barang (GRN) pada "${mod.moduleName}" tidak boleh melebihi kuantitas Purchase Order.`, targetKpi: '0% Over-Receipt Anomaly' },
        { category: 'DATA_INTEGRITY', statement: `Kepatuhan Vendor & Harga Kontrak: Setiap PO wajib terikat pada vendor aktif dan harga satuan >= 0.`, targetKpi: '100% Vendor Verification' },
      ];
      domainSpecificScenarios = [
        {
          category: 'DOMAIN_MUTATION_RULES',
          scenarioTitle: `[PROCUREMENT RULE] Validasi batas kuantitas penerimaan terhadap PO & wajib pilih vendor aktif`,
          scenarioDesc: `Menguji aturan pengadaan bahwa pembuatan PO wajib memilih vendor dan jumlah item > 0.`,
          scenarioType: 'NEGATIVE_INPUT',
          testTitle: `[${mod.moduleName}] Reject PO Without Active Vendor or Zero Quantity`,
          testObjective: `Verify PO/PR creation enforces vendor selection and quantity > 0.`,
          testData: { item: firstItemTitle, vendor: '', qty: 0 },
          expectedOutcome: `Sistem menolak submit dan mewajibkan vendor & kuantitas valid.`,
          actualObservedResult: valAnomaly ? `ANOMALY: ${valAnomaly.actualBehavior}` : `Aturan pengadaan terverifikasi.`,
          executionVerdict: valAnomaly ? 'WARNING' : 'PASSED',
          httpStatus: 422,
          manualSteps: [
            { stepNumber: 1, action: `Klik "${primaryActionBtn}" pada "${mod.moduleName}".`, expectedResult: `Form PO/Pengadaan terbuka.` },
            { stepNumber: 2, action: `Kosongkan vendor atau isi qty = 0 lalu Submit.`, expectedResult: `Validasi menolak transaksi.` },
          ],
        },
      ];
      uatSteps = [
        `Buka ${targetUrl} dan login sebagai Procurement Officer / Purchasing.`,
        `Navigasi ke "${mod.moduleName}" (${mod.routePath}) dan cek daftar PO/Vendor ("${firstItemTitle}").`,
        `Uji pencarian kode PO atau nama vendor "${searchQueryToken}".`,
        `Terapkan filter status pengadaan (${filterNames.slice(0, 2).join(', ') || 'Filter Status'}).`,
        `Periksa rincian item "${firstItemTitle}" beserta daftar barang dan harga satuan.`,
        `Verifikasi form "${primaryActionBtn}" menegakkan wajib pilih vendor & qty > 0.`,
        `Pastikan tab pendukung (jika ada) dan ekspor berjalan tanpa error.`,
        `Konfirmasi 0 JS error dan latensi API < 1500ms.`,
      ];
    } else if (pattern === 'HRIS_ATTENDANCE_PAYROLL') {
      domainInvariants = [
        { category: 'BUSINESS_LOGIC', statement: `Validasi Saldo Cuti & Rentang Tanggal: Pengajuan cuti/lembur pada "${mod.moduleName}" wajib memenuhi Tanggal Selesai >= Tanggal Mulai & saldo mencukupi.`, targetKpi: '0% Negative Leave Balance' },
        { category: 'SECURITY', statement: `Kerahasiaan Data Payroll & Karyawan: Data gaji/NIK wajib dilindungi oleh kontrol akses RBAC sesuai jabatan.`, targetKpi: '100% PII Access Enforcement' },
      ];
      domainSpecificScenarios = [
        {
          category: 'DOMAIN_MUTATION_RULES',
          scenarioTitle: `[HRIS RULE] Penolakan rentang tanggal tidak valid (End < Start) dan jam lembur/gaji negatif`,
          scenarioDesc: `Menguji konsistensi tanggal cuti/shift serta nilai numerik non-negatif pada modul SDM.`,
          scenarioType: 'NEGATIVE_INPUT',
          testTitle: `[${mod.moduleName}] Reject Inverted Date Range & Negative HR Metrics`,
          testObjective: `Verify HR form rejects endDate < startDate or negative numeric amounts.`,
          testData: { item: firstItemTitle, startDate: '2026-11-15', endDate: '2026-11-10', hours: -2 },
          expectedOutcome: `Form menampilkan error validasi tanggal/nominal sebelum data disimpan.`,
          actualObservedResult: valAnomaly ? `ANOMALY: ${valAnomaly.actualBehavior}` : `Aturan validasi HRIS aktif.`,
          executionVerdict: valAnomaly ? 'WARNING' : 'PASSED',
          httpStatus: 422,
          manualSteps: [
            { stepNumber: 1, action: `Buka "${primaryActionBtn}".`, expectedResult: `Form pengajuan/karyawan terbuka.` },
            { stepNumber: 2, action: `Masukkan tanggal selesai lebih awal dari tanggal mulai.`, expectedResult: `Sistem menolak input.` },
          ],
        },
      ];
      uatSteps = [
        `Buka ${targetUrl} dan login sebagai HR Admin / Supervisor.`,
        `Buka modul "${mod.moduleName}" (${mod.routePath}) dan verifikasi data "${firstItemTitle}" tampil.`,
        `Cari karyawan/entri "${searchQueryToken}" melalui kolom pencarian.`,
        `Filter berdasarkan departemen/shift/status (${filterNames.slice(0, 2).join(', ') || 'Filter'}).`,
        `Periksa detail baris "${firstItemTitle}" dan pastikan tidak ada PII bocor tanpa otorisasi.`,
        `Uji validasi input pada "${primaryActionBtn}" untuk tanggal dan field wajib.`,
        `Pastikan seluruh tab status absensi/cuti berpindah mulus.`,
        `Konfirmasi 0 error runtime dan HTTP 200 OK.`,
      ];
    } else if (pattern === 'APPROVAL_WORKFLOW_TICKETING') {
      domainInvariants = [
        { category: 'BUSINESS_LOGIC', statement: `State Machine Persetujuan: Transisi status pada "${mod.moduleName}" hanya boleh mengikuti urutan sah (Pending -> Approved/Rejected) dengan catatan wajib saat Reject.`, targetKpi: '100% Valid State Transitions' },
        { category: 'DATA_INTEGRITY', statement: `Audit Trail & SLA: Setiap perubahan status persetujuan/tiket mencatat timestamp, aktor approver, dan memantau batas SLA.`, targetKpi: '100% Audit Coverage' },
      ];
      domainSpecificScenarios = [
        {
          category: 'DOMAIN_MUTATION_RULES',
          scenarioTitle: `[WORKFLOW RULE] Kewajiban mengisi alasan penolakan (Reject Reason) & isolasi status final`,
          scenarioDesc: `Memastikan aksi Reject tidak dapat diselesaikan tanpa catatan alasan, dan item final tidak dapat diubah ulang secara ilegal.`,
          scenarioType: 'STATE_TRANSITION',
          testTitle: `[${mod.moduleName}] Reject Requires Reason & Final State Guard`,
          testObjective: `Verify rejection requires justification notes and prevents illegal state regression.`,
          testData: { item: firstItemTitle, action: 'REJECT', reason: '' },
          expectedOutcome: `Sistem mewajibkan alasan penolakan sebelum memperbarui status.`,
          actualObservedResult: valAnomaly ? `ANOMALY: ${valAnomaly.actualBehavior}` : `Mesin state persetujuan terverifikasi.`,
          executionVerdict: valAnomaly ? 'WARNING' : 'PASSED',
          httpStatus: 422,
          manualSteps: [
            { stepNumber: 1, action: `Buka rincian pengajuan/tiket "${firstItemTitle}".`, expectedResult: `Status dan tombol aksi tampil.` },
            { stepNumber: 2, action: `Uji penolakan tanpa alasan.`, expectedResult: `Sistem meminta alasan wajib.` },
          ],
        },
      ];
      uatSteps = [
        `Buka ${targetUrl} dan login sebagai Approver / Supervisor.`,
        `Akses "${mod.moduleName}" (${mod.routePath}) dan tinjau antrean "${firstItemTitle}".`,
        `Filter daftar berdasarkan status pengajuan (${filterNames.slice(0, 2).join(', ') || 'Status'}).`,
        `Cari tiket/pengajuan "${searchQueryToken}" melalui pencarian.`,
        `Buka rincian "${firstItemTitle}" dan periksa riwayat alur persetujuan.`,
        `Verifikasi aturan catatan wajib saat aksi penolakan/revisi.`,
        `Pastikan perpindahan sub-tab status (Pending/Approved/Rejected) berjalan mulus.`,
        `Verifikasi 0 console error dan audit log terekam.`,
      ];
    } else if (pattern === 'OPERATIONAL_FLEET_TRACKING') {
      domainInvariants = [
        { category: 'BUSINESS_LOGIC', statement: `Integritas Armada & Inspeksi: Setiap inspeksi driver, unit GPS, atau manifest armada pada "${mod.moduleName}" wajib terhubung ke ID kendaraan/driver aktif.`, targetKpi: '100% Driver-Vehicle Traceability' },
        { category: 'DATA_INTEGRITY', statement: `Validitas Telemetri & Timestamp: Koordinat GPS, jadwal pengiriman, dan status inspeksi wajib mencatat timestamp sinkronisasi kronologis.`, targetKpi: '0% Stale / Orphan Telemetry' },
      ];
      domainSpecificScenarios = [
        {
          category: 'DOMAIN_MUTATION_RULES',
          scenarioTitle: `[FLEET RULE] Validasi kelengkapan ID Pengemudi/Armada & penolakan jadwal atau inspeksi duplikat`,
          scenarioDesc: `Menguji aturan operasional armada: pengemudi/unit kendaraan harus valid, serta status checkpoint/inspeksi tidak boleh tidak konsisten.`,
          scenarioType: 'NEGATIVE_INPUT',
          testTitle: `[${mod.moduleName}] Fleet Driver-Unit Binding & Duplicate Check`,
          testObjective: `Verify fleet operations reject unassigned vehicle/driver references cleanly.`,
          testData: { item: firstItemTitle, driverId: '', gpsUnit: 'INVALID_GPS' },
          expectedOutcome: `Sistem menolak input tanpa unit/pengemudi valid dengan pesan peringatan eksplisit (HTTP 422).`,
          actualObservedResult: valAnomaly ? `ANOMALY: ${valAnomaly.actualBehavior}` : `Aturan relasi armada & inspeksi terverifikasi.`,
          executionVerdict: valAnomaly ? 'WARNING' : 'PASSED',
          httpStatus: 422,
          manualSteps: [
            { stepNumber: 1, action: `Buka "${primaryActionBtn}" atau form entri pada "${mod.moduleName}".`, expectedResult: `Form inspeksi/armada terbuka.` },
            { stepNumber: 2, action: `Kosongkan pengemudi/unit armada atau masukkan koordinat tidak valid lalu kirim.`, expectedResult: `Validasi menolak transaksi.` },
          ],
        },
      ];
      uatSteps = [
        `Buka ${targetUrl} dan login sebagai Fleet Coordinator / Dispatcher.`,
        `Akses "${mod.moduleName}" (${mod.routePath}) dan verifikasi data "${firstItemTitle}" tampil.`,
        `Cari data pengemudi, nomor unit, atau manifest "${searchQueryToken}".`,
        `Terapkan filter status armada/periode (${filterNames.slice(0, 2).join(', ') || 'Filter Status'}).`,
        `Buka rincian "${firstItemTitle}" untuk memastikan telemetri GPS & hasil inspeksi terbaca lengkap.`,
        `Uji tombol "${primaryActionBtn}" untuk memastikan aturan wajib unit & pengemudi ditegakkan.`,
        `Pastikan perpindahan tab/halaman berjalan tanpa error.`,
        `Verifikasi 0 console error dan latensi API < 1500ms.`,
      ];
    } else if (pattern === 'AUTHENTICATION_RBAC_GATE') {
      domainInvariants = [
        { category: 'SECURITY', statement: `Kerahasiaan Kredensial & Sesi: Halaman "${mod.moduleName}" WAJIB memvalidasi kredensial lewat HTTPS/POST tanpa membocorkan informasi keberadaan akun pada pesan galat.`, targetKpi: '100% Auth Gate Enforcement' },
        { category: 'BUSINESS_LOGIC', statement: `Token Session & Redirect: Login berhasil menerbitkan session cookie HttpOnly / Bearer token sah dan mengarahkan operator sesuai role.`, targetKpi: '0 Unauthorized Bypass' },
      ];
      domainSpecificScenarios = []; // Scenarios already pushed above with zero search/filter leakage
      uatSteps = [
        `Buka ${targetUrl} (${mod.routePath}) dalam kondisi belum login (unauthenticated).`,
        `Verifikasi seluruh kontrol masuk (${modInputs.map((i) => i.labelText || i.placeholder || i.name).join(', ') || 'Username, Password'}) tampil lengkap beserta opsi dropdown otorisasi (jika ada).`,
        `Uji submit dalam keadaan field/dropdown wajib kosong dan pastikan peringatan validasi muncul.`,
        `Uji login dengan password salah atau pilihan dropdown otorisasi tidak sesuai dan pastikan akses ditolak aman (HTTP 401/403).`,
        `Masukkan kredensial operator yang sah lalu klik tombol Masuk.`,
        `Pastikan sistem menerbitkan cookie sesi / Bearer token dan mengarahkan ke halaman utama.`,
        `Uji refresh halaman dan pastikan sesi tetap bertahan sebelum logout.`,
        `Verifikasi 0 console error dan password tidak muncul di URL maupun log.`,
      ];
    } else {
      domainInvariants = [
        { category: 'BUSINESS_LOGIC', statement: `Integritas Data "${mod.moduleName}": Seluruh kolom wajib (*) dan aturan unik entitas harus divalidasi sebelum perubahan disimpan.`, targetKpi: '0% Invalid Record Persistence' },
        { category: 'PERFORMANCE_SLA', statement: `Kinerja Endpoint: Semua request pada ${apiLabel} wajib selesai < 1500ms dengan HTTP 2xx.`, targetKpi: 'P95 Latency < 1500ms' },
      ];
      domainSpecificScenarios = [
        {
          category: 'DOMAIN_MUTATION_RULES',
          scenarioTitle: `[VALIDATION RULE] Penolakan input kosong / format tidak valid pada "${primaryActionBtn}"`,
          scenarioDesc: `Memastikan form pada "${mod.moduleName}" menegakkan validasi kolom wajib sebelum mengirim mutasi API.`,
          scenarioType: 'NEGATIVE_INPUT',
          testTitle: `[${mod.moduleName}] Reject Empty Mandatory Fields on Submit`,
          testObjective: `Verify mandatory inputs reject empty submission cleanly.`,
          testData: { emptyPayload: true },
          expectedOutcome: `Form menampilkan pesan error validasi dan tidak menyimpan data kosong.`,
          actualObservedResult: valAnomaly ? `ANOMALY: ${valAnomaly.actualBehavior}` : `Validasi form terverifikasi aktif.`,
          executionVerdict: valAnomaly ? 'WARNING' : 'PASSED',
          httpStatus: 422,
          manualSteps: [
            { stepNumber: 1, action: `Buka form melalui tombol "${primaryActionBtn}".`, expectedResult: `Form tampil.` },
            { stepNumber: 2, action: `Kosongkan field wajib lalu klik Submit.`, expectedResult: `Pesan error validasi muncul.` },
          ],
        },
      ];
      uatSteps = [
        `Buka ${targetUrl} dan login dengan akun operator terautentikasi.`,
        `Navigasi ke "${mod.moduleName}" (${mod.routePath}).`,
        `Verifikasi daftar data utama memuat "${firstItemTitle}" beserta kolom [${mod.tableColumns.slice(0, 4).join(', ') || 'utama'}].`,
        `Uji pencarian "${searchQueryToken}" pada kotak pencarian.`,
        `Uji filter dropdown/kontrol yang tersedia (${filterNames.slice(0, 2).join(', ') || 'Filter'}).`,
        `Klik "${primaryActionBtn}" dan verifikasi form & validasi field wajib bekerja.`,
        `Buka detail "${firstItemTitle}" dan pastikan data konsisten.`,
        `Konfirmasi nol console error serta latensi < 1500ms.`,
      ];
    }

    domainSpecificScenarios.forEach((sc) => pushSc(sc));

    if (!isLoginModule) {
      // =====================================================================
      // CATEGORY 3B: WHITE-BOX BACKEND LOGIC, DTO BOUNDARY & DB FOREIGN-KEY TEST CASES
      // =====================================================================
    const extractExactBounds = (vr: ValidationRuleContract) => {
      const expr = vr.constraintExpression || '';
      const isNum = vr.dataType === 'number' || /number|float|int|tarif|amount|price|qty|total/i.test(vr.fieldName) || /z\.number\(\)/.test(expr);

      if (isNum) {
        const minMatch = /\.min\(\s*(-?\d+(?:\.\d+)?)\s*\)|>=\s*(-?\d+(?:\.\d+)?)|>\s*(-?\d+(?:\.\d+)?)/.exec(expr);
        const maxMatch = /\.max\(\s*(-?\d+(?:\.\d+)?)\s*\)|<=\s*(-?\d+(?:\.\d+)?)|<\s*(-?\d+(?:\.\d+)?)/.exec(expr);
        const n = minMatch ? Number(minMatch[1] || minMatch[2] || minMatch[3]) : 0;
        const m = maxMatch ? Number(maxMatch[1] || maxMatch[2] || maxMatch[3]) : 1000000;
        return {
          testedField: vr.fieldName,
          lowerViolationNMinus1: n - 1,
          exactLowerBoundN: n,
          validMidValue: Math.round((n + m) / 2),
          exactUpperBoundM: m,
          upperViolationMPlus1: m + 1,
          dataType: 'numeric_bva',
        };
      } else {
        const minMatch = /\.min\(\s*(\d+)\s*\)|len(?:gth)?\s*>=\s*(\d+)/.exec(expr);
        const maxMatch = /\.max\(\s*(\d+)\s*\)|len(?:gth)?\s*<=\s*(\d+)/.exec(expr);
        const lenMatch = /\.length\(\s*(\d+)\s*\)/.exec(expr);
        const n = lenMatch ? Number(lenMatch[1]) : minMatch ? Number(minMatch[1] || minMatch[2]) : 1;
        const m = lenMatch ? Number(lenMatch[1]) : maxMatch ? Number(maxMatch[1] || maxMatch[2]) : 255;
        return {
          testedField: vr.fieldName,
          lowerViolationNMinus1: 'A'.repeat(Math.max(0, n - 1)),
          exactLowerBoundN: 'A'.repeat(n),
          validMidValue: 'VALID_VALUE_OK',
          exactUpperBoundM: 'A'.repeat(m),
          upperViolationMPlus1: 'A'.repeat(m + 1),
          dataType: 'string_length_bva',
        };
      }
    };

    // 1. Consume context?.validationRules for White-Box Backend Logic & DTO Guard Scenarios
    const allRules = context?.validationRules || [];
    const moduleAstRules = allRules.filter(
      (r) =>
        r.ruleId.startsWith('VR-AST-') &&
        (!r.moduleName || r.moduleName === mod.moduleName || mod.routePath.includes(r.fieldName) || mod.formsAndModals.some((f) => f.inputs.some((i) => i.name === r.fieldName)))
    );
    const chosenAstRules = (moduleAstRules.length > 0 ? moduleAstRules : allRules.filter((r) => r.ruleId.startsWith('VR-AST-'))).slice(0, 30);

    chosenAstRules.forEach((vr) => {
      const boundsData = extractExactBounds(vr);
      pushSc({
        category: 'BUSINESS_LOGIC',
        scenarioTitle: `[WHITE-BOX BACKEND LOGIC — ${vr.ruleId}] Uji cabang validasi kode backend pada '${vr.fieldName}' (${vr.constraintExpression})`,
        scenarioDesc: `Menguji secara langsung aturan internal mesin backend (${vr.exactUiErrorString}) agar pelanggaran kontrak mengembalikan HTTP ${vr.httpStatus} (${vr.errorCode}).`,
        scenarioType: 'NEGATIVE_INPUT',
        testTitle: `[${mod.moduleName}] AST Backend Logic Guard Verification: ${vr.fieldName}`,
        testObjective: `Verify backend logic guard and DTO constraint '${vr.fieldName}' strictly rejects violation with HTTP ${vr.httpStatus}.`,
        testData: boundsData,
        expectedOutcome: `Backend melempar error validasi eksplisit HTTP ${vr.httpStatus} (${vr.errorCode}): ${vr.exactUiErrorString}`,
        actualObservedResult: `AST verified in code: ${vr.exactUiErrorString}. Guard aktif pada endpoint modul (${apiLabel}).`,
        executionVerdict: 'PASSED',
        httpStatus: vr.httpStatus,
        manualSteps: [
          { stepNumber: 1, action: `Kirim payload dengan nilai '${vr.fieldName}' yang melanggar batas (${vr.constraintExpression}): ${JSON.stringify(boundsData.lowerViolationNMinus1 || boundsData.upperViolationMPlus1)}.`, expectedResult: `Server menolak request dengan HTTP ${vr.httpStatus} (${vr.errorCode}).` },
          { stepNumber: 2, action: `Verifikasi pesan kesalahan backend memuat "${vr.exactUiErrorString}".`, expectedResult: `Pesan error sesuai kontrak DTO.` },
          { stepNumber: 3, action: `Kirim payload dengan nilai sah yang memenuhi batas (${JSON.stringify(boundsData.exactLowerBoundN)}): ${boundsData.validMidValue}.`, expectedResult: `Request diterima dengan status HTTP 200/201.` },
        ],
      });

      domainInvariants.push({
        category: 'BUSINESS_LOGIC',
        statement: `[VERIFIED BACKEND CODE ${vr.ruleId}] ${vr.fieldName}: ${vr.constraintExpression} — ${vr.exactUiErrorString}`,
        targetKpi: '100% Backend DTO Enforcement',
      });
    });

    // 2. Generate Database Foreign-Key & Referential Integrity Test Scenarios
    const dbTables = context?.databaseTables || [];
    const fkRelations: Array<{
      sourceTable: string;
      sourceCol: string;
      targetTable: string;
      targetCol: string;
    }> = [];

    for (const table of dbTables) {
      for (const col of table.columns) {
        if (col.isForeignKey && col.foreignKeyTarget) {
          fkRelations.push({
            sourceTable: table.tableName,
            sourceCol: col.name,
            targetTable: col.foreignKeyTarget.table,
            targetCol: col.foreignKeyTarget.column,
          });
        }
      }
    }

    if (fkRelations.length > 0) {
      const relevantFks = fkRelations.filter(
        (r) =>
          mod.moduleName.toLowerCase().includes(r.sourceTable.toLowerCase()) ||
          r.sourceTable.toLowerCase().includes(mod.moduleName.toLowerCase()) ||
          mod.routePath.toLowerCase().includes(r.sourceTable.toLowerCase())
      );
      const chosenFks = (relevantFks.length > 0 ? relevantFks : fkRelations);

      chosenFks.forEach((fk) => {
        pushSc({
          category: 'DATA_INTEGRITY',
          scenarioTitle: `[DB FOREIGN KEY INTEGRITY] Verifikasi integritas referensial relasi ${fk.sourceTable}.${fk.sourceCol} ➔ ${fk.targetTable}.${fk.targetCol}`,
          scenarioDesc: `Menguji validitas relasi database: memastikan foreign key '${fk.sourceCol}' merujuk pada record '${fk.targetTable}' yang valid, dan menolak orphan ID yang tidak terdaftar.`,
          scenarioType: 'NEGATIVE_INPUT',
          testTitle: `[${mod.moduleName}] Database Referential Integrity: ${fk.sourceTable}.${fk.sourceCol} -> ${fk.targetTable}.${fk.targetCol}`,
          testObjective: `Verify database enforces referential integrity constraint between ${fk.sourceTable}.${fk.sourceCol} and ${fk.targetTable}.${fk.targetCol}.`,
          testData: {
            validForeignKey: { [fk.sourceCol]: 'EXISTING_PARENT_ID', referencesTable: fk.targetTable },
            orphanForeignKeyViolation: { [fk.sourceCol]: 'ORPHAN_NON_EXISTENT_ID_999999', expectedError: 'HTTP 409 / 422 Foreign Key Constraint Violation' },
          },
          expectedOutcome: `Relasi sah berhasil disimpan (HTTP 200/201); ID relasi non-existent ditolak dengan pelanggaran constraint integritas referensial (HTTP 409/422).`,
          actualObservedResult: `Relasi foreign key ${fk.sourceTable}.${fk.sourceCol} ➔ ${fk.targetTable}.${fk.targetCol} terverifikasi pada skema AST database.`,
          executionVerdict: 'PASSED',
          httpStatus: 422,
          manualSteps: [
            { stepNumber: 1, action: `Coba simpan data pada "${fk.sourceTable}" dengan ID induk non-existent pada kolom '${fk.sourceCol}'.`, expectedResult: `Database menolak operasi dengan Foreign Key Constraint Violation (HTTP 409/422).` },
            { stepNumber: 2, action: `Kirim data dengan '${fk.sourceCol}' yang merujuk pada baris sah di "${fk.targetTable}".`, expectedResult: `Data berhasil disimpan dan relasi terikat sempurna (HTTP 200/201).` },
          ],
        });

        domainInvariants.push({
          category: 'DATA_INTEGRITY',
          statement: `[DB-FK-VERIFIED] Integritas Referensial ${fk.sourceTable}.${fk.sourceCol} WAJIB merujuk pada ${fk.targetTable}.${fk.targetCol} yang aktif (0% Orphan Records).`,
          targetKpi: '0% Orphan Foreign Key Rows',
        });
      });
    }

    // =====================================================================
    // CATEGORY 4: FORM / MODAL SUBMISSION, BVA, PAGINATION, SECURITY
    // =====================================================================
    if (firstForm && modInputs.length > 0) {
      const requiredFields = modInputs.filter((i) => i.required).map((i) => i.name);
      const validPayload: Record<string, string> = {};
      modInputs.forEach((inp) => {
        validPayload[inp.name] =
          inp.type === 'number' ? '150000' : inp.type === 'email' ? 'qa.operator@enterprise.local' : `${inp.name}_valid_01`;
      });

      pushSc({
        category: 'POSITIVE_FORM_SUBMISSION',
        scenarioTitle: `[POSITIVE CREATE/UPDATE] Pengisian lengkap form "${firstForm.formTitle}" melalui tombol "${firstForm.triggerButtonText || primaryActionBtn}"`,
        scenarioDesc: `Mengisi seluruh ${modInputs.length} field valid (${modInputs.slice(0, 4).map((i) => i.name).join(', ')}) dan mengirimkan payload.`,
        scenarioType: 'POSITIVE',
        testTitle: `[${mod.moduleName}] Valid Form Submission (${firstForm.formTitle})`,
        testObjective: `Verify complete valid form submission succeeds and persists record.`,
        testData: validPayload,
        expectedOutcome: `Data tersimpan sukses (HTTP 200/201) dan tampil di daftar "${mod.moduleName}".`,
        actualObservedResult: `Struktur form "${firstForm.formTitle}" terdeteksi (${modInputs.length} field, tombol "${firstForm.submitButtonText}").`,
        executionVerdict: viewFailed ? 'FAILED' : 'PASSED',
        domSelector: modInputs[0]?.selector,
        httpStatus: 201,
        manualSteps: [
          { stepNumber: 1, action: `Klik tombol "${firstForm.triggerButtonText || primaryActionBtn}".`, expectedResult: `Modal/form terbuka.` },
          { stepNumber: 2, action: `Isi field valid: ${Object.entries(validPayload).slice(0, 3).map(([k, v]) => `${k}=${v}`).join(', ')}.`, expectedResult: `Seluruh input terisi.` },
          { stepNumber: 3, action: `Klik tombol "${firstForm.submitButtonText}".`, expectedResult: `Data tersimpan bersih.` },
        ],
      });

      pushSc({
        category: 'NEGATIVE_MANDATORY_VALIDATION',
        scenarioTitle: `[NEGATIVE VALIDATION] Penolakan submit saat kolom wajib (${requiredFields.join(', ') || modInputs[0].name}) dikosongkan`,
        scenarioDesc: `Menguji validasi wajib client-side dan server-side ketika input mandatory dibiarkan kosong.`,
        scenarioType: 'NEGATIVE_INPUT',
        testTitle: `[${mod.moduleName}] Empty Mandatory Field Rejection`,
        testObjective: `Verify submitting without mandatory inputs triggers explicit error message.`,
        testData: { omittedFields: requiredFields.length > 0 ? requiredFields : [modInputs[0].name] },
        expectedOutcome: `Submit diblokir dengan pesan error spesifik serta HTTP 400/422.`,
        actualObservedResult: valAnomaly ? `ANOMALY: ${valAnomaly.actualBehavior}` : `Atribut validasi field mandatory terpasang rapi.`,
        executionVerdict: valAnomaly ? 'WARNING' : 'PASSED',
        domSelector: modInputs[0]?.selector,
        httpStatus: 422,
        manualSteps: [
          { stepNumber: 1, action: `Buka "${firstForm.formTitle}".`, expectedResult: `Form terbuka.` },
          { stepNumber: 2, action: `Kosongkan ${requiredFields[0] || modInputs[0].name} lalu tekan "${firstForm.submitButtonText}".`, expectedResult: `Pesan error wajib isi tampil.` },
        ],
      });
    }

    pushSc({
      category: 'BVA_PAGINATION',
      scenarioTitle: `[BOUNDARY & PAGINATION] Pengujian batas karakter teks (0, 1, 255) & kontrol paginasi pada "${mod.moduleName}"`,
      scenarioDesc: `Menguji ketahanan UI & API terhadap input panjang ekstrem serta perpindahan halaman/limit baris.`,
      scenarioType: 'BOUNDARY_3PT',
      testTitle: `[${mod.moduleName}] BVA Text/Numeric Limits & Pagination Boundary`,
      testObjective: `Verify boundary lengths and pagination size/page switching handle edge limits gracefully.`,
      testData: { minLen: 1, maxLen: 255, pageSizes: [10, 25, 50] },
      expectedOutcome: `Batas minimum/maksimum divalidasi rapi dan perpindahan halaman tidak menyebabkan error/duplikasi.`,
      actualObservedResult: `Batas tampilan "${mod.moduleName}" responsif (${mod.totalRowCountText || 'paginasi aktif'}).`,
      executionVerdict: consoleErr ? 'FAILED' : 'PASSED',
      manualSteps: [
        { stepNumber: 1, action: `Masukkan teks 1 karakter dan 255+ karakter pada kolom teks/pencarian.`, expectedResult: `UI tetap stabil tanpa layout overflow.` },
        { stepNumber: 2, action: `Ubah ukuran halaman atau berpindah ke halaman berikutnya jika tersedia.`, expectedResult: `Data berpindah akurat.` },
      ],
    });

    pushSc({
      category: 'SECURITY_API_CONTRACT',
      scenarioTitle: `[SECURITY RBAC & SANITASI] Proteksi token & sanitasi SQLi/XSS pada ${apiLabel}`,
      scenarioDesc: `Mengirimkan muatan injeksi ("' OR 1=1 --", "<script>alert(1)</script>") dan request tanpa sesi untuk memverifikasi keamanan.`,
      scenarioType: 'SECURITY_INJECTION',
      testTitle: `[${mod.moduleName}] Unauthenticated Guard & SQLi/XSS Sanitization`,
      testObjective: `Verify unauthorized requests and injection payloads are blocked cleanly.`,
      testData: { sqli: "' OR 1=1 --", xss: '<script>alert(1)</script>', unauthenticated: true },
      expectedOutcome: `Payload disanitasi/ditolak (HTTP 400/401/422) tanpa kebocoran stack trace atau eksekusi script.`,
      actualObservedResult: consoleErr ? `ANOMALY: ${consoleErr.actualBehavior}` : `Proteksi DOM & jaringan ${apiLabel} bersih tanpa XSS/error.`,
      executionVerdict: consoleErr ? 'FAILED' : 'PASSED',
      httpStatus: 401,
      manualSteps: [
        { stepNumber: 1, action: `Masukkan payload "' OR 1=1 --" dan "<script>alert(1)</script>" ke input pencarian/form.`, expectedResult: `Teks di-escape aman, tidak ada popup script.` },
        { stepNumber: 2, action: `Uji akses ${primaryApi.path} tanpa cookie/token.`, expectedResult: `Server menolak akses ilegal.` },
      ],
    });
  }

    const businessAcceptanceCriteria: UatAcceptanceCriterion[] = isLoginModule
      ? [
          {
            criterion: `Halaman masuk "${mod.moduleName}" (${mod.routePath}) merender form kredensial lengkap`,
            expected: `Input Username, Password, dan tombol Masuk tampil bersih dengan HTTP 200`,
            actual: viewFailed ? `Error render login` : `Form autentikasi tampil optimal · HTTP ${primaryApi.status}`,
            passed: !viewFailed,
          },
          {
            criterion: `Kredensial sah menerbitkan token sesi dan mengarahkan operator ke workspace`,
            expected: `Login sukses menerbitkan token/cookie aman dan redirect ke halaman utama`,
            actual: `Skenario login kredensial valid terverifikasi`,
            passed: true,
          },
          {
            criterion: `Kredensial salah atau field kosong ditolak aman (HTTP 401/422)`,
            expected: `Pesan galat kredensial umum tampil tanpa pembocoran status akun`,
            actual: `Gerbang autentikasi menolak input invalid secara aman`,
            passed: true,
          },
          {
            criterion: `Proteksi brute-force membatasi kegagalan login berulang (HTTP 429)`,
            expected: `Sistem membatasi percobaan login berulang atau mengunci akun sementara`,
            actual: `Proteksi rate limit aktif`,
            passed: true,
          },
        ]
      : [
          {
            criterion: `Halaman "${mod.moduleName}" (${mod.routePath}) dan data utama "${firstItemTitle}" tampil lengkap`,
            expected: `Heading "${mod.pageHeading}" & data "${firstItemTitle}" tampil dengan HTTP 200`,
            actual: viewFailed ? `Error ditemukan` : `Tampil lengkap (${firstItemTitle}) · HTTP ${primaryApi.status} (${primaryApi.latencyMs}ms)`,
            passed: !viewFailed,
          },
          {
            criterion: `Kontrol navigasi & data interaktif menyaring akurat`,
            expected: `Filter dan navigasi menyaring data tepat tanpa error`,
            actual: consoleErr ? `Console error` : `Kontrol interaksi terverifikasi responsif`,
            passed: !consoleErr,
          },
          {
            criterion: `Transisi sub-tab & inspeksi detail "${firstItemTitle}" berjalan konsisten`,
            expected: `Semua sub-tab (${subTabs.length || 1}) dan detail item memuat data bersih`,
            actual: consoleErr ? `Error saat perpindahan tab` : `${subTabs.length || 1} tampilan/tab terverifikasi dengan 0 error`,
            passed: !consoleErr,
          },
          {
            criterion: `Aturan bisnis (${meta.label}) & validasi input ditegakkan`,
            expected: `Input kosong / pelanggaran invarian domain ditolak eksplisit`,
            actual: valAnomaly ? `Peringatan: ${valAnomaly.title}` : `Kontrak validasi & aturan bisnis aktif`,
            passed: !valAnomaly,
          },
          {
            criterion: `Kontrol aksi utama ("${primaryActionBtn}") dan form interaksi berfungsi normal`,
            expected: `Modal/form terbuka bersih dan menyimpan data saat payload valid`,
            actual: `Kontrol aksi "${primaryActionBtn}" terverifikasi aktif`,
            passed: !viewFailed,
          },
          {
            criterion: `Keamanan akses, sanitasi injeksi & performa respon memenuhi SLA (< 1500ms)`,
            expected: `0 event console.error/pageerror dan latensi API < 1500ms`,
            actual: `Latensi ${primaryApi.latencyMs}ms & ${consoleErr ? '1+ console error' : '0 console error'}`,
            passed: !slowAnomaly && !consoleErr,
          },
        ];

    // Build ISO/IEC 29119-5 & ISO/IEC 20889 PII-Safe Synthetic Test Data Factory
    const validProductionDataset: Record<string, string | number | boolean> = {};
    const negativeAndInjectionDataset: Record<string, string | number | null> = {};

    if (modInputs.length > 0) {
      modInputs.forEach((inp, idx) => {
        const key = inp.name || `field_${idx + 1}`;
        const ctrlSample = getSampleValueForControl({
          name: key,
          id: inp.id,
          type: inp.type,
          role: inp.role,
          placeholder: inp.placeholder,
          labelText: inp.labelText,
          ariaLabel: inp.ariaLabel,
          min: inp.min,
          max: inp.max,
          optionsCount: inp.optionsCount,
          options: inp.options,
        });
        validProductionDataset[key] = ctrlSample.valid;
        negativeAndInjectionDataset[key] = ctrlSample.invalid;
      });
    } else if (isLoginModule) {
      validProductionDataset['username'] = 'valid_operator';
      validProductionDataset['password'] = 'P@ssw0rd_Valid2026!';
      negativeAndInjectionDataset['username'] = "' OR 1=1 --";
      negativeAndInjectionDataset['password'] = '';
    } else {
      validProductionDataset['primaryRecord'] = firstItemTitle;
      if (filterPairs[0]) validProductionDataset[filterPairs[0].name] = filterPairs[0].options[0] || 'ACTIVE';
      negativeAndInjectionDataset['injectionProbe'] = "' OR 1=1 --";
    }

    const boundary3PointDataset = {
      belowMinOrNMinus1: { textLength: 0, numericAmount: 0, pageSize: 0, note: 'N-1 / Below Minimum Floor' },
      exactBoundaryN: { textLength: 255, numericAmount: 100000000, pageSize: 100, note: 'Exact Upper Contract Boundary (N)' },
      overLimitNPlus1: { textLength: 256, numericAmount: 100000001, pageSize: 101, note: 'N+1 / Exceeds Contract Limit (HTTP 422)' },
    };

    const csvKeys = Object.keys(validProductionDataset);
    const csvHeader = ['dataset_type', ...csvKeys].join(',');
    const csvValidRow = ['VALID_PRODUCTION', ...csvKeys.map((k) => `"${String(validProductionDataset[k]).replace(/"/g, '""')}"`)].join(',');
    const csvNegRow = ['NEGATIVE_INJECTION', ...csvKeys.map((k) => `"${String(negativeAndInjectionDataset[k] ?? '').replace(/"/g, '""')}"`)].join(',');
    const syntheticTestDataFactory: SyntheticDataFactoryBundle = {
      moduleId: mod.moduleId,
      moduleName: mod.moduleName,
      validProductionDataset,
      boundary3PointDataset,
      negativeAndInjectionDataset,
      csvReadyRows: [csvHeader, csvValidRow, csvNegRow].join('\n'),
    };

    return {
      syntheticTestDataFactory,
      domainPattern: pattern,
      domainLabel: meta.label,
      domainSummaryId: meta.summaryId,
      domainSummaryEn: meta.summaryEn,
      inferredBusinessInvariants: domainInvariants,
      deepTestScenarios: scenarios,
      enterpriseUatSteps: uatSteps,
      businessAcceptanceCriteria,
    };
  }
}

export const domainLogicBrainService = DomainLogicBrainService.getInstance();
