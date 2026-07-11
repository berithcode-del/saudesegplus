import { createCapacitorStorageAdapter } from '@/lib/vendor/api-client';
import type { StorageAdapter } from '@/lib/vendor/api-client';

/**
 * Uses Capacitor Preferences in the Android shell and keeps localStorage as a
 * browser/dev fallback through the shared adapter.
 */
export const mobileStorage: StorageAdapter = createCapacitorStorageAdapter();
