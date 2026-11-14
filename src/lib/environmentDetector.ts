/**
 * OneSpec SDLC Workbench - Environment Classifier & Production Safety Guard
 * Standards:
 * - Autonomous Sandbox Crawling vs Production Safe Read-Only Guard
 */

import type { TargetEnvironmentMode } from '@/types/sdlc';

export interface EnvironmentDetectionResult {
  mode: 'SANDBOX_AUTONOMOUS' | 'PRODUCTION_READ_ONLY';
  reason: string;
  isStagingOrLocal: boolean;
}

export function detectEnvironment(targetUrl: string, requestedMode?: TargetEnvironmentMode): EnvironmentDetectionResult {
  if (requestedMode && requestedMode !== 'AUTO_DETECT') {
    return {
      mode: requestedMode,
      reason: requestedMode === 'SANDBOX_AUTONOMOUS'
        ? 'Manual configuration: Sandbox Autonomous mode (Full robotic exploration enabled).'
        : 'Manual configuration: Production Read-Only mode (Safe guard active: mutating actions locked).',
      isStagingOrLocal: requestedMode === 'SANDBOX_AUTONOMOUS',
    };
  }

  try {
    const raw = (targetUrl || 'http://localhost:3000').trim();
    const u = new URL(raw.startsWith('http') ? raw : `http://${raw}`);
    const host = u.hostname.toLowerCase();
    const port = u.port;

    const isLocalOrPrivate =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.') ||
      host.endsWith('.local') ||
      host.endsWith('.internal');

    const isStagingDomain =
      /staging|sandbox|dev|test|uat|qa|preview|demo|stage/i.test(host);

    const isNonStandardPort = !!(port && port !== '80' && port !== '443');

    if (isLocalOrPrivate || isStagingDomain || isNonStandardPort) {
      return {
        mode: 'SANDBOX_AUTONOMOUS',
        reason: `Detected staging/sandbox environment (${isLocalOrPrivate ? 'Local/Private Network' : isStagingDomain ? 'Staging Host' : `Custom Port :${port}`}). Autonomous robotic exploration enabled.`,
        isStagingOrLocal: true,
      };
    }

    return {
      mode: 'PRODUCTION_READ_ONLY',
      reason: `Detected live production domain (${host}). High-assurance safety guard active: mutating actions locked to prevent unintended real-world state changes.`,
      isStagingOrLocal: false,
    };
  } catch {
    return {
      mode: 'SANDBOX_AUTONOMOUS',
      reason: 'Fallback to sandbox mode',
      isStagingOrLocal: true,
    };
  }
}
