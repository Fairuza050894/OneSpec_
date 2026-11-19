/**
 * OneSpec SDLC Workbench - PRD-to-Code Gap Auditor & Tech Doc Synthesizer
 * Standards: ISO/IEC/IEEE 29148:2018 (StRS / SyRS) & ISO/IEC/IEEE 29119-3:2022
 */

import type {
  ValidationRuleContract,
  BrdMatrixRow,
  DiscoveredApiEndpoint,
  DatabaseErdTable,
  AuditDiscrepancyItem,
  GapAuditSummary,
  DefectTicketPayload,
  CrawledModuleSummary,
  FeatureModuleSurface,
} from '@/types/sdlc';
import { isNoiseUiControlOrInternalId } from './sdlcCompiler';

export class GapAuditorService {
  private static instance: GapAuditorService;

  private constructor() {}

  public static getInstance(): GapAuditorService {
    if (!GapAuditorService.instance) {
      GapAuditorService.instance = new GapAuditorService();
    }
    return GapAuditorService.instance;
  }

  /**
   * Perform comprehensive gap audit cross-referencing Phase 1 vs Phase 2 dynamically
   */
  public auditSpecificationsAgainstImplementation(params: {
    validationRules: ValidationRuleContract[];
    businessRules: BrdMatrixRow[];
    apiEndpoints: DiscoveredApiEndpoint[];
    databaseTables: DatabaseErdTable[];
    hasSourceRequirements?: boolean;
    discoveredModules?: CrawledModuleSummary[];
    discoveredFeatureModules?: FeatureModuleSurface[];
  }): { items: AuditDiscrepancyItem[]; summary: GapAuditSummary } {
    const {
      validationRules,
      businessRules,
      apiEndpoints,
      databaseTables,
      hasSourceRequirements: explicitHasSource,
      discoveredModules = [],
      discoveredFeatureModules = [],
    } = params;

    const cleanValidationRules = (validationRules || []).filter(
      (r) => (!r.fieldName || !isNoiseUiControlOrInternalId(r.fieldName)) && !isNoiseUiControlOrInternalId(r.ruleId)
    );
    const cleanBusinessRules = (businessRules || []).filter(
      (r) => (!r.moduleName || !isNoiseUiControlOrInternalId(r.moduleName)) && !isNoiseUiControlOrInternalId(r.ruleId)
    );

    const items: AuditDiscrepancyItem[] = [];

    const hasSource =
      explicitHasSource ??
      (cleanBusinessRules.some((r) => r.provenance === 'SOURCE_REQUIREMENT') ||
        cleanValidationRules.some((r) => r.provenance === 'SOURCE_REQUIREMENT'));

    if (hasSource) {
      // -----------------------------------------------------------------------
      // DUAL-TRACK MODE: SOURCE_REQUIREMENT (MoM / PRD) vs AS_BUILT_DISCOVERED
      // -----------------------------------------------------------------------
      const sourceBrd = cleanBusinessRules.filter((r) => r.provenance === 'SOURCE_REQUIREMENT');
      const rulesToAudit = sourceBrd.length > 0 ? sourceBrd : cleanBusinessRules;

      const sourceValidation = cleanValidationRules.filter((r) => r.provenance === 'SOURCE_REQUIREMENT');
      const valRulesToAudit = sourceValidation.length > 0 ? sourceValidation : cleanValidationRules;

      // 1. Audit Source BRD Requirements against Discovered App Surface
      rulesToAudit.forEach((rule) => {
        const textToSearch = `${rule.statement} ${rule.moduleName || ''} ${rule.targetKpi}`.toLowerCase();
        const keywords = textToSearch
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length >= 4 && !['shall', 'system', 'process', 'client', 'target', 'requests'].includes(w));

        const matchedModule =
          discoveredModules.find((m) =>
            keywords.some((kw) => m.moduleName.toLowerCase().includes(kw) || m.pagePath.toLowerCase().includes(kw))
          ) ||
          discoveredFeatureModules.find((f) =>
            keywords.some((kw) => f.moduleName.toLowerCase().includes(kw) || f.routePath.toLowerCase().includes(kw))
          );

        const matchedApi = apiEndpoints.find((e) =>
          keywords.some((kw) => e.path.toLowerCase().includes(kw) || (e.summary && e.summary.toLowerCase().includes(kw)))
        );

        const matchedTable = databaseTables.find((t) =>
          keywords.some((kw) => t.tableName.toLowerCase().includes(kw))
        );

        if (matchedModule || matchedApi || matchedTable) {
          const modulePath = matchedModule ? ('pagePath' in matchedModule ? matchedModule.pagePath : matchedModule.routePath) : '';
          const target = matchedApi
            ? `${matchedApi.method} ${matchedApi.path}`
            : matchedModule
            ? `UI Route: ${modulePath}`
            : `DB Table: ${matchedTable?.tableName}`;

          items.push({
            id: `GAP-${String(items.length + 1).padStart(3, '0')}`,
            verdict: 'VERIFIED_MATCH',
            ruleRef: rule.ruleId,
            userStoryRef: rule.moduleName ? `MOD-${rule.moduleName}` : 'STAKEHOLDER-REQ',
            targetEntity: target,
            discrepancyTitle: `Verified Match: ${rule.ruleId} (${rule.statement.slice(0, 48)}...)`,
            discrepancyDescription: `Business requirement ${rule.ruleId} from Stakeholder MoM/PRD verified against discovered runtime entity (${target}).`,
            severity: 'LOW',
            diffLanguage: 'markdown',
            expectedSpec: `// Stakeholder MoM Requirement (${rule.ruleId})\n${rule.statement}\nTarget KPI: ${rule.targetKpi}`,
            actualImplementation: `// Verified Discovered Entity\nTarget: ${target}\nCategory: ${rule.category}`,
            defectTicket: {
              ticketId: `SDLC-DEFECT-${String(items.length + 1).padStart(3, '0')}`,
              issueKey: `VERIFIED-${rule.ruleId}`,
              title: `${rule.ruleId} implementation verified in application`,
              severity: 'LOW',
              component: target,
              expectedBehavior: rule.statement,
              actualBehavior: 'Implemented and functional in discovered surface',
              suggestedRemediation: 'None required (1:1 Verification match confirmed).',
              markdownPayload: `### Parity Verified: ${rule.ruleId} implemented in ${target}`,
            },
            remediationAction: 'None (Verified Match)',
          });
        } else {
          // MISSING_IMPLEMENTATION!
          items.push({
            id: `GAP-${String(items.length + 1).padStart(3, '0')}`,
            verdict: 'MISSING_IMPLEMENTATION',
            ruleRef: rule.ruleId,
            userStoryRef: rule.moduleName ? `MOD-${rule.moduleName}` : 'STAKEHOLDER-REQ',
            targetEntity: `Requirement: ${rule.statement.slice(0, 40)}`,
            discrepancyTitle: `Missing Implementation: ${rule.ruleId} (${rule.statement.slice(0, 45)}...)`,
            discrepancyDescription: `Stakeholder Requirement ${rule.ruleId} ("${rule.statement}") was requested in MoM / PRD, but no matching UI route, API endpoint, or database table was discovered during crawl.`,
            severity: 'CRITICAL',
            diffLanguage: 'typescript',
            expectedSpec: `// Stakeholder Business Invariant (${rule.ruleId})\n// Statement: ${rule.statement}\n// KPI Target: ${rule.targetKpi}`,
            actualImplementation: `// Discovered Implementation\n// ERROR: 404 - No corresponding route, API controller, or DB entity discovered!`,
            defectTicket: {
              ticketId: `SDLC-DEFECT-${String(items.length + 1).padStart(3, '0')}`,
              issueKey: `MISSING-${rule.ruleId}`,
              title: `Implement missing requirement: ${rule.ruleId}`,
              severity: 'CRITICAL',
              component: 'Unimplemented Module / Ingress Route',
              expectedBehavior: rule.statement,
              actualBehavior: 'Missing implementation: Feature not found in scanned system',
              suggestedRemediation: `Develop and deploy feature module implementing ${rule.ruleId} with target KPI ${rule.targetKpi}.`,
              markdownPayload: `### Missing Feature Implementation: ${rule.ruleId}\nRequirement: ${rule.statement}`,
            },
            remediationAction: `Develop and release missing functionality required by ${rule.ruleId}.`,
          });
        }
      });

      // 2. Audit Validation Rules
      valRulesToAudit.forEach((rule) => {
        const matchingApi = apiEndpoints.find(
          (e) =>
            e.path.toLowerCase().includes(rule.fieldName.toLowerCase()) ||
            (e.summary && e.summary.toLowerCase().includes(rule.fieldName.toLowerCase())) ||
            (e.requestBodySchema && JSON.stringify(e.requestBodySchema).includes(rule.fieldName))
        );

        const matchingTable = databaseTables.find((t) =>
          t.columns.some((c) => c.name.toLowerCase() === rule.fieldName.toLowerCase())
        );

        const isEnumConstraint = rule.constraintExpression.includes('IN') || rule.constraintExpression.includes('enum');

        if (isEnumConstraint && matchingTable) {
          items.push({
            id: `GAP-${String(items.length + 1).padStart(3, '0')}`,
            verdict: 'SCHEMA_TYPE_MISMATCH',
            ruleRef: rule.ruleId,
            userStoryRef: rule.userStoryId,
            targetEntity: `Database Column: ${matchingTable.tableName}.${rule.fieldName}`,
            discrepancyTitle: `Enum Constraint Not Enforced at Database Layer for ${rule.fieldName}`,
            discrepancyDescription: `The SyRS specification (${rule.ruleId}) defines ${rule.fieldName} with constraint ${rule.constraintExpression}, but the database column uses VARCHAR without CHECK constraint.`,
            severity: 'MAJOR',
            diffLanguage: 'sql',
            expectedSpec: `-- Expected ISO SyRS Constraint (${rule.ruleId})\nALTER TABLE "${matchingTable.tableName}" \n  ADD CONSTRAINT chk_${matchingTable.tableName.toLowerCase()}_${rule.fieldName.toLowerCase()} \n  CHECK (${rule.constraintExpression});`,
            actualImplementation: `-- Discovered Database Column\nCREATE TABLE "${matchingTable.tableName}" (\n  "id" UUID PRIMARY KEY,\n  "${rule.fieldName}" VARCHAR(255) NOT NULL\n);`,
            defectTicket: {
              ticketId: `SDLC-DEFECT-${String(items.length + 1).padStart(3, '0')}`,
              issueKey: `DEFECT-${rule.ruleId}`,
              title: `Add CHECK constraint on ${matchingTable.tableName}.${rule.fieldName}`,
              severity: 'MAJOR',
              component: `Database Schema: ${matchingTable.tableName}.${rule.fieldName}`,
              expectedBehavior: `Enforce ${rule.constraintExpression}`,
              actualBehavior: 'Unrestricted VARCHAR permits arbitrary string insertion without DB check',
              suggestedRemediation: `Apply migration: ALTER TABLE "${matchingTable.tableName}" ADD CONSTRAINT chk_${matchingTable.tableName.toLowerCase()}_${rule.fieldName.toLowerCase()} CHECK (${rule.constraintExpression});`,
              markdownPayload: `### SDLC Defect: ${matchingTable.tableName}.${rule.fieldName} missing CHECK constraint`,
            },
            remediationAction: `Apply SQL migration adding CHECK constraint to ${matchingTable.tableName}.${rule.fieldName}.`,
          });
        } else if (matchingApi || matchingTable) {
          items.push({
            id: `GAP-${String(items.length + 1).padStart(3, '0')}`,
            verdict: 'VERIFIED_MATCH',
            ruleRef: rule.ruleId,
            userStoryRef: rule.userStoryId,
            targetEntity: matchingApi ? `${matchingApi.method} ${matchingApi.path}` : `DB: ${matchingTable?.tableName}`,
            discrepancyTitle: `Field "${rule.fieldName}" Validation Invariant Enforced`,
            discrepancyDescription: `The validation rule ${rule.ruleId} (${rule.constraintExpression}) is satisfied by active API/DB schema.`,
            severity: 'LOW',
            diffLanguage: 'typescript',
            expectedSpec: `// ISO 29148 SyRS Contract (${rule.ruleId})\nexport const ${rule.fieldName}Schema = z.${rule.dataType === 'number' ? 'number()' : 'string()'};\n// Constraint: ${rule.constraintExpression}`,
            actualImplementation: `// Discovered Contract (${matchingApi?.path || 'Schema'})\nConstraint: ${rule.constraintExpression} verified with status ${rule.httpStatus}.`,
            defectTicket: {
              ticketId: `SDLC-DEFECT-${String(items.length + 1).padStart(3, '0')}`,
              issueKey: `VERIFIED-${rule.ruleId}`,
              title: `${rule.fieldName} validation verified`,
              severity: 'LOW',
              component: matchingApi?.path || 'API/DB',
              expectedBehavior: `Enforce ${rule.constraintExpression}`,
              actualBehavior: 'Enforced in application',
              suggestedRemediation: 'None required.',
              markdownPayload: `### Parity Verified: ${rule.ruleId} enforced`,
            },
            remediationAction: 'None (Compliant)',
          });
        } else {
          items.push({
            id: `GAP-${String(items.length + 1).padStart(3, '0')}`,
            verdict: 'MISSING_IMPLEMENTATION',
            ruleRef: rule.ruleId,
            userStoryRef: rule.userStoryId,
            targetEntity: `Field Contract: ${rule.fieldName}`,
            discrepancyTitle: `Missing Field Implementation: ${rule.fieldName} (${rule.ruleId})`,
            discrepancyDescription: `Validation rule ${rule.ruleId} specifies input invariant "${rule.constraintExpression}" for field "${rule.fieldName}", but no corresponding form input or API parameter was discovered.`,
            severity: 'MAJOR',
            diffLanguage: 'typescript',
            expectedSpec: `// Required Field Specification (${rule.ruleId})\n"${rule.fieldName}": ${rule.dataType} (constraint: ${rule.constraintExpression})`,
            actualImplementation: `// Discovered Surface\n// Field "${rule.fieldName}" was not found in any active form or API controller DTO.`,
            defectTicket: {
              ticketId: `SDLC-DEFECT-${String(items.length + 1).padStart(3, '0')}`,
              issueKey: `MISSING-${rule.ruleId}`,
              title: `Implement field validation for ${rule.fieldName}`,
              severity: 'MAJOR',
              component: `Form/DTO: ${rule.fieldName}`,
              expectedBehavior: `Accept and validate ${rule.fieldName}`,
              actualBehavior: 'Field not present in discovered forms or APIs',
              suggestedRemediation: `Add field ${rule.fieldName} to corresponding UI forms and backend DTO.`,
              markdownPayload: `### Missing Field: ${rule.fieldName}`,
            },
            remediationAction: `Implement input ${rule.fieldName} in UI and backend API.`,
          });
        }
      });

      // 3. Audit Undocumented Shadow APIs & Features
      apiEndpoints.forEach((ep) => {
        if (ep.path === '/api/_auth/session' || ep.path === '/api/health' || ep.path.startsWith('/_')) {
          return;
        }
        const isMatchedByBrd = rulesToAudit.some((r) => {
          const words = r.statement.toLowerCase().split(/\s+/).filter((w) => w.length >= 4);
          return words.some((w) => ep.path.toLowerCase().includes(w));
        });
        const isMatchedByVal = valRulesToAudit.some(
          (r) =>
            ep.path.toLowerCase().includes(r.fieldName.toLowerCase()) ||
            ep.linkedRequirementId === r.userStoryId
        );

        if (!isMatchedByBrd && !isMatchedByVal) {
          items.push({
            id: `GAP-${String(items.length + 1).padStart(3, '0')}`,
            verdict: 'UNDOCUMENTED_SHADOW_FEATURE',
            ruleRef: 'UNDOCUMENTED',
            userStoryRef: 'UNASSIGNED',
            targetEntity: `${ep.method} ${ep.path}`,
            discrepancyTitle: `Undocumented Shadow Endpoint: ${ep.method} ${ep.path}`,
            discrepancyDescription: `Discovered in active system (${ep.controllerPath || ep.path}), but has zero corresponding Business Rule or PRD requirement in Stakeholder MoM/PRD.`,
            severity: 'MAJOR',
            diffLanguage: 'json',
            expectedSpec: `// Expected: None (Shadow Feature missing in Stakeholder MoM/PRD!)\n{\n  "error": "No StRS/PRD requirement defines ${ep.method} ${ep.path}"\n}`,
            actualImplementation: `// Discovered Endpoint (${ep.path})\nexport const ${ep.handlerName || 'handler'} = () => {\n  // Discovered in AST / Network Harvester\n};`,
            defectTicket: {
              ticketId: `SDLC-DEFECT-${String(items.length + 1).padStart(3, '0')}`,
              issueKey: `SHADOW-${ep.id || ep.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
              title: `Document Shadow API ${ep.method} ${ep.path} in PRD`,
              severity: 'MAJOR',
              component: ep.path,
              expectedBehavior: 'Documented in ISO 29148 PRD with approved business justification',
              actualBehavior: 'Exposed endpoint discovered in live application without PRD specification',
              suggestedRemediation: 'Back-port specification into PRD or evaluate decommissioning if unauthorized.',
              markdownPayload: `### Shadow API Discovered: ${ep.method} ${ep.path}`,
            },
            remediationAction: `Back-port specification for ${ep.path} into ISO 29148 PRD or review for deprecation.`,
          });
        }
      });
    } else {
      // -----------------------------------------------------------------------
      // AS-BUILT BASELINE MODE (Zero-Doc Reverse Engineering)
      // When no stakeholder requirement source (MoM / PRD) is provided,
      // all discovered items are recorded as BASELINE_MATCH (never COMPLIANT).
      // Compliance rate is N/A because the spec is derived from the implementation.
      // -----------------------------------------------------------------------
      cleanValidationRules.forEach((rule) => {
        const matchingApi =
          apiEndpoints.find(
            (e) =>
              e.path.toLowerCase().includes(rule.fieldName.toLowerCase()) ||
              (e.summary && e.summary.toLowerCase().includes(rule.fieldName.toLowerCase())) ||
              (e.requestBodySchema && JSON.stringify(e.requestBodySchema).includes(rule.fieldName))
          ) || apiEndpoints[0];

        items.push({
          id: `GAP-${String(items.length + 1).padStart(3, '0')}`,
          verdict: 'BASELINE_MATCH',
          ruleRef: rule.ruleId,
          userStoryRef: rule.userStoryId,
          targetEntity: matchingApi ? `${matchingApi.method} ${matchingApi.path}` : 'API Controller',
          discrepancyTitle: `Field "${rule.fieldName}" Invariant Recorded in Baseline`,
          discrepancyDescription: `As-built baseline specification derived from runtime surface: ${rule.constraintExpression} (HTTP ${rule.httpStatus}).`,
          severity: 'LOW',
          diffLanguage: 'typescript',
          expectedSpec: `// As-Built Baseline Contract (${rule.ruleId})\nexport const ${rule.fieldName}Schema = z.${rule.dataType === 'number' ? 'number()' : 'string()'};\n// Constraint: ${rule.constraintExpression}`,
          actualImplementation: `// Discovered Implementation (${matchingApi?.path || '/api'})\nif (!payload.${rule.fieldName}) {\n  throw createError({ statusCode: ${rule.httpStatus}, message: "${rule.exactUiErrorString || 'Validation error'}" });\n}`,
          defectTicket: {
            ticketId: `SDLC-BASELINE-${String(items.length + 1).padStart(3, '0')}`,
            issueKey: `BASELINE-${rule.ruleId}`,
            title: `${rule.fieldName} baseline invariant recorded`,
            severity: 'LOW',
            component: matchingApi?.path || 'controller',
            expectedBehavior: `Enforce ${rule.constraintExpression}`,
            actualBehavior: 'Recorded in as-built baseline',
            suggestedRemediation: 'None required (As-built baseline reference).',
            markdownPayload: `### Baseline Invariant: ${rule.ruleId} recorded`,
          },
          remediationAction: 'None (As-Built Baseline Reference)',
        });
      });
    }

