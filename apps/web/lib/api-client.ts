import { ApiClient, localStorageAdapter } from '@repo/api-client';

const client = new ApiClient({ storage: localStorageAdapter });

export { client as apiClient };
