'use client';

export { useQueue } from '@repo/api-client';

import { getAuthToken as _getToken, getProfileIdFromToken as _getProfileId, clearSession as _clearSession } from '@repo/api-client';
import { ApiClient, localStorageAdapter } from '@repo/api-client';

export function getAuthToken(): string | null { return _getToken(localStorageAdapter); }
export function getProfileIdFromToken(): string | null { return _getProfileId(localStorageAdapter); }
export function clearSession(): void { return _clearSession(localStorageAdapter); }

const apiClient = new ApiClient({ storage: localStorageAdapter });

export async function apiFetch(path: string, options: RequestInit = {}) {
  return apiClient.fetch(path, options);
}

export async function apiGetQueue(doctorId: string) {
  return apiFetch(`/api/queue?doctorId=${encodeURIComponent(doctorId)}`);
}

export async function apiEnqueue(examRequestId: string) {
  return apiFetch('/api/queue/enqueue', {
    method: 'POST',
    body: JSON.stringify({ examRequestId }),
  });
}

export async function apiAcceptPatient(queueEntryId: string, doctorId: string) {
  return apiFetch(`/api/queue/${queueEntryId}/accept`, {
    method: 'POST',
    body: JSON.stringify({ doctorId }),
  });
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${apiClient.getBaseUrl()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function apiListSolicitacoes(
  filters: { status?: string; companyId?: string; patientId?: string } = {},
  page = 1,
  limit = 20
) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.companyId) params.set('companyId', filters.companyId);
  if (filters.patientId) params.set('patientId', filters.patientId);
  params.set('page', String(page));
  params.set('limit', String(limit));
  return apiFetch(`/api/solicitacoes?${params.toString()}`);
}

export async function apiGetSolicitacao(id: string) {
  return apiFetch(`/api/solicitacoes/${id}`);
}

