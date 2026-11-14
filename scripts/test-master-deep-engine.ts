import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { reaBridge } from '../src/services/reaBridge';
import { triModalDiscoveryService } from '../src/services/triModalDiscoveryService';
import { domainLogicBrainService } from '../src/services/domainLogicBrainService';
import { iso26514UserManualService } from '../src/services/iso26514UserManualService';
import type { FeatureModuleSurface, ValidationRuleContract, DatabaseErdTable } from '../src/types/sdlc';

console.log('🧪 Starting Master Deep-Engine Verification Test Suite...');

async function testReaBridgeAstExtractor() {
  console.log('\n--- Test 1: reaBridge Foreign Key & Backend Logic AST Extractor ---');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'onespec-test-ast-'));

  try {
    // 1. Prisma schema
    const prismaDir = path.join(tempDir, 'prisma');
    fs.mkdirSync(prismaDir, { recursive: true });
    fs.writeFileSync(
      path.join(prismaDir, 'schema.prisma'),
      `
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  posts Post[]
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
}
`
    );

    // 2. SQL schema
    const sqlDir = path.join(tempDir, 'sql');
    fs.mkdirSync(sqlDir, { recursive: true });
    fs.writeFileSync(
      path.join(sqlDir, 'schema.sql'),
      `
CREATE TABLE orders (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36),
  total_amount NUMERIC(12,2),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);
`
    );

    // 3. Drizzle ORM
    const drizzleDir = path.join(tempDir, 'src', 'db');
    fs.mkdirSync(drizzleDir, { recursive: true });
    fs.writeFileSync(
      path.join(drizzleDir, 'drizzle.ts'),
      `
export const shipments = pgTable('shipments', {
  id: uuid('id').primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  carrierCode: varchar('carrier_code', { length: 32 }).notNull(),
});
`
    );

    // 4. Backend formulas, Zod, and Transactions
    fs.writeFileSync(
      path.join(tempDir, 'src', 'orderService.ts'),
      `
import { z } from 'zod';

export const CreateOrderDto = z.object({
  quantity: z.number().min(1).max(100),
  promoCode: z.string().min(3).max(10),
  status: z.enum(['PENDING', 'PROCESSING', 'DELIVERED']),
});

export async function processOrder(subtotal: number, taxRate: number, discount: number) {
  const tax = subtotal * taxRate;
  const grandTotal = subtotal + tax - discount;

  await prisma.$transaction(async (tx) => {
    if (grandTotal < 0) {
      throw new Error('Grand total cannot be negative');
    }
  });

  return grandTotal;
}
`
    );

    const analysis = await reaBridge.performHeuristicAstScan(tempDir);

    // Assert Prisma FK
    const postSchema = analysis.databaseSchemas.find((s) => s.tableName === 'Post');
    assert(postSchema, 'Post table schema should be extracted from Prisma');
    const authorIdCol = postSchema.columns.find((c) => c.name === 'authorId');
    assert(authorIdCol, 'authorId column should exist in Post schema');
    assert.strictEqual(authorIdCol.isForeignKey, true, 'authorId should have isForeignKey === true');
    assert(authorIdCol.references, 'authorId should have references object');
    assert.strictEqual(authorIdCol.references?.table, 'User', 'authorId should reference User');
    assert.strictEqual(authorIdCol.references?.column, 'id', 'authorId should reference id');
    console.log('✅ 1.1 Prisma Foreign Key extraction verified');

    // Assert SQL FK
    const orderSchema = analysis.databaseSchemas.find((s) => s.tableName.toLowerCase() === 'orders');
    assert(orderSchema, 'orders table should be extracted from SQL');
    const customerIdCol = orderSchema.columns.find((c) => c.name.toLowerCase() === 'customer_id');
    assert(customerIdCol, 'customer_id column should exist in orders schema');
    assert.strictEqual(customerIdCol.isForeignKey, true, 'customer_id should have isForeignKey === true');
    assert.strictEqual(customerIdCol.references?.table, 'customers', 'customer_id should reference customers');
    console.log('✅ 1.2 SQL Foreign Key extraction verified');

    // Assert Drizzle FK
    const shipmentSchema = analysis.databaseSchemas.find((s) => s.tableName === 'shipments');
    assert(shipmentSchema, 'shipments table should be extracted from Drizzle');
    const orderIdCol = shipmentSchema.columns.find((c) => c.name === 'orderId' || c.name === 'order_id');
    assert(orderIdCol, 'orderId/order_id column should exist in shipments schema');
    assert.strictEqual(orderIdCol.isForeignKey, true, 'orderId should have isForeignKey === true');
    assert.strictEqual(orderIdCol.references?.table, 'orders', 'orderId should reference orders');
    console.log('✅ 1.3 Drizzle Foreign Key extraction verified');

    // Assert Zod bounds extraction
    const rules = analysis.extractedBackendRules || [];
    const qtyRule = rules.find((r) => r.fieldOrGuardName === 'quantity');
    assert(qtyRule, 'quantity Zod rule should be extracted');
    assert.strictEqual(qtyRule.minNumber, 1, 'quantity minNumber should be 1');
    assert.strictEqual(qtyRule.maxNumber, 100, 'quantity maxNumber should be 100');
    console.log('✅ 1.4 Zod min/max bounds extraction verified');

    // Assert Formula extraction
    const formulaRule = rules.find((r) => r.fieldOrGuardName === 'grandTotal' && r.ruleCategory === 'BACKEND_FORMULA_OR_TX');
    assert(formulaRule, 'grandTotal formula should be extracted');
    assert(formulaRule.constraintExpression.includes('subtotal + tax - discount'), 'formula expression should be preserved');
    console.log('✅ 1.5 Backend formula extraction verified');

    // Assert Transaction extraction
    const txRule = rules.find((r) => r.fieldOrGuardName === 'db_transaction_atomic');
    assert(txRule, 'prisma.$transaction boundary should be extracted');
    assert(txRule.sourceFile.includes('orderService.ts'), 'transaction sourceFile should be recorded');
    console.log('✅ 1.6 Database ACID transaction extraction verified');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function testDomainLogicBrainAndWhiteBoxScenarios() {
  console.log('\n--- Test 2: domainLogicBrainService White-Box & FK Test Cases ---');
  const dummyModule: FeatureModuleSurface = {
    moduleId: 'MOD-01',
    moduleName: 'Order Processing',
    routePath: '/orders',
    fullUrl: 'http://localhost:3000/orders',
    pageHeading: 'Order Management',
    hasDataTable: true,
    tableColumns: ['order_id', 'customer_id', 'total_amount'],
    sampleRowData: ['ORD-001', 'CUST-100', '150000'],
    hasSearchOrFilter: true,
    searchFilterSelectors: ['input[type="search"]'],
    formsAndModals: [],
    triggeredApis: [{ method: 'POST', path: '/api/orders', status: 201, latencyMs: 50 }],
    observedAnomalies: [],
  };

  const dummyRules: ValidationRuleContract[] = [
    {
      ruleId: 'VR-AST-01',
      userStoryId: 'REQ-US-01',
      fieldName: 'quantity',
      dataType: 'number',
      constraintExpression: 'z.number().min(1).max(100)',
      errorCode: 'ERR_ZOD_01',
      httpStatus: 422,
      exactUiErrorString: '[AST src/orderService.ts:6] quantity must satisfy z.number().min(1).max(100)',
      moduleName: 'Order Processing',
    },
  ];

  const dummyTables: DatabaseErdTable[] = [
    {
      id: 'orders',
      tableName: 'orders',
      primaryKeys: ['id'],
      columns: [
        { name: 'id', type: 'UUID', isPrimaryKey: true, isForeignKey: false, isNullable: false },
        {
          name: 'customer_id',
          type: 'UUID',
          isPrimaryKey: false,
          isForeignKey: true,
          isNullable: false,
          foreignKeyTarget: { table: 'customers', column: 'id' },
        },
      ],
    },
  ];

  const report = domainLogicBrainService.inferDomainIntelligence(dummyModule, {
    appName: 'TestApp',
    targetUrl: 'http://localhost:3000/orders',
    validationRules: dummyRules,
    databaseTables: dummyTables,
  });

  // Verify White-Box AST Scenario
  const whiteBoxSc = report.deepTestScenarios.find((s) => s.scenarioTitle.includes('[WHITE-BOX BACKEND LOGIC — VR-AST-01]'));
  assert(whiteBoxSc, 'White-box AST scenario should be generated');
  assert(whiteBoxSc.scenarioTitle.includes('quantity'), 'Scenario title should mention quantity');
  assert.strictEqual(whiteBoxSc.testData?.lowerViolationNMinus1, 0, 'Exact BVA boundary lowerViolation should be 0 (1-1)');
  assert.strictEqual(whiteBoxSc.testData?.exactLowerBoundN, 1, 'Exact BVA boundary lowerBound should be 1');
  assert.strictEqual(whiteBoxSc.testData?.upperViolationMPlus1, 101, 'Exact BVA boundary upperViolation should be 101 (100+1)');
  console.log('✅ 2.1 White-Box AST logic scenario with exact BVA bounds verified');

  // Verify DB FK Referential Integrity Scenario
  const fkSc = report.deepTestScenarios.find((s) => s.scenarioTitle.includes('[DB FOREIGN KEY INTEGRITY]'));
  assert(fkSc, 'Database FK Referential Integrity scenario should be generated');
  assert(fkSc.scenarioTitle.includes('orders.customer_id ➔ customers.id'), 'FK scenario should reference exact tables/columns');
  assert.strictEqual(fkSc.httpStatus, 422, 'FK violation should expect rejection');
  console.log('✅ 2.2 Database Foreign-Key Referential Integrity scenario verified');
}

async function testUserManualSection7() {
  console.log('\n--- Test 3: iso26514UserManualService Section 7 AST & FK Invariants ---');
  const dummyModule: FeatureModuleSurface = {
    moduleId: 'MOD-01',
    moduleName: 'Order Processing',
    routePath: '/orders',
    fullUrl: 'http://localhost:3000/orders',
    pageHeading: 'Order Management',
    hasDataTable: true,
    tableColumns: ['order_id'],
    sampleRowData: ['ORD-001'],
    hasSearchOrFilter: false,
    searchFilterSelectors: [],
    formsAndModals: [],
    triggeredApis: [],
    observedAnomalies: [],
  };

  const dummyRules: ValidationRuleContract[] = [
    {
      ruleId: 'VR-AST-01',
      userStoryId: 'REQ-US-01',
      fieldName: 'quantity',
      dataType: 'number',
      constraintExpression: 'z.number().min(1).max(100)',
      errorCode: 'ERR_ZOD_01',
      httpStatus: 422,
      exactUiErrorString: '[AST src/orderService.ts:6] quantity must satisfy z.number().min(1).max(100)',
    },
  ];

  const dummyTables: DatabaseErdTable[] = [
    {
      id: 'orders',
      tableName: 'orders',
      primaryKeys: ['id'],
      columns: [
        {
          name: 'customer_id',
          type: 'UUID',
          isPrimaryKey: false,
          isForeignKey: true,
          isNullable: false,
          foreignKeyTarget: { table: 'customers', column: 'id' },
        },
      ],
    },
  ];

  const manual = iso26514UserManualService.generateModuleManual(
    dummyModule,
    'TestApp',
    'id',
    null,
    dummyRules,
    dummyTables
  );

  const coreRules = manual.section7_BusinessLogicAndStateRules.coreBusinessRules;
  const astManualRule = coreRules.find((r) => r.ruleCode === 'VR-AST-01');
  assert(astManualRule, 'AST rule VR-AST-01 should be injected into Section 7');
  assert(astManualRule.ruleTitle.includes('[AST BACKEND VERIFIED]'), 'AST rule should carry [AST BACKEND VERIFIED] title');
  console.log('✅ 3.1 User Manual Section 7 AST verified rule injection verified');

  const fkManualRule = coreRules.find((r) => r.ruleCode === 'BR-FK-01');
  assert(fkManualRule, 'Database FK rule BR-FK-01 should be injected into Section 7');
  assert(fkManualRule.formulaOrCondition.includes('orders.customer_id ➔ customers.id'), 'FK rule formula should list relations');
  console.log('✅ 3.2 User Manual Section 7 Foreign Key rule injection verified');
}

async function main() {
  await testReaBridgeAstExtractor();
  await testDomainLogicBrainAndWhiteBoxScenarios();
  await testUserManualSection7();
  console.log('\n🎉 ALL MASTER DEEP-ENGINE UPGRADE TESTS PASSED WITH 100% SUCCESS!\n');
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

async function testTriModalDiscoveryModeBAndC() {
  console.log('\n--- Test 4: triModalDiscoveryService Mode B & Mode C Hybrid AST Fusion ---');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'onespec-test-trimodal-'));

  try {
    fs.mkdirSync(path.join(tempDir, 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, 'src', 'auth.ts'),
      `
import { z } from 'zod';
export const LoginDto = z.object({
  email: z.string().min(5).max(50),
  password: z.string().min(8).max(64),
});
`
    );

    // Test Mode B Local
    const resB = await triModalDiscoveryService.discoverModeBLocal({
      targetPath: tempDir,
    });

    assert(resB.compiledState, 'Mode B should produce compiledState');
    const astRulesB = resB.compiledState.validationRules.filter((r) => r.ruleId.startsWith('VR-AST-'));
    assert(astRulesB.length >= 2, 'Mode B should map extractedBackendRules into VR-AST-xx');
    assert(astRulesB[0].exactUiErrorString.includes('[AST'), 'VR-AST contract must carry [AST file:line] provenance');
    console.log('✅ 4.1 Mode B Local AST rule mapping & provenance verified');

    // Test Mode C Staging Hybrid Fusion fallback
    const resC = await triModalDiscoveryService.discoverModeCStaging({
      stagingUrl: 'http://localhost:3000',
      dbUri: tempDir,
    });
    assert(resC.databaseTables, 'Mode C should introspect databaseTables from AST scan');
    console.log('✅ 4.2 Mode C Staging Hybrid AST Fusion verified');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// Append to main runner
testTriModalDiscoveryModeBAndC().then(() => {
  console.log('🎉 Tri-Modal Discovery Mode B & C verification complete!');
});
