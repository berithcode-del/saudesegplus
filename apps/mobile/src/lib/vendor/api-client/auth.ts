import type { StorageAdapter } from './storage/types.js';
import type { JWTPayload } from '../api-types';

const TOKEN_KEY = 'token';
const ROLE_KEY = 'userRole';
const PROFILE_ID_KEY = 'profileId';

export function getAuthToken(storage: StorageAdapter): string | null {
  return storage.getItem(TOKEN_KEY);
}

export function getProfileIdFromToken(storage: StorageAdapter): string | null {
  try {
    const token = getAuthToken(storage);
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload: JWTPayload = JSON.parse(atob(parts[1]!));
    return payload?.profileId ?? null;
  } catch {
    return null;
  }
}

export function getUserRole(storage: StorageAdapter): string | null {
  return storage.getItem(ROLE_KEY);
}

export function persistSession(storage: StorageAdapter, token: string, role?: string, profileId?: string): void {
  storage.setItem(TOKEN_KEY, token);
  if (role) storage.setItem(ROLE_KEY, role);
  if (profileId) storage.setItem(PROFILE_ID_KEY, profileId);
}

export function clearSession(storage: StorageAdapter): void {
  storage.removeItem(TOKEN_KEY);
  storage.removeItem(ROLE_KEY);
  storage.removeItem(PROFILE_ID_KEY);
}
