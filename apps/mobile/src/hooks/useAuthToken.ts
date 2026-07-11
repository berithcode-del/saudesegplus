import { useCallback } from 'react';
import { getAuthToken, getProfileIdFromToken, persistSession, clearSession } from '@/lib/vendor/api-client';
import { mobileStorage } from '../lib/storage';

/**
 * Hook para gerenciar autenticação via StorageAdapter.
 * Web usa localStorage; mobile usará Capacitor Preferences.
 */
export function useAuthToken() {
  const token = getAuthToken(mobileStorage);
  const profileId = getProfileIdFromToken(mobileStorage);

  const save = useCallback((jwt: string, role?: string, pid?: string) => {
    persistSession(mobileStorage, jwt, role, pid);
  }, []);

  const clear = useCallback(() => {
    clearSession(mobileStorage);
  }, []);

  return { token, profileId, save, clear, isAuthenticated: !!token };
}
