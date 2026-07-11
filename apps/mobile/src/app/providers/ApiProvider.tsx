import { createContext, useContext, useMemo } from 'react';
import { ApiClient } from '@/lib/vendor/api-client';
import { mobileStorage } from '../../lib/storage';

const ApiContext = createContext<ApiClient | null>(null);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => new ApiClient({ storage: mobileStorage }), []);
  return (
    <ApiContext.Provider value={client}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApiClient(): ApiClient {
  const client = useContext(ApiContext);
  if (!client) throw new Error('useApiClient must be used within ApiProvider');
  return client;
}