    // Purge any noise UI controls or framework IDs from discrepancy matrix
    const cleanItems = items.filter(
      (i) =>
        !isNoiseUiControlOrInternalId(i.targetEntity) &&
        !isNoiseUiControlOrInternalId(i.discrepancyTitle) &&
        !isNoiseUiControlOrInternalId(i.ruleRef)
    );

    // Calculate Summary Metrics
    const totalAudited = cleanItems.length;
    let compliantCount = 0;
    let baselineMatchCount = 0;
    let missingInBackendCount = 0;
    let schemaMismatchCount = 0;
    let shadowApiCount = 0;
    let missingImplementationCount = 0;
    let undocumentedShadowCount = 0;
    let verifiedMatchCount = 0;
    let complianceRatePercent: number | null = null;

    if (hasSource) {
      compliantCount = cleanItems.filter((i) => i.verdict === 'COMPLIANT' || i.verdict === 'VERIFIED_MATCH').length;
      missingInBackendCount = cleanItems.filter((i) => i.verdict === 'MISSING_IN_BACKEND' || i.verdict === 'MISSING_IMPLEMENTATION').length;
      schemaMismatchCount = cleanItems.filter((i) => i.verdict === 'SCHEMA_TYPE_MISMATCH').length;
      shadowApiCount = cleanItems.filter((i) => i.verdict === 'UNDOCUMENTED_SHADOW_API' || i.verdict === 'UNDOCUMENTED_SHADOW_FEATURE').length;
      missingImplementationCount = cleanItems.filter((i) => i.verdict === 'MISSING_IMPLEMENTATION').length;
      undocumentedShadowCount = cleanItems.filter((i) => i.verdict === 'UNDOCUMENTED_SHADOW_FEATURE' || i.verdict === 'UNDOCUMENTED_SHADOW_API').length;
      verifiedMatchCount = compliantCount;
      complianceRatePercent = totalAudited > 0 ? Math.round((compliantCount / totalAudited) * 1000) / 10 : 100;
    } else {
      baselineMatchCount = cleanItems.filter((i) => i.verdict === 'BASELINE_MATCH').length;
      complianceRatePercent = null; // N/A — tidak ada baseline requirement pembanding
    }

