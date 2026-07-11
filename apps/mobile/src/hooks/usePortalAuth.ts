import { useState, useCallback } from 'react';
import { useApiClient } from '../app/providers/ApiProvider';
import { mobileStorage } from '../lib/storage';
import { persistSession } from '@/lib/vendor/api-client';

export interface PortalAuthResult {
  sessionToken: string;
  processId: string;
  patientName: string;
  companyName: string;
  examPurpose: string;
}

export interface PortalPreview {
  empresaNome?: string;
  tipoExame?: string;
  expirado?: boolean;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export function usePortalAuth() {
  const apiClient = useApiClient();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [authResult, setAuthResult] = useState<PortalAuthResult | null>(null);

  const previewToken = useCallback(
    async (token: string): Promise<PortalPreview | null> => {
      try {
        const data = (await apiClient.fetch(`/api/portal/preview/${token}`)) as PortalPreview;
        return data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Token inválido';
        setError(msg);
        return null;
      }
    },
    [apiClient],
  );

  const authenticate = useCallback(
    async (token: string, cpf: string, birthDate: string): Promise<boolean> => {
      setStatus('loading');
      setError(null);
      try {
        const data = (await apiClient.fetch('/api/portal/auth', {
          method: 'POST',
          body: JSON.stringify({ token, cpf, birthDate }),
        })) as PortalAuthResult;

        const result: PortalAuthResult = {
          sessionToken: (data as any).sessionToken ?? (data as any).access_token ?? '',
          processId: data.processId,
          patientName: data.patientName,
          companyName: data.companyName,
          examPurpose: data.examPurpose,
        };

        persistSession(mobileStorage, result.sessionToken, 'PORTAL', result.processId);
        setAuthResult(result);
        setStatus('success');
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Dados não conferem ou link expirado.';
        setError(msg);
        setStatus('error');
        return false;
      }
    },
    [apiClient],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setAuthResult(null);
  }, []);

  return { status, error, authResult, previewToken, authenticate, reset };
}
