/**
 * OneSpec SDLC Workbench - Multi-Persona RBAC Differential Matrix Engine
 * Standards: ISO/IEC 27001:2022 Annex A.9, OWASP API1:2023 (BOLA) & API5:2023 (BFLA)
 * Maps exact UI control visibility and API permission boundaries across Login Dropdown Contexts
 * (e.g. "Pancaran / Internal" vs "Eksternal / Partner" vs "Viewer" vs "Unauthenticated").
 */
import type { CompiledSdlcState } from './sdlcCompiler';
import type { FeatureModuleSurface } from '@/types/sdlc';

export interface RbacPersonaDefinition {
  personaId: string;
  personaName: string;
  loginDropdownContext: string;
  authorityLevel: 'FULL_INTERNAL' | 'EXTERNAL_PARTNER' | 'READ_ONLY_AUDITOR' | 'UNAUTHENTICATED';
  descriptionId: string;
  descriptionEn: string;
}

export interface RbacDifferentialRow {
  rowId: string;
  moduleId: string;
  moduleName: string;
  routePath: string;
  targetControlOrAction: string;
  controlCategory: 'LOGIN_GATE' | 'VIEW_READ' | 'CREATE_MUTATION' | 'UPDATE_APPROVE' | 'DELETE_ADMIN' | 'EXPORT_REPORT';
  triggeredEndpoint: string;
  pancaranInternalAccess: 'ALLOWED (HTTP 200/201)' | 'RESTRICTED';
  eksternalPartnerAccess: 'ALLOWED (SCOPED TENANT)' | 'READ_ONLY (HIDDEN ACTION)' | 'DENIED (HTTP 403 FORBIDDEN)';
  viewerAuditorAccess: 'READ_ONLY (HTTP 200)' | 'DENIED (HTTP 403 FORBIDDEN)';
  unauthenticatedAccess: 'PUBLIC_LOGIN_SURFACE' | 'DENIED (HTTP 401 UNAUTHORIZED)';
  owaspSecurityGate: string;
  verificationAssertionId: string;
  verificationAssertionEn: string;
}

export interface RbacDifferentialReport {
  appName: string;
  evaluatedAt: string;
  detectedLoginContexts: string[];
  personas: RbacPersonaDefinition[];
  rows: RbacDifferentialRow[];
}

export class RbacDifferentialMatrixService {
  private static instance: RbacDifferentialMatrixService;

  private constructor() {}

  public static getInstance(): RbacDifferentialMatrixService {
    if (!RbacDifferentialMatrixService.instance) {
      RbacDifferentialMatrixService.instance = new RbacDifferentialMatrixService();
    }
    return RbacDifferentialMatrixService.instance;
  }

