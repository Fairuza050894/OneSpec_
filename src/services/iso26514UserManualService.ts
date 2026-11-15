/**
 * OneSpec SDLC Workbench - ISO/IEC/IEEE 26514:2022 Enterprise User Manual & Functional Encyclopedia
 * Produces complete 6-section layperson-ready manuals (Buttons, Icons, Menus, Sub-Tabs, Filters, SOP 1-5, FAQ)
 * in both Indonesian ('id') and English ('en').
 */

import type {
  FeatureModuleSurface,
  ScreenControlCatalogItem,
  ValidationRuleContract,
  DatabaseErdTable,
} from '@/types/sdlc';
import type { RegressionDiffSummary } from './workspaceVaultService';
import { domainLogicBrainService } from './domainLogicBrainService';
import {
  buildFeatureModuleBlueprintSvgDataUrl,
  isBlankOrMissingScreenshot,
} from '@/lib/featureModuleBlueprint';

export interface Iso26514ButtonEntry {
  buttonName: string;
  screenLocation: string;
  primaryPurpose: string;
  howToUseAndImpact: string;
  calloutNumber?: number;
  xPercent?: number;
  yPercent?: number;
  versionDeltaBadge?: string;
}

export interface Iso26514FilterEntry {
  filterName: string;
  controlType: string;
  businessPurpose: string;
  sampleValues: string;
  validationRule: string;
  calloutNumber?: number;
  xPercent?: number;
  yPercent?: number;
  versionDeltaBadge?: string;
}
export interface Iso26514SopItem {
  sopId: string;
  sopTitle: string;
  steps: string[];
  expectedResult: string;
}

export interface Iso26514FaqItem {
  question: string;
  answer: string;
}

export interface Iso26514BusinessRuleItem {
  ruleCode: string;
  ruleTitle: string;
  logicExplanation: string;
  formulaOrCondition: string;
  plainHumanCondition: string;
  failureImpact: string;
}

export interface Iso26514StateTransitionItem {
  fromState: string;
  userTrigger: string;
  systemValidation: string;
  toState: string;
  visibleUiIndicator: string;
}

export interface Iso26514UiInteractionItem {
  uiControlOrAction: string;
  triggeredEndpoint: string;
  requestPayloadSummary: string;
  onSuccessHttp200_201: string;
  onErrorHttp4xx_5xx: string;
  userRecoveryAction: string;
  versionDeltaBadge?: string;
}

export interface Iso26514DomainGlossaryItem {
  termOrAcronym: string;
  category: string;
  plainDefinition: string;
  whereUsedInModule: string;
}

export interface Iso26514ModuleManual {
  moduleId: string;
  moduleName: string;
  routePath: string;
  locale: 'en' | 'id';
  screenshotDataUrl?: string;
  capturedAt?: string;
  visualCalloutPins?: Array<{
    calloutNumber: number;
    label: string;
    kind: 'BUTTON' | 'FILTER' | 'SUB_TAB';
    xPercent: number;
    yPercent: number;
    summary: string;
  }>;
  section1_OverviewAndPurpose: {
    heading: string;
    purposeSummary: string;
    targetUsers: string;
    displayedBusinessData: string;
    whenToUse: string;
  };
  section2_NavigationAndSubTabsGuide: {
    heading: string;
    howToReachMenu: string;
    subTabs: Array<{
      tabName: string;
      businessContent: string;
      actionButtons: string;
    }>;
  };
  section3_ButtonsAndIconsDictionary: {
    heading: string;
    buttons: Iso26514ButtonEntry[];
  };
  section4_SearchAndFiltersDictionary: {
    heading: string;
    filters: Iso26514FilterEntry[];
  };
  section5_TaskOrientedSops: {
    heading: string;
    sops: Iso26514SopItem[];
  };
  section6_TroubleshootingAndFaq: {
    heading: string;
    faqs: Iso26514FaqItem[];
  };
  section7_BusinessLogicAndStateRules: {
    heading: string;
    domainClassification: {
      domain: string;
      domainLabel: string;
      summary: string;
    };
    coreBusinessRules: Iso26514BusinessRuleItem[];
    stateTransitionLifecycle: Iso26514StateTransitionItem[];
  };
  section8_UiToApiAndErrorRecoveryMatrix: {
    heading: string;
    interactions: Iso26514UiInteractionItem[];
  };
  section9_DomainGlossaryAndAcronyms: {
    heading: string;
    terms: Iso26514DomainGlossaryItem[];
  };
}

export class Iso26514UserManualService {
  private static instance: Iso26514UserManualService;

  private constructor() {}

  public static getInstance(): Iso26514UserManualService {
    if (!Iso26514UserManualService.instance) {
      Iso26514UserManualService.instance = new Iso26514UserManualService();
    }
    return Iso26514UserManualService.instance;
  }

  private explainControlPurpose(name: string, isId: boolean, isLogistics: boolean): { purpose: string; impact: string; sample: string; rule: string } {
    const lower = name.toLowerCase();
    if (/tambah|create|add|baru|\+/.test(lower)) {
      return isId
        ? {
            purpose: `Membuka formulir pembuatan data baru pada modul (${name})`,
            impact: 'Klik untuk membuka modal/halaman form; isi kolom wajib lalu tekan Simpan agar kartu/baris baru langsung tersimpan.',
            sample: 'Form Entri Baru',
            rule: 'Wajib isi seluruh kolom bertanda *',
          }
        : {
            purpose: `Opens the creation form to register a new record (${name})`,
            impact: 'Click to open the creation dialog/screen; complete required fields and click Save.',
            sample: 'Creation Form Modal',
            rule: 'Required fields enforced',
          };
    }
    if (/filter lanjutan|advanced/.test(lower)) {
      return isId
        ? {
            purpose: 'Membuka panel penyaringan kombinasi beberapa kriteria bisnis sekaligus',
            impact: isLogistics
              ? 'Klik untuk menyaring berdasarkan Job Character (Single/Round Trip), SAT (Service Agreement Type), dan Unit Type (40ft/FTR).'
              : 'Klik untuk memilih kombinasi kriteria filter detail lalu tekan Terapkan Filter.',
            sample: isLogistics ? 'Job Character, SAT, Unit Type' : 'Multi-kriteria detail',
            rule: 'Opsional (Kombinasi AND)',
          }
        : {
            purpose: 'Opens multi-attribute advanced filtering panel',
            impact: isLogistics
              ? 'Click to combine Job Character, SAT (Service Agreement Type), and Unit Type filters.'
              : 'Click to combine multiple granular filter parameters and click Apply.',
            sample: isLogistics ? 'Job Character, SAT, Unit Type' : 'Multi-criteria',
            rule: 'Optional (AND intersection)',
          };
    }
    if (/reset/.test(lower)) {
      return isId
        ? {
            purpose: 'Menghapus seluruh filter & kata pencarian yang sedang aktif',
            impact: 'Klik untuk mengembalikan seluruh daftar data ke kondisi awal tanpa saringan.',
            sample: 'Reset Semua',
            rule: 'Sekali klik',
          }
        : {
            purpose: 'Clears all active search keywords and filter dropdown selections',
            impact: 'Click to restore the full unfiltered dataset view immediately.',
            sample: 'Reset All',
            rule: 'Single click',
          };
    }
    if (/grid|table|card|view/.test(lower)) {
      return isId
        ? {
            purpose: 'Mengubah mode tata letak tampilan data antara Kartu (Grid) dan Tabel Baris',
            impact: 'Klik untuk beralih ke tampilan visual kartu atau tabel ringkas sesuai preferensi pembacaan.',
            sample: 'Card Grid / Table',
            rule: 'Non-destruktif',
          }
        : {
            purpose: 'Switches display layout between Visual Card Grid and Compact Table',
            impact: 'Click to toggle visual presentation without losing current search/filter state.',
            sample: 'Card Grid / Table',
            rule: 'Non-destructive',
          };
    }
    if (/export|ekspor|download|unduh/.test(lower)) {
      return isId
        ? {
            purpose: 'Mengunduh data yang tampil pada layar ke format dokumen/spreadsheet',
            impact: 'Klik untuk mengunduh laporan sesuai saringan filter yang sedang aktif.',
            sample: '.xlsx / .csv / .pdf',
            rule: 'Sesuai hak akses user',
          }
        : {
            purpose: 'Exports visible records to a downloadable spreadsheet or document',
            impact: 'Click to download active filtered records.',
            sample: '.xlsx / .csv / .pdf',
            rule: 'Role-gated',
          };
    }
    if (/origin|destination|kode rute|search|cari/.test(lower)) {
      return isId
        ? {
            purpose: 'Mencari data secara cepat berdasarkan kata kunci teks bebas',
            impact: isLogistics
              ? 'Ketik nama kota asal (Origin), tujuan (Destination), atau kode rute untuk menyaring kartu langsung.'
              : 'Ketik minimal 2 karakter lalu tekan Enter atau tunggu penyaringan otomatis.',
            sample: isLogistics ? 'BOGOR, TANJUNG PRIOK, CIKARANG' : 'Kata kunci teks',
            rule: 'Opsional (Case-insensitive)',
          }
        : {
            purpose: 'Quick free-text search across primary record identifiers',
            impact: isLogistics
              ? 'Type Origin city, Destination port, or Route Code to filter matching route cards.'
              : 'Enter keyword to filter displayed rows/cards immediately.',
            sample: isLogistics ? 'BOGOR, TANJUNG PRIOK' : 'Keyword text',
            rule: 'Optional (Case-insensitive)',
          };
    }
    if (/business unit|bu\b/.test(lower)) {
      return isId
        ? {
            purpose: 'Menyaring data berdasarkan unit bisnis / divisi operasional terkait',
            impact: 'Pilih unit bisnis tertentu agar hanya komponen divisi tersebut yang ditampilkan.',
            sample: 'Commercial Ocean, Trucking, Freight',
            rule: 'Opsional (Dropdown)',
          }
        : {
            purpose: 'Filters records by owning operational Business Unit',
            impact: 'Select a Business Unit to scope displayed pricing or operational items.',
            sample: 'Commercial Ocean, Trucking',
            rule: 'Optional (Dropdown)',
          };
    }
    if (/role|peran|akses|access|tenant|perusahaan|company|cabang|branch|unit organisasi|organization|organisasi|divisi|department|dept|pancaran|eksternal|external|internal|domain|tipe pengguna|user type|user_type/.test(lower)) {
      return isId
        ? {
            purpose: `Memilih otorisasi ${name} (Role / Tenant / Cabang / Unit Organisasi) sebelum autentikasi`,
            impact:
              'Buka dropdown lalu pilih satu opsi yang sesuai dengan hak akses dan unit kerja Anda. Pilihan ini dikirim bersama kredensial pada payload login dan menentukan cakupan data yang dapat diakses setelah masuk.',
            sample: 'Pilih Role / Tenant / Cabang / Unit Organisasi',
            rule: 'Wajib dipilih sebelum menekan Masuk (*)',
          }
        : {
            purpose: `Selects the authorization context for ${name} (Role / Tenant / Branch / Organizational Unit) before sign-in`,
            impact:
              'Open the dropdown and select the option matching your assigned permissions and organizational unit. The value is submitted with the credential payload and determines the data scope after sign-in.',
            sample: 'Select Role / Tenant / Branch / Organizational Unit',
            rule: 'Required before submitting sign-in (*)',
          };
    }
    if (/sat|service agreement/.test(lower)) {
      return isId
        ? {
            purpose: 'Menyaring berdasarkan Jenis Perjanjian Layanan (Service Agreement Type)',
            impact: 'Pilih jenis perjanjian kontrak pelanggan/vendor untuk membandingkan struktur tarif.',
            sample: 'Contractual, Spot, Dedicated',
            rule: 'Opsional (Dropdown)',
          }
        : {
            purpose: 'Filters components by Service Agreement Type (SAT)',
            impact: 'Select contract agreement category to view applicable rate structures.',
            sample: 'Contractual, Spot, Dedicated',
            rule: 'Optional (Dropdown)',
          };
    }
    if (/job character/.test(lower)) {
      return isId
        ? {
            purpose: 'Menyaring pola perjalanan kerja (mis. Single Trip vs Round Trip)',
            impact: 'Menentukan apakah tarif berlaku untuk satu kali jalan atau pulang-pergi.',
            sample: 'Single Trip, Round Trip',
            rule: 'Opsional (Dropdown)',
          }
        : {
            purpose: 'Filters operational trip pattern (e.g. Single Trip vs Round Trip)',
            impact: 'Restricts visible pricing items to the selected trip execution pattern.',
            sample: 'Single Trip, Round Trip',
            rule: 'Optional (Dropdown)',
          };
    }
    if (/unit type|armada|container|tipe/.test(lower)) {
      return isId
        ? {
            purpose: 'Menyaring jenis/kapasitas armada atau tipe komponen layanan',
            impact: 'Pilih ukuran kontainer/truk (40ft, 20ft, FTR) atau tipe komponen yang dicari.',
            sample: '40ft, 20ft, FTR, TRUCKING',
            rule: 'Opsional (Dropdown)',
          }
        : {
            purpose: 'Filters fleet container/truck unit size or service component type',
            impact: 'Select container/vehicle type (e.g. 40ft, FTR) or service classification.',
            sample: '40ft, 20ft, FTR, TRUCKING',
            rule: 'Optional (Dropdown)',
          };
    }
    if (/baris|page|halaman/.test(lower)) {
      return isId
        ? {
            purpose: 'Mengatur jumlah kartu/baris data yang ditampilkan dalam satu halaman',
            impact: 'Pilih 10, 25, atau 50 untuk memperbanyak atau meringkas tampilan daftar.',
            sample: '10, 25, 50',
            rule: 'Default: 10/12 item',
          }
        : {
            purpose: 'Controls how many cards or table rows appear per page',
            impact: 'Select 10, 25, or 50 to adjust page density.',
            sample: '10, 25, 50',
            rule: 'Default: 10/12 items',
          };
    }
    if (/user id|username|nama pengguna|email|akun|nik|nip/.test(lower)) {
      return isId
        ? {
            purpose: 'Kolom isian identitas pengguna (User ID, Username, atau Email resmi terdaftar)',
            impact: 'Masukkan ID pengguna atau email akun Anda tanpa spasi berlebih sebelum menekan tombol Masuk/Simpan.',
            sample: 'operator_user / admin@perusahaan.co.id',
            rule: 'Wajib diisi (*)',
          }
        : {
            purpose: 'Credential or identity input field for entering your registered User ID, username, or email',
            impact: 'Type your assigned operator username or email address before submitting.',
            sample: 'operator_user / admin@enterprise.com',
            rule: 'Required (*)',
          };
    }
    if (/sandi|password|passcode|pin\b|kata kunci rahasia/.test(lower)) {
      return isId
        ? {
            purpose: 'Kolom rahasia (karakter disamarkan) untuk memasukkan kata sandi akun',
            impact: 'Ketik kata sandi dengan memperhatikan huruf besar/kecil (case-sensitive); gunakan ikon mata bila perlu memeriksa ketikan.',
            sample: '•••••••• (Min. 6 karakter)',
            rule: 'Wajib diisi & Case-Sensitive (*)',
          }
        : {
            purpose: 'Masked security input field for entering your account password',
            impact: 'Enter your case-sensitive password; characters remain masked to prevent shoulder-surfing.',
            sample: '•••••••• (Min. 6 chars)',
            rule: 'Required & Case-Sensitive (*)',
          };
    }
    if (/\b(masuk|login|sign in|signin|submit|kirim|proses|terapkan|apply)\b/i.test(lower)) {
      return isId
        ? {
            purpose: `Mengirimkan kredensial atau data yang telah diisi (${name}) untuk autentikasi / pemrosesan server`,
            impact: 'Klik setelah seluruh kolom wajib diisi; sistem memvalidasi masukan dan mengarahkan ke modul tujuan atau menyimpan perubahan.',
            sample: 'Autentikasi / Eksekusi Aksi',
            rule: 'Wajib kolom bertanda * terisi',
          }
        : {
            purpose: `Submits entered credentials or payload (${name}) to authenticate and proceed`,
            impact: 'Click after filling all required fields; validates input and navigates to your authorized workspace or persists changes.',
            sample: 'Authenticate / Submit',
            rule: 'Required fields must be valid',
          };
    }
    if (/simpan|save|update|perbarui|konfirmasi/.test(lower)) {
      return isId
        ? {
            purpose: `Menyimpan perubahan atau entri formulir (${name}) secara permanen`,
            impact: 'Klik untuk memvalidasi formulir dan memperbarui data di basis data sistem.',
            sample: 'Simpan Perubahan',
            rule: 'Validasi skema aktif',
          }
        : {
            purpose: `Persists form entries or record updates (${name}) to the server`,
            impact: 'Click to validate inputs and commit the changes.',
            sample: 'Save Changes',
            rule: 'Schema validation enforced',
          };
    }
    if (/edit|ubah|modify/.test(lower)) {
      return isId
        ? {
            purpose: `Membuka mode penyuntingan data pada baris/kartu (${name})`,
            impact: 'Klik untuk mengubah atribut item yang dipilih tanpa membuat duplikat.',
            sample: 'Mode Ubah Data',
            rule: 'Sesuai hak akses edit',
          }
        : {
            purpose: `Opens edit mode for the selected record (${name})`,
            impact: 'Click to modify attributes of the selected item.',
            sample: 'Edit Record',
            rule: 'Edit permission required',
          };
    }
    if (/hapus|delete|remove|buang/.test(lower)) {
      return isId
        ? {
            purpose: `Menghapus entri terpilih (${name}) setelah konfirmasi`,
            impact: 'Klik untuk menghapus data; dialog konfirmasi akan muncul sebelum penghapusan dijalankan.',
            sample: 'Konfirmasi Hapus',
            rule: 'Aksi destruktif (perlu konfirmasi)',
          }
        : {
            purpose: `Deletes the selected item (${name}) after user confirmation`,
            impact: 'Click to remove the record; prompts for confirmation first.',
            sample: 'Confirm Delete',
            rule: 'Confirmation required',
          };
    }
    if (/batal|cancel|tutup|close|kembali|back/.test(lower)) {
      return isId
        ? {
            purpose: `Menutup dialog/halaman saat ini (${name}) tanpa menyimpan perubahan yang belum dikirim`,
            impact: 'Klik untuk kembali ke tampilan daftar sebelumnya dengan aman.',
            sample: 'Batal / Kembali',
            rule: 'Aman (Non-destruktif)',
          }
        : {
            purpose: `Closes the current modal or returns to the previous view (${name}) without saving unsent edits`,
            impact: 'Click to safely discard draft form edits and return.',
            sample: 'Cancel / Back',
            rule: 'Safe (Non-destructive)',
          };
    }
    if (/detail|lihat|inspect|preview|pratinjau/.test(lower)) {
      return isId
        ? {
            purpose: `Membuka rincian lengkap informasi (${name})`,
            impact: 'Klik untuk menampilkan seluruh kolom, riwayat, dan metadata item.',
            sample: 'Panel Rincian',
            rule: 'Baca-saja (Read-only)',
          }
        : {
            purpose: `Opens the full detail drawer or page (${name})`,
            impact: 'Click to inspect complete record attributes and audit history.',
            sample: 'Detail Drawer',
            rule: 'Read-only',
          };
    }
    return isId
      ? {
          purpose: `Kontrol / kolom interaktif "${name}" untuk menjalankan fungsi modul terkait`,
          impact: `Gunakan kontrol "${name}" sesuai alur kerja pada layar ini untuk memproses atau menyaring data.`,
          sample: name,
          rule: 'Sesuai skema modul',
        }
      : {
          purpose: `Interactive control / input field "${name}" for executing module workflow actions`,
          impact: `Use "${name}" to enter required parameters, filter records, or trigger the corresponding action.`,
          sample: name,
          rule: 'Per module schema',
        };
  }

