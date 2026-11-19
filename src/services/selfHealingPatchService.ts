import * as crypto from 'node:crypto';
import * as child_process from 'node:child_process';
import type { CompiledSdlcState } from './sdlcCompiler';
import { owaspDastService } from './owaspDastService';

export interface AutonomousRemediationItem {
  id: string;
  sourceCategory: 'OWASP_DAST' | 'SQL_BOTTLENECK' | 'GAP_AUDIT' | 'ANOMALY_GUARD';
  title: string;
  targetFile: string;
  cweMapping: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  remediationSummary: string;
  diffSnippet: string;
  provenance: 'SIMULATED' | 'MEASURED_GIT_DIFF';
  isIllustrativeOnly: boolean;
}

export interface PatchGenerationOptions {
  isRealGitRepo?: boolean;
  gitWorkingDir?: string;
}

export class SelfHealingPatchService {
  private static instance: SelfHealingPatchService;

  private constructor() {}

  public static getInstance(): SelfHealingPatchService {
    if (!SelfHealingPatchService.instance) {
      SelfHealingPatchService.instance = new SelfHealingPatchService();
    }
    return SelfHealingPatchService.instance;
  }

  /**
   * Computes the authentic Git object blob SHA-1 (first 7 hex chars), exactly matching Git's object model.
   * Format: "blob <byteLength>\0<content>" hashed with SHA-1.
   */
  public static gitBlobSha7(content: string): string {
    const header = `blob ${Buffer.byteLength(content, 'utf8')}\0`;
    return crypto.createHash('sha1').update(header + content, 'utf8').digest('hex').slice(0, 7);
  }

  /**
   * Creates a 100% syntactically valid unified git diff for a new file that cleanly passes `git apply --check`.
   */
  public static createUnifiedNewFileDiff(filePath: string, fileContent: string): string {
    const normalized = fileContent.endsWith('\n') ? fileContent : fileContent + '\n';
    const lines = normalized.split('\n');
    lines.pop(); // remove trailing empty string resulting from the terminal newline
    const blobSha = SelfHealingPatchService.gitBlobSha7(normalized);

    return [
      `diff --git a/${filePath} b/${filePath}`,
      `new file mode 100644`,
      `index 0000000..${blobSha}`,
      `--- /dev/null`,
      `+++ b/${filePath}`,
      `@@ -0,0 +1,${lines.length} @@`,
      ...lines.map((l) => `+${l}`),
    ].join('\n');
  }

  /**
   * Generates a standard Unified Git Patch (.patch) and accompanying
   * engineering runbook for automated merge in CI/CD or local developer checkout.
   * If a real git working copy is supplied (Mode A), attempts to extract actual git diff.
   * Otherwise (Mode B), emits an illustrative patch strictly marked as SIMULATED that
   * conforms 100% to git unified diff standards and passes `git apply --check`.
   */
  public generateUnifiedGitPatch(
    state: CompiledSdlcState,
    options?: PatchGenerationOptions
  ): string {
    // Mode A: If real git repo is available and contains uncommitted remediation changes
    if (options?.isRealGitRepo && options?.gitWorkingDir) {
      try {
        const gitDiff = child_process.execSync('git diff', {
          cwd: options.gitWorkingDir,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        });
        if (gitDiff.trim().length > 0) {
          return gitDiff;
        }
      } catch {
        // Fall back to illustrative patch
      }
    }

    const appName = state.appName || 'Target Application';
    const timestamp = new Date().toISOString();
    const items = this.extractRemediationItems(state);

    const patchLines: string[] = [];
    patchLines.push(
      `From: OneSpec Autonomous Remediation Engine <remediation-bot@onespec.internal>`,
      `Date: ${new Date().toUTCString()}`,
      `Subject: [PATCH] fix(security-perf): autonomous remediation (Contoh Ilustratif / SIMULATED)`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      `X-OneSpec-Provenance: SIMULATED`,
      `X-OneSpec-Illustrative: true`,
      ``,
      `# ==============================================================================`,
      `# ONESPEC SDLC STUDIO — CONTOH PATCH REMEDIASI ILUSTRATIF (SIMULATED)`,
      `# PERINGATAN: Berkas ini merupakan contoh arsitektural berbasis simulasi dan`,
      `# TIDAK untuk diterapkan langsung pada repositori produksi tanpa tinjauan teknis.`,
      `# Provenance: SIMULATED · Mode: AS_BUILT_RULE_BASED`,
      `# Application: ${appName} (${state.targetUrl || 'http://localhost:3000/'})`,
      `# Generated At: ${timestamp}`,
      `# Compliance Standards: Mengacu pada Kontrol A.8 ISO/IEC 27001:2022 · OWASP ASVS v4.0 · ISO/IEC 25010:2023`,
      `# Remediated Items Count: ${items.length}`,
      `# ==============================================================================`,
      ``,
      `---`
    );

    // Append unified diff chunks for each remediated component
    for (const item of items) {
      patchLines.push(item.diffSnippet);
    }

    // Append documentation runbook as a new markdown file in the git repository
    const runbookContent = this.generateRemediationRunbook(state, items);
    patchLines.push(
      SelfHealingPatchService.createUnifiedNewFileDiff('docs/AUTONOMOUS_REMEDIATION_RUNBOOK.md', runbookContent)
    );

    patchLines.push('--', '2.44.0', '');

    return patchLines.join('\n');
  }

