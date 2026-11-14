/**
 * OneSpec SDLC Workbench - Reverse Data Flow Diagram (DFD Level 0/1/2) Engine
 * Standards:
 * - IEEE Std 1016-2009 (Standard for Information Technology - Systems Design - Software Design Descriptions)
 * - ISO/IEC 19510 / Gane-Sarson & Yourdon Data Flow Diagram Notation
 * - UU PDP No. 27/2022 Pasal 35 (Data Transfer & Sensitive PII Egress Audit)
 */

import type {
  DiscoveredApiEndpoint,
  DatabaseErdTable,
  ValidationRuleContract,
  BrdMatrixRow,
  CrawledModuleSummary,
} from '@/types/sdlc';
export type DfdLevel = 'LEVEL_0' | 'LEVEL_1' | 'LEVEL_2';
export type DfdNodeType = 'EXTERNAL_ENTITY' | 'PROCESS' | 'DATA_STORE';
export type PiiClassification = 'PII_CRITICAL' | 'PII_STANDARD' | 'OPERATIONAL';

export interface DfdNode {
  id: string; // e.g. ENT-01, PROC-1.0, DS-01
  name: string;
  type: DfdNodeType;
  level: DfdLevel;
  description: string;
  systemOwner?: string;
  piiFlag?: boolean;
}

export interface DfdDataFlow {
  id: string; // e.g. FLOW-01
  fromNodeId: string;
  toNodeId: string;
  dataLabel: string;
  dataAttributes: string[];
  piiClassification: PiiClassification;
  isEncrypted: boolean;
  protocol: string;
}

export interface DfdModelLevel {
  level: DfdLevel;
  title: string;
  description: string;
  nodes: DfdNode[];
  flows: DfdDataFlow[];
}

export interface ReverseDfdResult {
  level0: DfdModelLevel;
  level1: DfdModelLevel;
  level2: DfdModelLevel;
  totalProcesses: number;
  totalDataStores: number;
  totalExternalEntities: number;
  piiFlowsCount: number;
  generatedAt: string;
}

export interface ReverseDfdParams {
  appName?: string;
  targetUrl: string;
  apiEndpoints: DiscoveredApiEndpoint[];
  databaseTables: DatabaseErdTable[];
  validationRules: ValidationRuleContract[];
  businessRules: BrdMatrixRow[];
  discoveredModules?: CrawledModuleSummary[];
}

export class DfdReverseService {
  private static instance: DfdReverseService;

  private constructor() {}

  public static getInstance(): DfdReverseService {
    if (!DfdReverseService.instance) {
      DfdReverseService.instance = new DfdReverseService();
    }
    return DfdReverseService.instance;
  }

  /**
   * Helper to categorize data attributes into PII classifications
   */
  public classifyPii(attrs: string[]): PiiClassification {
    const criticalRegex = /nik|ktp|password|secret|credit|card|cvv|token/i;
    const standardRegex = /email|phone|name|address|gender|dob|birth/i;

    if (attrs.some((a) => criticalRegex.test(a))) return 'PII_CRITICAL';
    if (attrs.some((a) => standardRegex.test(a))) return 'PII_STANDARD';
    return 'OPERATIONAL';
  }

