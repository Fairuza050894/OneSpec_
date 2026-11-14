/**
 * OneSpec SDLC Workbench - Deterministic ISO/IEC 19510 (BPMN 2.0) XML Generator
 * Standard namespace: http://www.omg.org/spec/BPMN/20100524/MODEL
 * Standards:
 * - Camunda 8 (Zeebe) Engine Executable (zeebe:taskDefinition, zeebe:ioMapping)
 * - Camunda 7 Engine Executable (camunda:type="external", camunda:topic)
 * Output adheres to Camunda Modeler 5.x / 8.x layout rules with horizontal Pools, 3 Swimlanes, and orthogonal DI coordinates.
 */

export interface BpmnDiscoveredModuleFlow {
  moduleName: string;
  pagePath: string;
  inputs?: string[];
  apiMethod?: string;
  apiPath?: string;
  tableName?: string;
}

export interface BpmnGeneratorInput {
  poolName?: string;
  workflowTitle?: string;
  userStoryId?: string;
  businessRuleIds?: string[];
  laneUserTitle?: string;
  laneApiTitle?: string;
  laneDbTitle?: string;
  startEventName?: string;
  userTaskName?: string;
  gatewayTaskName?: string;
  serviceTaskName?: string;
  dbTaskName?: string;
  gatewayName?: string;
  endSuccessName?: string;
  endErrorName?: string;
  discoveredModules?: BpmnDiscoveredModuleFlow[];
}

