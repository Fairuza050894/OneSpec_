# AGENTS_MASTER_PROMPT.md — Rulebook & Step-by-Step Prompts for Company AI Coding Agent

> **Cara Penggunaan untuk Anda (User):**
> 1. Simpan ketiga file (`DESIGN.md`, `ARCHITECTURE_AND_SDLC_SPEC.md`, dan file ini sebagai `AGENTS.md` atau `CLAUDE.md`) di root folder proyek Anda.
> 2. Jalankan instalasi `anti-slop` dan `rea` di terminal lokal Anda (perintah ada di Bagian 1 di bawah).
> 3. Salin **Prompt Tahap 1 s/d Tahap 6** pada Bagian 3 secara berurutan ke AI Coding Agent perusahaan Anda (Claude Code, Cursor, Codex, Antigravity, atau Gemini CLI).

---

## Bagian 1: Persiapan Environment Lokal (Jalankan Sekali di Terminal)

Sebelum memberikan prompt ke AI perusahaan, jalankan perintah berikut di folder proyek kosong Anda untuk memasang filter **`miqdadbadjuber/anti-slop`** dan reverse-engineering MCP **`morluto/rea`**:

```bash
# 1. Pasang Anti-Slop dalam mode "during" (mencegah AI membuat UI/teks/kode slop sejak awal)
npx antislop-ai --mode during

# 2. Pasang REA (Reverse Engineer Anything) MCP & CLI pada AI Agent Anda
npx rea-agents@latest setup
```

---

## Bagian 2: Isi Blok `AGENTS.md` / `CLAUDE.md` (Otomatis Dibaca AI Perusahaan)

```markdown
<!-- antislop:start -->
## antislop & OneSpec Engineering Mandate

antislop active: during (session override).

For all UI, copywriting, accessibility, responsive layout, and code generation tasks in this repository:
1. Read `DESIGN.md` first as the authoritative source of visual direction, color tokens, typography, and Liveliness Dials (ENERGY 2 / RHYTHM 3 / MOTION 1).
2. Apply `antislop.md` rules R-01 through R-40 in `during` mode:
   - FORBIDDEN: blue-to-purple gradients, glowing orbs, sparkle icons, emoji bullets in UI headers, pill-shaped card radii, fake unmeasured metrics, and dead buttons (R-01, R-11, R-24, R-39, R-40).
   - MANDATORY: WCAG AA/AAA contrast ratios, `cursor: pointer` on all enabled controls, `tabular-nums` on all numeric/latency columns, and clean ISO/IEC/IEEE 29148, BPMN 2.0 (ISO 19510), and ISO 29119 terminology.
3. Read `ARCHITECTURE_AND_SDLC_SPEC.md` for system boundaries, data schemas, and `morluto/rea` (`rea-agents`) integration contracts.
4. Close EVERY implementation turn with the mandatory 4-block **Anti-Slop Delivery Gate Report** (Block 1: Hard Gate R-01..R-40 PASS/FAIL, Block 2: Purpose Gate, Block 3: Quality Locks & Contrast, Block 4: Functional Parity Verification).
<!-- antislop:end -->
```

---

## Bagian 3: Urutan Prompt Step-by-Step untuk AI Perusahaan Anda

Salin dan tempelkan prompt di bawah ini satu per satu ke AI Coding Agent perusahaan Anda. Jangan lanjut ke Prompt berikutnya sebelum AI menyerahkan **Delivery Gate Report: PASS** pada tahap tersebut.

---

### PROMPT TAHAP 1: Inisialisasi Monorepo, Skema Data ISO, dan Koneksi `morluto/rea`

