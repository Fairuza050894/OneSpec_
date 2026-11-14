import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../lib/prisma';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const CACHE_FILE_PATH = path.resolve(process.cwd(), '.onespec-workspace-cache.json');

const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric lowercase and dashes'),
  description: z.string().optional(),
  projectMode: z.enum(['GREENFIELD', 'BROWNFIELD']).default('GREENFIELD'),
  existingDomain: z.string().optional().nullable(),
  repositoryUrl: z.string().optional().nullable(),
  repositoryBranch: z.string().default('main'),
  localPath: z.string().optional().nullable(),
  databaseUrl: z.string().optional().nullable(),
});

export const workspaceRoutes: FastifyPluginAsync = async (fastify) => {
  // Workspace disk cache endpoints
  fastify.get('/cache', async (_request, reply) => {
    try {
      if (fs.existsSync(CACHE_FILE_PATH)) {
        const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf8');
        const data = JSON.parse(raw);
        return reply.send({ success: true, data });
      }
      return reply.status(404).send({ success: false, message: 'No cached workspace on disk' });
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.post('/cache', async (request, reply) => {
    try {
      fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(request.body, null, 2), 'utf8');
      return reply.send({ success: true, message: 'Workspace cached to disk successfully' });
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // List all workspaces with ISO artifact counts
  fastify.get('/', async (_request, reply) => {
    const workspaces = await prisma.projectWorkspace.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            brdArtifacts: true,
            prdArtifacts: true,
            bpmnProcessModels: true,
            rtmTestCases: true,
          },
        },
      },
    });

    return reply.send({
      total: workspaces.length,
      data: workspaces,
    });
  });

  // Create a new workspace
  fastify.post('/', async (request, reply) => {
    const parseResult = createWorkspaceSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'VALIDATION_FAILED',
        details: parseResult.error.format(),
      });
    }

    const { name, slug, description, projectMode, existingDomain, repositoryUrl, repositoryBranch, localPath, databaseUrl } =
      parseResult.data;

    const existing = await prisma.projectWorkspace.findUnique({ where: { slug } });
    if (existing) {
      return reply.status(409).send({
        error: 'SLUG_CONFLICT',
        message: `Workspace with slug '${slug}' already exists`,
      });
    }

    const workspace = await prisma.projectWorkspace.create({
      data: {
        name,
        slug,
        description,
        projectMode,
        existingDomain: projectMode === 'BROWNFIELD' ? existingDomain : null,
        repositoryUrl,
        repositoryBranch,
        localPath,
        databaseUrl,
      },
    });

    return reply.status(201).send(workspace);
  });

  // Get single workspace with full bi-directional ISO artifacts
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const workspace = await prisma.projectWorkspace.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        brdArtifacts: {
          include: {
            businessRules: {
              include: {
                userStories: true,
                rtmTestCases: true,
              },
            },
          },
        },
        prdArtifacts: {
          include: {
            userStories: {
              include: {
                businessRule: true,
                rtmTestCases: true,
              },
            },
            bpmnProcessModels: true,
            rtmTestCases: true,
          },
        },
        bpmnProcessModels: true,
        rtmTestCases: {
          include: {
            businessRule: true,
            userStory: true,
          },
          orderBy: { testCaseId: 'asc' },
        },
      },
    });

    if (!workspace) {
      return reply.status(404).send({
        error: 'NOT_FOUND',
        message: `Workspace '${id}' not found`,
      });
    }

    return reply.send(workspace);
  });

  // Bi-directional Requirement Traceability Matrix (RTM) aggregated view
  fastify.get('/:id/rtm-matrix', async (request, reply) => {
    const { id } = request.params as { id: string };

    const workspace = await prisma.projectWorkspace.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        brdArtifacts: {
          include: {
            businessRules: {
              include: {
                userStories: {
                  include: {
                    rtmTestCases: true,
                  },
                },
                rtmTestCases: true,
              },
            },
          },
        },
        rtmTestCases: {
          include: {
            businessRule: true,
            userStory: true,
          },
        },
      },
    });

    if (!workspace) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Workspace not found' });
    }

    // Compile flattened bi-directional traceability records
    const matrixRows: Array<{
      businessRuleId: string;
      businessRuleTitle: string;
      userStoryId: string;
      userStoryTitle: string;
      testCaseId: string;
      testType: string;
      apiEndpoint: string | null;
      domSelector: string | null;
      executionVerdict: string;
      executionLatencyMs: number | null;
    }> = [];

    for (const brd of workspace.brdArtifacts) {
      for (const rule of brd.businessRules) {
        if (rule.userStories.length === 0 && rule.rtmTestCases.length === 0) {
          matrixRows.push({
            businessRuleId: rule.ruleId,
            businessRuleTitle: rule.title,
            userStoryId: 'UNLINKED',
            userStoryTitle: 'No linked user story (SyRS gap)',
            testCaseId: 'UNLINKED',
            testType: 'NONE',
            apiEndpoint: null,
            domSelector: null,
            executionVerdict: 'NOT_RUN',
            executionLatencyMs: null,
          });
        }

        for (const story of rule.userStories) {
          const testCases = story.rtmTestCases.length > 0 ? story.rtmTestCases : rule.rtmTestCases;

          if (testCases.length === 0) {
            matrixRows.push({
              businessRuleId: rule.ruleId,
              businessRuleTitle: rule.title,
              userStoryId: story.storyId,
              userStoryTitle: story.title,
              testCaseId: 'UNLINKED',
              testType: 'NONE',
              apiEndpoint: null,
              domSelector: null,
              executionVerdict: 'NOT_RUN',
              executionLatencyMs: null,
            });
          } else {
            for (const tc of testCases) {
              matrixRows.push({
                businessRuleId: rule.ruleId,
                businessRuleTitle: rule.title,
                userStoryId: story.storyId,
                userStoryTitle: story.title,
                testCaseId: tc.testCaseId,
                testType: tc.testType,
                apiEndpoint: tc.apiEndpoint,
                domSelector: tc.domSelector,
                executionVerdict: tc.executionVerdict,
                executionLatencyMs: tc.executionLatencyMs,
              });
            }
          }
        }
      }
    }

    return reply.send({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      projectMode: workspace.projectMode,
      totalRows: matrixRows.length,
      rows: matrixRows,
    });
  });

  // Seed sample ISO 29148 / BPMN 2.0 / ISO 29119 benchmark workspace
  fastify.post('/seed-sample', async (_request, reply) => {
    const slug = 'architecture-engine';
    let workspace = await prisma.projectWorkspace.findUnique({ where: { slug } });

    if (!workspace) {
      workspace = await prisma.projectWorkspace.create({
        data: {
          name: 'Architecture & Invariants Engine',
          slug,
          description: 'Core application transaction validation with strict parameter invariants and concurrency locks.',
          projectMode: 'GREENFIELD',
          existingDomain: null,
          repositoryUrl: 'https://github.com/example/api-service',
          repositoryBranch: 'main',
        },
      });
    }

    // Create or find BRD
    let brd = await prisma.brdArtifact.findFirst({ where: { projectId: workspace.id } });
    if (!brd) {
      brd = await prisma.brdArtifact.create({
        data: {
          projectId: workspace.id,
          title: 'Stakeholder Requirements Specification — Architecture Engine',
          version: '1.0.0',
          status: 'APPROVED',
          executiveSummary:
            'Normative requirements governing transaction validation, fraud mitigation, and strict service SLA ceilings.',
          rawMeetingNotes:
            'Architecture Workshop: System SHALL enforce strict data integrity across all exposed HTTP routes and database entities. Target KPI: P99 latency < 150ms.',
          kpis: JSON.stringify([
            { id: 'KPI-01', metric: 'Transaction Validation Latency', target: '< 150ms', baseline: '350ms', unit: 'ms' },
            { id: 'KPI-02', metric: 'Duplicate Submission Fraud Rate', target: '0.00%', baseline: '0.05%', unit: '%' },
          ]),
          scopeIn: JSON.stringify(['Transaction validation', 'Schema verification', 'Concurrency locks']),
          scopeOut: JSON.stringify(['Cross-border multi-currency FX conversion']),
        },
      });

      // Create Business Rules
      const br01 = await prisma.businessRule.create({
        data: {
          brdArtifactId: brd.id,
          ruleId: 'BR-01',
          title: 'Parameter Validation Invariant',
          statement: 'The system SHALL validate all input parameters against format and length constraints.',
          rationale: 'Prevent invalid or malformed data propagation.',
          priority: 'HIGH',
          complianceReference: 'ISO/IEC/IEEE 29148:2018 Section 5.2.4',
        },
      });

      const br02 = await prisma.businessRule.create({
        data: {
          brdArtifactId: brd.id,
          ruleId: 'BR-02',
          title: 'Single-Execution Concurrency Limitation',
          statement: 'The system SHALL enforce ACID row locking and reject concurrent duplicate submissions.',
          rationale: 'Prevent race conditions and double claims.',
          priority: 'HIGH',
          complianceReference: 'ISO/IEC/IEEE 29148:2018 Section 5.2.6',
        },
      });

      // Create PRD
      const prd = await prisma.prdArtifact.create({
        data: {
          projectId: workspace.id,
          brdArtifactId: brd.id,
          title: 'System Requirements Specification — Core Processing Module',
          version: '1.0.0',
          status: 'VERIFIED',
          overview: 'Detailed user stories, field validations, and HTTP contracts fulfilling BR-01 and BR-02.',
        },
      });

      // Create User Stories
      const us01 = await prisma.userStory.create({
        data: {
          prdArtifactId: prd.id,
          businessRuleId: br01.id,
          storyId: 'REQ-US-01',
          title: 'Process Transaction Request',
          role: 'Authenticated Client',
          capability: 'submit formatted transaction parameters to the service gateway',
          benefit: 'receive instantaneous processing response prior to downstream settlement',
          acceptanceCriteriaGherkin: `Feature: Transaction Processing
  Scenario: Valid parameter submission
    Given the client is authenticated
    When the client submits valid transaction parameters
    Then the system processes the request successfully
    And the HTTP response status is 200 OK`,
          fieldValidations: JSON.stringify([
            {
              fieldName: 'username',
              dataType: 'string',
              required: true,
              constraints: { min: 3, max: 30, pattern: '^[A-Za-z0-9_.-]+$' },
              errorCode: 'USERNAME_INVALID_FORMAT',
              errorHttpStatus: 400,
            },
            {
              fieldName: 'amount',
              dataType: 'number',
              required: true,
              constraints: { min: 1 },
              errorCode: 'AMOUNT_BELOW_MINIMUM',
              errorHttpStatus: 422,
            },
          ]),
          httpContracts: JSON.stringify([
            {
              method: 'POST',
              path: '/api/v1/records/process',
              response2xx: { status: 200, schema: { discountAmount: 'number', finalTotal: 'number' } },
              response4xx: [
                { status: 400, errorCode: 'INVALID_REQUEST', description: 'Malformed code syntax' },
                { status: 422, errorCode: 'CART_BELOW_THRESHOLD', description: 'Cart subtotal < 50000' },
              ],
              slaThresholdMs: 150,
            },
          ]),
        },
      });

      const us02 = await prisma.userStory.create({
        data: {
          prdArtifactId: prd.id,
          businessRuleId: br02.id,
          storyId: 'REQ-US-02',
          title: 'Reject Concurrent Duplicate Requests',
          role: 'System Security Engine',
          capability: 'query historical in-flight locks for idempotency key',
          benefit: 'guarantee strict idempotency and zero duplicate execution leakage',
          acceptanceCriteriaGherkin: `Feature: Idempotency Validation
  Scenario: Duplicate request rejection
    Given a request with key "KEY-9921" is currently in flight
    When another request attempts to use "KEY-9921" concurrently
    Then the system rejects with error "CONCURRENT_CLAIM"
    And the HTTP response status is 409 Conflict`,
          fieldValidations: JSON.stringify([
            {
              fieldName: 'customerId',
              dataType: 'string',
              required: true,
              errorCode: 'CUSTOMER_ID_REQUIRED',
              errorHttpStatus: 401,
            },
          ]),
          httpContracts: JSON.stringify([
            {
              method: 'POST',
              path: '/api/v1/vouchers/apply',
              response2xx: { status: 200, schema: {} },
              response4xx: [
                { status: 409, errorCode: 'VOUCHER_ALREADY_REDEEMED', description: 'Redemption limit reached' },
              ],
              slaThresholdMs: 120,
            },
          ]),
        },
      });

      // Create BPMN 2.0 Process Model (Camunda-Style)
      await prisma.bpmnProcessModel.create({
        data: {
          projectId: workspace.id,
          prdArtifactId: prd.id,
          name: 'Voucher Application & Validation Flow',
          version: '1.0.0',
          poolName: 'Voucher Management Pool',
          swimlanes: JSON.stringify([
            { id: 'lane-ui', name: 'Lane 1: Client UI / Actor', actorType: 'CLIENT_UI', orderIndex: 0, height: 160 },
            { id: 'lane-api', name: 'Lane 2: Backend API & Database', actorType: 'BACKEND_API', orderIndex: 1, height: 220 },
          ]),
          nodes: JSON.stringify([
            { id: 'node-start', laneId: 'lane-ui', type: 'START_EVENT', name: 'Checkout Page Opened', x: 80, y: 80, width: 36, height: 36 },
            { id: 'node-task-1', laneId: 'lane-ui', type: 'USER_TASK', name: 'Enter Voucher Code', linkedRequirementId: 'REQ-US-01', x: 160, y: 60, width: 140, height: 70 },
            { id: 'node-task-2', laneId: 'lane-api', type: 'SERVICE_TASK', name: 'Validate Threshold & Quota', linkedRequirementId: 'REQ-US-01', x: 360, y: 220, width: 160, height: 70, properties: { apiRoute: 'POST /api/v1/vouchers/apply', slaThresholdMs: 150 } },
            { id: 'node-xor', laneId: 'lane-api', type: 'EXCLUSIVE_GATEWAY_XOR', name: 'Valid?', x: 580, y: 235, width: 40, height: 40 },
            { id: 'node-end-err', laneId: 'lane-ui', type: 'END_EVENT', name: 'Display Error [409/422]', x: 700, y: 80, width: 36, height: 36 },
            { id: 'node-end-ok', laneId: 'lane-ui', type: 'END_EVENT', name: 'Discount Applied [200]', x: 700, y: 150, width: 36, height: 36 },
          ]),
          edges: JSON.stringify([
            { id: 'edge-1', sourceNodeId: 'node-start', targetNodeId: 'node-task-1', waypoints: [{ x: 116, y: 98 }, { x: 160, y: 98 }] },
            { id: 'edge-2', sourceNodeId: 'node-task-1', targetNodeId: 'node-task-2', waypoints: [{ x: 230, y: 130 }, { x: 230, y: 255 }, { x: 360, y: 255 }] },
            { id: 'edge-3', sourceNodeId: 'node-task-2', targetNodeId: 'node-xor', waypoints: [{ x: 520, y: 255 }, { x: 580, y: 255 }] },
            { id: 'edge-4', sourceNodeId: 'node-xor', targetNodeId: 'node-end-err', conditionExpression: '[NO: HTTP 409 / 422]', waypoints: [{ x: 600, y: 235 }, { x: 600, y: 98 }, { x: 700, y: 98 }] },
            { id: 'edge-5', sourceNodeId: 'node-xor', targetNodeId: 'node-end-ok', conditionExpression: '[YES: HTTP 200]', waypoints: [{ x: 620, y: 255 }, { x: 660, y: 255 }, { x: 660, y: 168 }, { x: 700, y: 168 }] },
          ]),
        },
      });

      // Create ISO 29119 RTM Test Cases
      await prisma.rtmTestCase.create({
        data: {
          projectId: workspace.id,
          prdArtifactId: prd.id,
          businessRuleId: br01.id,
          userStoryId: us01.id,
          testCaseId: 'TC-VCH-001',
          title: 'Positive Verification: Standard valid coupon code on cart above 50K',
          testType: 'POSITIVE',
          precondition: 'User cart total is IDR 75.000, voucher DISC20 is active and has remaining balance.',
          testSteps: JSON.stringify([
            { stepNumber: 1, action: 'Fill voucher input', testData: 'DISC20', expectedStepResult: 'Input populated' },
            { stepNumber: 2, action: 'Click Apply button', testData: 'click', expectedStepResult: 'HTTP 200 response' },
          ]),
          expectedResult: 'HTTP 200 OK with discount of IDR 15.000 reflected in cart summary',
          gherkinScenario: 'Scenario: Valid voucher application above minimum threshold',
          domSelector: '[data-testid="voucher-input"]',
          apiEndpoint: 'POST /api/v1/vouchers/apply',
          executionVerdict: 'PASSED',
          executionLatencyMs: 94,
          executionLog: 'Playwright locator.fill OK (12ms), API response 200 OK (82ms). Assertion verified.',
          lastExecutedAt: new Date(),
        },
      });

      await prisma.rtmTestCase.create({
        data: {
          projectId: workspace.id,
          prdArtifactId: prd.id,
          businessRuleId: br01.id,
          userStoryId: us01.id,
          testCaseId: 'TC-VCH-002',
          title: 'Boundary Value Analysis: Cart subtotal exactly IDR 49.999 (1 IDR below minimum)',
          testType: 'BOUNDARY_VALUE',
          precondition: 'Cart subtotal is IDR 49.999, voucher DISC20 is active.',
          testSteps: JSON.stringify([
            { stepNumber: 1, action: 'Submit voucher code', testData: 'DISC20', expectedStepResult: 'Request rejected' },
          ]),
          expectedResult: 'HTTP 422 Unprocessable Entity with code CART_BELOW_MINIMUM_THRESHOLD',
          gherkinScenario: 'Scenario: Reject cart total below boundary limit',
          domSelector: '[data-testid="voucher-apply-btn"]',
          apiEndpoint: 'POST /api/v1/vouchers/apply',
          executionVerdict: 'PASSED',
          executionLatencyMs: 68,
          executionLog: 'API responded with 422 Unprocessable Entity. Constraint validation verified.',
          lastExecutedAt: new Date(),
        },
      });

      await prisma.rtmTestCase.create({
        data: {
          projectId: workspace.id,
          prdArtifactId: prd.id,
          businessRuleId: br02.id,
          userStoryId: us02.id,
          testCaseId: 'TC-VCH-003',
          title: 'Negative Verification: Duplicate redemption attempt by same authenticated customer',
          testType: 'NEGATIVE',
          precondition: 'Customer CUST-9921 has order ORD-1002 with redeemed code DISC20.',
          testSteps: JSON.stringify([
            { stepNumber: 1, action: 'Authenticate as CUST-9921', testData: 'Bearer token', expectedStepResult: 'Session active' },
            { stepNumber: 2, action: 'Submit voucher DISC20', testData: 'DISC20', expectedStepResult: 'HTTP 409 Conflict' },
          ]),
          expectedResult: 'HTTP 409 Conflict with code VOUCHER_ALREADY_REDEEMED and 0 discount calculated',
          gherkinScenario: 'Scenario: Duplicate voucher application rejection',
          domSelector: '[data-testid="voucher-error-banner"]',
          apiEndpoint: 'POST /api/v1/vouchers/apply',
          executionVerdict: 'PASSED',
          executionLatencyMs: 112,
          executionLog: 'DB unique index scan caught duplicate claim. HTTP 409 returned.',
          lastExecutedAt: new Date(),
        },
      });
    }

    return reply.status(200).send({
      message: 'Benchmark ISO SDLC Workspace seeded successfully',
      workspaceId: workspace.id,
      slug: workspace.slug,
    });
  });
};