const escapeXml = (str: string): string =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export function generateCanonicalBpmn2Xml(input: BpmnGeneratorInput = {}): string {
  const poolName = escapeXml(input.poolName || 'Pipeline Workflow Engine Orchestrator');
  const userStoryId = escapeXml(input.userStoryId || 'REQ-US-01');
  const brList = escapeXml(
    input.businessRuleIds && input.businessRuleIds.length > 0
      ? input.businessRuleIds.join(', ')
      : 'BR-01, VR-01'
  );

  const laneUser = escapeXml(input.laneUserTitle || 'Presentation Layer (DOM)');
  const laneApi = escapeXml(input.laneApiTitle || 'Gateway & Service Logic');
  const laneDb = escapeXml(input.laneDbTitle || 'Persistence & DB (ACID)');

  const startName = escapeXml(input.startEventName || 'User Ingress');
  const userTaskName = escapeXml(input.userTaskName || `Client Form Dispatch [${userStoryId}]`);
  const gatewayTaskName = escapeXml(input.gatewayTaskName || 'Verify Signature & Rate Limit');
  const serviceTaskName = escapeXml(input.serviceTaskName || `Evaluate Invariants [${brList}]`);
  const dbTaskName = escapeXml(input.dbTaskName || 'ACID Commit & Row Lock');
  const gatewayName = escapeXml(input.gatewayName || 'Contract Valid?');
  const endSuccessName = escapeXml(input.endSuccessName || 'HTTP 200 OK');
  const endErrorName = escapeXml(input.endErrorName || 'HTTP 422 Rejection');

  const modules = (input.discoveredModules || []).filter((m) => m.moduleName || m.pagePath);
  if (modules.length > 1) {
    const colStep = 195;
    const startModX = 400;
    const gwX = startModX + modules.length * colStep;
    const poolWidth = Math.max(1100, gwX + 240);
    const laneWidth = poolWidth - 30;

    const uiFlowNodeRefs: string[] = ['StartEvent_Trigger', 'UserTask_Interaction'];
    const apiFlowNodeRefs: string[] = ['ServiceTask_GatewayAuth'];
    const dbFlowNodeRefs: string[] = [];

    const processElements: string[] = [];
    const sequenceFlows: string[] = [];
    const diShapes: string[] = [];
    const diEdges: string[] = [];

    // Fixed Auth & Ingress Handshake
    sequenceFlows.push(
      `<bpmn:sequenceFlow id="Flow_StartToUserTask" sourceRef="StartEvent_Trigger" targetRef="UserTask_Interaction" />`,
      `<bpmn:sequenceFlow id="Flow_UserTaskToGatewayAuth" sourceRef="UserTask_Interaction" targetRef="ServiceTask_GatewayAuth" />`,
      `<bpmn:sequenceFlow id="Flow_GatewayToMod0" sourceRef="ServiceTask_GatewayAuth" targetRef="UserTask_Mod_0" />`
    );
    diEdges.push(
      `<bpmndi:BPMNEdge id="Flow_StartToUserTask_di" bpmnElement="Flow_StartToUserTask"><di:waypoint x="166" y="115" /><di:waypoint x="210" y="115" /></bpmndi:BPMNEdge>`,
      `<bpmndi:BPMNEdge id="Flow_UserTaskToGatewayAuth_di" bpmnElement="Flow_UserTaskToGatewayAuth"><di:waypoint x="275" y="152" /><di:waypoint x="275" y="230" /></bpmndi:BPMNEdge>`,
      `<bpmndi:BPMNEdge id="Flow_GatewayToMod0_di" bpmnElement="Flow_GatewayToMod0"><di:waypoint x="340" y="267" /><di:waypoint x="370" y="267" /><di:waypoint x="370" y="115" /><di:waypoint x="400" y="115" /></bpmndi:BPMNEdge>`
    );

    modules.forEach((mod, idx) => {
      const colX = startModX + idx * colStep;
      const centerX = colX + 70;
      const uId = `UserTask_Mod_${idx}`;
      const sId = `ServiceTask_Mod_${idx}`;
      const dId = `ServiceTask_Db_${idx}`;
      const fInUi = idx === 0 ? 'Flow_GatewayToMod0' : `Flow_Db${idx - 1}_To_Mod${idx}`;
      const fUiToApi = `Flow_Mod${idx}_UiToApi`;
      const fApiToDb = `Flow_Mod${idx}_ApiToDb`;
      const fOutDb = idx < modules.length - 1 ? `Flow_Db${idx}_To_Mod${idx + 1}` : 'Flow_LastDbToGateway';

      uiFlowNodeRefs.push(uId);
      apiFlowNodeRefs.push(sId);
      dbFlowNodeRefs.push(dId);

      const modLabel = escapeXml(mod.moduleName || mod.pagePath || `Module ${idx + 1}`);
      const apiLabel = escapeXml(`${mod.apiMethod || 'GET'} ${mod.apiPath || mod.pagePath || '/'}`);
      const dbLabel = escapeXml(`Persist: ${mod.tableName || 'EntityRecords'}`);
      const usRef = `REQ-US-${String(idx + 1).padStart(2, '0')}`;

      processElements.push(`
    <bpmn:userTask id="${uId}" name="${modLabel} UI [${usRef}]">
      <bpmn:documentation>Interactive flow for ${modLabel} (${escapeXml(mod.pagePath)})</bpmn:documentation>
      <bpmn:incoming>${fInUi}</bpmn:incoming>
      <bpmn:outgoing>${fUiToApi}</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:serviceTask id="${sId}" name="${apiLabel}" camunda:type="external" camunda:topic="mod-${idx}-api">
      <bpmn:extensionElements>
        <zeebe:taskDefinition type="mod-${idx}-api" retries="3" />
      </bpmn:extensionElements>
      <bpmn:documentation>Service contract handler for ${modLabel}</bpmn:documentation>
      <bpmn:incoming>${fUiToApi}</bpmn:incoming>
      <bpmn:outgoing>${fApiToDb}</bpmn:outgoing>
    </bpmn:serviceTask>
    <bpmn:serviceTask id="${dId}" name="${dbLabel}" camunda:type="external" camunda:topic="mod-${idx}-db">
      <bpmn:extensionElements>
        <zeebe:taskDefinition type="mod-${idx}-db" retries="2" />
      </bpmn:extensionElements>
      <bpmn:documentation>Database ACID read/write for ${modLabel}</bpmn:documentation>
      <bpmn:incoming>${fApiToDb}</bpmn:incoming>
      <bpmn:outgoing>${fOutDb}</bpmn:outgoing>
    </bpmn:serviceTask>`);

      sequenceFlows.push(
        `<bpmn:sequenceFlow id="${fUiToApi}" sourceRef="${uId}" targetRef="${sId}" />`,
        `<bpmn:sequenceFlow id="${fApiToDb}" sourceRef="${sId}" targetRef="${dId}" />`
      );
      diShapes.push(
        `<bpmndi:BPMNShape id="${uId}_di" bpmnElement="${uId}"><dc:Bounds x="${colX}" y="78" width="140" height="74" /></bpmndi:BPMNShape>`,
        `<bpmndi:BPMNShape id="${sId}_di" bpmnElement="${sId}"><dc:Bounds x="${colX}" y="230" width="140" height="74" /></bpmndi:BPMNShape>`,
        `<bpmndi:BPMNShape id="${dId}_di" bpmnElement="${dId}"><dc:Bounds x="${colX}" y="385" width="140" height="74" /></bpmndi:BPMNShape>`
      );
      diEdges.push(
        `<bpmndi:BPMNEdge id="${fUiToApi}_di" bpmnElement="${fUiToApi}"><di:waypoint x="${centerX}" y="152" /><di:waypoint x="${centerX}" y="230" /></bpmndi:BPMNEdge>`,
        `<bpmndi:BPMNEdge id="${fApiToDb}_di" bpmnElement="${fApiToDb}"><di:waypoint x="${centerX}" y="304" /><di:waypoint x="${centerX}" y="385" /></bpmndi:BPMNEdge>`
      );

      if (idx < modules.length - 1) {
        const nextX = startModX + (idx + 1) * colStep;
        const midX = colX + 168;
        sequenceFlows.push(`<bpmn:sequenceFlow id="${fOutDb}" sourceRef="${dId}" targetRef="UserTask_Mod_${idx + 1}" />`);
        diEdges.push(
          `<bpmndi:BPMNEdge id="${fOutDb}_di" bpmnElement="${fOutDb}"><di:waypoint x="${colX + 140}" y="422" /><di:waypoint x="${midX}" y="422" /><di:waypoint x="${midX}" y="115" /><di:waypoint x="${nextX}" y="115" /></bpmndi:BPMNEdge>`
        );
      } else {
        sequenceFlows.push(`<bpmn:sequenceFlow id="${fOutDb}" sourceRef="${dId}" targetRef="Gateway_ValidationDecision" />`);
        diEdges.push(
          `<bpmndi:BPMNEdge id="${fOutDb}_di" bpmnElement="${fOutDb}"><di:waypoint x="${colX + 140}" y="422" /><di:waypoint x="${gwX + 25}" y="422" /><di:waypoint x="${gwX + 25}" y="292" /></bpmndi:BPMNEdge>`
        );
      }
    });

    uiFlowNodeRefs.push('EndEvent_ErrorFeedback');
    apiFlowNodeRefs.push('Gateway_ValidationDecision');
    dbFlowNodeRefs.push('EndEvent_Success');

    const lastDbId = `ServiceTask_Db_${modules.length - 1}`;
    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
  xmlns:zeebe="http://camunda.org/schema/zeebe/1.0"
  xmlns:modeler="http://camunda.org/schema/modeler/1.0"
  id="Definitions_PipelineOrchestrator"
  targetNamespace="http://bpmn.io/schema/bpmn"
  exporter="OneSpec SDLC Studio"
  exporterVersion="2.2.0"
  modeler:executionPlatform="Camunda Cloud"
  modeler:executionPlatformVersion="8.5.0">

  <bpmn:collaboration id="Collaboration_WorkflowOrchestrator">
    <bpmn:participant id="Participant_Engine" name="${poolName} (${modules.length} Modules)" processRef="Process_PipelineWorkflow" />
  </bpmn:collaboration>

  <bpmn:process id="Process_PipelineWorkflow" isExecutable="true">
    <bpmn:laneSet id="LaneSet_Orchestrator">
      <bpmn:lane id="Lane_UI" name="${laneUser}">
        ${uiFlowNodeRefs.map((id) => `<bpmn:flowNodeRef>${id}</bpmn:flowNodeRef>`).join('\n        ')}
      </bpmn:lane>
      <bpmn:lane id="Lane_API" name="${laneApi}">
        ${apiFlowNodeRefs.map((id) => `<bpmn:flowNodeRef>${id}</bpmn:flowNodeRef>`).join('\n        ')}
      </bpmn:lane>
      <bpmn:lane id="Lane_DB" name="${laneDb}">
        ${dbFlowNodeRefs.map((id) => `<bpmn:flowNodeRef>${id}</bpmn:flowNodeRef>`).join('\n        ')}
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="StartEvent_Trigger" name="${startName}">
      <bpmn:outgoing>Flow_StartToUserTask</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:userTask id="UserTask_Interaction" name="${userTaskName}">
      <bpmn:documentation>Initial ingress &amp; authentication surface (${userStoryId}).</bpmn:documentation>
      <bpmn:incoming>Flow_StartToUserTask</bpmn:incoming>
      <bpmn:outgoing>Flow_UserTaskToGatewayAuth</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:serviceTask id="ServiceTask_GatewayAuth" name="${gatewayTaskName}" camunda:type="external" camunda:topic="gateway-auth">
      <bpmn:extensionElements>
        <zeebe:taskDefinition type="gateway-auth" retries="3" />
      </bpmn:extensionElements>
      <bpmn:incoming>Flow_UserTaskToGatewayAuth</bpmn:incoming>
      <bpmn:outgoing>Flow_GatewayToMod0</bpmn:outgoing>
    </bpmn:serviceTask>
    ${processElements.join('\n')}
    <bpmn:exclusiveGateway id="Gateway_ValidationDecision" name="${gatewayName}">
      <bpmn:incoming>Flow_LastDbToGateway</bpmn:incoming>
      <bpmn:outgoing>Flow_DecisionHappyPath</bpmn:outgoing>
      <bpmn:outgoing>Flow_DecisionNegativePath</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:endEvent id="EndEvent_Success" name="${endSuccessName}">
      <bpmn:incoming>Flow_DecisionHappyPath</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:endEvent id="EndEvent_ErrorFeedback" name="${endErrorName}">
      <bpmn:incoming>Flow_DecisionNegativePath</bpmn:incoming>
    </bpmn:endEvent>

    ${sequenceFlows.join('\n    ')}
    <bpmn:sequenceFlow id="Flow_DecisionHappyPath" name="[YES: VALID]" sourceRef="Gateway_ValidationDecision" targetRef="EndEvent_Success" />
    <bpmn:sequenceFlow id="Flow_DecisionNegativePath" name="[NO: REJECT]" sourceRef="Gateway_ValidationDecision" targetRef="EndEvent_ErrorFeedback" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_Orchestrator">
    <bpmndi:BPMNPlane id="BPMNPlane_Orchestrator" bpmnElement="Collaboration_WorkflowOrchestrator">
      <bpmndi:BPMNShape id="Participant_Engine_di" bpmnElement="Participant_Engine" isHorizontal="true">
        <dc:Bounds x="60" y="40" width="${poolWidth}" height="460" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_UI_di" bpmnElement="Lane_UI" isHorizontal="true">
        <dc:Bounds x="90" y="40" width="${laneWidth}" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_API_di" bpmnElement="Lane_API" isHorizontal="true">
        <dc:Bounds x="90" y="190" width="${laneWidth}" height="155" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_DB_di" bpmnElement="Lane_DB" isHorizontal="true">
        <dc:Bounds x="90" y="345" width="${laneWidth}" height="155" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="StartEvent_Trigger_di" bpmnElement="StartEvent_Trigger">
        <dc:Bounds x="130" y="97" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="UserTask_Interaction_di" bpmnElement="UserTask_Interaction">
        <dc:Bounds x="210" y="78" width="130" height="74" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="ServiceTask_GatewayAuth_di" bpmnElement="ServiceTask_GatewayAuth">
        <dc:Bounds x="210" y="230" width="130" height="74" />
      </bpmndi:BPMNShape>
      ${diShapes.join('\n      ')}
      <bpmndi:BPMNShape id="Gateway_ValidationDecision_di" bpmnElement="Gateway_ValidationDecision" isMarkerVisible="true">
        <dc:Bounds x="${gwX}" y="242" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_Success_di" bpmnElement="EndEvent_Success">
        <dc:Bounds x="${gwX + 130}" y="404" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_ErrorFeedback_di" bpmnElement="EndEvent_ErrorFeedback">
        <dc:Bounds x="${gwX + 130}" y="97" width="36" height="36" />
      </bpmndi:BPMNShape>
      ${diEdges.join('\n      ')}
      <bpmndi:BPMNEdge id="Flow_DecisionHappyPath_di" bpmnElement="Flow_DecisionHappyPath">
        <di:waypoint x="${gwX + 50}" y="267" />
        <di:waypoint x="${gwX + 90}" y="267" />
        <di:waypoint x="${gwX + 90}" y="422" />
        <di:waypoint x="${gwX + 130}" y="422" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_DecisionNegativePath_di" bpmnElement="Flow_DecisionNegativePath">
        <di:waypoint x="${gwX + 25}" y="242" />
        <di:waypoint x="${gwX + 25}" y="115" />
        <di:waypoint x="${gwX + 130}" y="115" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
  xmlns:zeebe="http://camunda.org/schema/zeebe/1.0"
  xmlns:modeler="http://camunda.org/schema/modeler/1.0"
  id="Definitions_PipelineOrchestrator"
  targetNamespace="http://bpmn.io/schema/bpmn"
  exporter="OneSpec SDLC Studio"
  exporterVersion="2.1.0"
  modeler:executionPlatform="Camunda Cloud"
  modeler:executionPlatformVersion="8.5.0">

  <bpmn:collaboration id="Collaboration_WorkflowOrchestrator">
    <bpmn:participant id="Participant_Engine" name="${poolName}" processRef="Process_PipelineWorkflow" />
  </bpmn:collaboration>

  <bpmn:process id="Process_PipelineWorkflow" isExecutable="true">
    <bpmn:laneSet id="LaneSet_Orchestrator">
      <!-- Lane 1: Client Presentation Layer -->
      <bpmn:lane id="Lane_UI" name="${laneUser}">
        <bpmn:flowNodeRef>StartEvent_Trigger</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>UserTask_Interaction</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>EndEvent_ErrorFeedback</bpmn:flowNodeRef>
      </bpmn:lane>

      <!-- Lane 2: API Gateway & Service Invariants -->
      <bpmn:lane id="Lane_API" name="${laneApi}">
        <bpmn:flowNodeRef>ServiceTask_GatewayAuth</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>ServiceTask_BackendValidation</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_ValidationDecision</bpmn:flowNodeRef>
      </bpmn:lane>

      <!-- Lane 3: Persistence Layer -->
      <bpmn:lane id="Lane_DB" name="${laneDb}">
        <bpmn:flowNodeRef>ServiceTask_DbCommit</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>EndEvent_Success</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <!-- Start Event -->
    <bpmn:startEvent id="StartEvent_Trigger" name="${startName}">
      <bpmn:outgoing>Flow_StartToUserTask</bpmn:outgoing>
    </bpmn:startEvent>

    <!-- User Task in Lane 1 -->
    <bpmn:userTask id="UserTask_Interaction" name="${userTaskName}">
      <bpmn:documentation>Client surface interaction linked to ${userStoryId}.</bpmn:documentation>
      <bpmn:incoming>Flow_StartToUserTask</bpmn:incoming>
      <bpmn:outgoing>Flow_UserTaskToGatewayAuth</bpmn:outgoing>
    </bpmn:userTask>

    <!-- Service Task 1 in Lane 2: API Gateway Ingress (Camunda 8 Zeebe + Camunda 7 Dual-Engine) -->
    <bpmn:serviceTask id="ServiceTask_GatewayAuth" name="${gatewayTaskName}" camunda:type="external" camunda:topic="gateway-auth">
      <bpmn:extensionElements>
        <zeebe:taskDefinition type="gateway-auth" retries="3" />
        <zeebe:ioMapping>
          <zeebe:input source="= request.headers" target="headers" />
          <zeebe:output source="= authStatus" target="authStatus" />
        </zeebe:ioMapping>
      </bpmn:extensionElements>
      <bpmn:documentation>Validates request signature, bearer token, and JSON schema.</bpmn:documentation>
      <bpmn:incoming>Flow_UserTaskToGatewayAuth</bpmn:incoming>
      <bpmn:outgoing>Flow_GatewayToValidation</bpmn:outgoing>
    </bpmn:serviceTask>

    <!-- Service Task 2 in Lane 2: Domain Logic Invariant Evaluation (Camunda 8 Zeebe + Camunda 7 Dual-Engine) -->
    <bpmn:serviceTask id="ServiceTask_BackendValidation" name="${serviceTaskName}" camunda:type="external" camunda:topic="invariant-engine">
      <bpmn:extensionElements>
        <zeebe:taskDefinition type="invariant-engine" retries="3" />
        <zeebe:ioMapping>
          <zeebe:input source="= request.body" target="payload" />
          <zeebe:output source="= validationResult" target="validationResult" />
        </zeebe:ioMapping>
      </bpmn:extensionElements>
      <bpmn:documentation>Enforces business invariants (${brList}).</bpmn:documentation>
      <bpmn:incoming>Flow_GatewayToValidation</bpmn:incoming>
      <bpmn:outgoing>Flow_ValidationToDecision</bpmn:outgoing>
    </bpmn:serviceTask>

    <!-- Exclusive Gateway XOR in Lane 2 -->
    <bpmn:exclusiveGateway id="Gateway_ValidationDecision" name="${gatewayName}">
      <bpmn:incoming>Flow_ValidationToDecision</bpmn:incoming>
      <bpmn:outgoing>Flow_DecisionHappyPath</bpmn:outgoing>
      <bpmn:outgoing>Flow_DecisionNegativePath</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <!-- Service Task 3 in Lane 3: Database Commit & Row Lock (Camunda 8 Zeebe + Camunda 7 Dual-Engine) -->
    <bpmn:serviceTask id="ServiceTask_DbCommit" name="${dbTaskName}" camunda:type="external" camunda:topic="persistence-engine">
      <bpmn:extensionElements>
        <zeebe:taskDefinition type="persistence-engine" retries="2" />
        <zeebe:ioMapping>
          <zeebe:input source="= transaction.id" target="txId" />
          <zeebe:output source="= commitResult" target="commitResult" />
        </zeebe:ioMapping>
      </bpmn:extensionElements>
      <bpmn:documentation>ACID transactional persistence with idempotency serialization.</bpmn:documentation>
      <bpmn:incoming>Flow_DecisionHappyPath</bpmn:incoming>
      <bpmn:outgoing>Flow_DbToSuccess</bpmn:outgoing>
    </bpmn:serviceTask>

    <!-- End Event 1: Success in Lane 3 -->
    <bpmn:endEvent id="EndEvent_Success" name="${endSuccessName}">
      <bpmn:incoming>Flow_DbToSuccess</bpmn:incoming>
    </bpmn:endEvent>

    <!-- End Event 2: Constraint Rejection in Lane 1 -->
    <bpmn:endEvent id="EndEvent_ErrorFeedback" name="${endErrorName}">
      <bpmn:incoming>Flow_DecisionNegativePath</bpmn:incoming>
    </bpmn:endEvent>

    <!-- Sequence Flows -->
    <bpmn:sequenceFlow id="Flow_StartToUserTask" sourceRef="StartEvent_Trigger" targetRef="UserTask_Interaction" />
    <bpmn:sequenceFlow id="Flow_UserTaskToGatewayAuth" sourceRef="UserTask_Interaction" targetRef="ServiceTask_GatewayAuth" />
    <bpmn:sequenceFlow id="Flow_GatewayToValidation" sourceRef="ServiceTask_GatewayAuth" targetRef="ServiceTask_BackendValidation" />
    <bpmn:sequenceFlow id="Flow_ValidationToDecision" sourceRef="ServiceTask_BackendValidation" targetRef="Gateway_ValidationDecision" />
    <bpmn:sequenceFlow id="Flow_DecisionHappyPath" name="[YES: VALID]" sourceRef="Gateway_ValidationDecision" targetRef="ServiceTask_DbCommit" />
    <bpmn:sequenceFlow id="Flow_DecisionNegativePath" name="[NO: REJECT]" sourceRef="Gateway_ValidationDecision" targetRef="EndEvent_ErrorFeedback" />
    <bpmn:sequenceFlow id="Flow_DbToSuccess" sourceRef="ServiceTask_DbCommit" targetRef="EndEvent_Success" />
  </bpmn:process>

  <!-- Canonical Diagram Interchange (DI) Layout -->
  <bpmndi:BPMNDiagram id="BPMNDiagram_Orchestrator">
    <bpmndi:BPMNPlane id="BPMNPlane_Orchestrator" bpmnElement="Collaboration_WorkflowOrchestrator">
      <!-- Participant Pool Shape -->
      <bpmndi:BPMNShape id="Participant_Engine_di" bpmnElement="Participant_Engine" isHorizontal="true">
        <dc:Bounds x="60" y="40" width="1020" height="420" />
      </bpmndi:BPMNShape>

      <!-- Lane 1: UI Shape -->
      <bpmndi:BPMNShape id="Lane_UI_di" bpmnElement="Lane_UI" isHorizontal="true">
        <dc:Bounds x="90" y="40" width="990" height="130" />
      </bpmndi:BPMNShape>

      <!-- Lane 2: API Gateway & Service Invariants Shape -->
      <bpmndi:BPMNShape id="Lane_API_di" bpmnElement="Lane_API" isHorizontal="true">
        <dc:Bounds x="90" y="170" width="990" height="140" />
      </bpmndi:BPMNShape>

      <!-- Lane 3: Persistence Shape -->
      <bpmndi:BPMNShape id="Lane_DB_di" bpmnElement="Lane_DB" isHorizontal="true">
        <dc:Bounds x="90" y="310" width="990" height="150" />
      </bpmndi:BPMNShape>

      <!-- Start Event (Lane 1) -->
      <bpmndi:BPMNShape id="StartEvent_Trigger_di" bpmnElement="StartEvent_Trigger">
        <dc:Bounds x="140" y="87" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="125" y="128" width="66" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <!-- User Task (Lane 1) -->
      <bpmndi:BPMNShape id="UserTask_Interaction_di" bpmnElement="UserTask_Interaction">
        <dc:Bounds x="220" y="65" width="130" height="80" />
      </bpmndi:BPMNShape>

      <!-- Service Task 1: Gateway Auth (Lane 2) -->
      <bpmndi:BPMNShape id="ServiceTask_GatewayAuth_di" bpmnElement="ServiceTask_GatewayAuth">
        <dc:Bounds x="220" y="200" width="140" height="80" />
      </bpmndi:BPMNShape>

      <!-- Service Task 2: Backend Validation (Lane 2) -->
      <bpmndi:BPMNShape id="ServiceTask_BackendValidation_di" bpmnElement="ServiceTask_BackendValidation">
        <dc:Bounds x="410" y="200" width="150" height="80" />
      </bpmndi:BPMNShape>

      <!-- Exclusive Gateway Decision (Lane 2) -->
      <bpmndi:BPMNShape id="Gateway_ValidationDecision_di" bpmnElement="Gateway_ValidationDecision" isMarkerVisible="true">
        <dc:Bounds x="610" y="215" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="600" y="272" width="70" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <!-- Service Task 3: DB Commit (Lane 3) -->
      <bpmndi:BPMNShape id="ServiceTask_DbCommit_di" bpmnElement="ServiceTask_DbCommit">
        <dc:Bounds x="720" y="345" width="150" height="80" />
      </bpmndi:BPMNShape>

      <!-- End Event: Success (Lane 3) -->
      <bpmndi:BPMNShape id="EndEvent_Success_di" bpmnElement="EndEvent_Success">
        <dc:Bounds x="930" y="367" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="915" y="410" width="66" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <!-- End Event: Error Feedback (Lane 1) -->
      <bpmndi:BPMNShape id="EndEvent_ErrorFeedback_di" bpmnElement="EndEvent_ErrorFeedback">
        <dc:Bounds x="780" y="87" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="760" y="128" width="76" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <!-- Edges / Sequence Flows -->
      <bpmndi:BPMNEdge id="Flow_StartToUserTask_di" bpmnElement="Flow_StartToUserTask">
        <di:waypoint x="176" y="105" />
        <di:waypoint x="220" y="105" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_UserTaskToGatewayAuth_di" bpmnElement="Flow_UserTaskToGatewayAuth">
        <di:waypoint x="285" y="145" />
        <di:waypoint x="285" y="200" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_GatewayToValidation_di" bpmnElement="Flow_GatewayToValidation">
        <di:waypoint x="360" y="240" />
        <di:waypoint x="410" y="240" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_ValidationToDecision_di" bpmnElement="Flow_ValidationToDecision">
        <di:waypoint x="560" y="240" />
        <di:waypoint x="610" y="240" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_DecisionHappyPath_di" bpmnElement="Flow_DecisionHappyPath">
        <di:waypoint x="660" y="240" />
        <di:waypoint x="690" y="240" />
        <di:waypoint x="690" y="385" />
        <di:waypoint x="720" y="385" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="670" y="310" width="65" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_DecisionNegativePath_di" bpmnElement="Flow_DecisionNegativePath">
        <di:waypoint x="635" y="215" />
        <di:waypoint x="635" y="105" />
        <di:waypoint x="780" y="105" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="645" y="150" width="70" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_DbToSuccess_di" bpmnElement="Flow_DbToSuccess">
        <di:waypoint x="870" y="385" />
        <di:waypoint x="930" y="385" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}
