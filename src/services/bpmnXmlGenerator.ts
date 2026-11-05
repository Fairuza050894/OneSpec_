/**
 * OneSpec SDLC Workbench - Deterministic ISO/IEC 19510 (BPMN 2.0) XML Generator
 * Standard namespace: http://www.omg.org/spec/BPMN/20100524/MODEL
 * Output adheres to Camunda Modeler layout rules with horizontal Pools, dual Swimlanes, and orthogonal DI coordinates.
 */

export interface BpmnGeneratorInput {
  poolName?: string;
  workflowTitle?: string;
  userStoryId?: string;
  businessRuleIds?: string[];
  laneUserTitle?: string;
  laneApiTitle?: string;
  startEventName?: string;
  userTaskName?: string;
  serviceTaskName?: string;
  gatewayName?: string;
  endSuccessName?: string;
  endErrorName?: string;
}

export function generateCanonicalBpmn2Xml(input: BpmnGeneratorInput = {}): string {
  const isMobospace = input.poolName?.includes('Mobospace') || input.workflowTitle?.includes('Mobospace') || input.workflowTitle?.includes('Operator');
  const poolName = input.poolName || (isMobospace ? 'Mobospace Access & Dispatch Pool' : 'Voucher & Promotion Redemption Pool');
  const userStoryId = input.userStoryId || 'REQ-US-01';
  const brList = input.businessRuleIds?.join(', ') || 'BR-01, BR-02';
  const laneUser = input.laneUserTitle || (isMobospace ? 'Operator UI Layer (Nuxt 3 Client)' : 'Lane 1: User / Presentation Layer (UI)');
  const laneApi = input.laneApiTitle || (isMobospace ? 'Auth Gateway & Telemetry Controller' : 'Lane 2: Application API & Persistence Layer');

  const startName = input.startEventName || (isMobospace ? 'Open Login Portal' : 'Checkout Page Opened');
  const userTaskName = input.userTaskName || (isMobospace ? `Select Tenant & Submit Credentials (FAIRUZA.REST) [${userStoryId}]` : `Enter Alphanumeric Voucher Code [${userStoryId}]`);
  const serviceTaskName = input.serviceTaskName || (isMobospace ? `Validate Credentials & Tenant [POST /api/_auth/session] [${brList}]` : `Execute Business Rules Validation [${brList}]`);
  const gatewayName = input.gatewayName || (isMobospace ? 'Credentials & Tenant Valid?' : 'Validation Passed? (BR-01 & BR-02)');
  const endSuccessName = input.endSuccessName || (isMobospace ? 'Access Granted [HTTP 200 OK]' : 'Discount Applied [HTTP 200 OK]');
  const endErrorName = input.endErrorName || (isMobospace ? 'Display Auth Error [HTTP 401 / 422]' : 'Display Rejection Message [HTTP 409 / 422]');

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
  id="Definitions_OneSpecSDLC"
  targetNamespace="http://bpmn.io/schema/bpmn"
  exporter="OneSpec SDLC Studio"
  exporterVersion="1.0.0">

  <bpmn:collaboration id="Collaboration_OneSpecProcess">
    <bpmn:participant id="Participant_Engine" name="${poolName}" processRef="Process_MainWorkflow" />
  </bpmn:collaboration>

  <bpmn:process id="Process_MainWorkflow" isExecutable="true">
    <bpmn:laneSet id="LaneSet_Architecture">
      <!-- Lane 1: User / Presentation Layer (UI) -->
      <bpmn:lane id="Lane_UI" name="${laneUser}">
        <bpmn:flowNodeRef>StartEvent_Trigger</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>UserTask_Interaction</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>EndEvent_ErrorFeedback</bpmn:flowNodeRef>
      </bpmn:lane>

      <!-- Lane 2: Application API & Persistence Layer -->
      <bpmn:lane id="Lane_API" name="${laneApi}">
        <bpmn:flowNodeRef>ServiceTask_BackendValidation</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_ValidationDecision</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>EndEvent_Success</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <!-- Start Event -->
    <bpmn:startEvent id="StartEvent_Trigger" name="${startName}">
      <bpmn:outgoing>Flow_StartToUserTask</bpmn:outgoing>
    </bpmn:startEvent>

    <!-- User Task in Lane 1 -->
    <bpmn:userTask id="UserTask_Interaction" name="${userTaskName}">
      <bpmn:documentation>Traces to ${userStoryId} and Field Validation VR-xx.</bpmn:documentation>
      <bpmn:incoming>Flow_StartToUserTask</bpmn:incoming>
      <bpmn:outgoing>Flow_UserTaskToServiceTask</bpmn:outgoing>
    </bpmn:userTask>

    <!-- Service Task in Lane 2 -->
    <bpmn:serviceTask id="ServiceTask_BackendValidation" name="${serviceTaskName}" camunda:type="external" camunda:topic="backend-validation">
      <bpmn:documentation>Evaluates ${brList} within strict latency SLA.</bpmn:documentation>
      <bpmn:incoming>Flow_UserTaskToServiceTask</bpmn:incoming>
      <bpmn:outgoing>Flow_ServiceTaskToGateway</bpmn:outgoing>
    </bpmn:serviceTask>

    <!-- Exclusive Gateway XOR in Lane 2 -->
    <bpmn:exclusiveGateway id="Gateway_ValidationDecision" name="${gatewayName}">
      <bpmn:incoming>Flow_ServiceTaskToGateway</bpmn:incoming>
      <bpmn:outgoing>Flow_DecisionHappyPath</bpmn:outgoing>
      <bpmn:outgoing>Flow_DecisionNegativePath</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <!-- End Event 1: Happy Path (HTTP 200) in Lane 2 -->
    <bpmn:endEvent id="EndEvent_Success" name="${endSuccessName}">
      <bpmn:incoming>Flow_DecisionHappyPath</bpmn:incoming>
    </bpmn:endEvent>

    <!-- End Event 2: Negative Constraint Feedback (HTTP 401 / 409 / 422) in Lane 1 -->
    <bpmn:endEvent id="EndEvent_ErrorFeedback" name="${endErrorName}">
      <bpmn:incoming>Flow_DecisionNegativePath</bpmn:incoming>
    </bpmn:endEvent>

    <!-- Sequence Flows -->
    <bpmn:sequenceFlow id="Flow_StartToUserTask" sourceRef="StartEvent_Trigger" targetRef="UserTask_Interaction" />
    <bpmn:sequenceFlow id="Flow_UserTaskToServiceTask" sourceRef="UserTask_Interaction" targetRef="ServiceTask_BackendValidation" />
    <bpmn:sequenceFlow id="Flow_ServiceTaskToGateway" sourceRef="ServiceTask_BackendValidation" targetRef="Gateway_ValidationDecision" />
    <bpmn:sequenceFlow id="Flow_DecisionHappyPath" name="[YES: HTTP 200]" sourceRef="Gateway_ValidationDecision" targetRef="EndEvent_Success" />
    <bpmn:sequenceFlow id="Flow_DecisionNegativePath" name="[NO: REJECT]" sourceRef="Gateway_ValidationDecision" targetRef="EndEvent_ErrorFeedback" />
  </bpmn:process>

  <!-- Canonical Diagram Interchange (DI) with +70px Horizontal Clearance (Start Event shifted to x=302) -->
  <bpmndi:BPMNDiagram id="BPMNDiagram_OneSpec">
    <bpmndi:BPMNPlane id="BPMNPlane_OneSpec" bpmnElement="Collaboration_OneSpecProcess">
      <!-- Participant Pool Shape with generous clearance -->
      <bpmndi:BPMNShape id="Participant_Engine_di" bpmnElement="Participant_Engine" isHorizontal="true">
        <dc:Bounds x="140" y="80" width="980" height="360" />
      </bpmndi:BPMNShape>

      <!-- Lane 1: UI Shape (increased horizontal spacing from pool header) -->
      <bpmndi:BPMNShape id="Lane_UI_di" bpmnElement="Lane_UI" isHorizontal="true">
        <dc:Bounds x="206" y="80" width="914" height="170" />
      </bpmndi:BPMNShape>

      <!-- Lane 2: API Shape (increased horizontal spacing from pool header) -->
      <bpmndi:BPMNShape id="Lane_API_di" bpmnElement="Lane_API" isHorizontal="true">
        <dc:Bounds x="206" y="250" width="914" height="190" />
      </bpmndi:BPMNShape>

      <!-- Start Event Shape: Shifted to x=302 (+70px right from 232) so vertical Pool/Lane labels NEVER overlap -->
      <bpmndi:BPMNShape id="StartEvent_Trigger_di" bpmnElement="StartEvent_Trigger">
        <dc:Bounds x="302" y="142" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="272" y="185" width="96" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <!-- User Task Shape: Shifted to x=390 (+70px right) -->
      <bpmndi:BPMNShape id="UserTask_Interaction_di" bpmnElement="UserTask_Interaction">
        <dc:Bounds x="390" y="120" width="165" height="80" />
      </bpmndi:BPMNShape>

      <!-- Service Task Shape: Shifted to x=600 (+80px right) -->
      <bpmndi:BPMNShape id="ServiceTask_BackendValidation_di" bpmnElement="ServiceTask_BackendValidation">
        <dc:Bounds x="600" y="300" width="175" height="80" />
      </bpmndi:BPMNShape>

      <!-- Exclusive Gateway Shape: Shifted to x=825 (+90px right) -->
      <bpmndi:BPMNShape id="Gateway_ValidationDecision_di" bpmnElement="Gateway_ValidationDecision" isMarkerVisible="true">
        <dc:Bounds x="825" y="315" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="810" y="372" width="85" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <!-- Success End Event Shape: Shifted to x=960 -->
      <bpmndi:BPMNShape id="EndEvent_Success_di" bpmnElement="EndEvent_Success">
        <dc:Bounds x="960" y="322" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="935" y="365" width="88" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <!-- Error End Event Shape: Shifted to x=960 -->
      <bpmndi:BPMNShape id="EndEvent_ErrorFeedback_di" bpmnElement="EndEvent_ErrorFeedback">
        <dc:Bounds x="960" y="142" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="930" y="185" width="96" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <!-- Sequence Flow Edges with Manhattan Waypoints -->
      <bpmndi:BPMNEdge id="Flow_StartToUserTask_di" bpmnElement="Flow_StartToUserTask">
        <di:waypoint x="338" y="160" />
        <di:waypoint x="390" y="160" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_UserTaskToServiceTask_di" bpmnElement="Flow_UserTaskToServiceTask">
        <di:waypoint x="472" y="200" />
        <di:waypoint x="472" y="340" />
        <di:waypoint x="600" y="340" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_ServiceTaskToGateway_di" bpmnElement="Flow_ServiceTaskToGateway">
        <di:waypoint x="775" y="340" />
        <di:waypoint x="825" y="340" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_DecisionHappyPath_di" bpmnElement="Flow_DecisionHappyPath">
        <di:waypoint x="875" y="340" />
        <di:waypoint x="960" y="340" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="878" y="308" width="85" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_DecisionNegativePath_di" bpmnElement="Flow_DecisionNegativePath">
        <di:waypoint x="850" y="315" />
        <di:waypoint x="850" y="160" />
        <di:waypoint x="960" y="160" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="858" y="221" width="80" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}
