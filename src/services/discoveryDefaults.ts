import type {
  DatabaseErdTable,
  DiscoveredApiEndpoint,
  DomTraceabilityBinding,
  TriModalDiscoveryResult,
} from '@/types/sdlc';

export function getDefaultErdTables(): DatabaseErdTable[] {
  return [
    {
      id: 'ProjectWorkspace',
      tableName: 'ProjectWorkspace',
      primaryKeys: ['id'],
      columns: [
        { name: 'id', type: 'String', isPrimaryKey: true, isForeignKey: false, isNullable: false },
        { name: 'name', type: 'String', isPrimaryKey: false, isForeignKey: false, isNullable: false },
        { name: 'slug', type: 'String', isPrimaryKey: false, isForeignKey: false, isNullable: false },
        { name: 'projectMode', type: 'String', isPrimaryKey: false, isForeignKey: false, isNullable: false },
        { name: 'repositoryUrl', type: 'String', isPrimaryKey: false, isForeignKey: false, isNullable: true },
        { name: 'createdAt', type: 'DateTime', isPrimaryKey: false, isForeignKey: false, isNullable: false },
      ],
    },
    {
      id: 'Vouchers',
      tableName: 'Vouchers',
      primaryKeys: ['id'],
      columns: [
        { name: 'id', type: 'String', isPrimaryKey: true, isForeignKey: false, isNullable: false },
        {
          name: 'workspaceId',
          type: 'String',
          isPrimaryKey: false,
          isForeignKey: true,
          isNullable: false,
          foreignKeyTarget: { table: 'ProjectWorkspace', column: 'id' },
        },
        { name: 'code', type: 'String', isPrimaryKey: false, isForeignKey: false, isNullable: false },
        { name: 'discountPercent', type: 'Int', isPrimaryKey: false, isForeignKey: false, isNullable: false },
        { name: 'minOrderSpend', type: 'Decimal', isPrimaryKey: false, isForeignKey: false, isNullable: false },
        { name: 'isActive', type: 'Boolean', isPrimaryKey: false, isForeignKey: false, isNullable: false },
      ],
    },
    {
      id: 'VoucherRedemptions',
      tableName: 'VoucherRedemptions',
      primaryKeys: ['id'],
      columns: [
        { name: 'id', type: 'String', isPrimaryKey: true, isForeignKey: false, isNullable: false },
        {
          name: 'voucherId',
          type: 'String',
          isPrimaryKey: false,
          isForeignKey: true,
          isNullable: false,
          foreignKeyTarget: { table: 'Vouchers', column: 'id' },
        },
        { name: 'customerId', type: 'String', isPrimaryKey: false, isForeignKey: false, isNullable: false },
        { name: 'orderSubtotal', type: 'Decimal', isPrimaryKey: false, isForeignKey: false, isNullable: false },
        { name: 'discountApplied', type: 'Decimal', isPrimaryKey: false, isForeignKey: false, isNullable: false },
        { name: 'redeemedAt', type: 'DateTime', isPrimaryKey: false, isForeignKey: false, isNullable: false },
      ],
    },
    {
      id: 'RtmTestCaseRecord',
      tableName: 'RtmTestCaseRecord',
      primaryKeys: ['id'],
      columns: [
        { name: 'id', type: 'String', isPrimaryKey: true, isForeignKey: false, isNullable: false },
        {
          name: 'workspaceId',
          type: 'String',
          isPrimaryKey: false,
          isForeignKey: true,
          isNullable: false,
          foreignKeyTarget: { table: 'ProjectWorkspace', column: 'id' },
        },
        { name: 'testCaseId', type: 'String', isPrimaryKey: false, isForeignKey: false, isNullable: false },
        { name: 'userStoryId', type: 'String', isPrimaryKey: false, isForeignKey: false, isNullable: false },
        { name: 'validationRuleId', type: 'String', isPrimaryKey: false, isForeignKey: false, isNullable: false },
        { name: 'verdict', type: 'String', isPrimaryKey: false, isForeignKey: false, isNullable: false },
      ],
    },
  ];
}

export function generateOpenApi31SpecClient(
  endpoints: DiscoveredApiEndpoint[],
  serverUrl: string
): Record<string, unknown> {
  const paths: Record<string, any> = {};

  for (const ep of endpoints) {
    const methodKey = ep.method.toLowerCase();
    if (!paths[ep.path]) {
      paths[ep.path] = {};
    }

    paths[ep.path][methodKey] = {
      summary: ep.summary,
      description: ep.description,
      operationId: ep.handlerName || `${methodKey}_${ep.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
      tags: [ep.path.split('/')[3] || 'checkout'],
      'x-controller-source': `${ep.controllerPath}:${ep.lineNumber}`,
      'x-linked-rtm': ep.linkedTestCaseIds,
      'x-linked-requirement': ep.linkedRequirementId,
      ...(ep.requestBodySchema && {
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ep.requestBodySchema,
            },
          },
        },
      }),
      responses: ep.responseSchemas
        ? Object.fromEntries(
            Object.entries(ep.responseSchemas).map(([status, item]: [string, any]) => [
              status,
              {
                description: item.description,
                content: {
                  'application/json': {
                    schema: item.schema || item,
                  },
                },
              },
            ])
          )
        : {
            '200': {
              description: 'Successful invocation',
            },
          },
    };
  }

  return {
    openapi: '3.1.0',
    info: {
      title: 'OneSpec SDLC Workbench - Auto-Discovered API Specification',
      version: '1.0.0',
      description: 'Auto-synthesized OpenAPI 3.1.0 contract extracted via morluto/rea static AST & HAR harvester.',
    },
    servers: [
      {
        url: serverUrl.startsWith('http') ? serverUrl : 'http://127.0.0.1:8080',
        description: 'Discovered Target Gateway',
      },
    ],
    paths,
  };
}