  /**
   * Generates a bilingual ISO-standard Markdown Remediation Runbook
   */
  public generateRemediationRunbook(
    state: CompiledSdlcState,
    items?: AutonomousRemediationItem[]
  ): string {
    const resolvedItems = items || this.extractRemediationItems(state);
    const appName = state.appName || 'Target Application';
    const targetUrl = state.targetUrl || 'http://localhost:3000/';

    return `# Autonomous Remediation Runbook & Engineering SOP
**System:** ${appName} · **Ingress URL:** \`${targetUrl}\`  
**Audit Standard:** Mengacu pada ISO/IEC 27001:2022 (A.8 SDLC) / OWASP ASVS v4.0 / ISO/IEC 25010:2023  
**Generated by:** OneSpec Autonomous Remediation Engine (Next-Gen AI SDLC)

> [!IMPORTANT]
> **Contoh Patch (Ilustratif / Simulated)**: Patch dan cuplikan perbaikan berikut ini dihasilkan secara terprogram oleh mesin aturan (rule-based simulation) sebagai panduan referensi arsitektur, bukan patch yang siap diterapkan secara buta pada repositori produksi tanpa penyesuaian oleh tim pengembang.

---

## 1. Executive Summary & Remediated Flaws
This patch automatically resolves **${resolvedItems.length} structural vulnerabilities and performance bottlenecks** detected across the application surface:

| Item ID | Category | Target Component | CWE / Standard | Severity | Provenance |
| :--- | :--- | :--- | :--- | :--- | :--- |
${resolvedItems
  .map(
    (it) =>
      `| **${it.id}** | \`${it.sourceCategory}\` | \`${it.targetFile}\` | ${it.cweMapping} | **${it.severity}** | \`${it.provenance}\` |`
  )
  .join('\n')}

---

## 2. One-Click Merge & Application Instructions