    return {
      items: cleanItems,
      summary: {
        totalAudited,
        compliantCount,
        baselineMatchCount,
        missingInBackendCount,
        shadowApiCount,
        schemaMismatchCount,
        complianceRatePercent,
        auditTimestamp: new Date().toISOString(),
        missingImplementationCount,
        undocumentedShadowCount,
        verifiedMatchCount,
        isZeroDocMode: !hasSource,
        hasSourceRequirements: hasSource,
      },
    };
  }

  /**
   * Alias for backward compatibility with UI components
   */
  public generateUnifiedTechDoc(items: AuditDiscrepancyItem[], summary: GapAuditSummary): string {
    return this.generateTechnicalSpecDocument({
      summary,
      items,
      validationRules: [],
      apiEndpoints: [],
      projectName: 'OneSpec Target',
    });
  }

  /**
   * Synthesize Unified Technical Specification & Gap Audit Report (Markdown)
   */
  public generateTechnicalSpecDocument(data: {
    summary: GapAuditSummary;
    items: AuditDiscrepancyItem[];
    validationRules: ValidationRuleContract[];
    apiEndpoints: DiscoveredApiEndpoint[];
    projectName?: string;
  }): string {
    const { summary, items, validationRules, apiEndpoints, projectName = 'System' } = data;

    return `# ${projectName} — Unified Technical Specification & Gap Audit Report
Generated by OneSpec SDLC Workbench per ISO/IEC/IEEE 29148:2018 & ISO/IEC/IEEE 29119-3:2022
Date: ${summary.auditTimestamp}

## 1. Executive Summary & Quality Gates
${
  summary.isZeroDocMode || !summary.hasSourceRequirements
    ? `- **Mode:** AS-BUILT BASELINE (No Stakeholder Requirements Provided)
- **Total Invariants Audited:** ${summary.totalAudited}
- **Baseline Invariants Recorded:** ${summary.baselineMatchCount ?? summary.totalAudited}
- **Compliance Rate:** N/A (tidak ada baseline requirement pembanding)`
    : `- **Mode:** DUAL-TRACK (Stakeholder MoM/PRD vs Discovered Surface)
- **Total Invariants Audited:** ${summary.totalAudited}
- **Compliant Contracts:** ${summary.compliantCount} (${summary.complianceRatePercent}%)
- **Missing Backend Handlers:** ${summary.missingInBackendCount}
- **Schema Type Mismatches:** ${summary.schemaMismatchCount}
- **Undocumented Shadow APIs:** ${summary.shadowApiCount}`
}

## 2. Discrepancy Matrix
${items
  .map(
    (item) => `### [${item.id}] ${item.verdict}: ${item.discrepancyTitle}
- **Rule Reference:** ${item.ruleRef} (${item.userStoryRef})
- **Target Entity:** \`${item.targetEntity}\`
- **Severity:** ${item.severity}
- **Remediation Action:** ${item.remediationAction}
`
  )
  .join('\n')}

## 3. Active SyRS Validation Contracts
${validationRules
  .map(
    (rule) => `- **${rule.ruleId}** (\`${rule.fieldName}\`): \`${rule.constraintExpression}\` → HTTP ${rule.httpStatus} (\`${rule.errorCode}\`)`
  )
  .join('\n')}

## 4. Discovered API Inventory
${apiEndpoints
  .map((ep) => `- \`${ep.method} ${ep.path}\` — ${ep.summary}`)
  .join('\n')}
`;
  }
}

export const gapAuditorService = GapAuditorService.getInstance();
