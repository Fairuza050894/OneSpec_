/**
 * OneSpec SDLC Workbench - Local User Profile & Self-Attestation Manager
 * Standards: ISO 9001:2015 Clause 7.5 & ISO/IEC/IEEE 29148:2018
 * Ticket: T-14 (F-08, F-20)
 */

export interface LocalUserProfile {
  name: string;
  role: string;
  email?: string;
  updatedAt?: string;
}

export const USER_PROFILE_STORAGE_KEY = 'onespec_user_profile';

export const DEFAULT_USER_PROFILE: LocalUserProfile = {
  name: '',
  role: 'Lead Systems Architect',
};

/**
 * Loads the operator's local self-attestation profile from browser localStorage.
 */
export function loadLocalUserProfile(): LocalUserProfile {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_USER_PROFILE;
  }
  try {
    const raw = window.localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PROFILE;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.name === 'string') {
      return {
        name: parsed.name.trim(),
        role: (parsed.role || 'Lead Systems Architect').trim(),
        email: parsed.email?.trim(),
        updatedAt: parsed.updatedAt,
      };
    }
  } catch {
    // Fallback on JSON parse failure
  }
  return DEFAULT_USER_PROFILE;
}

/**
 * Persists the operator's local self-attestation profile to browser localStorage.
 */
export function saveLocalUserProfile(profile: LocalUserProfile): LocalUserProfile {
  const cleanProfile: LocalUserProfile = {
    name: profile.name.trim(),
    role: profile.role.trim() || 'Lead Systems Architect',
    email: profile.email?.trim(),
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(cleanProfile));
    } catch {
      // Storage quota or restriction fallback
    }
  }
  return cleanProfile;
}