export async function apiUpdateSolicitacao(id: string, body: { status: string; laudoTexto?: string; decision: string; restrictionNotes?: string }) {
  return apiFetch(`/api/solicitacoes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function apiValidateInvite(data: { token: string; name: string; password: string }) {
  const url = `${apiClient.getBaseUrl()}/api/colaboradores`;
  const token = apiClient.getAuthToken();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  const result = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((result as { message?: string | string[] })?.message?.[0] ?? (result as { message?: string })?.message ?? 'Token inválido ou expirado.');
  }
  return result;
}

export async function apiGetColaboradorSolicitacoes(patientId: string) {
  return apiFetch(`/api/colaboradores/${patientId}/solicitacoes`);
}

export async function apiGetMedicoSolicitacoes(doctorId: string) {
  return apiFetch(`/api/medicos/${doctorId}/solicitacoes`);
}

export async function apiListMedicos(filters: { search?: string; city?: string; state?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.city) params.set('city', filters.city);
  if (filters.state) params.set('state', filters.state);
  const r = await apiFetch(`/api/medicos?${params.toString()}`);
  const raw = (r as { data?: { data?: unknown[] } })?.data?.data ?? (r as { data?: unknown[] })?.data ?? [];
  return { data: Array.isArray(raw) ? raw : [] };
}

export async function apiGetExamTypes() {
  const r = await apiFetch('/api/exams/types');
  const arr = (r as { data?: unknown[] })?.data ?? (r as { types?: unknown[] })?.types ?? r ?? [];
  return { data: Array.isArray(arr) ? arr : [] };
}

export async function apiGetRequiredExams(cboCode: string) {
  const r = await apiFetch(`/api/exams/required?cboCode=${encodeURIComponent(cboCode)}`);
  const arr = (r as { data?: { requiredExams?: unknown[] } })?.data?.requiredExams ?? (r as { requiredExams?: unknown[] })?.requiredExams ?? [];
  return { data: Array.isArray(arr) ? arr : [] };
}

export async function apiGetDocumentos(companyId: string) {
  return apiFetch(`/api/upload/documents/${companyId}`);
}

export async function apiUploadDocumento(_companyId: string, formData: FormData) {
  return apiClient.fetchWithFormData('/api/upload/document', formData);
}

export async function apiGetCompanyStatusCheck(companyId: string) {
  return apiFetch(`/api/company/${companyId}/status-check`);
}

export async function apiListCompanyAsos(companyId: string) {
  return apiFetch(`/api/company/${companyId}/asos`);
}

export async function apiCreateVideoRoom(examRequestId: string, doctorId?: string) {
  return apiFetch('/api/teleconsultation/create-room', {
    method: 'POST',
    body: JSON.stringify({ examRequestId, ...(doctorId ? { doctorId } : {}) }),
  });
}

export async function apiAdminStats() {
  return apiFetch('/api/admin/stats');
}

export async function apiAdminListCompanies(filters: Record<string, string> = {}) {
  const params = new URLSearchParams(filters);
  const qs = params.toString();
  const r = await apiFetch(`/api/admin/companies${qs ? '?' + qs : ''}`);
  const arr = Array.isArray(r) ? r : (r as { data?: unknown[] })?.data ?? [];
  return { data: Array.isArray(arr) ? arr : [] };
}

export async function apiAdminUpdateCompanyStatus(id: string, status: string) {
  return apiFetch(`/api/admin/companies/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function apiAdminListClinics() {
  let r: unknown;
  try {
    r = await apiFetch('/api/admin/clinics');
  } catch (adminError) {
    try {
      r = await apiFetch('/api/clinics');
    } catch {
      throw adminError;
    }
  }

  let arr = Array.isArray(r) ? r : (r as { data?: unknown[] })?.data ?? [];
  if (arr.length === 0) {
    const publicResult = await apiFetch('/api/clinics').catch(() => null);
    const publicArr = Array.isArray(publicResult)
      ? publicResult
      : (publicResult as { data?: unknown[] } | null)?.data ?? [];
    if (Array.isArray(publicArr) && publicArr.length > 0) arr = publicArr;
  }
  return { data: Array.isArray(arr) ? arr : [] };
}

export async function apiAdminCreateClinic(data: Record<string, unknown>) {
  return apiFetch('/api/admin/clinics', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiAdminListDoctors() {
  const r = await apiFetch('/api/admin/doctors');
  const arr = Array.isArray(r) ? r : (r as { data?: unknown[] })?.data ?? [];
  return { data: Array.isArray(arr) ? arr : [] };
}

export async function apiAdminCreateDoctor(data: { name: string; gender?: string; crmNumber: string; crmState: string; city?: string; state?: string; specialties?: string }) {
  return apiFetch('/api/admin/doctors', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiAdminVerifyDoctor(id: string) {
  return apiFetch(`/api/admin/doctors/${id}/verify`, {
    method: 'POST',
  });
}

export async function apiAdminGetCompaniesPendingApproval() {
  const r = await apiFetch('/api/admin/companies/pending-approval');
  const arr = Array.isArray(r) ? r : (r as { data?: unknown[] })?.data ?? [];
  return { data: Array.isArray(arr) ? arr : [] };
}

export async function apiAdminApproveCompany(id: string, approvedBy: string) {
  return apiFetch(`/api/admin/companies/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ approvedBy }),
  });
}

export async function apiSearchCbo(query: string): Promise<{ cboCode: string; functionName: string }[]> {
  if (!query || query.length < 2) return [];
  const r = await apiFetch(`/api/exams/cbo-search?q=${encodeURIComponent(query)}`);
  const raw = ((r as { data?: any[] })?.data ?? []) as any[];
  return raw.map((item: any) => ({ cboCode: item.code ?? item.cboCode ?? '', functionName: item.name ?? item.functionName ?? '' }));
}

export async function apiCreateInvite(companyId: string, payload: Record<string, unknown>) {
  return apiFetch(`/api/company/${companyId}/invite`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiCancelInvite(inviteId: string) {
  return apiFetch(`/api/company/invite/${inviteId}`, {
    method: 'DELETE',
  });
}

export async function apiListInvites(companyId: string) {
  return apiFetch(`/api/company/${companyId}/invites`);
}

// ============================================
// Calendar / Events (missing exports for build)
// ============================================

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

// ============================================
// Medico Profile (missing export for build)
// ============================================

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