  public buildDifferentialMatrix(state: CompiledSdlcState): RbacDifferentialReport {
    const appName = state.appName || 'Enterprise Application';
    const modules: FeatureModuleSurface[] = state.discoveredFeatureModules || [];

    // Deteksi konteks dropdown login dari modul autentikasi (default Pancaran | Eksternal)
    const loginMod = modules.find((m) => /login|signin|auth/i.test(`${m.routePath} ${m.moduleName}`));
    const rawDropdownOpts: string[] = [];
    for (const fm of loginMod?.formsAndModals || []) {
      for (const inp of fm.inputs || []) {
        if (inp.type === 'select' || /pancaran|eksternal|external|role|tenant|domain|tipe|akses/i.test(`${inp.name} ${inp.labelText || ''} ${inp.placeholder || ''}`)) {
          const parts = (inp.placeholder || '')
            .split(/[|,;/]/)
            .map((s) => s.trim())
            .filter((s) => s.length >= 2 && !/^(pilih|select)/i.test(s));
          rawDropdownOpts.push(...parts);
        }
      }
    }

    const detectedLoginContexts =
      rawDropdownOpts.length >= 2
        ? Array.from(new Set(rawDropdownOpts))
        : ['Pancaran (Internal)', 'Eksternal (Partner / Vendor)'];

    const primaryCtx = detectedLoginContexts[0] || 'Pancaran';
    const secondaryCtx = detectedLoginContexts[1] || 'Eksternal';

    const personas: RbacPersonaDefinition[] = [
      {
        personaId: 'PERSONA-01',
        personaName: `Operator Internal (${primaryCtx})`,
        loginDropdownContext: primaryCtx,
        authorityLevel: 'FULL_INTERNAL',
        descriptionId: `Akses penuh internal organisasi (${primaryCtx}) mencakup pembuatan, penyuntingan, persetujuan, dan ekspor seluruh modul.`,
        descriptionEn: `Full internal organizational access (${primaryCtx}) covering create, edit, approval, and export operations.`,
      },
      {
        personaId: 'PERSONA-02',
        personaName: `Mitra / Pengguna Luar (${secondaryCtx})`,
        loginDropdownContext: secondaryCtx,
        authorityLevel: 'EXTERNAL_PARTNER',
        descriptionId: `Akses terbatas mitra/pihak luar (${secondaryCtx}); hanya melihat data miliknya sendiri (Tenant Scoped) dan dilarang menghapus/mengubah master internal.`,
        descriptionEn: `Scoped external partner access (${secondaryCtx}); restricted to own tenant records and barred from internal master mutations.`,
      },
      {
        personaId: 'PERSONA-03',
        personaName: 'Viewer / Auditor Read-Only',
        loginDropdownContext: `${primaryCtx} (Read-Only)`,
        authorityLevel: 'READ_ONLY_AUDITOR',
        descriptionId: 'Hanya diizinkan melihat daftar, detail, dan mengunduh laporan tanpa hak mutasi (POST/PUT/DELETE).',
        descriptionEn: 'Permitted only to view lists, inspect details, and export reports without mutation rights.',
      },
      {
        personaId: 'PERSONA-04',
        personaName: 'Unauthenticated / Expired Token',
        loginDropdownContext: 'No Session / Anonymous',
        authorityLevel: 'UNAUTHENTICATED',
        descriptionId: 'Pengguna belum login atau token JWT telah kedaluwarsa; wajib ditolak HTTP 401 dan diarahkan ke /login.',
        descriptionEn: 'Unauthenticated user or expired JWT session; strictly rejected with HTTP 401 and redirected to /login.',
      },
    ];

    const rows: RbacDifferentialRow[] = [];
    let counter = 1;

    for (const mod of modules) {
      const isLogin = /login|signin|auth/i.test(`${mod.routePath} ${mod.moduleName}`) && !mod.hasDataTable;
      const baseEp = mod.triggeredApis?.[0]?.path || (mod.routePath.startsWith('/api') ? mod.routePath : `/api${mod.routePath}`);

      if (isLogin) {
        rows.push({
          rowId: `RBAC-${String(counter++).padStart(3, '0')}`,
          moduleId: mod.moduleId,
          moduleName: mod.moduleName,
          routePath: mod.routePath,
          targetControlOrAction: `Autentikasi & Pilih Dropdown [${detectedLoginContexts.join(' / ')}]`,
          controlCategory: 'LOGIN_GATE',
          triggeredEndpoint: 'POST /api/v1/auth/login',
          pancaranInternalAccess: 'ALLOWED (HTTP 200/201)',
          eksternalPartnerAccess: 'ALLOWED (SCOPED TENANT)',
          viewerAuditorAccess: 'READ_ONLY (HTTP 200)',
          unauthenticatedAccess: 'PUBLIC_LOGIN_SURFACE',
          owaspSecurityGate: 'OWASP API2:2023 Broken Authentication Gate',
          verificationAssertionId: `Memilih '${primaryCtx}' menerbitkan JWT scope internal; memilih '${secondaryCtx}' mengikat JWT pada tenant_id eksternal; salah konteks ditolak HTTP 403.`,
          verificationAssertionEn: `Selecting '${primaryCtx}' issues internal JWT scope; selecting '${secondaryCtx}' binds JWT to external tenant_id; mismatch returns HTTP 403.`,
        });
        continue;
      }

      // 1. Akses Baca Halaman & Tabel Utama (VIEW_READ)
      rows.push({
        rowId: `RBAC-${String(counter++).padStart(3, '0')}`,
        moduleId: mod.moduleId,
        moduleName: mod.moduleName,
        routePath: mod.routePath,
        targetControlOrAction: `Buka Halaman & Lihat Data "${mod.pageHeading || mod.moduleName}"`,
        controlCategory: 'VIEW_READ',
        triggeredEndpoint: `GET ${baseEp}`,
        pancaranInternalAccess: 'ALLOWED (HTTP 200/201)',
        eksternalPartnerAccess: 'ALLOWED (SCOPED TENANT)',
        viewerAuditorAccess: 'READ_ONLY (HTTP 200)',
        unauthenticatedAccess: 'DENIED (HTTP 401 UNAUTHORIZED)',
        owaspSecurityGate: 'OWASP API1:2023 BOLA / Tenant Isolation',
        verificationAssertionId: `Konteks '${primaryCtx}' melihat seluruh data unit; konteks '${secondaryCtx}' hanya menerima baris yang sesuai dengan tenant_id miliknya.`,
        verificationAssertionEn: `Context '${primaryCtx}' views all division records; context '${secondaryCtx}' receives only rows matching its own tenant_id.`,
      });

      // 2. Periksa setiap tombol aksi di modul untuk menentukan matriks izinnya
      const buttons = mod.toolbarButtons && mod.toolbarButtons.length > 0
        ? mod.toolbarButtons
        : (mod.screenControlsCatalog || []).filter((c) => c.controlType === 'PRIMARY_ACTION_BUTTON').map((c) => c.controlName);

      for (const btn of buttons.slice(0, 6)) {
        const lower = btn.toLowerCase();
        if (/hapus|delete|remove|void|purge|konfigurasi|setting|master/i.test(lower)) {
          rows.push({
            rowId: `RBAC-${String(counter++).padStart(3, '0')}`,
            moduleId: mod.moduleId,
            moduleName: mod.moduleName,
            routePath: mod.routePath,
            targetControlOrAction: `Tombol Destruktif / Admin: "${btn}"`,
            controlCategory: 'DELETE_ADMIN',
            triggeredEndpoint: `DELETE ${baseEp}/:id`,
            pancaranInternalAccess: 'ALLOWED (HTTP 200/201)',
            eksternalPartnerAccess: 'DENIED (HTTP 403 FORBIDDEN)',
            viewerAuditorAccess: 'DENIED (HTTP 403 FORBIDDEN)',
            unauthenticatedAccess: 'DENIED (HTTP 401 UNAUTHORIZED)',
            owaspSecurityGate: 'OWASP API5:2023 Broken Function Level Auth (BFLA)',
            verificationAssertionId: `Tombol "${btn}" disembunyikan/dikunci untuk akun '${secondaryCtx}' dan menolak paksa panggilan API langsung dengan HTTP 403.`,
            verificationAssertionEn: `Button "${btn}" is hidden/disabled for '${secondaryCtx}' accounts and rejects direct API calls with HTTP 403.`,
          });
        } else if (/approve|setuju|verifikasi|reject|tolak|publish/i.test(lower)) {
          rows.push({
            rowId: `RBAC-${String(counter++).padStart(3, '0')}`,
            moduleId: mod.moduleId,
            moduleName: mod.moduleName,
            routePath: mod.routePath,
            targetControlOrAction: `Tombol Otorisasi / Persetujuan: "${btn}"`,
            controlCategory: 'UPDATE_APPROVE',
            triggeredEndpoint: `PATCH ${baseEp}/:id/status`,
            pancaranInternalAccess: 'ALLOWED (HTTP 200/201)',
            eksternalPartnerAccess: 'DENIED (HTTP 403 FORBIDDEN)',
            viewerAuditorAccess: 'DENIED (HTTP 403 FORBIDDEN)',
            unauthenticatedAccess: 'DENIED (HTTP 401 UNAUTHORIZED)',
            owaspSecurityGate: 'OWASP API5:2023 Segregation of Duties Guard',
            verificationAssertionId: `Hanya pejabat berwenang pada konteks '${primaryCtx}' yang dapat mengeksekusi "${btn}"; pihak '${secondaryCtx}' ditolak HTTP 403.`,
            verificationAssertionEn: `Only authorized '${primaryCtx}' supervisors can execute "${btn}"; '${secondaryCtx}' callers receive HTTP 403.`,
          });
        } else if (/tambah|create|add|baru|buat|simpan|submit|\+/i.test(lower)) {
          const isInternalMaster = /master|tarif|katalog|harga|pricing|user|role|config/i.test(`${mod.moduleName} ${btn}`);
          rows.push({
            rowId: `RBAC-${String(counter++).padStart(3, '0')}`,
            moduleId: mod.moduleId,
            moduleName: mod.moduleName,
            routePath: mod.routePath,
            targetControlOrAction: `Tombol Mutasi / Entri: "${btn}"`,
            controlCategory: 'CREATE_MUTATION',
            triggeredEndpoint: `POST ${baseEp}`,
            pancaranInternalAccess: 'ALLOWED (HTTP 200/201)',
            eksternalPartnerAccess: isInternalMaster ? 'DENIED (HTTP 403 FORBIDDEN)' : 'ALLOWED (SCOPED TENANT)',
            viewerAuditorAccess: 'DENIED (HTTP 403 FORBIDDEN)',
            unauthenticatedAccess: 'DENIED (HTTP 401 UNAUTHORIZED)',
            owaspSecurityGate: 'OWASP API3:2023 BOPLA & RBAC Write Gate',
            verificationAssertionId: isInternalMaster
              ? `Pembuatan master data "${btn}" dikhususkan bagi internal '${primaryCtx}'; pengguna '${secondaryCtx}' hanya berhak baca (Read-Only).`
              : `Pengguna '${primaryCtx}' dan '${secondaryCtx}' dapat mengirim entri "${btn}" sesuai lingkup organisasinya masing-masing.`,
            verificationAssertionEn: isInternalMaster
              ? `Master creation "${btn}" is restricted to internal '${primaryCtx}'; '${secondaryCtx}' users have read-only access.`
              : `Both '${primaryCtx}' and '${secondaryCtx}' may submit "${btn}" within their respective tenant scopes.`,
          });
        } else if (/export|ekspor|download|unduh|cetak|print/i.test(lower)) {
          rows.push({
            rowId: `RBAC-${String(counter++).padStart(3, '0')}`,
            moduleId: mod.moduleId,
            moduleName: mod.moduleName,
            routePath: mod.routePath,
            targetControlOrAction: `Tombol Ekspor Laporan: "${btn}"`,
            controlCategory: 'EXPORT_REPORT',
            triggeredEndpoint: `GET ${baseEp}/export`,
            pancaranInternalAccess: 'ALLOWED (HTTP 200/201)',
            eksternalPartnerAccess: 'ALLOWED (SCOPED TENANT)',
            viewerAuditorAccess: 'READ_ONLY (HTTP 200)',
            unauthenticatedAccess: 'DENIED (HTTP 401 UNAUTHORIZED)',
            owaspSecurityGate: 'OWASP API4:2023 Rate-Limited Export & Tenant Filter',
            verificationAssertionId: `Ekspor "${btn}" menyaring baris sesuai konteks login ('${primaryCtx}' vs '${secondaryCtx}') agar tidak bocor lintas perusahaan.`,
            verificationAssertionEn: `Export "${btn}" filters rows by login context ('${primaryCtx}' vs '${secondaryCtx}') to prevent cross-tenant leakage.`,
          });
        }
      }
    }

    return {
      appName,
      evaluatedAt: new Date().toISOString(),
      detectedLoginContexts,
      personas,
      rows,
    };
  }
}

export const rbacDifferentialMatrixService = RbacDifferentialMatrixService.getInstance();