```text
antislop active: during (session override).
Baca file `DESIGN.md` dan `ARCHITECTURE_AND_SDLC_SPEC.md` secara menyeluruh.

Tugas Anda pada Tahap 1:
Bangun pondasi proyek full-stack lokal "OneSpec SDLC Workbench" menggunakan TypeScript (Next.js App Router / React + Fastify/Node.js backend API + SQLite via Prisma untuk penyimpanan artefak lokal) dengan struktur berikut:

1. Buat skema penyimpanan lokal (`prisma/schema.prisma` dan TypeScript interfaces di `src/types/sdlc.ts`) yang mengikat secara bi-directional:
   - `ProjectWorkspace` (mendukung mode `GREENFIELD` tanpa domain existing dan `BROWNFIELD` dengan domain existing).
   - `BrdArtifact` (ISO/IEC/IEEE 29148 StRS: Business Rules `BR-xx`, KPIs, Scope In/Out).
   - `PrdArtifact` (ISO/IEC/IEEE 29148 SyRS: User Stories `REQ-US-xx` yang merujuk ke `BR-xx`, Acceptance Criteria Gherkin, dan tabel Field Validations beserta kontrak HTTP 2xx/4xx).
   - `BpmnProcessModel` (ISO/IEC 19510 BPMN 2.0: Pool, Swimlanes, Start/End Events, User/Service Tasks, dan Exclusive Gateway XOR).
   - `RtmTestCase` (ISO/IEC/IEEE 29119: `TC-xxx` yang merujuk ke `BR-xx` & `REQ-US-xx`, langkah uji, ekspektasi hasil, Gherkin scenario, DOM selector, API endpoint, dan hasil eksekusi).
2. Buat wrapper service `src/services/reaBridge.ts` untuk memanggil CLI/MCP `rea-agents` (`morluto/rea`) secara terprogram.
3. Patuhi seluruh aturan `DESIGN.md` (tanpa gradien ungu, tanpa ikon sparkle, tanpa komentar kode AI slop).
4. Tutup respons Anda dengan 4-block Anti-Slop Delivery Gate Report.
```

---

### PROMPT TAHAP 2: Membangun Engine Fase 1 (MoM ➔ BRD, PRD & Matrix RTM ISO 29119)

```text
antislop active: during (session override).
Mengacu pada `DESIGN.md` dan `ARCHITECTURE_AND_SDLC_SPEC.md`, kerjakan Tahap 2 (Fase 1 Pra-Development: Langkah 1, 2, dan 4):

1. Buat modul `src/services/phase1Compiler.ts` dan endpoint API `POST /api/sdlc/compile-phase1` yang menerima input:
   - `projectMode`: `'greenfield' | 'brownfield'`
   - `existingDomain`: string (opsional untuk brownfield)
   - `rawMeetingNotes`: teks rangkuman rapat Scrum Master & bisnis user.
2. Integrasikan dengan LLM perusahaan (menggunakan JSON Schema ketat / Structured Outputs) agar dari 1x input rangkuman meeting langsung menghasilkan:
   - Dokumen BRD berstandar ISO/IEC/IEEE 29148 lengkap dengan ID `BR-01`, `BR-02`, dst.
   - Dokumen PRD berstandar ISO/IEC/IEEE 29148 lengkap dengan `REQ-US-01` (tertaut ke `BR-xx`), Acceptance Criteria BDD, dan Tabel Spesifikasi Validasi Input & kode HTTP error.
   - Tabel Requirement Traceability Matrix (RTM) berstandar ISO/IEC/IEEE 29119 yang mencakup skenario Positive, Negative, dan Boundary Value Analysis beserta file `.feature` Gherkin.
3. Buat fitur ekspor nyata ke file `.md`, `.feature`, dan `.csv` / `.xlsx` (bukan tombol dummy, patuhi R-24).
4. Bangun UI Langkah 1, Langkah 2, dan Langkah 4 sesuai palet warna dan tipografi `DESIGN.md`. Sertakan Anti-Slop Delivery Gate Report di akhir.
```

---

### PROMPT TAHAP 3: Membangun Camunda-Style BPMN 2.0 Modeler & Stateful Wireframe (Langkah 3)

```text
antislop active: during (session override).
Mengacu pada `DESIGN.md` dan Bagian 4 dari `ARCHITECTURE_AND_SDLC_SPEC.md`, kerjakan Tahap 3 (Visualisasi BPMN 2.0 & Design System di Langkah 3):

1. Buat komponen `src/components/bpmn/CamundaBpmnCanvas.tsx` yang merender diagram alur pengguna menggunakan standar **ISO/IEC 19510 (BPMN 2.0)** bergaya Camunda Modeler:
   - Wajib memiliki Pool horizontal dan Swimlanes yang memisahkan `Lane 1: Client UI / Actor` dan `Lane 2: Backend API & Database`.
   - Gunakan simbol standar BPMN 2.0: Start Event (lingkaran tipis), User Task & Service Task (persegi panjang sudut tegas dengan badge referensi `REQ-US-xx`), Exclusive Gateway XOR (belah ketupat dengan simbol `×`), dan End Event (lingkaran tebal).
   - Gunakan jalur konektor ortogonal (Manhattan routing) dengan label kondisi eksplisit `[YES: HTTP 200]` dan `[NO: HTTP 409 / 422]`. Dilarang membuat kartu-kartu penuh yang menumpuk.
2. Buat komponen `src/components/wireframe/StatefulWireframePreview.tsx`:
   - Jika proyek `brownfield`, tarik palet warna & variabel CSS dari domain existing. Jika `greenfield`, gunakan token standar dari `DESIGN.md`.
   - Sediakan 3 state interaktif yang bisa diklik langsung saat rapat refinement: `NORMAL (Idle)`, `ERROR (Negative Validation HTTP 4xx)`, dan `SUCCESS (Positive HTTP 2xx)`.
3. Pastikan seluruh kontrol memiliki kontras WCAG AA/AAA dan tutup dengan Anti-Slop Delivery Gate Report.
```

