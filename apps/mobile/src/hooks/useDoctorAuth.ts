import { useState, useCallback } from 'react';
import { useApiClient } from '../app/providers/ApiProvider';
import { mobileStorage } from '../lib/storage';
import { persistSession } from '@/lib/vendor/api-client';

export interface DoctorAuthResult {
  token: string;
  userId: string;
  role: string;
  profileId: string | null;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export function useDoctorAuth() {
  const apiClient = useApiClient();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setStatus('loading');
      setError(null);
      try {
        const data = (await apiClient.fetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })) as { token: string; user: { id: string; role: string; doctorProfile?: { id: string } } };

        if (data.user.role !== 'DOCTOR') {
          throw new Error('Acesso permitido apenas para médicos.');
        }

        const profileId = data.user.doctorProfile?.id ?? null;
        persistSession(mobileStorage, data.token, data.user.role, profileId ?? undefined);

        setStatus('success');
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Credenciais inválidas.';
        setError(msg);
        setStatus('error');
        return false;
      }
    },
    [apiClient],
  );

  const logout = useCallback(() => {
    mobileStorage.removeItem('token');
    mobileStorage.removeItem('userRole');
    mobileStorage.removeItem('profileId');
    setStatus('idle');
    setError(null);
  }, []);

  return { status, error, login, logout };
}
