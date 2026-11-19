/**
 * OneSpec SDLC Workbench - Workspace Cache Envelope & Stale State Detector
 * Standards: ISO/IEC/IEEE 29148:2018 & ISO/IEC 25010
 * Ticket: T-13 (F-13)
 */

export interface WorkspaceEnvelope<T> {
  schemaVersion: number;      // Increment when data schema types change
  engineBuildId: string;      // Build/version fingerprint (e.g. process.env.NEXT_PUBLIC_ENGINE_BUILD_ID || package.json version)
  compiledAt: string;         // ISO timestamp of compilation
  data: T;
}

export const CURRENT_SCHEMA_VERSION = 2;

function getEngineBuildId(): string {
  try {
    const globalProc =
      typeof globalThis !== 'undefined'
        ? (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process
        : undefined;
    return (
      globalProc?.env?.NEXT_PUBLIC_ENGINE_BUILD_ID ||
      globalProc?.env?.ONESPEC_ENGINE_BUILD_ID ||
      '1.0.0-revamp-v2'
    );
  } catch {
    return '1.0.0-revamp-v2';
  }
}

export const CURRENT_ENGINE_BUILD_ID = getEngineBuildId();

export const WORKSPACE_CACHE_LOCAL_STORAGE_KEY = 'onespec_active_workspace_v2';

export interface WorkspaceCacheValidation<T> {
  isStale: boolean;
  staleReason: string | null;
  envelope: WorkspaceEnvelope<T> | null;
  data: T | null;
}

/**
 * Checks if the given object conforms to the WorkspaceEnvelope structure.
 */
export function isWorkspaceEnvelope<T = unknown>(obj: unknown): obj is WorkspaceEnvelope<T> {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.schemaVersion === 'number' &&
    typeof o.engineBuildId === 'string' &&
    typeof o.compiledAt === 'string' &&
    'data' in o &&
    o.data !== undefined
  );
}

/**
 * Validates a cached object or JSON string against the current engine build ID and schema version.
 * If schemaVersion or engineBuildId differs, or if the payload lacks an envelope (legacy raw format),
 * isStale is marked true with an explanatory staleReason.
 */
export function validateWorkspaceCache<T = unknown>(
  cachedInput: unknown,
  expectedBuildId: string = CURRENT_ENGINE_BUILD_ID,
  expectedSchemaVersion: number = CURRENT_SCHEMA_VERSION
): WorkspaceCacheValidation<T> {
  if (cachedInput == null) {
    return {
      isStale: false,
      staleReason: null,
      envelope: null,
      data: null,
    };
  }

  let parsed: unknown = cachedInput;
  if (typeof cachedInput === 'string') {
    try {
      parsed = JSON.parse(cachedInput);
    } catch {
      return {
        isStale: true,
        staleReason: 'Format cache rusak (JSON parse error). Jalankan ulang pipeline.',
        envelope: null,
        data: null,
      };
    }
  }

  // Check if parsed object is wrapped in WorkspaceEnvelope
  if (!isWorkspaceEnvelope<T>(parsed)) {
    // Format lama tanpa envelope (legacy raw format) -> dianggap basi per F-13
    return {
      isStale: true,
      staleReason: 'Data dikompilasi dengan format lama tanpa envelope versi. Jalankan ulang pipeline.',
      envelope: null,
      data: parsed as T,
    };
  }

  const envelope = parsed as WorkspaceEnvelope<T>;

  // Check schema version
  if (envelope.schemaVersion !== expectedSchemaVersion) {
    return {
      isStale: true,
      staleReason: `Data dikompilasi dengan versi skema lama (v${envelope.schemaVersion} vs saat ini v${expectedSchemaVersion}). Jalankan ulang pipeline.`,
      envelope,
      data: envelope.data,
    };
  }

  // Check engine build ID
  if (envelope.engineBuildId !== expectedBuildId) {
    return {
      isStale: true,
      staleReason: `Data dikompilasi dengan engine lama (build ${envelope.engineBuildId || 'unknown'}). Jalankan ulang pipeline.`,
      envelope,
      data: envelope.data,
    };
  }

  return {
    isStale: false,
    staleReason: null,
    envelope,
    data: envelope.data,
  };
}

/**
 * Wraps arbitrary workspace state into a timestamped, versioned WorkspaceEnvelope.
 */
export function wrapWorkspaceEnvelope<T>(
  data: T,
  options?: { schemaVersion?: number; engineBuildId?: string; compiledAt?: string }
): WorkspaceEnvelope<T> {
  return {
    schemaVersion: options?.schemaVersion ?? CURRENT_SCHEMA_VERSION,
    engineBuildId: options?.engineBuildId ?? CURRENT_ENGINE_BUILD_ID,
    compiledAt: options?.compiledAt ?? new Date().toISOString(),
    data,
  };
}

/**
 * Persists an enveloped workspace state to browser localStorage.
 */
export function saveWorkspaceEnvelopeToLocalStorage<T>(
  data: T,
  key: string = WORKSPACE_CACHE_LOCAL_STORAGE_KEY
): WorkspaceEnvelope<T> | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const envelope = wrapWorkspaceEnvelope(data);
  try {
    window.localStorage.setItem(key, JSON.stringify(envelope));
    return envelope;
  } catch {
    return null;
  }
}

/**
 * Reads and validates an enveloped workspace state from browser localStorage.
 */
export function loadWorkspaceEnvelopeFromLocalStorage<T>(
  key: string = WORKSPACE_CACHE_LOCAL_STORAGE_KEY
): WorkspaceCacheValidation<T> {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { isStale: false, staleReason: null, envelope: null, data: null };
  }
  try {
    const raw = window.localStorage.getItem(key);
    return validateWorkspaceCache<T>(raw);
  } catch {
    return {
      isStale: true,
      staleReason: 'Gagal membaca cache dari local storage.',
      envelope: null,
      data: null,
    };
  }
}
