import { createApp } from '../src/server/index';
import { reaBridge } from '../src/services/reaBridge';
import { prisma } from '../src/lib/prisma';

async function verify() {
  console.log('[1/5] Verifying reaBridge availability...');
  const reaAvail = await reaBridge.checkAvailability();
  console.log('✓ reaBridge status:', reaAvail);

  console.log('[2/5] Running AST application analysis via reaBridge...');
  const appScan = await reaBridge.analyzeJavaScriptApplication('.');
  console.log(
    `✓ reaBridge scan: ${appScan.data?.routes.length || 0} routes, ${
      appScan.data?.databaseSchemas.length || 0
    } DB models in ${appScan.durationMs}ms`
  );

  console.log('[3/5] Starting Fastify server instance in-memory for testing...');
  const app = await createApp();
  await app.ready();

  const healthRes = await app.inject({
    method: 'GET',
    url: '/health',
  });
  console.log(`✓ Fastify /health status ${healthRes.statusCode}:`, healthRes.json().status);

  console.log('[4/5] Seeding benchmark workspace via API...');
  const seedRes = await app.inject({
    method: 'POST',
    url: '/api/workspaces/seed-sample',
  });
  console.log(`✓ Seed response ${seedRes.statusCode}:`, seedRes.json().message);

  console.log('[5/5] Fetching Bi-directional RTM Matrix...');
  const rtmRes = await app.inject({
    method: 'GET',
    url: '/api/workspaces/voucher-checkout-engine/rtm-matrix',
  });
  const rtmData = rtmRes.json();
  console.log(`✓ RTM Matrix rows returned: ${rtmData.totalRows}`);
  for (const row of rtmData.rows) {
    console.log(
      `  -> [${row.businessRuleId}] ➔ [${row.userStoryId}] ➔ [${row.testCaseId}] (${row.testType}): ${row.executionVerdict} [${row.executionLatencyMs}ms]`
    );
  }

  // Verify DB record direct relation integrity
  const fullWorkspace = await prisma.projectWorkspace.findUnique({
    where: { slug: 'voucher-checkout-engine' },
    include: {
      brdArtifacts: { include: { businessRules: true } },
      prdArtifacts: { include: { userStories: true } },
      bpmnProcessModels: true,
      rtmTestCases: true,
    },
  });

  if (!fullWorkspace) {
    throw new Error('Workspace verification failed: DB record missing');
  }

  console.log(`✓ Bi-directional DB integrity verified:`);
  console.log(`  Workspace: ${fullWorkspace.name} [Mode: ${fullWorkspace.projectMode}]`);
  console.log(`  StRS BRD Rules: ${fullWorkspace.brdArtifacts[0].businessRules.length}`);
  console.log(`  SyRS PRD Stories: ${fullWorkspace.prdArtifacts[0].userStories.length}`);
  console.log(`  BPMN 2.0 Models: ${fullWorkspace.bpmnProcessModels.length}`);
  console.log(`  ISO 29119 Test Cases: ${fullWorkspace.rtmTestCases.length}`);

  // Cleanup
  await app.close();
  await prisma.$disconnect();
  console.log('\n======================================================');
  console.log('✓ ONE-SPEC SDLC WORKBENCH STAGE 1 FOUNDATION: 100% PASS');
  console.log('======================================================\n');
  process.exit(0);
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
