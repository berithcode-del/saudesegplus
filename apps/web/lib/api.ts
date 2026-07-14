const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') ||
  (process.env.NODE_ENV === 'production'
    ? 'https://backend-production-fdc1.up.railway.app'
    : 'http://localhost:3001');

import { getProfileIdFromToken as _getProfileId } from '@repo/api-client';
import { ApiClient, localStorageAdapter } from '@repo/api-client';

export function getProfileIdFromToken(): string | null {
  return _getProfileId(localStorageAdapter);
}

const apiClient = new ApiClient({ storage: localStorageAdapter });

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  return apiClient.fetch(endpoint, options);
}

export async function apiGetExamTypes(): Promise<{ data: unknown }> {
  return apiFetch('/api/exams/types') as Promise<{ data: unknown }>;
}

export async function apiGetRequiredExams(cboCode: string): Promise<{ data: unknown }> {
  // Rota correta: /api/exams/required?cboCode=... (não /required-by-cbo que não existe)
  return apiFetch(`/api/exams/required?cboCode=${encodeURIComponent(cboCode)}`) as Promise<{ data: unknown }>;
}

export async function apiGetMedicoProfile(id: string): Promise<{ data: unknown }> {
  const me = await apiFetch('/api/auth/me') as {
    success?: boolean;
    role?: string;
    email?: string | null;
    doctorProfile?: Record<string, unknown> | null;
    data?: unknown;
  };

  if (me?.success !== false && me?.doctorProfile && (me.doctorProfile as { id?: string }).id === id) {
    return {
      data: {
        ...(me.doctorProfile as Record<string, unknown>),
        email: me.email ?? null,
      },
    };
  }

  return apiFetch(`/api/medicos/${id}/perfil`) as Promise<{ data: unknown }>;
}

export async function apiGetMedicoSolicitacoes(id: string, startDate?: string, endDate?: string): Promise<{ data: unknown }> {
  let url = `/api/medicos/${id}/solicitacoes`;
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  return apiFetch(url) as Promise<{ data: unknown }>;
}

export async function apiGetEvents(ownerType: string, ownerId: string, startDate?: string, endDate?: string) {
  const params = new URLSearchParams({ ownerType, ownerId });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const data = await apiFetch(`/api/calendar?${params.toString()}`);
  return (data as { data?: unknown[] })?.data ?? [];
}

export async function apiCreateEvent(payload: { title: string; type: string; date: string; ownerType: string; ownerId: string }) {
  const data = await apiFetch('/api/calendar', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return (data as { data?: unknown })?.data;
}

export async function apiUpdateEvent(id: string, payload: { title?: string; type?: string; date?: string }) {
  const data = await apiFetch(`/api/calendar/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return (data as { data?: unknown })?.data;
}

export async function apiDeleteEvent(id: string) {
  return apiFetch(`/api/calendar/${id}`, {
    method: 'DELETE',
  });
}

export async function apiGetQueue(doctorId: string) {
  return apiFetch(`/api/queue?doctorId=${encodeURIComponent(doctorId)}`);
}

export async function apiAcceptPatient(examRequestId: string, doctorId: string) {
  return apiFetch('/api/queue/accept', {
    method: 'POST',
    body: JSON.stringify({ examRequestId, doctorId }),
  });
}

export async function apiGetSolicitacao(id: string) {
  return apiFetch(`/api/solicitacoes/${id}`);
}

export async function apiUpdateSolicitacao(id: string, data: unknown) {
  return apiFetch(`/api/solicitacoes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiCreateVideoRoom(examRequestId: string, doctorId?: string) {
  return apiFetch('/api/teleconsultation/create-room', {
    method: 'POST',
    body: JSON.stringify({ examRequestId, ...(doctorId ? { doctorId } : {}) }),
  });
}

export async function apiCreateInvite(companyId: string, payload: Record<string, unknown>) {
  return apiFetch(`/api/company/${companyId}/invite`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiCancelInvite(inviteId: string) {
  // Rota correta: DELETE /api/company/invite/:id (não /api/invites/:id)
  return apiFetch(`/api/company/invite/${inviteId}`, {
    method: 'DELETE',
  });
}

// Busca ExamRequests (exames já iniciados) da empresa
export async function apiListSolicitacoes(
  filters: { status?: string; companyId?: string; patientId?: string } = {},
  page = 1,
  limit = 20
) {
  const params = new URLSearchParams();
  if (filters.companyId) params.set('companyId', filters.companyId);
  if (filters.status) params.set('status', filters.status);
  if (filters.patientId) params.set('patientId', filters.patientId);
  params.set('page', String(page));
  params.set('limit', String(limit));
  return apiFetch(`/api/solicitacoes?${params.toString()}`);
}

// Busca ExamInvites (convites pendentes) da empresa
export async function apiListInvites(companyId: string) {
  return apiFetch(`/api/company/${companyId}/invites`);
}