---

### PROMPT TAHAP 4: Membangun Tri-Modal Auto-Discovery (`morluto/rea`) untuk Git, Lokal & Staging (Langkah 5)

```text
antislop active: during (session override).
Mengacu pada Bagian 3 dari `ARCHITECTURE_AND_SDLC_SPEC.md`, kerjakan Tahap 4 (Fase 2 Pasca-Development — Langkah 5 Tri-Modal Auto-Discovery):

Bangun modul `src/services/discoveryEngine.ts` dan UI Langkah 5 yang mendukung 3 Mode Ingesti (agar proyek Greenfield yang belum punya domain tetap bisa di-bedah otomatis):

1. **Mode A — Git Repository Connect (`git_repo`):**
   - Terima input URL Git (SSH/HTTPS) dan nama branch.
   - Lakukan clone/fetch ke direktori kerja lokal, lalu jalankan `rea-agents` (`morluto/rea`) dan AST parser untuk mengekstrak seluruh daftar endpoint API (method, path, file controller, nomor baris, validasi request) serta membaca skema database dari `schema.prisma`, migrasi SQL, atau entity ORM.
2. **Mode B — Local Cloned Repo / ZIP Upload (`local_clone`):**
   - Terima input path direktori lokal hasil `git clone` atau upload file `.zip`.
   - Jalankan `npx -y rea-agents@latest analyze-javascript-application <path> --json` dan ekstraktor skema DB lokal.
3. **Mode C — Live Staging URL + Read-Only DB (`staging_url`):**
   - Jalankan Playwright network harvester (menyadap XHR/Fetch menjadi daftar endpoint bersih dan mengambil DOM `data-testid` selector) serta intropeksi skema database `read-only` (`information_schema`).

Tautkan setiap DOM selector, endpoint API, dan tabel database yang ditemukan secara otomatis ke ID `REQ-US-xx` (PRD) dan `TC-xxx` (RTM Fase 1). Tutup dengan Anti-Slop Delivery Gate Report.
```

---

### PROMPT TAHAP 5: Membangun Spec-to-Code Gap Auditor & Generator Dokumentasi Teknis (Langkah 6)

```text
antislop active: during (session override).
Mengacu pada `ARCHITECTURE_AND_SDLC_SPEC.md`, kerjakan Tahap 5 (Langkah 6 — Audit Gap PRD vs Kodingan Developer & Dokumentasi Technical Writer):

1. Buat modul `src/services/conformanceAuditor.ts` yang membandingkan:
   - Aturan Bisnis (`BR-xx`) & Validasi Field di PRD (Fase 1)
   - Bukti implementasi aktual dari hasil bedah AST/API/DB `morluto/rea` (Fase 2).
2. Jika ada aturan di PRD yang belum dikoding developer di controller atau belum memiliki constraint/index di database (misal: aturan 1x klaim per user `BR-02` atau batas plafon 30% gaji belum dicek di kode backend), tampilkan sebagai temuan `NON_CONFORMANT` lengkap dengan nama file, nomor baris kode hasil temuan REA, dan dampaknya.
3. Buat generator otomatis untuk peran Technical Writer yang menyusun Sequence Diagram dan Entity Relationship Diagram (ERD) aktual beserta fitur ekspor ke Markdown dan OpenAPI 3.0 YAML/JSON.
4. Tutup dengan Anti-Slop Delivery Gate Report.
```

---

### PROMPT TAHAP 6: Membangun REA Live Runner Diagram Streaming, Deteksi Bottleneck & Paritas Tool QA (Langkah 7)