  /**
   * Synthesize DFD Level 0, Level 1, and Level 2 from active codebase artifacts
   */
  public generateReverseDfd(params: ReverseDfdParams): ReverseDfdResult {
    const {
      appName = 'Active Application',
      targetUrl,
      apiEndpoints,
      databaseTables,
      validationRules,
      businessRules,
      discoveredModules = [],
    } = params;
    const isHttps = targetUrl.startsWith('https://') || targetUrl.includes('localhost');
    const inputFields = validationRules.map((v) => v.fieldName);
    const primaryTable = databaseTables[0]?.tableName || 'Records';
    const primaryEp = apiEndpoints[0]?.path || '/api/v1/transaction';

    // Collect all table columns to identify PII data stores
    const piiColumns = databaseTables.flatMap((t) =>
      t.columns
        .filter((c) => /nik|ktp|email|phone|password|secret|credit/i.test(c.name))
        .map((c) => ({ table: t.tableName, col: c.name }))
    );

    // =========================================================================
    // 1. DFD LEVEL 0: CONTEXT DIAGRAM (Single Black-Box Bubble)
    // =========================================================================
    const l0Nodes: DfdNode[] = [
      {
        id: 'ENT-USER',
        name: 'Client / End User',
        type: 'EXTERNAL_ENTITY',
        level: 'LEVEL_0',
        description: 'Authorized client browser, mobile app, or external tenant actor.',
      },
      {
        id: 'PROC-0.0',
        name: `${appName} System (Black-Box)`,
        type: 'PROCESS',
        level: 'LEVEL_0',
        description: `Complete monolithic or microservice boundary hosted on ${targetUrl} (Ingress: ${primaryEp}).`,
        systemOwner: 'Core Platform Engineering',
      },
      {
        id: 'ENT-GATEWAY',
        name: 'Third-Party Egress Gateway',
        type: 'EXTERNAL_ENTITY',
        level: 'LEVEL_0',
        description: 'External payment processor, SMS gateway, or regulatory reporting endpoint.',
      },
    ];

    const l0Flows: DfdDataFlow[] = [
      {
        id: 'FLOW-L0-1',
        fromNodeId: 'ENT-USER',
        toNodeId: 'PROC-0.0',
        dataLabel: 'User Credentials & Ingress Payload',
        dataAttributes: inputFields.length > 0 ? inputFields : ['username', 'payload'],
        piiClassification: this.classifyPii(inputFields),
        isEncrypted: isHttps,
        protocol: isHttps ? 'HTTPS/REST (TLS 1.3)' : 'HTTP/1.1 (Unencrypted)',
      },
      {
        id: 'FLOW-L0-2',
        fromNodeId: 'PROC-0.0',
        toNodeId: 'ENT-USER',
        dataLabel: 'Transaction Status & Presentation View',
        dataAttributes: ['status', 'message', 'token', 'timestamp'],
        piiClassification: 'OPERATIONAL',
        isEncrypted: isHttps,
        protocol: isHttps ? 'HTTPS/JSON' : 'HTTP/JSON',
      },
      {
        id: 'FLOW-L0-3',
        fromNodeId: 'PROC-0.0',
        toNodeId: 'ENT-GATEWAY',
        dataLabel: 'Dispatched Settlement & Audit Event',
        dataAttributes: ['transactionId', 'amount', 'auditDigest'],
        piiClassification: 'OPERATIONAL',
        isEncrypted: true,
        protocol: 'HTTPS/mTLS',
      },
    ];

    // =========================================================================
    // 2. DFD LEVEL 1: PROCESS DECOMPOSITION
    // =========================================================================
    const l1Nodes: DfdNode[] = [
      {
        id: 'ENT-USER-L1',
        name: 'End User / Ingress Agent',
        type: 'EXTERNAL_ENTITY',
        level: 'LEVEL_1',
        description: 'Client issuing commands and data requests.',
      },
      {
        id: 'ENT-EXT-L1',
        name: 'External Settlement / Audit Partner',
        type: 'EXTERNAL_ENTITY',
        level: 'LEVEL_1',
        description: 'External downstream clearing or telemetry authority.',
      },
    ];
    const l1Flows: DfdDataFlow[] = [];

    if (discoveredModules.length > 1) {
      discoveredModules.forEach((mod, idx) => {
        const procId = `PROC-${idx + 1}.0`;
        const modFields = mod.inputs.map((i) => i.name).filter(Boolean);
        const modEp = mod.apis[0] ? `${mod.apis[0].method} ${mod.apis[0].path}` : mod.pagePath;
        l1Nodes.push({
          id: procId,
          name: `${idx + 1}.0: ${mod.moduleName}`,
          type: 'PROCESS',
          level: 'LEVEL_1',
          description: `Handles ${mod.pagePath} across ${mod.inputs.length} inputs and ${mod.apis.length} APIs (${modEp}).`,
          systemOwner: 'Module Controller',
        });
        l1Flows.push({
          id: `FLOW-L1-${l1Flows.length + 1}`,
          fromNodeId: 'ENT-USER-L1',
          toNodeId: procId,
          dataLabel: `${mod.moduleName} Input Payload`,
          dataAttributes: modFields.length > 0 ? modFields : ['sessionToken', 'queryParams'],
          piiClassification: this.classifyPii(modFields),
          isEncrypted: isHttps,
          protocol: isHttps ? 'HTTPS/REST' : 'HTTP/REST',
        });
      });

      databaseTables.forEach((tbl, tIdx) => {
        const dsId = `DS-${String(tIdx + 1).padStart(2, '0')}`;
        const colNames = tbl.columns.map((c) => c.name);
        l1Nodes.push({
          id: dsId,
          name: `D${tIdx + 1}: ${tbl.tableName}`,
          type: 'DATA_STORE',
          level: 'LEVEL_1',
          description: `Relational store with ${tbl.columns.length} columns (${colNames.join(', ')}).`,
          piiFlag: piiColumns.some((p) => p.table === tbl.tableName) || this.classifyPii(colNames) !== 'OPERATIONAL',
        });
        const targetProcId = `PROC-${(tIdx % discoveredModules.length) + 1}.0`;
        l1Flows.push({
          id: `FLOW-L1-${l1Flows.length + 1}`,
          fromNodeId: targetProcId,
          toNodeId: dsId,
          dataLabel: `ACID Persistence (${tbl.tableName})`,
          dataAttributes: colNames,
          piiClassification: this.classifyPii(colNames),
          isEncrypted: true,
          protocol: 'PostgreSQL/TCP',
        });
      });
    } else {
      l1Nodes.push(
        {
          id: 'PROC-1.0',
          name: '1.0: Ingress Authentication & Schema Validation',
          type: 'PROCESS',
          level: 'LEVEL_1',
          description: 'Verifies session tokens, validates input boundary constraints, and parses DTOs.',
          systemOwner: 'API Gateway Layer',
        },
        {
          id: 'PROC-2.0',
          name: '2.0: Core Business Logic & State Transition Engine',
          type: 'PROCESS',
          level: 'LEVEL_1',
          description: `Enforces business rules (${businessRules[0]?.ruleId || 'BR-01'}), calculations, and transaction invariants.`,
          systemOwner: 'Backend Application Service',
        },
        {
          id: 'PROC-3.0',
          name: '3.0: Outbound Settlement & Third-Party Egress',
          type: 'PROCESS',
          level: 'LEVEL_1',
          description: 'Dispatches finalized events, webhook notifications, and downstream payments.',
          systemOwner: 'Integration Worker',
        }
      );
      databaseTables.forEach((tbl, tIdx) => {
        const dsId = `DS-${String(tIdx + 1).padStart(2, '0')}`;
        l1Nodes.push({
          id: dsId,
          name: `D${tIdx + 1}: ${tbl.tableName} (Relational Storage)`,
          type: 'DATA_STORE',
          level: 'LEVEL_1',
          description: `Persistent relational database (${tbl.columns.map((c) => c.name).join(', ')}).`,
          piiFlag: piiColumns.some((p) => p.table === tbl.tableName),
        });
      });
      if (databaseTables.length === 0) {
        l1Nodes.push({
          id: 'DS-01',
          name: `D1: ${primaryTable} (Relational Storage)`,
          type: 'DATA_STORE',
          level: 'LEVEL_1',
          description: 'Persistent relational database storing entity state and audit timestamps.',
          piiFlag: piiColumns.some((p) => p.table === primaryTable),
        });
      }
      l1Flows.push(
        {
          id: 'FLOW-L1-1',
          fromNodeId: 'ENT-USER-L1',
          toNodeId: 'PROC-1.0',
          dataLabel: 'Raw Ingress Request',
          dataAttributes: inputFields,
          piiClassification: this.classifyPii(inputFields),
          isEncrypted: isHttps,
          protocol: 'HTTPS/REST',
        },
        {
          id: 'FLOW-L1-2',
          fromNodeId: 'PROC-1.0',
          toNodeId: 'PROC-2.0',
          dataLabel: 'Validated DTO Contract',
          dataAttributes: inputFields,
          piiClassification: this.classifyPii(inputFields),
          isEncrypted: true,
          protocol: 'In-Memory RPC',
        },
        {
          id: 'FLOW-L1-3',
          fromNodeId: 'PROC-2.0',
          toNodeId: 'DS-01',
          dataLabel: 'ACID State Mutation (INSERT/UPDATE)',
          dataAttributes: databaseTables[0]?.columns.map((c) => c.name) || ['id', 'status'],
          piiClassification: this.classifyPii(databaseTables[0]?.columns.map((c) => c.name) || []),
          isEncrypted: true,
          protocol: 'PostgreSQL/TCP',
        },
        {
          id: 'FLOW-L1-4',
          fromNodeId: 'PROC-2.0',
          toNodeId: 'PROC-3.0',
          dataLabel: 'Settlement Command Trigger',
          dataAttributes: ['transactionId', 'amount', 'recipient'],
          piiClassification: 'OPERATIONAL',
          isEncrypted: true,
          protocol: 'Internal Bus / Event',
        },
        {
          id: 'FLOW-L1-5',
          fromNodeId: 'PROC-3.0',
          toNodeId: 'ENT-EXT-L1',
          dataLabel: 'External Clearing Egress',
          dataAttributes: ['transactionRef', 'amount', 'signature'],
          piiClassification: 'OPERATIONAL',
          isEncrypted: true,
          protocol: 'HTTPS/mTLS',
        }
      );
    }
    // =========================================================================
    // 3. DFD LEVEL 2: DEEP STORAGE & PROCESS DECOMPOSITION
    // =========================================================================
    const l2Nodes: DfdNode[] = [
      {
        id: 'PROC-2.1',
        name: '2.1: Transaction Invariant Validation',
        type: 'PROCESS',
        level: 'LEVEL_2',
        description: 'Evaluates balance constraints, rate limits, and zero-exhaustion checks.',
        systemOwner: 'Core Logic Module',
      },
      {
        id: 'PROC-2.2',
        name: '2.2: Concurrency Lock & ACID Execution',
        type: 'PROCESS',
        level: 'LEVEL_2',
        description: 'Acquires row-level lock (SELECT FOR UPDATE) to prevent double-spending.',
        systemOwner: 'Database Transaction Manager',
      },
      {
        id: 'PROC-2.3',
        name: '2.3: PII Masking & Cryptographic Seal Generator',
        type: 'PROCESS',
        level: 'LEVEL_2',
        description: 'Encrypts NIK/Card columns before disk write per UU PDP Pasal 35.',
        systemOwner: 'Security Crypto Service',
      },
      {
        id: 'DS-TBL-MAIN',
        name: `D1.1: ${primaryTable} Table`,
        type: 'DATA_STORE',
        level: 'LEVEL_2',
        description: `Physical table with primary keys: ${databaseTables[0]?.primaryKeys.join(', ') || 'id'}.`,
        piiFlag: true,
      },
      {
        id: 'DS-TBL-SEC',
        name: `D1.2: ${databaseTables[1]?.tableName || 'TransactionAudit'} Table`,
        type: 'DATA_STORE',
        level: 'LEVEL_2',
        description: 'Secondary relation storing audit trace and external references.',
        piiFlag: false,
      },
    ];

    const l2Flows: DfdDataFlow[] = [
      {
        id: 'FLOW-L2-1',
        fromNodeId: 'PROC-2.1',
        toNodeId: 'PROC-2.2',
        dataLabel: 'Validated Operation Parameters',
        dataAttributes: ['userId', 'amount', 'timestamp'],
        piiClassification: 'OPERATIONAL',
        isEncrypted: true,
        protocol: 'In-Memory Call',
      },
      {
        id: 'FLOW-L2-2',
        fromNodeId: 'PROC-2.2',
        toNodeId: 'PROC-2.3',
        dataLabel: 'Raw Sensitive Payload',
        dataAttributes: inputFields.filter((f) => /nik|email|phone|card/i.test(f)).length > 0
          ? inputFields.filter((f) => /nik|email|phone|card/i.test(f))
          : ['userEmail', 'secretCode'],
        piiClassification: 'PII_CRITICAL',
        isEncrypted: true,
        protocol: 'Internal Pipe',
      },
      {
        id: 'FLOW-L2-3',
        fromNodeId: 'PROC-2.3',
        toNodeId: 'DS-TBL-MAIN',
        dataLabel: 'Encrypted Field Write (AES-256-GCM)',
        dataAttributes: ['cipherText', 'ivNonce', 'authTag'],
        piiClassification: 'PII_CRITICAL',
        isEncrypted: true,
        protocol: 'PostgreSQL Storage Engine',
      },
      {
        id: 'FLOW-L2-4',
        fromNodeId: 'PROC-2.2',
        toNodeId: 'DS-TBL-SEC',
        dataLabel: 'Append Ledger Audit Entry',
        dataAttributes: ['auditId', 'recordHash', 'createdAt'],
        piiClassification: 'OPERATIONAL',
        isEncrypted: true,
        protocol: 'PostgreSQL Storage Engine',
      },
    ];

    const allFlows = [...l0Flows, ...l1Flows, ...l2Flows];
    const piiFlowsCount = allFlows.filter((f) => f.piiClassification === 'PII_CRITICAL' || f.piiClassification === 'PII_STANDARD').length;

    return {
      level0: {
        level: 'LEVEL_0',
        title: 'DFD Level 0: Global Context Diagram (IEEE 1016)',
        description: 'Macroscopic boundary representation between external actors and the black-box system boundary.',
        nodes: l0Nodes,
        flows: l0Flows,
      },
      level1: {
        level: 'LEVEL_1',
        title: 'DFD Level 1: Subsystem Process Decomposition (Gane-Sarson)',
        description: 'Breakdown into core functional processes, physical data stores, and external settlement egress.',
        nodes: l1Nodes,
        flows: l1Flows,
      },
      level2: {
        level: 'LEVEL_2',
        title: 'DFD Level 2: Sub-Process Storage & Cryptographic Flow',
        description: 'Granular data transformation, concurrency lock acquisition, and column-level encryption flows.',
        nodes: l2Nodes,
        flows: l2Flows,
      },
      totalProcesses: l0Nodes.filter((n) => n.type === 'PROCESS').length + l1Nodes.filter((n) => n.type === 'PROCESS').length + l2Nodes.filter((n) => n.type === 'PROCESS').length,
      totalDataStores: l1Nodes.filter((n) => n.type === 'DATA_STORE').length + l2Nodes.filter((n) => n.type === 'DATA_STORE').length,
      totalExternalEntities: l0Nodes.filter((n) => n.type === 'EXTERNAL_ENTITY').length,
      piiFlowsCount,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates formal IEEE 1016 Data Design Markdown Documentation
   */
  public generateDfdDocumentation(appName: string, result: ReverseDfdResult): string {
    return `# ${appName} — IEEE Std 1016 Data Design & Gane-Sarson Data Flow Specification
**System Boundary:** \`${appName}\`
**Standards:** IEEE Std 1016-2009 (Software Design Description) & ISO/IEC 19510
**Audit Focus:** UU PDP No. 27/2022 Pasal 35 (Data Flow & Egress Integrity)
**Generated At:** ${result.generatedAt}

---

## 1. DFD Level 0: System Context Diagram
${result.level0.description}

### External Entities & Black-Box Processes
| Element ID | Type | Element Name | Responsibility / Description |
| :--- | :--- | :--- | :--- |
${result.level0.nodes.map((n) => `| \`${n.id}\` | **${n.type}** | ${n.name} | ${n.description} |`).join('\n')}

### Context Data Ingress & Egress Flows
| Flow ID | From $\to$ To | Data Label | Data Attributes | Protocol | PII Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
${result.level0.flows.map((f) => `| \`${f.id}\` | \`${f.fromNodeId}\` $\\to$ \`${f.toNodeId}\` | **${f.dataLabel}** | \`${f.dataAttributes.join(', ')}\` | \`${f.protocol}\` | \`${f.piiClassification}\` |`).join('\n')}

---

## 2. DFD Level 1: Subsystem Process Decomposition (Gane-Sarson)
${result.level1.description}

### Processes & Physical Data Stores
| Element ID | Type | Element Name | Subsystem Responsibility | Data Store PII Flag |
| :--- | :--- | :--- | :--- | :--- |
${result.level1.nodes.map((n) => `| \`${n.id}\` | **${n.type}** | ${n.name} | ${n.description} | \`${n.piiFlag ? 'PII_SENSITIVE' : 'NO_PII'}\` |`).join('\n')}

### Decomposed Data Transformations
| Flow ID | Source $\to$ Target | Data Attributes | Security Protocol | PII Sensitivity |
| :--- | :--- | :--- | :--- | :--- |
${result.level1.flows.map((f) => `| \`${f.id}\` | \`${f.fromNodeId}\` $\\to$ \`${f.toNodeId}\` | \`${f.dataAttributes.join(', ')}\` | \`${f.protocol}\` | \`${f.piiClassification}\` |`).join('\n')}

---

## 3. DFD Level 2: Sub-Process Storage & Cryptographic Invariance
${result.level2.description}

### Granular Process Nodes
| Process ID | Name | System Responsibility |
| :--- | :--- | :--- |
${result.level2.nodes.map((n) => `| \`${n.id}\` | **${n.name}** | ${n.description} |`).join('\n')}

### Storage & Egress Data Flows
| Flow ID | Path | Attributes | Protocol | Classification |
| :--- | :--- | :--- | :--- | :--- |
${result.level2.flows.map((f) => `| \`${f.id}\` | \`${f.fromNodeId}\` $\\to$ \`${f.toNodeId}\` | \`${f.dataAttributes.join(', ')}\` | \`${f.protocol}\` | \`${f.piiClassification}\` |`).join('\n')}

---
*Generated deterministically by OneSpec SDLC Studio compliant with IEEE 1016 & ISO/IEC 19510.*
`;
  }
}

export const dfdReverseService = DfdReverseService.getInstance();
