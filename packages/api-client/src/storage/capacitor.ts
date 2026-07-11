import type { StorageAdapter } from './types';

/**
 * Creates a Capacitor Preferences storage adapter.
 * Falls back to localStorage when Capacitor is not available.
 *
 * Usage in mobile app:
 *   import { createCapacitorStorageAdapter } from '@repo/api-client';
 *   const storage = createCapacitorStorageAdapter();
 *   const client = new ApiClient({ storage });
 */
export function createCapacitorStorageAdapter(): StorageAdapter {
  let preferences: { getItem: (key: string) => Promise<{ value: string | null }>; setItem: (key: string, value: string) => Promise<void>; removeItem: (key: string) => Promise<void> } | null = null;

  const loadCapacitor = async (): Promise<void> => {
    if (preferences) return;
    try {
      const mod = await import('@capacitor/preferences' as string);
      preferences = mod.Preferences;
    } catch {
      // Capacitor not available — localStorage fallback will be used
    }
  };

  // Try to load in background
  void loadCapacitor();

  return {
    getItem(key: string): string | null {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    },

    async setItem(key: string, value: string): Promise<void> {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      if (preferences) {
        try {
          await preferences.setItem(key, value);
        } catch { /* ignore */ }
      }
    },

    async removeItem(key: string): Promise<void> {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      if (preferences) {
        try {
          await preferences.removeItem(key);
        } catch { /* ignore */ }
      }
    },
  };
}