```text
antislop active: during (session override).
Mengacu pada Bagian 5 dan Bagian 6 dari `ARCHITECTURE_AND_SDLC_SPEC.md`, kerjakan Tahap 6 (Langkah 7 — Eksekusi Otomasi, Live Bottleneck Streaming, dan Paritas Output):

1. Buat synthesizer otomatis `src/services/testParityGenerator.ts` yang mengonversi Matrix RTM (Fase 1) + DOM Selector & Endpoint API (Fase 2) menjadi 4 artefak pengujian yang 100% setara dengan tools terpisah:
   - File script `@playwright/test` (`tests/<project>.spec.ts`) yang menggabungkan pengujian UI E2E dan API contract assertion dalam satu runner.
   - File **Postman Collection v2.1** (`<project>.postman_collection.json`) beserta environment variables siap jalan di Postman atau CLI `newman`.
   - File **Cucumber Gherkin** (`features/<project>.feature`).
   - File laporan standar CI/CD **JUnit XML** (`reports/junit-results.xml`).
2. Bangun fitur **REA Live Runner Diagram Streaming** menggunakan WebSocket / Server-Sent Events:
   - Saat tombol "Run & Stream Live E2E + API Bottleneck Trace" ditekan, jalankan test suite dan alirkan telemetri real-time per tahapan:
     `[NODE-1: DOM Action]` ➔ `[NODE-2: API Route Controller]` ➔ `[NODE-3: SQL Query Execution]` ➔ `[NODE-4: ISO 29119 Assertion Gate]`.
   - Ukur durasi milidetik (`ms`) setiap tahapan terhadap ambang batas SLA (`thresholdMs`).
   - Sorot secara visual dengan warna `--status-defect` (`#B91C1C`) tahapan mana yang menjadi **BOTTLENECK** (misal query DB lambat karena belum ada index atau bug validasi di controller) lengkap dengan bukti file/baris dari `morluto/rea`.
3. Lakukan pemeriksaan menyeluruh terhadap seluruh aplikasi menggunakan daftar periksa `antislop` (R-01 s/d R-40) dan serahkan laporan akhir Anti-Slop Delivery Gate Report.
```

---

### PROMPT TAHAP 7: Membangun 7-Layer Deep SPA Harvester 2.0 & Cross-Subdomain Ingestion (Langkah 5)

```text
antislop active: during (session override).
Mengacu pada Bagian 8 dari `ARCHITECTURE_AND_SDLC_SPEC.md`, kembangkan kemampuan crawler di `src/services/deepSpaHarvester.ts` dan `src/services/blindCrawlerService.ts` menjadi 7-Layer Deep SPA Harvester:

1. Tangkap seluruh panggilan XHR/Fetch ke domain utama maupun subdomain backend (seperti `mobodfs-sandbox.pancaran-group.co.id`) tanpa membatasi pada filter `/api/`.
2. Jalankan `walkJson` rekursif pada body respons JSON untuk mengekstrak struktur menu dan menginferensi skema `DatabaseErdTable` (tipe data kolom INTEGER, DECIMAL, TIMESTAMP, VARCHAR, Primary Key, dan Foreign Key).
3. Implementasikan 3-pass recursive accordion unfolder pada sidebar dengan smooth scrolling vertikal.
4. Ekstrak rute dari memori Vue 2/3 dan Nuxt 2/3 (`$router.getRoutes()`, `window.__NUXT__`) dengan propagasi prefix path anak (`parentPath + '/' + childPath`).
5. Pindai chunk JavaScript (`/_nuxt/*.js`, `/_next/*.js`, `/assets/*.js`) untuk menemukan rute bersarang dan rute tersembunyi.
6. Jalankan non-anchor click probe untuk mendeteksi rute komponen yang dipicu handler `@click` tanpa `<a href>`.
7. Lakukan per-module deep grepping untuk sub-tab, form modal, dropdown options, action buttons dengan koordinat `(xPercent, yPercent)`, dan screenshot instan via CDP.
8. Tutup dengan Anti-Slop Delivery Gate Report.
```

---

### PROMPT TAHAP 8: Membangun GRC, Risk Matrix & Merkle Audit Vault (Langkah 8)

```text
antislop active: during (session override).
Bangun modul `src/services/merkleAuditVaultService.ts` dan UI Langkah 8 untuk kepatuhan tata kelola enterprise (GRC):