### Step 2.1 — Apply Patch to Working Copy
In the root directory of your repository, verify the illustrative patch cleanly:
\`\`\`bash
# 1. Verify git working directory status
git status

# 2. Check diff applicability dry-run (verifikasi sintaks patch)
git apply --check onespec-contoh-patch-ilustratif.patch

# 3. Apply the autonomous patch to a review branch
git checkout -b review/onespec-remediation
git apply onespec-contoh-patch-ilustratif.patch

# 4. Stage and commit the remediated components
git add .
git commit -m "fix(security-perf): autonomous remediation of OWASP API flaws & SQL bottlenecks (SIMULATED)"
\`\`\`

### Step 2.2 — Run Database Index Migration
If performance bottlenecks were resolved, apply the SQL index DDL:
\`\`\`bash
# Prisma migration
npx prisma migrate dev --name add_autonomous_remediation_indexes

# Or direct PostgreSQL / MySQL execution
psql -d "$DATABASE_URL" -f prisma/migrations/add_autonomous_remediation_indexes.sql
\`\`\`

---

## 3. Post-Remediation Verification Suite

Execute the following automated health checks to verify complete closure of findings:

1. **OWASP API1 (BOLA) & API2 (Authentication) Ingress Probe:**
   \`\`\`bash
   curl -i -X GET "${targetUrl.replace(/\/$/, '')}/api/v1/protected" -H "Accept: application/json"
   # Expected result: HTTP 401 Unauthorized (Clean gate enforcement)
   \`\`\`

2. **OWASP API3 (Mass Assignment) Strict Schema Probe:**
   \`\`\`bash
   curl -i -X POST "${targetUrl.replace(/\/$/, '')}/api" -H "Content-Type: application/json" -d '{"role":"SUPERADMIN","isAdmin":true}'
   # Expected result: HTTP 422 Unprocessable Entity (Extraneous fields rejected)
   \`\`\`

3. **Rate Limiting Concurrency Clamp (API4):**
   \`\`\`bash
   for i in {1..20}; do curl -s -o /dev/null -w "%{http_code} " "${targetUrl.replace(/\/$/, '')}/api"; done
   # Expected result: HTTP 200 within limit, transitioning to HTTP 429 upon quota exhaustion
   \`\`\`

---

## 4. Rollback & Contingency Protocol
In case of unforeseen regression in staging:
\`\`\`bash
git checkout -f main
git clean -fd
\`\`\`
`;
  }

  private extractRemediationItems(state: CompiledSdlcState): AutonomousRemediationItem[] {
    const items: AutonomousRemediationItem[] = [];
    const appName = state.appName || 'App';
    const primaryTable = state.databaseTables?.[0]?.tableName || 'EnterpriseRecord';

    // 1. OWASP DAST Findings Remediation
    // 1.1 API1: BOLA Tenant Isolation
    const f1Content = [
      `import type { Request, Response, NextFunction } from 'express';`,
      ``,
      `/**`,
      ` * OneSpec Autonomous Remediation: OWASP API1:2023 (BOLA)`,
      ` * Enforces mandatory tenant isolation and object ownership boundary.`,
      ` */`,
      `export function enforceTenantIsolation(req: Request, res: Response, next: NextFunction) {`,
      `  const user = (req as any).user;`,
      `  const requestedTenantId = req.headers['x-tenant-id'] || req.params.tenantId;`,
      `  `,
      `  if (requestedTenantId && user?.tenantId && String(requestedTenantId) !== String(user.tenantId)) {`,
      `    return res.status(403).json({`,
      `      statusCode: 403,`,
      `      error: 'Forbidden',`,
      `      message: 'Cross-tenant resource access violation detected (BOLA Guard)',`,
      `    });`,
      `  }`,
      `  next();`,
      `}`,
      ``,
    ].join('\n');

    items.push({
      id: 'REM-OWASP-API1',
      sourceCategory: 'OWASP_DAST',
      title: 'Broken Object Level Authorization (BOLA / IDOR) Tenant Isolation Middleware',
      targetFile: 'src/middleware/tenantIsolation.ts',
      cweMapping: 'CWE-284: Improper Access Control',
      severity: 'HIGH',
      remediationSummary: 'Enforces tenant isolation and ownership validation across entities.',
      diffSnippet: SelfHealingPatchService.createUnifiedNewFileDiff(
        'src/middleware/tenantIsolation.ts',
        f1Content
      ),
      provenance: 'SIMULATED',
      isIllustrativeOnly: true,
    });

    // 1.2 API3: Mass Assignment Zod Strict DTO
    const f2Content = [
      `import { z } from 'zod';`,
      ``,
      `/**`,
      ` * OneSpec Autonomous Remediation: OWASP API3:2023 (Mass Assignment)`,
      ` * Strict schema strips unexpected fields and rejects unwhitelisted properties.`,
      ` */`,
      `export const StrictPayloadContract = z`,
      `  .object({`,
      `    username: z.string().min(3).max(50),`,
      `    email: z.string().email().optional(),`,
      `    notes: z.string().max(255).optional(),`,
      `  })`,
      `  .strict(); // Throws 422 if client submits role, isAdmin, or internal flags!`,
      ``,
      `export type ValidatedStrictPayload = z.infer<typeof StrictPayloadContract>;`,
      ``,
    ].join('\n');

    items.push({
      id: 'REM-OWASP-API3',
      sourceCategory: 'OWASP_DAST',
      title: 'Mass Assignment Strict Schema Validator (BOPLA)',
      targetFile: 'src/schemas/strictValidationDto.ts',
      cweMapping: 'CWE-915: Improper Modification of Dynamically-Determined Attributes',
      severity: 'HIGH',
      remediationSummary: 'Rejects extraneous or privileged attributes (e.g. isAdmin, role, balance).',
      diffSnippet: SelfHealingPatchService.createUnifiedNewFileDiff(
        'src/schemas/strictValidationDto.ts',
        f2Content
      ),
      provenance: 'SIMULATED',
      isIllustrativeOnly: true,
    });

    // 1.3 API4: Rate Limiting & DoS Clamp
    const f3Content = [
      `import rateLimit from 'express-rate-limit';`,
      ``,
      `/**`,
      ` * OneSpec Autonomous Remediation: OWASP API4:2023 (Resource Consumption)`,
      ` * Throttles aggressive sequential requests to enforce SLA performance.`,
      ` */`,
      `export const standardApiRateLimiter = rateLimit({`,
      `  windowMs: 60 * 1000, // 1 minute`,
      `  max: 120, // 120 requests per IP`,
      `  standardHeaders: true,`,
      `  legacyHeaders: false,`,
      `  message: {`,
      `    statusCode: 429,`,
      `    error: 'Too Many Requests',`,
      `    message: 'Rate limit threshold exceeded. Please retry after window reset.',`,
      `  },`,
      `});`,
      ``,
    ].join('\n');

    items.push({
      id: 'REM-OWASP-API4',
      sourceCategory: 'OWASP_DAST',
      title: 'Rate-Limiting & High-Concurrency Request Throttling',
      targetFile: 'src/middleware/rateLimiter.ts',
      cweMapping: 'CWE-770: Allocation of Resources Without Limits or Throttling',
      severity: 'MEDIUM',
      remediationSummary: 'Clamps burst requests to 120 req/min per IP to eliminate DoS vector.',
      diffSnippet: SelfHealingPatchService.createUnifiedNewFileDiff(
        'src/middleware/rateLimiter.ts',
        f3Content
      ),
      provenance: 'SIMULATED',
      isIllustrativeOnly: true,
    });

    // 1.4 API8: Security Headers & CORS Misconfiguration
    const f4Content = [
      `import type { Request, Response, NextFunction } from 'express';`,
      ``,
      `/**`,
      ` * OneSpec Autonomous Remediation: OWASP API8:2023 (Security Misconfiguration)`,
      ` * Hardens ingress with HSTS, CSP, and clickjacking prevention.`,
      ` */`,
      `export function applyEnterpriseSecurityHeaders(req: Request, res: Response, next: NextFunction) {`,
      `  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');`,
      `  res.setHeader('X-Content-Type-Options', 'nosniff');`,
      `  res.setHeader('X-Frame-Options', 'DENY');`,
      `  res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none';");`,
      `  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');`,
      `  res.removeHeader('X-Powered-By');`,
      `  next();`,
      `}`,
      ``,
    ].join('\n');

    items.push({
      id: 'REM-OWASP-API8',
      sourceCategory: 'OWASP_DAST',
      title: 'Enterprise Security Headers & Restricted CORS Middleware',
      targetFile: 'src/middleware/securityHeaders.ts',
      cweMapping: 'CWE-16: Configuration Vulnerability',
      severity: 'MEDIUM',
      remediationSummary: 'Injects HSTS, CSP, X-Frame-Options, X-Content-Type-Options headers.',
      diffSnippet: SelfHealingPatchService.createUnifiedNewFileDiff(
        'src/middleware/securityHeaders.ts',
        f4Content
      ),
      provenance: 'SIMULATED',
      isIllustrativeOnly: true,
    });

    // 2. Stage 4 SQL Bottleneck Remediation DDL
    const stages = state.pipelineStages || [];
    const bottleneckStage = stages.find((s) => s.status === 'BOTTLENECK' && s.rootCause?.sqlRemediationQuery);
    const sqlQueries = bottleneckStage?.rootCause?.sqlRemediationQuery
      ? bottleneckStage.rootCause.sqlRemediationQuery
      : [
          `-- 1. Index on Primary Foreign Keys & Tenant Scoping`,
          `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_${primaryTable.toLowerCase()}_tenant_id ON "${primaryTable}" ("tenantId");`,
          ``,
          `-- 2. Index on Status & Date Queries for Pagination Acceleration`,
          `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_${primaryTable.toLowerCase()}_status_created ON "${primaryTable}" ("status", "createdAt" DESC);`,
        ].join('\n');

    const f5Content = [
      `-- OneSpec Autonomous Remediation: Stage 4 Database Index DDL`,
      `-- Target Table: ${primaryTable}`,
      ``,
      sqlQueries,
      ``,
    ].join('\n');

    items.push({
      id: 'REM-SQL-STAGE4',
      sourceCategory: 'SQL_BOTTLENECK',
      title: 'Database Composite Index DDL (Stage 4 Concurrency Acceleration)',
      targetFile: 'prisma/migrations/add_autonomous_remediation_indexes.sql',
      cweMapping: 'CWE-400: Uncontrolled Resource Consumption (Database Sequential Scan)',
      severity: 'HIGH',
      remediationSummary: 'Resolves sequential table scans and reduces database latency from > 500ms to < 25ms.',
      diffSnippet: SelfHealingPatchService.createUnifiedNewFileDiff(
        'prisma/migrations/add_autonomous_remediation_indexes.sql',
        f5Content
      ),
      provenance: 'SIMULATED',
      isIllustrativeOnly: true,
    });

    // 3. Gap Audit & Missing DTO Validation Contracts
    const vrs = state.validationRules || [];
    const validationCode = vrs.slice(0, 8).map((vr) => `
/** [${vr.ruleId}] ${vr.constraintExpression} -> HTTP ${vr.httpStatus} */
export const ${vr.fieldName.replace(/[^a-zA-Z0-9]/g, '')}Validator = z.${vr.dataType === 'number' ? 'number()' : 'string()'}.${vr.constraintExpression.includes('min') ? 'min(1)' : 'nonempty()'};`).join('\n');

    const f6Content = [
      `import { z } from 'zod';`,
      ``,
      `/**`,
      ` * OneSpec Autonomous Remediation: Gap Audit DTO Contracts`,
      ` * Enforces input constraints discovered during DOM and AST scanning.`,
      ` */`,
      validationCode.trim(),
      ``,
    ].join('\n');

    items.push({
      id: 'REM-GAP-VALIDATION',
      sourceCategory: 'GAP_AUDIT',
      title: 'Domain DTO Contract & Missing Validation Guard Assertions',
      targetFile: 'src/validators/inputContracts.ts',
      cweMapping: 'CWE-20: Improper Input Validation',
      severity: 'MEDIUM',
      remediationSummary: 'Prevents empty or malformed inputs before reaching database transaction layer.',
      diffSnippet: SelfHealingPatchService.createUnifiedNewFileDiff(
        'src/validators/inputContracts.ts',
        f6Content
      ),
      provenance: 'SIMULATED',
      isIllustrativeOnly: true,
    });

    return items;
  }
}

export const selfHealingPatchService = SelfHealingPatchService.getInstance();
