import assert from 'node:assert/strict';
import { unifiedReportGenerator } from '../src/services/unifiedReportGenerator';
import type { Iso26514ModuleManual } from '../src/services/iso26514UserManualService';

const manual = {
  moduleId: 'MOD-01', moduleName: 'Invoices', routePath: '/invoices', locale: 'en',
  section3_ButtonsAndIconsDictionary: { heading: 'Buttons', buttons: [] },
  section4_SearchAndFiltersDictionary: { heading: 'Filters', filters: [] },
  section7_BusinessLogicAndStateRules: {
    heading: 'Business rules', domainClassification: { domainLabel: 'Finance', summary: 'Invoice rules' },
    coreBusinessRules: [{ ruleCode: 'BR-1', ruleTitle: 'Positive amount', plainHumanCondition: 'Amount must be positive', logicExplanation: 'Positive financial value', formulaOrCondition: 'amount > 0', failureImpact: 'Reject save' }],
    stateTransitionLifecycle: [{ fromState: 'DRAFT', userTrigger: 'Submit', systemValidation: 'Valid amount', toState: 'POSTED', visibleUiIndicator: 'Posted badge' }],
  },
  section8_UiToApiAndErrorRecoveryMatrix: { heading: 'API interactions', interactions: [{ uiControlOrAction: 'Submit', triggeredEndpoint: 'POST /invoices', requestPayloadSummary: '{}', onSuccessHttp200_201: 'Created', onErrorHttp4xx_5xx: 'Validation error', userRecoveryAction: 'Correct amount' }] },
  section9_DomainGlossaryAndAcronyms: { heading: 'Glossary', terms: [] },
} as unknown as Iso26514ModuleManual;

const html = unifiedReportGenerator.generateExcelQaWorkbookHtml({
  appName: 'Regression check', targetUrl: 'https://example.invalid', testScenarios: [], rtmRows: [], bugReports: [], uatFlows: [], userManuals: [manual],
});
assert.match(html, /Positive amount/);
assert.match(html, /Amount must be positive/);
assert.match(html, /DRAFT → POSTED/);
assert.match(html, /POST \/invoices/);
assert.match(html, /Correct amount/);
console.log('Workbook sections 7–8 verified');