1. Bentuk pohon Merkle (Merkle Tree) berdasar hashing SHA-256 dari seluruh artefak SDLC (BRD, PRD, BPMN, RTM, Bukti Temuan AST, Hasil Pengujian, DAST).
2. Sediakan riwayat snapshot perubahan (*version diffing*) yang dapat diverifikasi integritasnya tanpa bisa dimanipulasi (*tamper-evident*).
3. Hitung Matriks Risiko Proyek berdasarkan formula ISO/IEC 27005 (Likelihood x Impact) dengan penanda mitigasi mitigatif.
4. Tutup dengan Anti-Slop Delivery Gate Report.
```

---

### PROMPT TAHAP 9: Membangun OWASP API Top 10 DAST & Security Scanner (Langkah 9)

```text
antislop active: during (session override).
Bangun modul `src/services/owaspDastService.ts` dan UI Langkah 9 untuk pemindaian keamanan dinamis API (DAST):

1. Jalankan audit otomatis terhadap 10 kategori risiko OWASP API Security:
   - API1: BOLA (Broken Object Level Authorization)
   - API2: Broken Authentication & Credential Stuffing
   - API3: Broken Object Property Level Authorization (BOPLA)
   - API4: Unrestricted Resource Consumption
   - API5: BFLA (Broken Function Level Authorization)
   - API6: Server-Side Request Forgery (SSRF)
   - API7: Security Misconfiguration (CORS, Missing Security Headers)
   - API8: Lack of Protection from Automated Threats
   - API9: Improper Inventory Management
   - API10: Unsafe Consumption of APIs
2. Cegah error Temporal Dead Zone (TDZ) dengan mendeklarasikan seluruh variabel di awal fungsi.
3. Tampilkan hasil pemindaian dengan skor CVSS v3.1 dan rekomendasi remediasi teknis.
4. Tutup dengan Anti-Slop Delivery Gate Report.
```

---

### PROMPT TAHAP 10: Membangun SMT Z3 Formal Proofs Engine (Langkah 10)

```text
antislop active: during (session override).
Bangun modul `src/services/smtProofService.ts` dan UI Langkah 10 untuk pembuktian formal logika sistem:

1. Transformasikan aturan bisnis (`BR-xx`) dan transisi status (state machines) menjadi formula logika predikat ordo pertama (First-Order Logic SMT-LIB2).
2. Verifikasi keterpenuhan (*satisfiability / unsat*) terhadap deadlock, invariant violations, dan celah eskalasi hak akses RBAC.
3. Visualisasikan status pembuktian formal (PROVEN, COUNTEREXAMPLE, REFUTED) secara deterministik.
4. Tutup dengan Anti-Slop Delivery Gate Report.
```

---

### PROMPT TAHAP 11: Membangun Delphi ARB Consensus Engine (Langkah 11)

```text
antislop active: during (session override).
Bangun modul `src/services/delphiArbService.ts` dan UI Langkah 11 untuk Architecture Review Board:

1. Simulasikan evaluasi konsensus multi-perspektif (Enterprise Architect, Principal Security Engineer, Head of QA, Compliance Lead).
2. Hitung skor konsensus Delphi, bobot risiko, dan catatan pertimbangan arsitektur (*architectural decisions*).
3. Hasilkan ringkasan rekomendasi persetujuan rilis (APPROVED, CONDITIONAL, REJECTED).
4. Tutup dengan Anti-Slop Delivery Gate Report.
```

---

### PROMPT TAHAP 12: Membangun Executive Summary, Knowledge Graph & Multi-Artifact Export Hub (Langkah 12)

```text
antislop active: during (session override).
Bangun modul `src/services/unifiedReportGenerator.ts`, `src/services/automationBundleExportService.ts`, dan UI Langkah 12 serta komponen `QuickExportToolbar.tsx`:

1. Sediakan visualisasi Knowledge Graph interaktif yang menghubungkan Stakeholder ➔ Business Rule ➔ User Story ➔ Endpoint API ➔ Tabel DB ➔ Test Case ➔ Vulnerability.
2. Sediakan tombol unduh instan dan endpoint `/api/sdlc/automation-bundle` untuk:
   - Workbook QA Excel (`.xlsx` 17 sheets lengkap dengan Bus-Factor, Synthetic Data, dan RBAC Matrix)
   - Manual Pengguna Word (`.docx` ISO 26514 bilingual dengan visual pin callout 1:1)
   - Playwright Test Suite (`.spec.ts`)
   - Postman Collection v2.1 (`.json`)
   - RBAC Differential Matrix (`.json`)
3. Lakukan verifikasi menyeluruh terhadap seluruh gate anti-slop (R-01 s/d R-40) dan serahkan laporan final Anti-Slop Delivery Gate Report.
```
