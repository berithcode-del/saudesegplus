const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') ||
  (process.env.NODE_ENV === 'production'
    ? 'https://backend-production-fdc1.up.railway.app'
    : 'http://localhost:3001');

export function getProfileIdFromToken(): string | null {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1] || ''));
    return payload?.profileId ?? null;
  } catch {
    return null;
  }
}

export async function apiGetExamTypes(): Promise<{ data: any }> {
  const res = await fetch(`${BACKEND_URL}/api/exams/types`);
  return res.json();
}

export async function apiGetRequiredExams(cboCode: string): Promise<{ data: any }> {
  const res = await fetch(`${BACKEND_URL}/api/exams/required-by-cbo?cbo=${encodeURIComponent(cboCode)}`);
  return res.json();
}

export async function apiGetMedicoProfile(id: string): Promise<{ data: any }> {
  const res = await fetch(`${BACKEND_URL}/api/medicos/${id}/perfil`);
  return res.json();
}

export async function apiGetMedicoSolicitacoes(id: string, startDate?: string, endDate?: string): Promise<{ data: any }> {
  let url = `${BACKEND_URL}/api/medicos/${id}/solicitacoes`;
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  const res = await fetch(url);
  return res.json();
}

export async function apiGetEvents(ownerType: string, ownerId: string, startDate?: string, endDate?: string) {
  const params = new URLSearchParams({ ownerType, ownerId });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await fetch(`${BACKEND_URL}/api/calendar?${params.toString()}`);
  if (!response.ok) throw new Error('Falha ao buscar eventos de calendário');
  const data = await response.json();
  return data.data || [];
}

export async function apiCreateEvent(payload: { title: string; type: string; date: string; ownerType: string; ownerId: string }) {
  const response = await fetch(`${BACKEND_URL}/api/calendar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Falha ao criar evento no calendário');
  const data = await response.json();
  return data.data;
}

export async function apiUpdateEvent(id: string, payload: { title?: string; type?: string; date?: string }) {
  const response = await fetch(`${BACKEND_URL}/api/calendar/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Falha ao atualizar evento no calendário');
  const data = await response.json();
  return data.data;
}

export async function apiDeleteEvent(id: string) {
  const response = await fetch(`${BACKEND_URL}/api/calendar/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Falha ao excluir evento no calendário');
  const data = await response.json();
  return data;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const error = new Error(`HTTP ${res.status}: ${res.statusText}`) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function apiGetQueue(doctorId: string) {
  return apiFetch(`/api/queue?doctorId=${encodeURIComponent(doctorId)}`);
}

export async function apiAcceptPatient(examRequestId: string, doctorId: string) {
  return apiFetch(`/api/queue/accept`, {
    method: 'POST',
    body: JSON.stringify({ examRequestId, doctorId }),
  });
}

export async function apiGetSolicitacao(id: string) {
  return apiFetch(`/api/solicitacoes/${id}`);
}

export async function apiUpdateSolicitacao(id: string, data: any) {
  return apiFetch(`/api/solicitacoes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiCreateVideoRoom(examRequestId: string, doctorId?: string) {
  return apiFetch(`/api/teleconsultation/create-room`, {
    method: 'POST',
    body: JSON.stringify({ examRequestId, ...(doctorId ? { doctorId } : {}) }),
  });
}
