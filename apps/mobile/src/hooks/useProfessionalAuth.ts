import { useCallback, useState } from 'react';
import { useApiClient } from '../app/providers/ApiProvider';
import { mobileStorage } from '../lib/storage';
import { persistSession } from '@/lib/vendor/api-client';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface LoginUser {
  id: string;
  role: string;
  doctorProfile?: { id?: string };
  clinicProfile?: { id?: string };
  operatorProfile?: { clinicId?: string };
  companyAdminProfile?: { companyId?: string };
}

interface LoginResponse {
  token: string;
  user: LoginUser;
}

function getProfileId(user: LoginUser): string | undefined {
  return (
    user.doctorProfile?.id ||
    user.clinicProfile?.id ||
    user.operatorProfile?.clinicId ||
    user.companyAdminProfile?.companyId
  );
}

function getRedirectPath(role: string): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'COMPANY_ADMIN') return '/empresa';
  if (role === 'DOCTOR') return '/medico';
  if (role === 'OPERATOR' || role === 'CLINIC') return '/consultorio';
  return '/';
}

export function useProfessionalAuth() {
  const apiClient = useApiClient();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      setStatus('loading');
      setError(null);

      try {
        const data = (await apiClient.fetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })) as LoginResponse;

        const role = data.user?.role;
        if (!role) {
          throw new Error('Perfil profissional nao identificado.');
        }

        persistSession(mobileStorage, data.token, role, getProfileId(data.user));
        setStatus('success');
        return getRedirectPath(role);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Credenciais invalidas.';
        setError(msg);
        setStatus('error');
        return null;
      }
    },
    [apiClient],
  );

  return { status, error, login };
}