  /**
   * Renders a crisp, high-contrast 1280x720 dark enterprise UI mockup from harvested module data.
   * Used whenever a live screenshot is missing, tiny, or a uniformly white SPA canvas.
   */
  public buildRichModuleBlueprintSvgDataUrl(
    mod: FeatureModuleSurface,
    buttons: Iso26514ButtonEntry[],
    filters: Iso26514FilterEntry[]
  ): string {
    return buildFeatureModuleBlueprintSvgDataUrl(mod, buttons, filters);
  }

  public generateModuleManual(
    mod: FeatureModuleSurface,
    appName: string,
    locale: 'en' | 'id' = 'id',
    regressionDiff?: RegressionDiffSummary | null,
    validationRules?: ValidationRuleContract[],
    databaseTables?: DatabaseErdTable[]
  ): Iso26514ModuleManual {
    const isId = locale === 'id';
    const newVer = regressionDiff?.newVersion || 'v1.x';
    const isNewButton = (name: string): string | undefined => {
      if (!regressionDiff) return undefined;
      const lower = name.toLowerCase();
      if (regressionDiff.addedButtonsAndActions?.some((entry) => {
        const detail = entry.replace(/^\[[^\]]+\]\s*/, '').split(' (')[0].toLowerCase();
        return entry.toLowerCase().includes(lower) || Boolean(detail && lower.includes(detail));
      })) {
        return isId ? `[+ BARU di ${newVer}]` : `[+ NEW in ${newVer}]`;
      }
      return undefined;
    };
    const isNewFilter = (name: string): string | undefined => {
      if (!regressionDiff) return undefined;
      const lower = name.toLowerCase();
      if (regressionDiff.addedOrModifiedFiltersAndInputs?.some((entry) => {
        const detail = entry.replace(/^\[[^\]]+\]\s*/, '').split(' [Type:')[0].toLowerCase();
        return entry.toLowerCase().includes(lower) || Boolean(detail && lower.includes(detail));
      })) {
        return isId ? `[+ BARU di ${newVer}]` : `[+ NEW in ${newVer}]`;
      }
      return undefined;
    };
    const isNewInteraction = (ep: string): string | undefined => {
      if (!regressionDiff) return undefined;
      const endpoints = [ep, ...Array.from(ep.matchAll(/(?:GET|POST|PUT|PATCH|DELETE)\s+\S+/gi), (match) => match[0])].map((item) => item.toLowerCase());
      if (regressionDiff.newApisAdded?.some((api) => endpoints.includes(api.toLowerCase()))) {
        return isId ? `[+ BARU di ${newVer}]` : `[+ NEW in ${newVer}]`;
      }
      if (regressionDiff.modifiedApiContracts?.some((item) => endpoints.includes(item.endpoint.toLowerCase()))) {
        return isId ? `[⚡ DIUBAH di ${newVer}]` : `[⚡ UPDATED in ${newVer}]`;
      }
      return undefined;
    };

    const domain = domainLogicBrainService.classifyDomain(mod);
    const isLogistics = domain === 'LOGISTICS_COMMERCIAL_PRICING';
    const domainInfo = domainLogicBrainService.inferDomainIntelligence(mod, {
      appName,
      targetUrl: mod.fullUrl,
      validationRules,
      databaseTables,
    });

    const subTabs =
      mod.subTabsCatalog && mod.subTabsCatalog.length > 0
        ? mod.subTabsCatalog
        : isLogistics
        ? [
            {
              tabName: 'Komponen Rute',
              description: isId
                ? 'Menampilkan kartu komponen tarif pokok per rute (Origin -> Destination), moda transportasi, mata uang, dan ukuran unit.'
                : 'Displays base route pricing cards (Origin -> Destination), transport mode, currency, and unit dimensions.',
              columnsOrCards:
                mod.cardItems && mod.cardItems.length > 0
                  ? mod.cardItems.map((c) => c.title)
                  : mod.sampleRowData.length > 0
                  ? mod.sampleRowData.slice(0, 3)
                  : [mod.pageHeading || mod.moduleName],
              actionButtons: ['+ Komponen Rute Tambahan'],
            },
            {
              tabName: 'Additional Cost',
              description: isId
                ? 'Mengelola komponen biaya tambahan di luar tarif pokok seperti biaya inap, buruh, tol, atau penyesuaian khusus.'
                : 'Manages supplemental surcharges beyond base tariff (overnight wait, toll, multi-drop).',
              columnsOrCards: ['Kode Biaya', 'Nama Surcharge', 'Nominal', 'SAT'],
              actionButtons: ['+ Additional Cost'],
            },
            {
              tabName: 'Terms & Conditions',
              description: isId
                ? 'Menyimpan klausul syarat dan ketentuan komersial resmi yang berlaku pada komponen penawaran.'
                : 'Maintains standard commercial terms and contractual clauses governing quotations.',
              columnsOrCards: ['Klausul Komersial', 'Masa Berlaku'],
              actionButtons: ['+ Terms & Conditions'],
            },
          ]
        : [];

    const firstCard = mod.cardItems?.[0]?.title || mod.sampleRowData[0] || mod.pageHeading || mod.moduleName;
    const controls = mod.screenControlsCatalog || [];

    const isAuthGate = domain === 'AUTHENTICATION_RBAC_GATE';
    // Login dropdowns (Role / Tenant / Branch / Access Type) harvested from the untouched login surface.
    const loginDropdowns = isAuthGate
      ? (mod.formsAndModals || [])
          .flatMap((fm) => fm.inputs || [])
          .filter((inp) => inp.type === 'select' || /role|peran|akses|access|tenant|perusahaan|cabang|branch|unit|organisasi|pancaran|eksternal|external|internal|domain|tipe|user_type/i.test(`${inp.labelText || ''} ${inp.name || ''}`))
          .filter((inp) => !/user ?id|username|password|sandi/i.test(`${inp.labelText || ''} ${inp.name || ''}`))
      : [];
    const loginDropdownLabels = Array.from(
      new Set(loginDropdowns.map((inp) => inp.labelText || inp.name).filter(Boolean))
    );
    const isFinance = domain === 'FINANCE_INVOICING_BILLING';
    const isWms = domain === 'WAREHOUSE_INVENTORY_WMS';
    // Section 1: Overview & Purpose
    const section1 = {
      heading: isId ? '1. Tujuan Halaman & Kegunaan Bisnis' : '1. Screen Purpose & Business Overview',
      purposeSummary: isId
        ? isAuthGate
          ? `Halaman "${mod.moduleName}" (${mod.routePath}) adalah gerbang autentikasi resmi aplikasi ${appName} untuk memverifikasi identitas operator, menerbitkan token sesi aman, dan mengarahkan pengguna ke modul kerja sesuai hak akses.`
          : isLogistics
          ? `Halaman "${mod.moduleName}" (${mod.routePath}) berfungsi sebagai pusat katalog komponen harga dan penawaran logistik pada ${appName}. Melalui halaman ini tim komersial dan operasional dapat melihat daftar tarif rute aktif (seperti ${firstCard}), membandingkan biaya tambahan, serta meninjau syarat & ketentuan penawaran secara terpusat.`
          : isFinance
          ? `Halaman "${mod.moduleName}" (${mod.routePath}) mengelola faktur, tagihan, pajak PPN/PPh, dan status pelunasan pada ${appName} secara terstruktur dan audit-ready.`
          : isWms
          ? `Halaman "${mod.moduleName}" (${mod.routePath}) mengendalikan saldo stok SKU gudang, pergerakan inbound/outbound, dan lokasi rak pada ${appName}.`
          : `Halaman "${mod.moduleName}" (${mod.routePath}) adalah layar operasional pada ${appName} untuk mengelola, mencari, dan memverifikasi data "${mod.moduleName}" secara langsung.`
        : isAuthGate
        ? `"${mod.moduleName}" (${mod.routePath}) is the primary authentication gateway for ${appName}, validating operator credentials, issuing secure session tokens, and routing authorized users to their permitted workspace modules.`
        : isLogistics
        ? `"${mod.moduleName}" (${mod.routePath}) serves as the central commercial pricing and quotation component catalog in ${appName}, enabling teams to browse active route rates (such as ${firstCard}), surcharges, and commercial terms.`
        : isFinance
        ? `"${mod.moduleName}" (${mod.routePath}) manages customer invoices, tax calculations, and payment settlement statuses in ${appName}.`
        : isWms
        ? `"${mod.moduleName}" (${mod.routePath}) tracks warehouse SKU inventory balances, inbound/outbound stock movements, and bin locations in ${appName}.`
        : `"${mod.moduleName}" (${mod.routePath}) is an operational workspace in ${appName} for reviewing, filtering, and managing "${mod.moduleName}" records.`,
      targetUsers: isId
        ? isAuthGate
          ? 'Seluruh Pengguna Terdaftar, Operator Operasional, dan Administrator Sistem.'
          : isLogistics
          ? 'Tim Commercial / Pricing Analyst, Sales Logistik, Business Analyst, dan Admin Operasional.'
          : 'Operator Terautentikasi, Administrator Sistem, Business Analyst, dan Tim QA.'
        : isAuthGate
        ? 'All Registered Users, Operations Staff, and System Administrators.'
        : isLogistics
        ? 'Commercial Pricing Analysts, Sales Operations, Business Analysts, and Administrators.'
        : 'Authenticated Operators, System Administrators, Business Analysts, and QA Engineers.',
      displayedBusinessData: isId
        ? mod.cardItems && mod.cardItems.length > 0
          ? `Menampilkan ${mod.cardItems.length} kartu data utama (${mod.cardItems.slice(0, 3).map((c) => `${c.title} [${c.badges.join(', ')}]`).join('; ')}) beserta total hitungan data${mod.totalRowCountText ? ` (${mod.totalRowCountText})` : ''}.`
          : mod.tableColumns.length > 0
          ? `Menampilkan tabel data dengan kolom: ${mod.tableColumns.join(', ')}${mod.totalRowCountText ? ` (${mod.totalRowCountText})` : ''}.`
          : isAuthGate
          ? `Menampilkan formulir masuk (${mod.formsAndModals[0]?.inputs.map((i) => i.labelText || i.placeholder || i.name).join(', ') || 'Username / Password'}${loginDropdownLabels.length ? ` beserta dropdown otorisasi [${loginDropdownLabels.join(', ')}]` : ''}) dan tombol autentikasi.`
          : `Menampilkan ringkasan status, kontrol input, dan panel informasi "${mod.moduleName}".`
        : mod.cardItems && mod.cardItems.length > 0
        ? `Displays ${mod.cardItems.length} primary data cards (${mod.cardItems.slice(0, 3).map((c) => `${c.title} [${c.badges.join(', ')}]`).join('; ')})${mod.totalRowCountText ? ` (${mod.totalRowCountText})` : ''}.`
        : mod.tableColumns.length > 0
        ? `Displays structured table columns: ${mod.tableColumns.join(', ')}${mod.totalRowCountText ? ` (${mod.totalRowCountText})` : ''}.`
        : isAuthGate
        ? `Displays sign-in credential inputs (${mod.formsAndModals[0]?.inputs.map((i) => i.labelText || i.placeholder || i.name).join(', ') || 'Username / Password'}${loginDropdownLabels.length ? ` along with authorization dropdown(s) [${loginDropdownLabels.join(', ')}]` : ''}) and submit controls.`
        : `Displays primary controls and status content for "${mod.moduleName}".`,
      whenToUse: isId
        ? isAuthGate
          ? 'Gunakan setiap kali memulai sesi kerja baru di aplikasi atau setelah sesi login berakhir.'
          : isLogistics
          ? 'Gunakan menu ini setiap kali menyusun penawaran harga baru ke klien, mengecek tarif rute aktif, menambahkan surcharge, atau memverifikasi syarat komersial.'
          : `Buka halaman ini saat perlu melihat daftar data terbaru, memfilter entitas spesifik, atau melakukan pembaruan data pada modul "${mod.moduleName}".`
        : isAuthGate
        ? 'Use at the start of every work session or whenever re-authentication is required.'
        : isLogistics
        ? 'Open this menu whenever preparing customer quotations, verifying active route tariffs, adding surcharges, or auditing commercial terms.'
        : `Open this screen whenever inspecting records, applying filter criteria, or executing updates on "${mod.moduleName}".`,
    };

    // Section 2: Navigation & Sub-Tabs Guide
    const navMenus = controls.filter((c) => c.controlType === 'MENU_NAVIGATION').map((c) => `${c.controlName} (${c.screenLocation})`);
    const section2 = {
      heading: isId ? '2. Panduan Menu & Fungsi Setiap Sub-Tab' : '2. Menu Navigation & Sub-Tabs Guide',
      howToReachMenu: isId
        ? `Masuk ke ${appName}, lalu akses rute ${mod.routePath} melalui menu navigasi ${navMenus.slice(0, 3).join(' / ') || 'Header Atas / Sidebar Kiri'} dan pilih "${mod.moduleName}".`
        : `Sign in to ${appName} and navigate to ${mod.routePath} via ${navMenus.slice(0, 3).join(' / ') || 'Top Navigation / Left Sidebar'} -> "${mod.moduleName}".`,
      subTabs:
        subTabs.length > 0
          ? subTabs.map((t) => ({
              tabName: t.tabName,
              businessContent: t.description,
              actionButtons: t.actionButtons.join(', ') || (isId ? 'Kontrol standar tabel/kartu' : 'Standard card/table controls'),
            }))
          : [
              {
                tabName: isId ? 'Tampilan Utama Halaman' : 'Primary Screen View',
                businessContent: isId
                  ? `Menampilkan seluruh data dan kontrol interaktif modul "${mod.moduleName}" dalam satu kanvas.`
                  : `Displays all data records and controls for "${mod.moduleName}" in a single view.`,
                actionButtons: mod.toolbarButtons?.join(', ') || (isId ? 'Kontrol aksi utama' : 'Primary action controls'),
              },
            ],
    };

    // Section 3: Complete Buttons & Icons Dictionary
    // Section 3: Complete Buttons & Icons Dictionary with 1-to-1 Visual Callout Coordinates
    const findCoord = (rawName: string, kind: 'BUTTON' | 'FILTER' | 'SUB_TAB', fallbackIdx: number) => {
      const clean = rawName.toLowerCase().replace(/^tab\s+/i, '').trim();
      const match = controls.find((c) => {
        const cn = c.controlName.toLowerCase().replace(/^tab\s+/i, '').trim();
        return cn === clean || cn.includes(clean) || clean.includes(cn);
      });
      if (match?.xPercent !== undefined && match?.yPercent !== undefined) {
        return { xPercent: match.xPercent, yPercent: match.yPercent };
      }
      if (kind === 'SUB_TAB') {
        return { xPercent: Math.min(88, 14 + fallbackIdx * 18), yPercent: 26 };
      }
      if (kind === 'BUTTON') {
        return { xPercent: Math.min(92, Math.max(12, 84 - (fallbackIdx % 4) * 14)), yPercent: 18 + Math.floor(fallbackIdx / 4) * 10 };
      }
      return { xPercent: Math.min(90, 18 + (fallbackIdx % 4) * 20), yPercent: 38 + Math.floor(fallbackIdx / 4) * 9 };
    };

    const buttonsList: Iso26514ButtonEntry[] = [];
    const seenBtn = new Set<string>();
    const addBtn = (name: string, loc: string, fallbackPurpose?: string, fallbackImpact?: string) => {
      const k = name.toLowerCase().trim();
      if (!k || seenBtn.has(k)) return;
      seenBtn.add(k);
      const info = this.explainControlPurpose(name, isId, isLogistics);
      const coords = findCoord(name, 'BUTTON', buttonsList.length);
      buttonsList.push({
        buttonName: name,
        screenLocation: loc,
        primaryPurpose: fallbackPurpose || info.purpose,
        howToUseAndImpact: fallbackImpact || info.impact,
        xPercent: coords.xPercent,
        yPercent: coords.yPercent,
        versionDeltaBadge: isNewButton(name),
      });
    };

    controls
      .filter(
        (c) =>
          c.controlType === 'PRIMARY_ACTION_BUTTON' ||
          (c.controlType === 'FILTER_CONTROL' && c.availableOptionsOrSample.startsWith('Membuka/menerapkan'))
      )
      .forEach((c) => addBtn(c.controlName, c.screenLocation));

    (mod.toolbarButtons || []).forEach((b) => addBtn(b, isId ? 'Toolbar Pencarian & Filter' : 'Search & Filter Toolbar'));
    mod.formsAndModals.forEach((fm) => {
      if (fm.triggerButtonText) addBtn(fm.triggerButtonText, isId ? 'Area Konten / Toolbar' : 'Content Toolbar');
      if (fm.submitButtonText) addBtn(fm.submitButtonText, isId ? 'Dialog / Modal Form' : 'Form Dialog');
    });

    if (isLogistics && buttonsList.length === 0) {
      addBtn('+ Komponen Rute Tambahan', isId ? 'Kanan Atas Sub-Tab Komponen Rute' : 'Top-Right Action Bar');
      addBtn('Filter Lanjutan', isId ? 'Toolbar Pencarian & Filter' : 'Filter Toolbar');
    }
    if (buttonsList.length === 0) {
      addBtn(isId ? 'Tombol Aksi Utama / Navigasi' : 'Primary Action / Navigation Button', isId ? 'Area Konten Utama' : 'Main Content Area');
    }

    const isLoginModule = isAuthGate;
    // Section 4: Search Bars, Filter Dropdowns & Form Fields Dictionary (disjoint & semantically deduplicated)
    const filtersList: Iso26514FilterEntry[] = [];
    const seenFilt = new Set<string>(seenBtn);
    const seenSamples = new Set<string>();
    const cleanHumanFieldTitle = (raw: string): string => {
      const trimmed = (raw || '').trim();
      if (/^username$/i.test(trimmed)) return isId ? 'User ID / Username' : 'User ID / Username';
      if (/^password$/i.test(trimmed)) return isId ? 'Kata Sandi (Password)' : 'Password';
      return trimmed.replace(/_{2,}/g, ' / ').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    };
    const getSemanticSlot = (rawName: string, sample?: string): string | null => {
      const combined = `${rawName} ${sample || ''}`.toLowerCase();
      if (/user id|username|masukkan user/i.test(combined)) return 'SLOT_USERNAME';
      if (/sandi|password/i.test(combined)) return 'SLOT_PASSWORD';
      return null;
    };
    const addFilt = (name: string, kind: string, sampleOverride?: string, required?: boolean) => {
      const displayName = cleanHumanFieldTitle(name);
      const k = displayName.toLowerCase().trim();
      const sampleKey = (sampleOverride || '').toLowerCase().trim();
      const slot = getSemanticSlot(displayName, sampleOverride);
      if (!k || seenFilt.has(k)) return;
      if (slot && seenSamples.has(slot)) return;
      if (sampleKey && sampleKey.length > 3 && seenSamples.has(sampleKey) && /input|search|form/i.test(kind)) return;
      seenFilt.add(k);
      if (slot) seenSamples.add(slot);
      if (sampleKey && sampleKey.length > 3) seenSamples.add(sampleKey);
      const info = this.explainControlPurpose(displayName, isId, isLogistics);
      const coords = findCoord(name, 'FILTER', filtersList.length);
      filtersList.push({
        filterName: displayName,
        controlType: kind,
        businessPurpose: info.purpose,
        sampleValues: sampleOverride || info.sample,
        validationRule: required ? (isId ? 'Wajib diisi (*)' : 'Required (*)') : info.rule,
        xPercent: coords.xPercent,
        yPercent: coords.yPercent,
        versionDeltaBadge: isNewFilter(displayName) || isNewFilter(name),
      });
    };

    controls
      .filter(
        (c: ScreenControlCatalogItem) =>
          c.controlType === 'SEARCH_INPUT' ||
          (c.controlType === 'FILTER_CONTROL' && !c.availableOptionsOrSample.startsWith('Membuka/menerapkan')) ||
          c.controlType === 'MODAL_FORM_INPUT'
      )
      .forEach((c) =>
        addFilt(
          c.controlName,
          c.controlType === 'SEARCH_INPUT' ? (isId ? 'Kolom Pencarian' : 'Search Input') : c.controlType === 'FILTER_CONTROL' ? (isId ? 'Dropdown Filter' : 'Filter Control') : (isId ? 'Input Form' : 'Form Input'),
          c.availableOptionsOrSample
        )
      );

    mod.formsAndModals.forEach((fm) => {
      fm.inputs.forEach((inp) => addFilt(inp.labelText || inp.placeholder || inp.name, inp.type === 'select' ? 'Dropdown' : `Input (${inp.type})`, inp.placeholder || undefined, inp.required));
    });
    if (filtersList.length === 0) {
      addFilt(isId ? 'Pencarian & Filter Daftar' : 'List Search & Filter', isId ? 'Kolom Pencarian' : 'Search Input', firstCard);
    }

    // Assign sequential 1-to-1 Callout Pins (#1..#N) and deduplicate overlapping coordinates
    const visualCalloutPins: NonNullable<Iso26514ModuleManual['visualCalloutPins']> = [];
    const usedCoords = new Set<string>();
    const reserveCoord = (x: number, y: number): { xPercent: number; yPercent: number } => {
      let cx = x;
      let cy = y;
      let tries = 0;
      while (usedCoords.has(`${Math.round(cx / 4)}:${Math.round(cy / 4)}`) && tries < 8) {
        cx = cx >= 86 ? cx - 6 : cx + 6;
        if (tries % 2 === 1) cy = cy >= 86 ? cy - 5 : cy + 5;
        tries++;
      }
      usedCoords.add(`${Math.round(cx / 4)}:${Math.round(cy / 4)}`);
      return { xPercent: cx, yPercent: cy };
    };
    let nextCallout = 1;
    buttonsList.forEach((b) => {
      const pinNum = nextCallout++;
      const pos = reserveCoord(b.xPercent ?? 78, b.yPercent ?? 20);
      const px = pos.xPercent;
      const py = pos.yPercent;
      b.calloutNumber = pinNum;
      b.xPercent = px;
      b.yPercent = py;
      visualCalloutPins.push({
        calloutNumber: pinNum,
        label: b.buttonName,
        kind: 'BUTTON',
        xPercent: px,
        yPercent: py,
        summary: b.primaryPurpose,
      });
    });
    filtersList.forEach((f) => {
      const pinNum = nextCallout++;
      const pos = reserveCoord(f.xPercent ?? 28, f.yPercent ?? 38);
      const px = pos.xPercent;
      const py = pos.yPercent;
      f.calloutNumber = pinNum;
      f.xPercent = px;
      f.yPercent = py;
      visualCalloutPins.push({
        calloutNumber: pinNum,
        label: f.filterName,
        kind: 'FILTER',
        xPercent: px,
        yPercent: py,
        summary: f.businessPurpose,
      });
    });

    if (mod.customCalloutPins && mod.customCalloutPins.length > 0) {
      visualCalloutPins.splice(0, visualCalloutPins.length, ...mod.customCalloutPins);
      for (const b of buttonsList) {
        const hit = mod.customCalloutPins.find((p) => p.label.toLowerCase() === b.buttonName.toLowerCase());
        if (hit) {
          b.calloutNumber = hit.calloutNumber;
          b.xPercent = hit.xPercent;
          b.yPercent = hit.yPercent;
        }
      }
      for (const f of filtersList) {
        const hit = mod.customCalloutPins.find((p) => p.label.toLowerCase() === f.filterName.toLowerCase());
        if (hit) {
          f.calloutNumber = hit.calloutNumber;
          f.xPercent = hit.xPercent;
          f.yPercent = hit.yPercent;
        }
      }
    }
    // Section 5: SOP 1 - SOP 5 (ISO 26514 Clause 8 Task-Oriented Procedures)
    const primaryBtnName = buttonsList[0]?.buttonName || (isId ? 'Tambah Data' : 'Create New');
    const sops: Iso26514SopItem[] = isId
      ? [
          {
            sopId: 'SOP-01',
            sopTitle: `Cara Membuka Halaman & Membaca Informasi Kartu / Tabel "${mod.moduleName}"`,
            steps: [
              `Login ke aplikasi ${appName} menggunakan akun yang memiliki hak akses modul ini.`,
              `Buka menu navigasi (${navMenus[0] || 'Header / Sidebar'}) lalu pilih "${mod.moduleName}" (${mod.routePath}).`,
              `Tunggu hingga indikator pemuatan selesai dan pastikan judul "${mod.pageHeading}" tampil di atas layar.`,
              `Amati ${mod.cardItems && mod.cardItems.length > 0 ? `kartu data utama seperti "${firstCard}" lengkap dengan badge penandanya` : `kolom tabel (${mod.tableColumns.join(', ') || 'data utama'})`}.`,
            ],
            expectedResult: `Seluruh daftar data awal tampil lengkap beserta jumlah total item dan status aktif.`,
          },
          {
            sopId: 'SOP-02',
            sopTitle: isLogistics
              ? 'Cara Mencari Rute Spesifik (Berdasarkan Origin, Destination, atau Kode Rute)'
              : `Cara Mencari Data Spesifik pada "${mod.moduleName}"`,
            steps: [
              `Arahkan kursor ke kolom pencarian di bagian toolbar atas (${filtersList[0]?.filterName || 'Kolom Pencarian'}).`,
              isLogistics
                ? `Ketik nama kota asal (mis. "BOGOR"), kota tujuan ("TANJUNG PRIOK"), atau kode rute yang dicari.`
                : `Ketik kata kunci yang ingin dicari (mis. "${firstCard}").`,
              `Tunggu sejenak atau tekan tombol Enter agar sistem memproses penyaringan otomatis.`,
              `Periksa kartu/baris hasil pencarian yang tersisa di layar.`,
            ],
            expectedResult: `Layar hanya menampilkan data yang mengandung kata kunci tersebut.`,
          },
          {
            sopId: 'SOP-03',
            sopTitle: 'Cara Menyaring Data Menggunakan Filter Cepat & Filter Lanjutan (Kombinasi Kriteria)',
            steps: [
              `Pilih nilai pada filter cepat di toolbar utama (mis. ${filtersList.slice(1, 3).map((f) => f.filterName).join(' atau ') || 'Dropdown Filter'}).`,
              `Klik tombol "Filter Lanjutan" (jika tersedia) untuk membuka kriteria tambahan.`,
              isLogistics
                ? `Pilih kombinasi parameter seperti Job Character ("Single Trip"), SAT (Service Agreement Type), dan Unit Type ("40ft" atau "FTR").`
                : `Tentukan nilai kriteria tambahan yang diinginkan lalu klik Terapkan.`,
              `Periksa hasil saringan dan tekan "Reset Filter" apabila ingin menampilkan seluruh data kembali.`,
            ],
            expectedResult: `Hanya data yang memenuhi seluruh kombinasi kriteria filter yang muncul; Reset mengembalikan seluruh item.`,
          },
          {
            sopId: 'SOP-04',
            sopTitle: 'Cara Berpindah Antar Sub-Tab & Melihat Rincian Komponen',
            steps: [
              `Lihat deretan tab di bawah judul halaman (${subTabs.map((t) => t.tabName).join(' / ') || 'Sub-Tab Modul'}).`,
              `Klik sub-tab yang ingin diperiksa (mis. "${subTabs[1]?.tabName || subTabs[0]?.tabName || 'Tab Berikutnya'}") untuk berpindah tampilan.`,
              `Klik salah satu kartu atau baris data (mis. "${firstCard}") untuk membuka panel/halaman rincian lengkap.`,
              `Tinjau detail informasi di dalamnya lalu tutup dialog atau kembali ke daftar utama bila selesai.`,
            ],
            expectedResult: `Setiap sub-tab memuat daftar komponen yang relevan dan rincian kartu terbuka lengkap tanpa error.`,
          },
          {
            sopId: 'SOP-05',
            sopTitle: `Cara Menambah atau Memperbarui Data Melalui Tombol "${primaryBtnName}"`,
            steps: [
              `Pastikan Anda berada di tab yang sesuai lalu klik tombol aksi utama "${primaryBtnName}".`,
              `Lengkapi seluruh kolom wajib bertanda bintang (*) sesuai aturan format (mis. nominal biaya harus > 0).`,
              `Periksa kembali isian agar tidak terjadi duplikasi data atau nilai tidak logis.`,
              `Klik tombol Simpan / Submit dan tunggu notifikasi sukses muncul.`,
            ],
            expectedResult: `Data baru langsung tersimpan di server dan otomatis muncul pada daftar katalog.`,
          },
        ]
      : [
          {
            sopId: 'SOP-01',
            sopTitle: `Opening "${mod.moduleName}" and Reading Primary Cards / Table Data`,
            steps: [
              `Sign in to ${appName} with an authorized operator account.`,
              `Open navigation (${navMenus[0] || 'Header / Sidebar'}) and select "${mod.moduleName}" (${mod.routePath}).`,
              `Wait for data loading to complete and verify heading "${mod.pageHeading}" is visible.`,
              `Review ${mod.cardItems && mod.cardItems.length > 0 ? `primary data cards such as "${firstCard}" along with their attribute badges` : `table columns (${mod.tableColumns.join(', ') || 'records'})`}.`,
            ],
            expectedResult: `All active records render cleanly with accurate totals and status indicators.`,
          },
          {
            sopId: 'SOP-02',
            sopTitle: isLogistics
              ? 'Searching Specific Routes (By Origin, Destination, or Route Code)'
              : `Searching Specific Records in "${mod.moduleName}"`,
            steps: [
              `Locate the search input on the top filter toolbar (${filtersList[0]?.filterName || 'Search Box'}).`,
              isLogistics
                ? `Enter Origin city (e.g. "BOGOR"), Destination ("TANJUNG PRIOK"), or Route Code.`
                : `Type your search keyword (e.g. "${firstCard}").`,
              `Press Enter or wait for automatic filtering to complete.`,
              `Inspect the narrowed card/table list displayed on screen.`,
            ],
            expectedResult: `Only records matching the entered query remain visible.`,
          },
          {
            sopId: 'SOP-03',
            sopTitle: 'Applying Quick Filters & Advanced Filter Combinations',
            steps: [
              `Select a value from the primary toolbar dropdowns (${filtersList.slice(1, 3).map((f) => f.filterName).join(' / ') || 'Filter Dropdown'}).`,
              `Click "Filter Lanjutan" / Advanced Filter to access granular criteria if available.`,
              isLogistics
                ? `Combine Job Character ("Single Trip"), SAT (Service Agreement Type), and Unit Type ("40ft" / "FTR").`
                : `Select desired criteria and click Apply Filters.`,
              `Click "Reset Filter" when finished to return to the unfiltered list.`,
            ],
            expectedResult: `Only items satisfying all active criteria appear; Reset restores the full baseline list.`,
          },
          {
            sopId: 'SOP-04',
            sopTitle: 'Switching Sub-Tabs & Inspecting Record Details',
            steps: [
              `Locate the page sub-tabs (${subTabs.map((t) => t.tabName).join(' / ') || 'Module Tabs'}) beneath the header.`,
              `Click any sub-tab (e.g. "${subTabs[1]?.tabName || subTabs[0]?.tabName || 'Next Tab'}") to load its view.`,
              `Click a card or table row ("${firstCard}") to open detailed attributes.`,
              `Review the detailed parameters and close the drawer/modal when finished.`,
            ],
            expectedResult: `Each sub-tab renders its dedicated records cleanly and item details load accurately.`,
          },
          {
            sopId: 'SOP-05',
            sopTitle: `Creating or Updating Records via "${primaryBtnName}"`,
            steps: [
              `Select the target sub-tab and click primary action button "${primaryBtnName}".`,
              `Fill in all mandatory fields (*) obeying validation rules (e.g. positive tariff values > 0).`,
              `Review entries to prevent duplicate codes or conflicting attributes.`,
              `Click Save / Submit and confirm the success banner appears.`,
            ],
            expectedResult: `The new or updated record persists cleanly and appears in the catalog.`,
          },
        ];
    if (isLoginModule) {
      const submitText = mod.formsAndModals[0]?.submitButtonText || (isId ? 'Masuk / Login' : 'Sign in');
      const dropdownStepId = loginDropdowns.length
        ? `Pilih nilai pada dropdown otorisasi login: ${loginDropdowns
            .map((d) => `${d.labelText || d.name}${d.placeholder ? ` (opsi: ${d.placeholder})` : ''}`)
            .join('; ')}.`
        : null;
      const dropdownStepEn = loginDropdowns.length
        ? `Select the login authorization dropdown value(s): ${loginDropdowns
            .map((d) => `${d.labelText || d.name}${d.placeholder ? ` (options: ${d.placeholder})` : ''}`)
            .join('; ')}.`
        : null;
      const loginSopsId: Iso26514SopItem[] = [
        {
          sopId: 'SOP-01',
          sopTitle: 'Cara Masuk ke Aplikasi (Autentikasi & Pemilihan Otorisasi)',
          steps: [
            'Buka halaman login dan periksa kolom User ID serta Kata Sandi.',
            ...(dropdownStepId ? [dropdownStepId] : []),
            'Isi kredensial pada kolom yang sesuai; jangan membagikan kata sandi kepada siapa pun.',
            `Tekan "${submitText}" satu kali lalu tunggu konfirmasi atau pesan kesalahan sebelum mencoba kembali.`,
          ],
          expectedResult:
            'Pengguna terverifikasi diarahkan ke workspace yang diizinkan sesuai Role / Tenant / Cabang yang dipilih; kredensial tidak tampil pada dokumentasi.',
        },
        {
          sopId: 'SOP-02',
          sopTitle: 'Cara Mengubah Role / Tenant / Cabang Saat Login',
          steps: [
            ...(dropdownStepId
              ? [dropdownStepId, 'Periksa kembali pilihan sebelum menekan tombol Masuk karena pilihan menentukan cakupan data.']
              : ['Halaman login ini tidak menampilkan dropdown otorisasi tambahan; hubungi administrator untuk perubahan hak akses.']),
            'Jika pilihan tidak tersedia, pastikan akun Anda terdaftar pada tenant/cabang tersebut.',
            'Tekan tombol Masuk dan verifikasi modul yang tampil sesuai pilihan otorisasi.',
          ],
          expectedResult: 'Workspace yang terbuka hanya memuat data sesuai Role / Tenant / Cabang yang dipilih.',
        },
        {
          sopId: 'SOP-03',
          sopTitle: 'Cara Mengatasi Gagal Masuk (Kredensial / Otorisasi Tidak Cocok)',
          steps: [
            'Periksa huruf besar/kecil kata sandi dan pastikan tidak ada spasi berlebih.',
            'Pastikan dropdown Role / Tenant / Cabang yang dipilih sesuai dengan akun Anda.',
            'Jika pesan "terlalu banyak percobaan" muncul, tunggu 15 menit sebelum mencoba lagi.',
            'Hubungi administrator apabila akun terkunci atau pilihan otorisasi tidak tersedia.',
          ],
          expectedResult: 'Pengguna dapat masuk kembali setelah kredensial dan pilihan otorisasi diperbaiki.',
        },
        {
          sopId: 'SOP-04',
          sopTitle: 'Cara Keluar dari Aplikasi dengan Aman',
          steps: [
            'Klik menu profil / Keluar pada header aplikasi.',
            'Pastikan halaman login tampil kembali dan sesi tidak dapat diakses ulang dengan tombol Back.',
            'Tutup jendela browser apabila menggunakan perangkat bersama.',
          ],
          expectedResult: 'Sesi berakhir dan token akses tidak berlaku lagi.',
        },
        {
          sopId: 'SOP-05',
          sopTitle: 'Cara Memverifikasi Pilihan Dropdown Otorisasi Login Sebelum Masuk',
          steps: [
            loginDropdowns.length
              ? `Buka setiap dropdown otorisasi (${loginDropdownLabels.join(', ')}) dan pilih nilai yang benar.`
              : 'Periksa apakah formulir login memiliki dropdown otorisasi; jika tidak ada, lanjutkan dengan kredensial.',
            'Bandingkan nilai yang dipilih dengan unit kerja / perusahaan Anda pada halaman konfirmasi (jika ada).',
            'Jangan menekan tombol Masuk sebelum seluruh dropdown wajib terisi.',
            `Tekan "${submitText}" dan periksa apakah data yang tampil sesuai dengan pilihan otorisasi.`,
          ],
          expectedResult:
            'Payload login mengirimkan Role / Tenant / Cabang yang benar dan pengguna diarahkan ke data yang sesuai.',
        },
      ];
      const loginSopsEn: Iso26514SopItem[] = [
        {
          sopId: 'SOP-01',
          sopTitle: 'Signing in to the Application (Authentication & Authorization Selection)',
          steps: [
            'Open the sign-in page and identify the User ID and password fields.',
            ...(dropdownStepEn ? [dropdownStepEn] : []),
            'Enter credentials into the matching fields; never share the password.',
            `Select "${submitText}" once and wait for confirmation or an error before retrying.`,
          ],
          expectedResult:
            'A verified user is routed to the permitted workspace for the selected Role / Tenant / Branch; credentials remain confidential.',
        },
        {
          sopId: 'SOP-02',
          sopTitle: 'Changing Role / Tenant / Branch at Sign-In',
          steps: [
            ...(dropdownStepEn
              ? [dropdownStepEn, 'Review the selected values before submitting; they determine the data scope after sign-in.']
              : ['This sign-in page exposes no additional authorization dropdown; contact the administrator for access changes.']),
            'If an option is unavailable, confirm your account is registered on that tenant/branch.',
            'Select Sign in and verify the visible modules match the selected authorization context.',
          ],
          expectedResult: 'The opened workspace contains only data permitted by the selected Role / Tenant / Branch.',
        },
        {
          sopId: 'SOP-03',
          sopTitle: 'Recovering from a Failed Sign-In (Credential / Authorization Mismatch)',
          steps: [
            'Verify password case sensitivity and remove leading/trailing spaces.',
            'Confirm the selected Role / Tenant / Branch matches your account assignment.',
            'If a "too many attempts" message appears, wait 15 minutes before retrying.',
            'Contact the administrator if the account is locked or an authorization option is missing.',
          ],
          expectedResult: 'The user regains access after correcting credentials and the authorization selection.',
        },
        {
          sopId: 'SOP-04',
          sopTitle: 'Signing Out Securely',
          steps: [
            'Select the profile / Sign out menu in the application header.',
            'Confirm the sign-in page returns and the previous session cannot be reopened with the Back button.',
            'Close the browser window when using a shared device.',
          ],
          expectedResult: 'The session ends and the access token is no longer valid.',
        },
        {
          sopId: 'SOP-05',
          sopTitle: 'Verifying Login Authorization Dropdowns Before Signing In',
          steps: [
            loginDropdowns.length
              ? `Open each authorization dropdown (${loginDropdownLabels.join(', ')}) and select the correct value.`
              : 'Check whether the sign-in form exposes authorization dropdowns; continue with credentials if none exist.',
            'Compare the selected value with your assigned company / organizational unit on the confirmation screen (if present).',
            'Do not submit the form before all mandatory dropdowns are populated.',
            `Select "${submitText}" and verify the displayed data matches the selected authorization context.`,
          ],
          expectedResult: 'The login payload carries the correct Role / Tenant / Branch and the user lands on the matching dataset.',
        },
      ];
      sops.splice(0, sops.length, ...(isId ? loginSopsId : loginSopsEn));
    }

    // Section 6: Troubleshooting & FAQ for Laypersons
    const faqs: Iso26514FaqItem[] = isId
      ? [
          {
            question: `Mengapa data "${firstCard}" yang saya cari tidak muncul di layar?`,
            answer: `Periksa apakah ada Filter Cepat atau "Filter Lanjutan" (${isLogistics ? 'Job Character / SAT / Unit Type' : 'filter kriteria'}) yang masih aktif menyaring kategori lain. Klik tombol Reset Filter atau kosongkan kotak pencarian untuk menampilkan seluruh data kembali.`,
          },
          {
            question: 'Mengapa tombol Simpan menolak form atau muncul pesan error saat menambah data?',
            answer: isLogistics
              ? 'Pastikan seluruh kolom wajib (*) terisi, Origin tidak sama dengan Destination, Kode Rute belum pernah dipakai sebelumnya, dan nilai biaya/tarif IDR lebih besar dari 0.'
              : 'Pastikan seluruh kolom wajib bertanda bintang (*) sudah terisi sesuai format yang diminta dan tidak ada duplikasi kode unik.',
          },
          {
            question: 'Bagaimana cara melihat informasi biaya tambahan atau syarat kontrak dari penawaran?',
            answer: subTabs.length > 1
              ? `Gunakan baris sub-tab di bagian atas konten dan klik tab "${subTabs.slice(1).map((t) => t.tabName).join('" atau "')}" untuk berpindah langsung tanpa meninggalkan halaman.`
              : `Gunakan tombol rincian atau klik langsung kartu/baris data untuk membuka seluruh informasi pendukung.`,
          },
        ]
      : [
          {
            question: `Why does "${firstCard}" not appear in the list after searching?`,
            answer: `Verify whether a Quick Filter or Advanced Filter (${isLogistics ? 'Job Character / SAT / Unit Type' : 'filter dropdown'}) is still restricting the view. Click Reset Filter or clear the search box to restore all records.`,
          },
          {
            question: 'Why does the system reject saving a new entry with a validation error?',
            answer: isLogistics
              ? 'Ensure all mandatory fields (*) are populated, Origin differs from Destination, Route Code is unique, and all tariff/cost amounts are strictly greater than zero.'
              : 'Ensure all required fields (*) are completed in valid format and no duplicate identifier exists.',
          },
          {
            question: 'How do I view supplemental costs or commercial terms?',
            answer: subTabs.length > 1
              ? `Click the sub-tabs directly below the page title ("${subTabs.slice(1).map((t) => t.tabName).join('" or "')}") to switch sections instantly.`
              : `Click any card or table row to open its complete breakdown and metadata.`,
          },
        ];

    if (isAuthGate) {
      const ddLabel = loginDropdownLabels.length > 0 ? loginDropdownLabels.join(', ') : (isId ? 'Role / Tenant / Cabang' : 'Role / Tenant / Branch');
      const authFaqs: Iso26514FaqItem[] = isId
        ? [
            {
              question: 'Mengapa saya gagal masuk (error 401/403) padahal User ID dan Kata Sandi sudah benar?',
              answer: `Pastikan Anda telah memilih opsi yang tepat pada dropdown otorisasi (${ddLabel}) sesuai penugasan akun Anda, serta periksa huruf besar/kecil (Caps Lock) dan spasi berlebih pada kolom User ID maupun Kata Sandi.`,
            },
            {
              question: `Mengapa pilihan unit kerja atau peran saya tidak muncul pada dropdown (${ddLabel}) di halaman login?`,
              answer: 'Daftar opsi pada dropdown halaman login dimuat berdasarkan konfigurasi otorisasi aktif. Segarkan halaman (F5) atau hubungi Administrator Sistem untuk memastikan akun Anda telah didaftarkan pada unit bisnis/tenant terkait.',
            },
            {
              question: 'Apa yang harus dilakukan jika muncul peringatan "Terlalu banyak percobaan masuk" (Akun Terkunci)?',
              answer: 'Demi keamanan (proteksi Brute-Force HTTP 429), sistem membekukan sementara akses login setelah 5 kali kegagalan berturut-turut. Tunggu selama 15 menit sebelum mencoba kembali atau minta reset kredensial ke Administrator.',
            },
          ]
        : [
            {
              question: 'Why is sign-in rejected (HTTP 401/403) even though my User ID and Password are correct?',
              answer: `Verify that you selected the authorized option in the login dropdown (${ddLabel}) assigned to your account, and check for accidental Caps Lock or leading/trailing spaces.`,
            },
            {
              question: `Why is my assigned role or branch missing from the login dropdown (${ddLabel})?`,
              answer: 'Refresh the login screen (F5) to reload active authorization options, or contact your System Administrator to bind your account to the target tenant/branch.',
            },
            {
              question: 'What should I do if the account is temporarily locked due to too many attempts (HTTP 429)?',
              answer: 'Wait 15 minutes for the brute-force protection cooldown to expire or request an administrative credential reset.',
            },
          ];
      faqs.splice(0, faqs.length, ...authFaqs);
    }

    // Section 7: Behind-the-Screen Business Logic, Invariants & State Lifecycle
    const coreRules: Iso26514BusinessRuleItem[] = [];
    const domainPattern = domainInfo.domainPattern;

    if (domainPattern === 'LOGISTICS_COMMERCIAL_PRICING') {
      coreRules.push(
        {
          ruleCode: 'VR-01',
          ruleTitle: isId ? 'Invarian Keunikan Rute Asal & Tujuan' : 'Route Origin-Destination Diversity Invariant',
          plainHumanCondition: isId
            ? 'Kota/Pelabuhan Asal (Origin) dan Tujuan (Destination) harus berbeda dan memiliki minimal 2 karakter'
            : 'Origin and Destination ports/cities must be distinct locations with at least 2 characters',
          logicExplanation: isId
            ? 'Lokasi asal (Origin) dan tujuan (Destination) tidak boleh merujuk ke pelabuhan/kota yang sama untuk mencegah kalkulasi rute loop berbiaya nol.'
            : 'Origin and Destination ports/cities must be strictly distinct to prevent zero-distance loop pricing.',
          formulaOrCondition: 'origin !== destination && len(origin) >= 2 && len(destination) >= 2',
          failureImpact: isId
            ? 'HTTP 422: Sistem memblokir penyimpanan dan memunculkan inline error "Kota Asal dan Tujuan tidak boleh sama".'
            : 'HTTP 422: Mutation rejected; inline warning "Origin and Destination cannot be identical" appears.',
        },
        {
          ruleCode: 'VR-02',
          ruleTitle: isId ? 'Invarian Positif Nominal Tarif Pokok & Surcharge' : 'Strictly Positive Rate Valuation Invariant',
          plainHumanCondition: isId
            ? 'Nominal tarif pokok dan biaya tambahan wajib berupa angka positif (> 0) dalam mata uang terdaftar'
            : 'Base tariff and surcharges must be strictly positive numbers (> 0) in valid currency',
          logicExplanation: isId
            ? 'Setiap komponen tarif pokok (Base Tariff), biaya inap, buruh, dan penyesuaian khusus harus bernilai lebih besar dari nol (> 0).'
            : 'Base route tariffs and supplemental surcharges must strictly exceed zero (> 0) in valid operational currency.',
          formulaOrCondition: 'tariff_amount > 0 && currency in [\'IDR\', \'USD\', \'SGD\']',
          failureImpact: isId
            ? 'HTTP 422: Form menolak nilai 0 atau negatif; tombol simpan menampilkan pesan validasi numerik.'
            : 'HTTP 422: Prevents 0 or negative rates; displays monetary validation error below tariff inputs.',
        },
        {
          ruleCode: 'VR-03',
          ruleTitle: isId ? 'Pencegahan Duplikasi Kode Rute & Komponen' : 'Unique Route Code Invariant',
          plainHumanCondition: isId
            ? 'Kode rute tidak boleh sama dengan kode rute yang sudah pernah terdaftar di tenant aktif'
            : 'Route code must not duplicate any existing code registered in the active tenant',
          logicExplanation: isId
            ? 'Kode rute unik (Route Code) tidak boleh duplikat dalam unit bisnis dan tenant yang sama.'
            : 'Route identifiers must remain unique per operational tenant and business division.',
          formulaOrCondition: 'COUNT(route_code WHERE tenant_id = current_tenant) === 0',
          failureImpact: isId
            ? 'HTTP 409: Sistem mengembalikan Conflict error; kolom kode rute ditandai merah dengan saran kode alternatif.'
            : 'HTTP 409: Database conflict returned; route code input is outlined in red with uniqueness warning.',
        },
        {
          ruleCode: 'VR-04',
          ruleTitle: isId ? 'Integritas Relasi SAT (Service Agreement Type) & Unit Type' : 'SAT & Unit Dimension Integrity',
          plainHumanCondition: isId
            ? 'Tipe perjanjian SAT harus berpasangan dengan ukuran kontainer/armada yang valid (20ft, 40ft, FTR)'
            : 'SAT contract type must pair with a valid container or fleet dimension (20ft, 40ft, FTR)',
          logicExplanation: isId
            ? 'Kombinasi jenis perjanjian (Contractual / Spot / Dedicated) wajib memiliki armada/kontainer yang terdaftar (40ft, 20ft, FTR).'
            : 'Every service agreement type must bind to registered equipment dimensions (e.g. 40ft, 20ft, FTR).',
          formulaOrCondition: 'sat in [\'CONTRACTUAL\', \'SPOT\', \'DEDICATED\'] && unit_type in [\'40ft\', \'20ft\', \'FTR\']',
          failureImpact: isId
            ? 'HTTP 422: Dropdown menampilkan indikasi tidak kompatibel dan menonaktifkan tombol simpan.'
            : 'HTTP 422: Incompatible pair alert disallows form commitment.',
        },
        {
          ruleCode: 'BR-01',
          ruleTitle: isId ? 'Isolasi Multi-Tenant & Otorisasi Peran Analis Komersial' : 'Multi-Tenant Isolation & Commercial RBAC',
          plainHumanCondition: isId
            ? 'Hanya pengguna berhak akses khusus (Commercial Analyst / Admin) di perusahaan yang sama yang dapat mengubah data'
            : 'Only authorized users (Commercial Analyst / Admin) within the same tenant can modify records',
          logicExplanation: isId
            ? 'Hanya pengguna dengan peran Commercial Analyst, Pricing Lead, atau Administrator yang diizinkan memperbarui data tarif rute.'
            : 'Only authenticated users with Commercial Analyst, Pricing Lead, or Admin roles can mutate pricing catalog records.',
          formulaOrCondition: 'user.tenant_id === record.tenant_id && user.hasRole([\'PRICING_ANALYST\', \'COMMERCIAL_LEAD\', \'ADMIN\'])',
          failureImpact: isId
            ? 'HTTP 403: Sistem menolak aksi tulis dan mengembalikan peringatan "Hak akses tidak mencukupi".'
            : 'HTTP 403: Forbidden rejection; mutation aborted with permission denied banner.',
        }
      );
    } else if (domainPattern === 'AUTHENTICATION_RBAC_GATE') {
      coreRules.push(
        {
          ruleCode: 'VR-01',
          ruleTitle: isId ? 'Validasi Keberadaan Identitas Pengguna' : 'Mandatory Identifier Presence Invariant',
          plainHumanCondition: isId
            ? 'Kolom User ID / Username tidak boleh kosong dan minimal memiliki panjang 3 karakter'
            : 'Username or User ID cannot be empty and must be at least 3 characters in length',
          logicExplanation: isId
            ? 'Kolom User ID / Username atau Email tidak boleh kosong dan harus memiliki panjang minimal 3 karakter.'
            : 'User identifier or email cannot be empty and requires minimum 3 characters.',
          formulaOrCondition: 'username.trim().length >= 3 && !has_invalid_control_chars(username)',
          failureImpact: isId
            ? 'HTTP 422: Tombol Masuk diblokir atau memunculkan tooltip "User ID wajib diisi".'
            : 'HTTP 422: Submit control blocked; tooltip "Username is required" is rendered.',
        },
        {
          ruleCode: 'VR-02',
          ruleTitle: isId ? 'Validasi Panjang & Karakter Kata Sandi' : 'Password Complexity Invariant',
          plainHumanCondition: isId
            ? 'Kata sandi wajib diisi dengan panjang minimal 6 karakter'
            : 'Password input must be populated with at least 6 characters',
          logicExplanation: isId
            ? 'Kata sandi wajib terisi dengan panjang minimal 6 karakter dan tidak memuat karakter berbahaya.'
            : 'Password input must be non-empty and at least 6 characters in length.',
          formulaOrCondition: 'password.length >= 6',
          failureImpact: isId
            ? 'HTTP 422: Tampil pesan "Kata sandi minimal 6 karakter" di bawah input password.'
            : 'HTTP 422: Inline copy "Password must be at least 6 characters" renders.',
        },
        {
          ruleCode: 'BR-01',
          ruleTitle: isId ? 'Verifikasi Kriptografis Kredensial & Penerbitan Token' : 'Cryptographic Signature & Token Issuance',
          plainHumanCondition: isId
            ? 'Kombinasi User ID dan kata sandi harus cocok serta akun terdaftar dalam status aktif'
            : 'Username and password credentials must match and account must be active',
          logicExplanation: isId
            ? 'Sistem memverifikasi hash kata sandi menggunakan algoritma aman (Argon2id / PBKDF2) dan menerbitkan JWT bertanda tangan digital.'
            : 'Verifies password hash using secure cryptographic digest and issues signed JWT session bearer token.',
          formulaOrCondition: 'argon2_verify(submitted_password, stored_hash) === true && account.is_active === true',
          failureImpact: isId
            ? 'HTTP 401: Alert merah muncul "User ID atau kata sandi tidak cocok. Silakan periksa kembali".'
            : 'HTTP 401: Unauthorized alert "Invalid username or password. Please verify credentials" renders.',
        },
        {
          ruleCode: 'BR-02',
          ruleTitle: isId ? 'Pencegahan Serangan Brute-Force (Rate Limiting)' : 'Brute-Force Rate Limiting Invariant',
          plainHumanCondition: isId
            ? 'Maksimal 5 kali percobaan login yang salah berturut-turut sebelum akun dibekukan sementara 15 menit'
            : 'Maximum 5 consecutive failed sign-in attempts before temporary 15-minute freeze',
          logicExplanation: isId
            ? 'Maksimal 5 kali percobaan login gagal berturut-turut dalam interval 15 menit per alamat IP atau akun.'
            : 'Maximum 5 consecutive failed sign-in attempts per 15-minute rolling window per IP/account.',
          formulaOrCondition: 'failed_attempts_counter < 5 per 15m window',
          failureImpact: isId
            ? 'HTTP 429: Akun terkunci sementara selama 15 menit; verifikasi tambahan diaktifkan.'
            : 'HTTP 429: Account temporarily throttled for 15 minutes; secondary verification required.',
        },
        {
          ruleCode: 'BR-03',
          ruleTitle: isId ? 'Siklus Hidup Sesi & Kedaluwarsa Token' : 'Session Lifecycle & Token Expiry Guard',
          plainHumanCondition: isId
            ? 'Sesi login akan berakhir otomatis setelah 30 menit tidak ada aktivitas atau segera saat tombol Keluar ditekan'
            : 'Login session expires automatically after 30 minutes of inactivity or immediately upon logout',
          logicExplanation: isId
            ? 'Token sesi memiliki masa berlaku geser (sliding window) 30 menit; logout langsung membatalkan token di database/store.'
            : 'Session token enforces 30-minute sliding expiration; sign-out blacklists token immediately.',
          formulaOrCondition: 'token.expires_at > now() && !token_blacklist.has(token.jti)',
          failureImpact: isId
            ? 'HTTP 401: Sesi habis; pengguna dialihkan kembali ke form login dengan pesan "Sesi telah berakhir".'
            : 'HTTP 401: Session expired; client redirects to login view with expiration notification.',
        },
        ...(loginDropdowns.length > 0
          ? [
              {
                ruleCode: 'VR-03',
                ruleTitle: isId
                  ? 'Validasi Pilihan Dropdown Otorisasi / Unit Organisasi Login'
                  : 'Login Authorization Dropdown / Organizational Unit Validation',
                plainHumanCondition: isId
                  ? `Dropdown ${loginDropdownLabels.join(', ')} wajib dipilih dan nilainya harus terdaftar pada akun pengguna`
                  : `Dropdown(s) ${loginDropdownLabels.join(', ')} must be selected and the value must be registered to the user account`,
                logicExplanation: isId
                  ? `Nilai ${loginDropdownLabels.join(', ')} dikirim bersama kredensial; server memverifikasi bahwa Role / Tenant / Cabang yang dipilih memang dimiliki oleh pengguna sebelum menerbitkan token sesi.`
                  : `The ${loginDropdownLabels.join(', ')} value is submitted with credentials; the server verifies that the selected Role / Tenant / Branch is actually assigned to the user before issuing a session token.`,
                formulaOrCondition: `login_dropdown_value IN user.assigned_contexts AND login_dropdown_value IS NOT NULL (${loginDropdowns
                  .map((d) => d.name || d.labelText)
                  .join(', ')})`,
                failureImpact: isId
                  ? 'HTTP 403 / 422: Sistem menolak login dengan pesan "Role / Tenant / Cabang tidak sesuai dengan akun Anda"; sesi tidak diterbitkan.'
                  : 'HTTP 403 / 422: Login is rejected with "Selected Role / Tenant / Branch does not match your account"; no session is issued.',
              } satisfies Iso26514BusinessRuleItem,
            ]
          : []),
      );
    } else if (domainPattern === 'FINANCE_INVOICING_BILLING') {
      coreRules.push(
        {
          ruleCode: 'VR-01',
          ruleTitle: isId ? 'Invarian Positif Nominal Faktur & Tagihan' : 'Strictly Positive Invoice Valuation Invariant',
          plainHumanCondition: isId
            ? 'Nominal faktur, subtotal tagihan, dan total akhir wajib bernilai lebih besar dari nol (> 0)'
            : 'Invoice amount, subtotal, and total must be strictly greater than zero (> 0)',
          logicExplanation: isId
            ? 'Subtotal tagihan, harga satuan, dan total akhir wajib bernilai lebih besar dari nol (> 0).'
            : 'Invoice subtotal, line item prices, and grand total must strictly exceed zero (> 0).',
          formulaOrCondition: 'total_amount > 0 && subtotal > 0 && currency in [\'IDR\', \'USD\', \'SGD\']',
          failureImpact: isId
            ? 'HTTP 422: Formulir menolak nominal negatif atau nol; transaksi tidak dapat diposting.'
            : 'HTTP 422: Rejection of negative or zero amounts; prevents ledger posting.',
        },
        {
          ruleCode: 'VR-02',
          ruleTitle: isId ? 'Kalkulasi Presisi Pajak & Pembulatan Akuntansi' : 'Tax Computation & Rounding Invariant',
          plainHumanCondition: isId
            ? 'Perhitungan PPN/pajak wajib sesuai tarif resmi dengan pembulatan 2 angka desimal'
            : 'Tax amount must match official rate with exact 2-decimal rounding',
          logicExplanation: isId
            ? 'Besaran PPN/Tax dihitung tepat dari tarif resmi dan dibulatkan maksimal 2 desimal.'
            : 'Tax amount must match base rate precision rounded to exactly 2 decimal places.',
          formulaOrCondition: 'tax_amount === round(taxable_subtotal * tax_rate, 2)',
          failureImpact: isId
            ? 'HTTP 422: Sistem memunculkan alert diskrepansi pajak dan mengoreksi pembulatan otomatis.'
            : 'HTTP 422: Rejects tax calculation discrepancy and prompts auto-reconciliation.',
        },
        {
          ruleCode: 'BR-01',
          ruleTitle: isId ? 'Ketentuan Jatuh Tempo Tagihan (Due Date Precedence)' : 'Invoice Due Date Precedence Invariant',
          plainHumanCondition: isId
            ? 'Tanggal jatuh tempo harus sama atau sesudah tanggal faktur diterbitkan'
            : 'Due date must strictly fall on or after invoice creation date',
          logicExplanation: isId
            ? 'Tanggal jatuh tempo (due_date) wajib sama atau setelah tanggal penerbitan faktur (invoice_date).'
            : 'Due date must strictly fall on or after invoice creation date.',
          formulaOrCondition: 'due_date >= invoice_date',
          failureImpact: isId
            ? 'HTTP 422: Form menandai kolom tanggal jatuh tempo merah dengan pesan koreksi tanggal.'
            : 'HTTP 422: Inline date validation error flags invalid chronological order.',
        },
        {
          ruleCode: 'BR-02',
          ruleTitle: isId ? 'Imutabilitas Buku Besar Akuntansi (Audit Ledger Immortality)' : 'Financial Ledger Immutability Invariant',
          plainHumanCondition: isId
            ? 'Faktur yang telah dibayar atau diposting tidak boleh diedit langsung (wajib melalui Nota Kredit)'
            : 'Posted or paid invoices are immutable; adjustments mandate Credit Note workflow',
          logicExplanation: isId
            ? 'Faktur yang telah berstatus PAID / POSTED tidak boleh diubah langsung; koreksi wajib melalui mekanisme Credit Note.'
            : 'Posted or reconciled financial invoices are immutable; adjustments mandate Credit Note.',
          formulaOrCondition: 'status === \'POSTED\' -> immutable(record_id)',
          failureImpact: isId
            ? 'HTTP 409: Tombol edit dinonaktifkan; sistem mengarahkan operator ke pembuatan Credit Note.'
            : 'HTTP 409: Edit locked; directs user to Credit Note creation workflow.',
        }
      );
    } else if (domainPattern === 'WAREHOUSE_INVENTORY_WMS') {
      coreRules.push(
        {
          ruleCode: 'VR-01',
          ruleTitle: isId ? 'Invarian Kuantitas Stok Non-Negatif' : 'Non-Negative Physical Stock Invariant',
          plainHumanCondition: isId
            ? 'Jumlah stok fisik di gudang tidak boleh bernilai negatif dan reservasi tidak boleh melebihi stok'
            : 'Physical stock balance must not drop below zero and reservations cannot exceed available stock',
          logicExplanation: isId
            ? 'Jumlah kuantitas stok fisik gudang (on_hand_qty) tidak boleh bernilai negatif dalam kondisi apapun.'
            : 'Physical on-hand inventory balance must never drop below zero under any operational transaction.',
          formulaOrCondition: 'on_hand_qty >= 0 && reserved_qty <= on_hand_qty',
          failureImpact: isId
            ? 'HTTP 422: Transaksi pick/dispatch dibatalkan seketika dengan alert "Stok tidak mencukupi".'
            : 'HTTP 422: Dispatch aborted with insufficient inventory notification.',
        },
        {
          ruleCode: 'VR-02',
          ruleTitle: isId ? 'Validasi Alokasi Bin / Rak Penyimpanan' : 'Storage Bin Allocation Compatibility',
          plainHumanCondition: isId
            ? 'Barang wajib dialokasikan ke rak/bin yang sesuai dengan jenisnya (Kering / Dingin / Berbahaya) dan kapasitas tidak penuh'
            : 'Items must map strictly to compliant storage bins without exceeding bin capacity limit',
          logicExplanation: isId
            ? 'Item barang wajib dialokasikan ke zona bin yang sesuai dengan karakteristik penyimpanan (Dry / Cold / Hazmat).'
            : 'Items must map strictly to compliant warehouse storage zones (Dry, Chilled, Hazmat).',
          formulaOrCondition: 'bin.zone_type === item.storage_class && bin.current_capacity + item.volume <= bin.max_capacity',
          failureImpact: isId
            ? 'HTTP 422: Penolakan penempatan rak; sistem merekomendasikan bin alternatif yang memenuhi syarat.'
            : 'HTTP 422: Bin allocation rejected; suggests compliant storage locations.',
        },
        {
          ruleCode: 'BR-01',
          ruleTitle: isId ? 'Prinsip FIFO/FEFO Pengeluaran Barang' : 'FIFO / FEFO Dispatch Priority Invariant',
          plainHumanCondition: isId
            ? 'Barang dengan tanggal kedaluwarsa paling dekat atau lot tertua wajib dikeluarkan terlebih dahulu'
            : 'Items with earliest expiration date or oldest lot must be picked and dispatched first',
          logicExplanation: isId
            ? 'Barang dengan tanggal kedaluwarsa paling dekat atau lot tertua diprioritaskan keluar terlebih dahulu.'
            : 'Prioritizes picking items with nearest expiration date or earliest inbound lot.',
          formulaOrCondition: 'picked_lot.expiry_date === MIN(available_lots.expiry_date)',
          failureImpact: isId
            ? 'HTTP 409: Operator menerima konfirmasi peringatan apabila memilih lot di luar urutan FEFO.'
            : 'HTTP 409: Warning prompt requires supervisor override when bypassing FEFO sequence.',
        }
      );
    } else if (domainPattern === 'PROCUREMENT_VENDOR_PO') {
      coreRules.push(
        {
          ruleCode: 'VR-01',
          ruleTitle: isId ? 'Verifikasi Status Rekanan Vendor Aktif' : 'Active Qualified Vendor Invariant',
          plainHumanCondition: isId
            ? 'Pesanan Pembelian (PO) hanya dapat diterbitkan kepada vendor yang berstatus AKTIF dan terverifikasi'
            : 'Purchase orders may only be issued to vendors with ACTIVE standing and verified compliance',
          logicExplanation: isId
            ? 'Pesanan Pembelian (PO) hanya dapat diterbitkan kepada rekanan vendor yang berstatus ACTIVE dan lulus audit kepatuhan.'
            : 'Purchase orders may only bind to vendors in ACTIVE standing with verified compliance documentation.',
          formulaOrCondition: 'vendor.status === \'ACTIVE\' && vendor.compliance_verified === true',
          failureImpact: isId
            ? 'HTTP 422: Dropdown vendor menandai vendor non-aktif dan memblokir penerbitan PO.'
            : 'HTTP 422: Blocks PO draft generation for non-active or suspended vendors.',
        },
        {
          ruleCode: 'BR-01',
          ruleTitle: isId ? 'Prinsip 3-Way Matching (PO, GRN & Tagihan)' : 'Three-Way Matching Reconciliation Invariant',
          plainHumanCondition: isId
            ? 'Jumlah dan nilai barang pada PO, Surat Penerimaan Barang (GRN), dan Faktur Vendor wajib cocok (toleransi max ±1%)'
            : 'Quantity and value on PO, Goods Receipt Note (GRN), and Vendor Invoice must balance within ±1% tolerance',
          logicExplanation: isId
            ? 'Kuantitas dan nilai pada PO, Surat Penerimaan Barang (GRN), dan Faktur Vendor wajib cocok dalam batas toleransi ±1%.'
            : 'PO quantity/value, Good Receipt Note (GRN), and Vendor Invoice must balance within ±1% tolerance.',
          formulaOrCondition: 'abs(invoice.amount - grn.amount) <= tolerance_threshold',
          failureImpact: isId
            ? 'HTTP 409: Pembayaran ditangguhkan (On Hold) hingga verifikasi selisih diselesaikan.'
            : 'HTTP 409: Payment placed on hold pending variance resolution.',
        }
      );
    } else if (domainPattern === 'HRIS_ATTENDANCE_PAYROLL') {
      coreRules.push(
        {
          ruleCode: 'VR-01',
          ruleTitle: isId ? 'Invarian Radius Geofence Presensi Kehadiran' : 'Attendance Geofence Boundary Invariant',
          plainHumanCondition: isId
            ? 'Presensi kehadiran masuk dan pulang wajib berada dalam radius maksimal 100 meter dari kantor terdaftar'
            : 'Check-in and check-out GPS coordinates must strictly reside within 100m radius of registered facility',
          logicExplanation: isId
            ? 'Presensi kehadiran masuk dan pulang wajib berada dalam radius maksimal 100 meter dari koordinat kantor terdaftar.'
            : 'Check-in and check-out coordinates must strictly register within 100m radius of registered facility.',
          formulaOrCondition: 'haversine_distance(user_gps, office_coords) <= 100.0',
          failureImpact: isId
            ? 'HTTP 422: Tombol presensi memunculkan peringatan "Anda berada di luar jangkauan lokasi kantor".'
            : 'HTTP 422: Rejection copy "You are outside approved workplace perimeter" renders.',
        },
        {
          ruleCode: 'BR-01',
          ruleTitle: isId ? 'Batasan Lembur & Hak Cuti Karyawan' : 'Statutory Overtime Cap & Leave Balance Guard',
          plainHumanCondition: isId
            ? 'Total lembur harian tidak boleh melebihi 4 jam dan cuti tidak boleh melebihi sisa saldo cuti aktif'
            : 'Daily overtime capped at 4 hours and leave requests cannot exceed remaining leave balance',
          logicExplanation: isId
            ? 'Total jam lembur harian tidak boleh melebihi 4 jam dan pengajuan cuti tidak boleh melebihi sisa saldo cuti aktif.'
            : 'Daily overtime capped at 4 hours; leave requests cannot exceed remaining leave balance.',
          formulaOrCondition: 'daily_overtime <= 4.0 && requested_leave_days <= employee.remaining_leave_days',
          failureImpact: isId
            ? 'HTTP 422: Sistem memblokir pengajuan lembur/cuti yang melebihi kuota resmi.'
            : 'HTTP 422: Submission locked with quota exceeded notice.',
        }
      );
    } else if (domainPattern === 'APPROVAL_WORKFLOW_TICKETING') {
      coreRules.push(
        {
          ruleCode: 'VR-01',
          ruleTitle: isId ? 'Invarian Kelengkapan Alasan Penolakan / Eskalasi' : 'Rejection Reason Mandatory Invariant',
          plainHumanCondition: isId
            ? 'Setiap penolakan tiket persetujuan wajib menyertakan alasan tertulis minimal 10 karakter'
            : 'Ticket rejections mandate descriptive written rationale of at least 10 characters',
          logicExplanation: isId
            ? 'Setiap penolakan tiket persetujuan wajib menyertakan alasan penolakan tertulis minimal 10 karakter.'
            : 'Ticket rejections mandate descriptive rationale of at least 10 characters.',
          formulaOrCondition: 'action === \'REJECT\' -> len(rejection_notes.trim()) >= 10',
          failureImpact: isId
            ? 'HTTP 422: Modal penolakan mewajibkan pengisian kolom alasan sebelum tombol Tolak aktif.'
            : 'HTTP 422: Modal requires rationale text before confirming rejection.',
        },
        {
          ruleCode: 'BR-01',
          ruleTitle: isId ? 'Pemisahan Kewenangan (Segregation of Duties / Self-Approval)' : 'Segregation of Duties (No Self-Approval)',
          plainHumanCondition: isId
            ? 'Pengaju tiket atau pembuat permohonan dilarang menyetujui pengajuannya sendiri'
            : 'Creator of request is strictly disallowed from executing approval on own ticket',
          logicExplanation: isId
            ? 'Pengaju tiket/transaksi dilarang menyetujui tiket yang dibuat oleh dirinya sendiri.'
            : 'Creator of request is strictly disallowed from executing approval on own ticket.',
          formulaOrCondition: 'ticket.requester_id !== approver.user_id',
          failureImpact: isId
            ? 'HTTP 403: Tombol Setujui dinonaktifkan dengan peringatan "Anda tidak dapat menyetujui tiket sendiri".'
            : 'HTTP 403: Approval control disabled with segregation of duties notice.',
        }
      );
    } else if (domainPattern === 'OPERATIONAL_FLEET_TRACKING') {
      coreRules.push(
        {
          ruleCode: 'VR-01',
          ruleTitle: isId ? 'Validasi Koordinat GPS & Kecepatan Telemetri' : 'GPS Coordinates & Speed Telemetry Boundary',
          plainHumanCondition: isId
            ? 'Koordinat GPS armada harus berada dalam batas bumi yang valid dan kecepatan maksimal 140 km/jam'
            : 'Fleet GPS coordinates must reside within valid geographic bounds and speed capped at 140 km/h',
          logicExplanation: isId
            ? 'Data GPS armada wajib memiliki koordinat bumi valid (-90 <= lat <= 90, -180 <= lon <= 180) dan kecepatan realistis (<= 140 km/h).'
            : 'Fleet telemetry coordinates must reside within geographic bounds and speed capped at 140 km/h.',
          formulaOrCondition: 'lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 && speed <= 140.0',
          failureImpact: isId
            ? 'HTTP 422: Paket telemetri ditandai anomali sensor dan disimpan ke log pemeriksaan teknis.'
            : 'HTTP 422: Anomaly flag placed on out-of-bound telemetry packet.',
        },
        {
          ruleCode: 'BR-01',
          ruleTitle: isId ? 'Invarian Penugasan Pengemudi & Kelayakan Kendaraan' : 'Driver Licensing & Fleet Readiness Guard',
          plainHumanCondition: isId
            ? 'Pengemudi wajib memiliki SIM aktif dan kendaraan wajib memiliki masa berlaku STNK/KIR yang masih aktif'
            : 'Vehicle dispatch demands active driver license and verified inspection certificate (KIR)',
          logicExplanation: isId
            ? 'Penugasan rute hanya dapat diberikan kepada pengemudi dengan SIM aktif dan kendaraan dengan STNK/KIR masa berlaku valid.'
            : 'Vehicle dispatch demands active driver license and verified inspection certificate (KIR).',
          formulaOrCondition: 'driver.license_expiry >= now() && vehicle.inspection_expiry >= now()',
          failureImpact: isId
            ? 'HTTP 409: Penugasan ditolak sistem dengan alert dokumen masa berlaku habis.'
            : 'HTTP 409: Dispatch locked with expired license/inspection warning.',
        }
      );
    } else {
      coreRules.push(
        {
          ruleCode: 'VR-01',
          ruleTitle: isId ? 'Invarian Kelengkapan Kolom Wajib Entri' : 'Mandatory Form Attributes Invariant',
          plainHumanCondition: isId
            ? `Seluruh kolom input bertanda bintang (*) pada modul "${mod.moduleName}" wajib diisi dan tidak boleh hanya berisi spasi`
            : `All mandatory fields marked with an asterisk (*) on "${mod.moduleName}" must be populated prior to persistence`,
          logicExplanation: isId
            ? `Seluruh kolom input bertanda bintang (*) pada modul "${mod.moduleName}" wajib diisi sebelum data dapat dipersistensikan.`
            : `All mandatory fields marked with an asterisk (*) on "${mod.moduleName}" must be populated prior to persistence.`,
          formulaOrCondition: 'forall f in required_fields: f !== null && f.trim() !== ""',
          failureImpact: isId
            ? 'HTTP 422: Sistem memunculkan label galat merah di bawah kolom yang belum terisi.'
            : 'HTTP 422: System renders red validation callout under empty required fields.',
        },
        {
          ruleCode: 'VR-02',
          ruleTitle: isId ? 'Validasi Sanitasi Input & Format Tipe Data' : 'Type Safety & Injection Sanitization',
          plainHumanCondition: isId
            ? 'Masukan teks dibersihkan dari skrip berbahaya dan nilai angka/tanggal divalidasi sesuai tipe data'
            : 'Input values are strictly sanitized against injection and numeric ranges stay within boundary limits',
          logicExplanation: isId
            ? 'Masukan teks dibersihkan dari tag berbahaya dan nilai numerik divalidasi tidak melebihi batas tipe integer/float.'
            : 'Input values are strictly sanitized against injection and numeric ranges stay within boundary limits.',
          formulaOrCondition: 'xss_sanitized(input) === true && is_valid_type(input, schema_type)',
          failureImpact: isId
            ? 'HTTP 400: Request ditolak di gateway sebelum mencapai basis data.'
            : 'HTTP 400: Gateway terminates payload parsing before reaching domain handlers.',
        },
        {
          ruleCode: 'BR-01',
          ruleTitle: isId ? 'Kontrol Integritas Transaksi & Penguncian Bersamaan' : 'ACID Concurrency & Optimistic Locking',
          plainHumanCondition: isId
            ? 'Jika data telah diubah oleh operator lain, sistem akan meminta penyegaran data terbaru sebelum menyimpan'
            : 'If record was concurrently modified by another user, system requires a refresh before saving edits',
          logicExplanation: isId
            ? 'Pembaruan data memeriksa nomor versi entitas (version / updated_at) untuk mencegah penimpaan data yang tidak disengaja.'
            : 'Record updates evaluate entity version numbers to prevent accidental lost updates under concurrent access.',
          formulaOrCondition: 'payload.entity_version === database.entity_version',
          failureImpact: isId
            ? 'HTTP 409: Sistem memberi tahu bahwa data telah diubah oleh operator lain; minta refresh data.'
            : 'HTTP 409: Conflict alert prompts operator to refresh latest state before re-applying edits.',
        },
        {
          ruleCode: 'BR-02',
          ruleTitle: isId ? 'Isolasi Data Penyewa (Multi-Tenant Boundary)' : 'Multi-Tenant Partition Invariant',
          plainHumanCondition: isId
            ? 'Operator hanya dapat melihat dan mengubah data yang terdaftar pada unit bisnis/organisasi mereka sendiri'
            : 'Operators can strictly read and mutate records belonging to their active organizational tenant',
          logicExplanation: isId
            ? 'Setiap kueri baca dan tulis secara otomatis menyematkan predikat tenant_id aktif pengguna yang terautentikasi.'
            : 'All read and write queries strictly append current authenticated tenant_id to isolate organizational records.',
          formulaOrCondition: 'query.where.tenant_id === session.tenant_id',
          failureImpact: isId
            ? 'HTTP 403: Akses ke data di luar tenant aktif ditolak secara permanen demi keamanan data.'
            : 'HTTP 403: Cross-tenant data access blocked immediately.',
        }
      );
    }

    // Dynamic field rules from mod.formsAndModals
    if (mod.formsAndModals && mod.formsAndModals.length > 0) {
      let fieldNum = 1;
      for (const form of mod.formsAndModals) {
        for (const inp of form.inputs || []) {
          if (fieldNum > 50) break;
          const cleanName = inp.name || `field_${fieldNum}`;
          coreRules.push({
            ruleCode: `VR-FIELD-0${fieldNum++}`,
            ruleTitle: isId ? `Aturan Format & Validasi Kolom "${cleanName}"` : `Format & Invariant for "${cleanName}"`,
            plainHumanCondition: isId
              ? `Kolom "${cleanName}" wajib${inp.required ? ' diisi dan' : ''} memiliki format ${inp.type} yang valid${inp.required ? ' sebelum formulir dapat disimpan' : ''}`
              : `Field "${cleanName}" must${inp.required ? ' be populated and' : ''} satisfy valid ${inp.type} format${inp.required ? ' before the form can be submitted' : ''}`,
            logicExplanation: isId
              ? `Kolom "${cleanName}" (${form.formTitle}) bertipe ${inp.type}${inp.required ? ' (wajib diisi)' : ''} harus diisi dengan format yang valid.`
              : `Field "${cleanName}" (${form.formTitle}) of type ${inp.type}${inp.required ? ' (required)' : ''} must satisfy validation.`,
            formulaOrCondition: inp.required ? `${cleanName} !== null && len(${cleanName}) > 0` : `is_valid_${inp.type}(${cleanName})`,
            failureImpact: isId
              ? `HTTP 422: Sistem menolak entri "${cleanName}" yang cacat dengan border merah.`
              : `HTTP 422: System rejects invalid "${cleanName}" entry with red outline alert.`,
          });
        }
      }
    }

    // Inject AST-Verified Backend Code Rules at the TOP of Section 7 Core Business Rules
    const astRules = (validationRules || []).filter((v) => v.ruleId.startsWith('VR-AST-'));
    const moduleAstRules = astRules.filter(
      (v) => !v.moduleName || v.moduleName === mod.moduleName || mod.routePath.includes(v.fieldName)
    );
    const chosenAst = (moduleAstRules.length > 0 ? moduleAstRules : astRules);
    const astRuleItems: Iso26514BusinessRuleItem[] = chosenAst.map((vr) => ({
      ruleCode: vr.ruleId,
      ruleTitle: isId
        ? `[AST BACKEND VERIFIED] Aturan Validasi & Guard '${vr.fieldName}'`
        : `[AST BACKEND VERIFIED] Validation Guard '${vr.fieldName}'`,
      plainHumanCondition: isId
        ? `Kolom atau parameter '${vr.fieldName}' wajib memenuhi batasan kode backend: ${vr.constraintExpression}`
        : `Field or parameter '${vr.fieldName}' must satisfy backend code constraint: ${vr.constraintExpression}`,
      logicExplanation: isId
        ? `Aturan diekstrak langsung dari AST kode backend (${vr.exactUiErrorString}). Pelanggaran aturan memicu penolakan server.`
        : `Extracted directly from backend code AST (${vr.exactUiErrorString}). Violations trigger rejection.`,
      formulaOrCondition: vr.constraintExpression,
      failureImpact: `HTTP ${vr.httpStatus} (${vr.errorCode}): ${vr.exactUiErrorString}`,
    }));
    if (astRuleItems.length > 0) {
      coreRules.unshift(...astRuleItems);
    }

    // Inject Database Foreign-Key Referential Integrity Rule (BR-FK-01)
    const fkList = (databaseTables || []).flatMap((t) =>
      t.columns
        .filter((c) => c.isForeignKey && c.foreignKeyTarget)
        .map((c) => `${t.tableName}.${c.name} ➔ ${c.foreignKeyTarget!.table}.${c.foreignKeyTarget!.column}`)
    );
    if (fkList.length > 0) {
      coreRules.push({
        ruleCode: 'BR-FK-01',
        ruleTitle: isId
          ? 'Integritas Relasi Foreign Key Database'
          : 'Database Foreign Key Referential Integrity',
        plainHumanCondition: isId
          ? `Setiap data relasional wajib memiliki referensi entitas induk yang valid: ${fkList.join(', ')}`
          : `Every relational record must reference a valid parent entity: ${fkList.join(', ')}`,
        logicExplanation: isId
          ? 'Mencegah timbulnya data yatim (orphan rows) melalui penegakan referential integrity pada level basis data.'
          : 'Prevents orphan records via database engine referential integrity enforcement.',
        formulaOrCondition: fkList.join(' AND '),
        failureImpact: isId
          ? 'HTTP 409 / 422: Penolakan penyimpanan akibat Foreign Key Constraint Violation.'
          : 'HTTP 409 / 422: Mutation rejected due to Foreign Key Constraint Violation.',
      });
    }

    const stateTransitions: Iso26514StateTransitionItem[] = [
      {
        fromState: isId ? 'State 0: Tampilan Awal / Tanpa Filter (Idle Baseline)' : 'State 0: Initial Unfiltered Baseline',
        userTrigger: isId
          ? `Pengguna mengetik kata kunci pada "${filtersList[0]?.filterName || 'Pencarian'}" atau memilih opsi pada dropdown filter`
          : `User types in "${filtersList[0]?.filterName || 'Search'}" or selects a filter option`,
        systemValidation: isId
          ? 'Debounce input 300ms, sanitasi teks pencarian, dan kalkulasi predikat query pada katalog data'
          : 'Applies 300ms debounce, sanitizes keyword query, and evaluates filter predicates against dataset',
        toState: isId ? 'State 1: Filter Aktif / Data Terfokus' : 'State 1: Filter Applied / Narrowed Dataset',
        visibleUiIndicator: isId
          ? 'Chip filter aktif muncul di toolbar, hitungan baris diperbarui, dan kartu/tabel terseleksi seketika'
          : 'Active filter badge renders, row counters update, and matching records highlight',
      },
      {
        fromState: isId ? 'State 1: Tampilan Katalog Aktif' : 'State 1: Active Catalog View',
        userTrigger: isId
          ? `Pengguna menekan tombol aksi utama "${primaryBtnName}"`
          : `User clicks primary action button "${primaryBtnName}"`,
        systemValidation: isId
          ? 'Sistem memverifikasi otorisasi tulis (RBAC) dan memuat template formulir entitas'
          : 'Verifies RBAC write permissions and mounts clean entity creation form drawer',
        toState: isId ? 'State 2: Modal Form Terbuka (Awaiting Input)' : 'State 2: Modal Form Open / Awaiting Input',
        visibleUiIndicator: isId
          ? 'Dialog overlay muncul di layar dengan kursor terfokus pada kolom isian pertama dan tombol Simpan aktif'
          : 'Modal dialog overlay renders with first input focused and Save button enabled',
      },
      {
        fromState: isId ? 'State 2: Pengisian Formulir (Draft State)' : 'State 2: Form Input Draft State',
        userTrigger: isId
          ? 'Pengguna melengkapi data lalu menekan tombol "Simpan" / "Submit"'
          : 'User fills required attributes and clicks "Save" / "Submit"',
        systemValidation: isId
          ? 'Parser skema klien mengecek seluruh kolom bertanda * dan mengunci tombol untuk mencegah double-submit'
          : 'Client schema engine checks mandatory fields and activates button lock to prevent double-submit',
        toState: isId ? 'State 3: Validasi Payload & Optimistic Lock' : 'State 3: Validating Payload & Lock',
        visibleUiIndicator: isId
          ? 'Ikon loading spinner aktif pada tombol, seluruh kolom input dinonaktifkan sementara (read-only)'
          : 'Loading spinner animates on submit control, inputs temporarily disabled',
      },
      {
        fromState: isId ? 'State 3: Validasi Payload' : 'State 3: Validating Payload',
        userTrigger: isId
          ? 'Server mendeteksi kegagalan aturan bisnis (kolom kosong, format salah, atau kode duplikat)'
          : 'Backend detects business rule violation (missing field, invalid format, or duplicate identifier)',
        systemValidation: isId
          ? 'Server menolak transaksi dengan HTTP 422 / HTTP 409 dan merespons dengan rincian fieldErrors'
          : 'Server rejects request with HTTP 422 / 409 returning structured fieldErrors schema',
        toState: isId ? 'State 4A: Ditolak dengan Notifikasi Validasi' : 'State 4A: Rejected with Validation Alert',
        visibleUiIndicator: isId
          ? 'Banner peringatan merah muncul di atas form dengan pesan spesifik per kolom dan border merah'
          : 'Red warning banner renders above form with specific field-level guidance and red border',
      },
      {
        fromState: isId ? 'State 3: Validasi Payload' : 'State 3: Validating Payload',
        userTrigger: isId
          ? 'Server menyetujui seluruh aturan bisnis dan mengikat data ke dalam transaksi basis data ACID'
          : 'Backend confirms all business invariants pass and commits ACID transaction to database',
        systemValidation: isId
          ? 'Basis data menyimpan entitas baru, memperbarui indeks pencarian, dan mengembalikan status HTTP 200/201'
          : 'Database writes record, updates search indices, and emits HTTP 200/201 confirmation payload',
        toState: isId ? 'State 4B: Data Tersimpan / State Tersinkronisasi' : 'State 4B: Persisted / Synchronized State',
        visibleUiIndicator: isId
          ? 'Toast hijau muncul "Berhasil Disimpan", modal form tertutup otomatis, dan data baru langsung tampil di katalog'
          : 'Green toast "Successfully Saved" appears, modal dismisses, and new row/card appears in catalog',
      },
    ];

    // Section 8: UI-to-API and Error Recovery Matrix
    const interactions: Iso26514UiInteractionItem[] = [];
    const baseApi = mod.triggeredApis[0] || {
      method: 'GET',
      path: mod.routePath.startsWith('/api') ? mod.routePath : `/api/v1${mod.routePath === '/' ? '/core' : mod.routePath}`,
      status: 200,
      latencyMs: 38,
    };

    // Dynamic payload generator from actual form inputs, table rows, or cards
    const buildDataDrivenPayload = (): string => {
      if (mod.formsAndModals && mod.formsAndModals[0]?.inputs?.length) {
        const payloadObj: Record<string, unknown> = {};
        for (const inp of mod.formsAndModals[0].inputs) {
          const key = inp.name || 'field';
          if (inp.type === 'number') payloadObj[key] = 2500000;
          else if (inp.type === 'date') payloadObj[key] = new Date().toISOString().slice(0, 10);
          else if (inp.type === 'email') payloadObj[key] = 'operator@enterprise.com';
          else if (inp.type === 'checkbox') payloadObj[key] = true;
          else payloadObj[key] = inp.placeholder || `SAMPLE_${key.toUpperCase()}`;
        }
        return JSON.stringify(payloadObj);
      }
      if (mod.tableColumns && mod.tableColumns.length && mod.sampleRows && mod.sampleRows[0]) {
        const payloadObj: Record<string, unknown> = {};
        mod.tableColumns.slice(0, 4).forEach((col, idx) => {
          const key = col.toLowerCase().replace(/[^a-z0-9_]/g, '_');
          payloadObj[key] = mod.sampleRows?.[0]?.[idx] || `SAMPLE_${col}`;
        });
        return JSON.stringify(payloadObj);
      }
      if (mod.cardItems && mod.cardItems[0]) {
        const payloadObj: Record<string, unknown> = {
          itemTitle: mod.cardItems[0].title,
          status: 'ACTIVE',
        };
        if (mod.cardItems[0].badges?.length) {
          payloadObj['category'] = mod.cardItems[0].badges[0];
        }
        return JSON.stringify(payloadObj);
      }
      return JSON.stringify({
        moduleCode: mod.moduleId,
        recordName: mod.moduleName,
        status: 'ACTIVE',
      });
    };

    // Dynamic login payload built strictly from the harvested login form inputs,
    // including Role / Tenant / Branch dropdown fields.
    const buildAuthPayload = (): string => {
      const payloadObj: Record<string, unknown> = {};
      const loginInputs = mod.formsAndModals?.[0]?.inputs || [];
      for (const inp of loginInputs) {
        const key = inp.name || inp.type || 'field';
        if (inp.type === 'password' || /sandi|password/i.test(key)) {
          payloadObj[key] = '••••••';
          continue;
        }
        if (inp.type === 'select') {
          const options = (inp.placeholder || '')
            .split('|')
            .map((o) => o.trim())
            .filter(Boolean);
          payloadObj[key] = options[0] || '<pilih_opsi_otorisasi>';
          continue;
        }
        if (inp.type === 'email') {
          payloadObj[key] = 'operator@enterprise.com';
          continue;
        }
        payloadObj[key] = inp.placeholder || `SAMPLE_${key.toUpperCase()}`;
      }
      if (Object.keys(payloadObj).length === 0) {
        payloadObj.username = '<user_id>';
        payloadObj.password = '••••••';
      }
      return JSON.stringify(payloadObj);
    };

    // 1. Primary Action Button
    buttonsList.forEach((b) => {
      const isCreate = /tambah|create|add|baru|\+/i.test(b.buttonName);
      const isSearchOrFilter = /filter|cari|search|reset/i.test(b.buttonName);
      const isAuth = /masuk|login|sign in|submit/i.test(b.buttonName);
      const method = isAuth ? 'POST' : isCreate ? 'POST' : isSearchOrFilter ? 'GET' : 'PUT';
      const endpoint = isAuth
        ? '/api/v1/auth/login'
        : isCreate
        ? `${baseApi.path.replace(/\/\d+$/, '')}`
        : `${baseApi.path}`;
      const payloadSummary = isAuth
        ? buildAuthPayload()
        : isCreate
        ? buildDataDrivenPayload()
        : '{ "status": "FILTER_APPLIED" }';

      const interactionEndpoint = `${method} ${endpoint}`;
      interactions.push({
        uiControlOrAction: `${b.buttonName} (${b.screenLocation})`,
        triggeredEndpoint: interactionEndpoint,
        requestPayloadSummary: payloadSummary,
        versionDeltaBadge: isNewInteraction(interactionEndpoint),
        onSuccessHttp200_201: isId
          ? isAuth
            ? 'HTTP 200 OK: Menerima Bearer token dan mengarahkan operator ke workspace utama.'
            : isCreate
            ? 'HTTP 201 Created: Toast hijau muncul, modal tertutup, dan baris/kartu baru tampil di layar.'
            : 'HTTP 200 OK: Data berhasil diperbarui atau disaring seketika pada tampilan.'
          : isAuth
          ? 'HTTP 200 OK: Receives Bearer session token and navigates user to main workspace.'
          : isCreate
          ? 'HTTP 201 Created: Green toast appears, modal closes, and new row/card renders.'
          : 'HTTP 200 OK: View state reloaded immediately with updated records.',
        onErrorHttp4xx_5xx: isId
          ? isAuth
            ? 'HTTP 401 Unauthorized: Alert "User ID atau kata sandi tidak valid". HTTP 429: "Terlalu banyak percobaan".'
            : 'HTTP 422: Alert kolom bertanda merah. HTTP 409: "Kode duplikat". HTTP 500: "Gangguan server internal".'
          : isAuth
          ? 'HTTP 401 Unauthorized: Alert "Invalid credentials". HTTP 429: "Too many attempts".'
          : 'HTTP 422: Red inline alerts. HTTP 409: "Duplicate key". HTTP 500: "Internal server error".',
        userRecoveryAction: isId
          ? isAuth
            ? 'Periksa kembali huruf besar/kecil kata sandi. Jika terkunci, tunggu 15 menit atau hubungi administrator.'
            : 'Periksa kolom isian bertanda bintang (*), pastikan tidak ada kode yang duplikat, lalu klik Simpan kembali.'
          : isAuth
          ? 'Verify caps lock and password spelling. If locked out, wait 15 minutes or contact system administrator.'
          : 'Review fields outlined in red, fix duplicate or negative values, and click Save again.',
      });
    });

    // 2. Search & Filter Controls
    filtersList.forEach((f) => {
      const interactionEndpoint = `GET ${baseApi.path}?q={keyword}&filter={value}`;
      interactions.push({
        uiControlOrAction: `${f.filterName} (${f.controlType})`,
        triggeredEndpoint: interactionEndpoint,
        versionDeltaBadge: f.versionDeltaBadge,
        requestPayloadSummary: `{ "${f.filterName.toLowerCase().replace(/[^a-z0-9]/g, '_')}": "${f.sampleValues.slice(0, 24)}" }`,
        onSuccessHttp200_201: isId
          ? 'HTTP 200 OK: Daftar baris/kartu tersaring seketika dengan total hitungan yang cocok.'
          : 'HTTP 200 OK: Dataset filters dynamically with updated result tally.',
        onErrorHttp4xx_5xx: isId
          ? 'HTTP 400 Bad Request: Alert "Karakter pencarian tidak valid". HTTP 500: "Gagal memuat kueri data".'
          : 'HTTP 400 Bad Request: "Invalid filter token". HTTP 500: "Failed to execute query".',
        userRecoveryAction: isId
          ? 'Hapus karakter khusus dari kolom pencarian atau klik tombol "Reset Filter" untuk memulihkan seluruh data.'
          : 'Remove special characters or click "Reset Filter" to restore full baseline records.',
      });
    });

    // 3. Sub-Tabs
    subTabs.forEach((tab) => {
      interactions.push({
        uiControlOrAction: `Sub-Tab "${tab.tabName}"`,
        triggeredEndpoint: `GET ${baseApi.path}/subtabs/${tab.tabName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        requestPayloadSummary: 'Headers: { "Accept": "application/json", "Authorization": "Bearer <TOKEN>" }',
        onSuccessHttp200_201: isId
          ? `HTTP 200 OK: Konten tab "${tab.tabName}" dimuat lengkap tanpa memuat ulang seluruh halaman.`
          : `HTTP 200 OK: Tab "${tab.tabName}" data renders asynchronously without full page reload.`,
        onErrorHttp4xx_5xx: isId
          ? 'HTTP 401: Sesi kedaluwarsa. HTTP 404: Sub-tab tidak ditemukan.'
          : 'HTTP 401: Session expired. HTTP 404: Sub-tab resource not found.',
        userRecoveryAction: isId
          ? 'Segarkan halaman (F5) atau periksa koneksi internet apabila tab gagal dimuat.'
          : 'Refresh page (F5) or verify network connectivity if tab contents fail to load.',
      });
    });

    // Anti-blank-screen guard: a missing, malformed, or unencoded SVG screenshot cannot guide a reader.
    // Replace it with a crisp Base64 data-driven UI blueprint built from the harvested surface.
    const isBadShot =
      !mod.screenshotDataUrl ||
      typeof mod.screenshotDataUrl !== 'string' ||
      mod.screenshotDataUrl.length < 1500 ||
      !mod.screenshotDataUrl.startsWith('data:image/') ||
      mod.screenshotDataUrl.startsWith('data:image/svg+xml;utf8') ||
      isBlankOrMissingScreenshot(mod.screenshotDataUrl);

    const resolvedScreenshotDataUrl = isBadShot
      ? this.buildRichModuleBlueprintSvgDataUrl(mod, buttonsList, filtersList)
      : mod.screenshotDataUrl;

    return {
      moduleId: mod.moduleId,
      moduleName: mod.moduleName,
      routePath: mod.routePath,
      locale,
      screenshotDataUrl: resolvedScreenshotDataUrl,
      capturedAt: mod.capturedAt,
      visualCalloutPins,
      section1_OverviewAndPurpose: section1,
      section2_NavigationAndSubTabsGuide: section2,
      section3_ButtonsAndIconsDictionary: {
        heading: isId ? '3. Kamus Lengkap Fungsi Tombol & Ikon di Layar' : '3. Buttons, Actions & Icons Encyclopedia',
        buttons: buttonsList,
      },
      section4_SearchAndFiltersDictionary: {
        heading: isId ? '4. Kamus Kolom Pencarian, Dropdown Filter & Form Input' : '4. Search, Filter & Input Fields Dictionary',
        filters: filtersList,
      },
      section5_TaskOrientedSops: {
        heading: isId ? '5. Panduan Langkah Kerja / SOP Operasional (ISO 26514 Clause 8)' : '5. Task-Oriented Operating Procedures (ISO 26514 Clause 8)',
        sops,
      },
      section6_TroubleshootingAndFaq: {
        heading: isId ? '6. Solusi Kendala Umum (FAQ Pengguna)' : '6. Troubleshooting & Frequently Asked Questions',
        faqs,
      },
      section7_BusinessLogicAndStateRules: {
        heading: isId
          ? '7. Logika Bisnis di Balik Layar, Rumus Validasi & Aturan Status Data'
          : '7. Behind-the-Screen Business Logic, Invariants & State Lifecycle',
        domainClassification: {
          domain: domainInfo.domainPattern,
          domainLabel: domainInfo.domainLabel,
          summary: isId ? domainInfo.domainSummaryId : domainInfo.domainSummaryEn,
        },
        coreBusinessRules: coreRules,
        stateTransitionLifecycle: stateTransitions,
      },
      section8_UiToApiAndErrorRecoveryMatrix: {
        heading: isId
          ? '8. Peta Koneksi Aksi Tombol ke API, Respons Sukses & Penanganan Error'
          : '8. UI Control to Backend API Connection & Error Recovery Matrix',
        interactions,
      },
      section9_DomainGlossaryAndAcronyms: (() => {
        const terms: Iso26514DomainGlossaryItem[] = [];
        // Universal technical terms
        const universalTerms: Iso26514DomainGlossaryItem[] = [
          { termOrAcronym: 'RBAC', category: isId ? 'Keamanan & Akses' : 'Security & Access', plainDefinition: isId ? 'Sistem pengendalian hak akses berdasarkan peran pengguna (Admin, Operator, Viewer, dsb.)' : 'Role-Based Access Control — permission system keyed to assigned user roles', whereUsedInModule: isId ? 'Login, Validasi Otorisasi API, Tombol Edit/Hapus' : 'Login, API Authorization, Edit/Delete controls' },
          { termOrAcronym: 'JWT', category: isId ? 'Keamanan & Akses' : 'Security & Access', plainDefinition: isId ? 'Token sesi digital bertanda tangan yang digunakan untuk memverifikasi identitas pengguna di setiap permintaan API' : 'JSON Web Token — a signed session credential verified on every API request', whereUsedInModule: isId ? 'Header Authorization setiap panggilan API' : 'Authorization header for every API call' },
          { termOrAcronym: 'SLA', category: isId ? 'Operasional' : 'Operational', plainDefinition: isId ? 'Perjanjian Tingkat Layanan — komitmen waktu respons dan ketersediaan sistem yang telah disepakati' : 'Service Level Agreement — committed response time and uptime benchmark', whereUsedInModule: isId ? 'Pemantauan latensi modul & notifikasi eskalasi' : 'Module latency monitoring & escalation alerts' },
          { termOrAcronym: 'HTTP 422', category: isId ? 'Kode Error API' : 'API Error Code', plainDefinition: isId ? 'Respons server yang menunjukkan data yang dikirim tidak memenuhi aturan validasi bisnis' : 'Unprocessable Entity — server understood the request but business rule validation failed', whereUsedInModule: isId ? 'Respons gagal simpan saat kolom wajib kosong atau format salah' : 'Save failure response when required fields are empty or format invalid' },
          { termOrAcronym: 'HTTP 409', category: isId ? 'Kode Error API' : 'API Error Code', plainDefinition: isId ? 'Respons server yang menunjukkan konflik data, biasanya kode duplikat atau penimpaan data bersamaan' : 'Conflict — indicates duplicate key or concurrent optimistic lock violation', whereUsedInModule: isId ? 'Duplikasi kode unik atau update bersamaan' : 'Duplicate key or concurrent update collision' },
          { termOrAcronym: 'HTTP 403', category: isId ? 'Kode Error API' : 'API Error Code', plainDefinition: isId ? 'Respons server yang menunjukkan pengguna tidak memiliki hak akses untuk menjalankan aksi ini' : 'Forbidden — authenticated user lacks permission to perform the requested operation', whereUsedInModule: isId ? 'Tombol Edit/Hapus untuk pengguna tanpa otorisasi' : 'Edit/Delete buttons for unauthorized roles' },
          { termOrAcronym: 'Multi-Tenant', category: isId ? 'Arsitektur' : 'Architecture', plainDefinition: isId ? 'Arsitektur sistem di mana satu aplikasi melayani banyak organisasi/perusahaan secara terpisah dan aman' : 'Single application instance serving multiple independent organizations with strict data isolation', whereUsedInModule: isId ? 'Seluruh kueri data secara otomatis disaring berdasarkan tenant aktif' : 'All data queries automatically filtered by active tenant' },
          { termOrAcronym: 'ACID', category: isId ? 'Basis Data' : 'Database', plainDefinition: isId ? 'Jaminan transaksi basis data: Atomicity (semua atau tidak sama sekali), Consistency, Isolation, Durability' : 'Database transaction guarantees: Atomicity, Consistency, Isolation, Durability', whereUsedInModule: isId ? 'Setiap operasi simpan/perbarui/hapus data' : 'Every create/update/delete data operation' },
        ];
        terms.push(...universalTerms);

        // Domain-specific terms
        if (domainPattern === 'LOGISTICS_COMMERCIAL_PRICING') {
          terms.push(
            { termOrAcronym: 'SAT', category: isId ? 'Logistik' : 'Logistics', plainDefinition: isId ? 'Service Agreement Type — jenis perjanjian layanan angkutan: Contractual (kontrak tetap), Spot (satu kali), atau Dedicated (eksklusif)' : 'Service Agreement Type — Contractual (fixed contract), Spot (one-time), or Dedicated (exclusive fleet)', whereUsedInModule: isId ? 'Filter SAT di toolbar, Kolom pada kartu rute' : 'SAT filter toolbar, Route card column' },
            { termOrAcronym: 'FTR / 20ft / 40ft', category: isId ? 'Logistik' : 'Logistics', plainDefinition: isId ? 'Ukuran unit angkutan: FTR (Full Truck Load), 20ft dan 40ft (ukuran kontainer standar ISO)' : 'Transport unit sizes: FTR (Full Truckload), 20ft and 40ft ISO standard containers', whereUsedInModule: isId ? 'Filter Unit Type, Komponen rute pada kartu' : 'Unit Type filter, Route component cards' },
            { termOrAcronym: 'Origin & Destination', category: isId ? 'Logistik' : 'Logistics', plainDefinition: isId ? 'Titik keberangkatan (Origin) dan titik tujuan (Destination) dari sebuah rute pengiriman barang' : 'Departure point (Origin) and arrival point (Destination) of a freight shipment route', whereUsedInModule: isId ? 'Kolom kunci pada kartu rute, Filter pencarian rute' : 'Key columns on route cards, Route search filters' }
          );
        } else if (domainPattern === 'FINANCE_INVOICING_BILLING') {
          terms.push(
            { termOrAcronym: 'PPN / PPh', category: isId ? 'Keuangan' : 'Finance', plainDefinition: isId ? 'PPN: Pajak Pertambahan Nilai (VAT Indonesia). PPh: Pajak Penghasilan (income tax withholding)' : 'PPN: Indonesian Value-Added Tax. PPh: Withholding income tax deduction', whereUsedInModule: isId ? 'Kalkulasi otomatis pada form faktur, Kolom tax di tabel tagihan' : 'Auto-computed on invoice form, Tax column in billing table' },
            { termOrAcronym: 'Credit Note', category: isId ? 'Keuangan' : 'Finance', plainDefinition: isId ? 'Dokumen koreksi resmi yang digunakan untuk membatalkan atau mengurangi nilai faktur yang sudah diposting' : 'Official correction document used to reverse or reduce the value of an already-posted invoice', whereUsedInModule: isId ? 'Alur koreksi faktur status POSTED/PAID' : 'Correction workflow for POSTED/PAID invoices' }
          );
        } else if (domainPattern === 'WAREHOUSE_INVENTORY_WMS') {
          terms.push(
            { termOrAcronym: 'GRN', category: isId ? 'Gudang' : 'Warehouse', plainDefinition: isId ? 'Goods Receipt Note — dokumen penerimaan barang yang mencatat kuantitas dan kondisi barang yang masuk ke gudang' : 'Goods Receipt Note — inbound document recording quantity and condition of received goods', whereUsedInModule: isId ? 'Proses inbound penerimaan stok barang' : 'Inbound stock receiving process' },
            { termOrAcronym: 'FIFO / FEFO', category: isId ? 'Gudang' : 'Warehouse', plainDefinition: isId ? 'FIFO: First In First Out — barang terlama dikeluarkan pertama. FEFO: First Expired First Out — barang terdekat kedaluwarsa dikeluarkan pertama' : 'FIFO: First In First Out. FEFO: First Expired First Out — prioritizes nearest-expiry items', whereUsedInModule: isId ? 'Aturan dispatch picking otomatis sistem WMS' : 'Automated WMS dispatch picking rule' }
          );
        } else if (domainPattern === 'PROCUREMENT_VENDOR_PO') {
          terms.push(
            { termOrAcronym: 'PO / PR', category: isId ? 'Pengadaan' : 'Procurement', plainDefinition: isId ? 'PO: Purchase Order — surat pesanan pembelian resmi. PR: Purchase Requisition — permintaan pembelian internal' : 'PO: Purchase Order — official procurement commitment. PR: Purchase Requisition — internal purchase request', whereUsedInModule: isId ? 'Alur buat PO dari PR, Daftar PO aktif' : 'PO creation from PR workflow, Active PO list' },
            { termOrAcronym: '3-Way Matching', category: isId ? 'Pengadaan' : 'Procurement', plainDefinition: isId ? 'Verifikasi kesesuaian antara PO, GRN, dan Faktur Vendor sebelum pembayaran dapat diproses' : 'Three-way reconciliation of PO, GRN, and Vendor Invoice quantities/values before payment', whereUsedInModule: isId ? 'Validasi pembayaran invoice vendor' : 'Vendor invoice payment validation' }
          );
        }

        // Document every observed table column and filter/input, deduplicated case-insensitively.
        const describeDomainField = (label: string): string => {
          const lower = label.toLowerCase();
          const samples = mod.sampleRows?.flatMap((row) => {
            const idx = mod.tableColumns.findIndex((col) => col.toLowerCase() === lower);
            return idx >= 0 && row[idx] ? [row[idx]!] : [];
          }) || [];
          const sample = samples.slice(0, 3).join(', ');
          const value = sample ? `${isId ? 'Contoh' : 'Examples'}: ${sample}. ` : '';
          if (/date|tanggal|time|waktu|created|updated|timestamp/i.test(label)) return `${value}${isId ? 'Waktu pencatatan atau perubahan data agar urutan dan masa berlakunya dapat ditelusuri.' : 'The time the record was created or changed, used to trace sequence and validity.'}`;
          if (/status|state|condition|aktif|active/i.test(label)) return `${value}${isId ? 'Tahap atau kondisi data saat ini; nilai menunjukkan apakah proses masih berjalan, selesai, atau perlu tindak lanjut.' : 'The record’s current state; values indicate whether work is active, complete, or needs attention.'}`;
          if (/code|kode|id|number|nomor|ref/i.test(label)) return `${value}${isId ? 'Pengenal bisnis untuk membedakan dan menemukan satu transaksi atau entitas secara tepat.' : 'A business identifier used to distinguish and locate a specific transaction or entity.'}`;
          if (/amount|nominal|tariff|tarif|price|harga|total|fee|biaya|tax|pajak/i.test(label)) return `${value}${isId ? 'Nilai uang atau tarif yang digunakan dalam perhitungan dan pemeriksaan transaksi.' : 'A monetary amount or tariff used to calculate and validate the transaction.'}`;
          if (/filter|search|cari|pencarian|origin|destination|from|to/i.test(label)) return `${value}${isId ? 'Kriteria untuk mempersempit daftar data yang ditampilkan; hanya baris yang cocok dengan pilihan ini yang muncul.' : 'A criterion that narrows the displayed records to matching rows.'}`;
          return `${value}${isId ? `Informasi ${label} yang direkam pada ${mod.moduleName}; makna spesifik mengikuti label dan konteks data sumber.` : `${label} information recorded in ${mod.moduleName}; its precise meaning follows the source label and data context.`}`;
        };

        const controlTerms = [...(mod.tableColumns || []), ...filtersList.map((filter) => filter.filterName)].map((label): Iso26514DomainGlossaryItem => ({
          termOrAcronym: label,
          category: isId ? 'Kolom / Filter / Atribut' : 'Column / Filter / Attribute',
          plainDefinition: describeDomainField(label),
          whereUsedInModule: `${mod.moduleName} · ${mod.routePath}`,
        }));
        const uniqueTerms = new Map<string, Iso26514DomainGlossaryItem>();
        for (const term of [...terms, ...controlTerms]) {
          const key = term.termOrAcronym.trim().toLocaleLowerCase();
          if (key && !uniqueTerms.has(key)) uniqueTerms.set(key, term);
        }
        return {
          heading: isId ? '9. Glosarium Domain & Kamus Akronim Teknis' : '9. Domain Glossary & Technical Acronym Dictionary',
          terms: [...uniqueTerms.values()],
        };

      })(),
    };
  }

  public generateModuleManualMarkdown(manual: Iso26514ModuleManual): string {
    const isId = manual.locale === 'id';
    return `## ${manual.moduleName} (\`${manual.routePath}\`) — ISO/IEC/IEEE 26514:2022 User Manual

### ${manual.section1_OverviewAndPurpose.heading}
- **${isId ? 'Ringkasan Fungsi' : 'Purpose'}:** ${manual.section1_OverviewAndPurpose.purposeSummary}
- **${isId ? 'Pengguna Utama' : 'Target Users'}:** ${manual.section1_OverviewAndPurpose.targetUsers}
- **${isId ? 'Data yang Ditampilkan' : 'Displayed Data'}:** ${manual.section1_OverviewAndPurpose.displayedBusinessData}
- **${isId ? 'Kapan Digunakan' : 'When to Use'}:** ${manual.section1_OverviewAndPurpose.whenToUse}

### ${manual.section2_NavigationAndSubTabsGuide.heading}
- **${isId ? 'Akses Menu' : 'Navigation Path'}:** ${manual.section2_NavigationAndSubTabsGuide.howToReachMenu}
${manual.section2_NavigationAndSubTabsGuide.subTabs
  .map((t) => `- **Sub-Tab \`${t.tabName}\`:** ${t.businessContent} *(Aksi: ${t.actionButtons})*`)
  .join('\n')}

### ${manual.section3_ButtonsAndIconsDictionary.heading}
| Pin | ${isId ? 'Nama Tombol / Kontrol' : 'Button / Control'} | ${isId ? 'Lokasi di Layar' : 'Screen Location'} | ${isId ? 'Fungsi Utama' : 'Primary Purpose'} | ${isId ? 'Cara Pakai & Dampak' : 'Usage & Impact'} |
| :--- | :--- | :--- | :--- | :--- |
${manual.section3_ButtonsAndIconsDictionary.buttons
  .map((b) => `| \`[#${b.calloutNumber || '-'}]\` | **${b.buttonName}**${b.versionDeltaBadge ? ` **${b.versionDeltaBadge}**` : ''} | ${b.screenLocation} | ${b.primaryPurpose} | ${b.howToUseAndImpact} |`)
  .join('\n')}

### ${manual.section4_SearchAndFiltersDictionary.heading}
| Pin | ${isId ? 'Nama Filter / Kolom' : 'Filter / Field'} | ${isId ? 'Jenis Kontrol' : 'Control Type'} | ${isId ? 'Kegunaan Bisnis' : 'Business Purpose'} | ${isId ? 'Contoh Nilai' : 'Sample Values'} | ${isId ? 'Aturan Validasi' : 'Validation Rule'} |
| :--- | :--- | :--- | :--- | :--- | :--- |
${manual.section4_SearchAndFiltersDictionary.filters
  .map((f) => `| \`[#${f.calloutNumber || '-'}]\` | **${f.filterName}**${f.versionDeltaBadge ? ` **${f.versionDeltaBadge}**` : ''} | \`${f.controlType}\` | ${f.businessPurpose} | ${f.sampleValues} | ${f.validationRule} |`)
  .join('\n')}

### ${manual.section5_TaskOrientedSops.heading}
${manual.section5_TaskOrientedSops.sops
  .map(
    (s) => `#### ${s.sopId}: ${s.sopTitle}
${s.steps.map((st, idx) => `${idx + 1}. ${st}`).join('\n')}
- **${isId ? 'Hasil yang Diharapkan' : 'Expected Result'}:** ${s.expectedResult}`
  )
  .join('\n\n')}

### ${manual.section6_TroubleshootingAndFaq.heading}
${manual.section6_TroubleshootingAndFaq.faqs
  .map((f) => `- **Q: ${f.question}**\n  **A:** ${f.answer}`)
  .join('\n')}

### ${manual.section7_BusinessLogicAndStateRules.heading}
- **${isId ? 'Klasifikasi Domain' : 'Domain Classification'}:** ${manual.section7_BusinessLogicAndStateRules.domainClassification.domainLabel} (\`${manual.section7_BusinessLogicAndStateRules.domainClassification.domain}\`)
- **${isId ? 'Ringkasan Invarian' : 'Domain Summary'}:** ${manual.section7_BusinessLogicAndStateRules.domainClassification.summary}

#### ${isId ? 'Aturan Bisnis & Rumus Validasi' : 'Core Business Rules & Validation Formulas'}
| ${isId ? 'Kode' : 'Code'} | ${isId ? 'Nama Aturan Bisnis' : 'Rule Title'} | ${isId ? 'Kondisi Awam' : 'Plain Condition'} | ${isId ? 'Kondisi / Rumus Logika' : 'Logic Formula'} | ${isId ? 'Penjelasan Operasional' : 'Explanation'} | ${isId ? 'Dampak Pelanggaran' : 'Failure Impact'} |
| :--- | :--- | :--- | :--- | :--- | :--- |
${manual.section7_BusinessLogicAndStateRules.coreBusinessRules
  .map((r) => `| \`${r.ruleCode}\` | **${r.ruleTitle}** | ${r.plainHumanCondition} | \`${r.formulaOrCondition}\` | ${r.logicExplanation} | ${r.failureImpact} |`)
  .join('\n')}

#### ${isId ? 'Siklus Transisi Status Layar (State Lifecycle)' : 'Screen State Transition Lifecycle'}
| ${isId ? 'Status Awal' : 'From State'} | ${isId ? 'Pemicu Pengguna' : 'User Trigger'} | ${isId ? 'Validasi Sistem' : 'System Validation'} | ${isId ? 'Status Akhir' : 'To State'} | ${isId ? 'Indikator UI' : 'Visible UI Indicator'} |
| :--- | :--- | :--- | :--- | :--- |
${manual.section7_BusinessLogicAndStateRules.stateTransitionLifecycle
  .map((st) => `| **${st.fromState}** | ${st.userTrigger} | ${st.systemValidation} | **${st.toState}** | ${st.visibleUiIndicator} |`)
  .join('\n')}

### ${manual.section8_UiToApiAndErrorRecoveryMatrix.heading}
| ${isId ? 'Kontrol / Aksi UI' : 'UI Control / Action'} | ${isId ? 'Endpoint API Terpicu' : 'Triggered API'} | ${isId ? 'Ringkasan Payload' : 'Payload Summary'} | ${isId ? 'Respons Sukses (200/201)' : 'Success (200/201)'} | ${isId ? 'Penanganan Error (4xx/5xx)' : 'Error (4xx/5xx)'} | ${isId ? 'Langkah Pemulihan' : 'Recovery Action'} |
| :--- | :--- | :--- | :--- | :--- | :--- |
${manual.section8_UiToApiAndErrorRecoveryMatrix.interactions
  .map((it) => `| **${it.uiControlOrAction}**${it.versionDeltaBadge ? ` **${it.versionDeltaBadge}**` : ''} | \`${it.triggeredEndpoint}\` | \`${it.requestPayloadSummary}\` | ${it.onSuccessHttp200_201} | ${it.onErrorHttp4xx_5xx} | ${it.userRecoveryAction} |`)
  .join('\n')}

### ${manual.section9_DomainGlossaryAndAcronyms.heading}
| ${isId ? 'Istilah / Akronim' : 'Term / Acronym'} | ${isId ? 'Kategori' : 'Category'} | ${isId ? 'Definisi Awam' : 'Plain Definition'} | ${isId ? 'Digunakan Di' : 'Used In'} |
| :--- | :--- | :--- | :--- |
${manual.section9_DomainGlossaryAndAcronyms.terms
  .map((t) => `| **${t.termOrAcronym}** | \`${t.category}\` | ${t.plainDefinition} | ${t.whereUsedInModule} |`)
  .join('\n')}
`;
  }
}

export const iso26514UserManualService = Iso26514UserManualService.getInstance();
