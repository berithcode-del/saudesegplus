'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') ||
  (process.env.NODE_ENV === 'production'
    ? 'https://backend-production-fdc1.up.railway.app'
    : 'http://localhost:3001');
interface QueueEvent {
  type: 'ENQUEUED' | 'ACCEPTED' | 'COMPLETED' | 'DOCTOR_STATUS' | 'TELECONSULTA_INICIADA' | 'DOCTOR_VIEWING_PATIENT';
  payload: Record<string, unknown>;
}
export function useQueue() {
  const [events, setEvents] = useState<QueueEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<unknown>(null);
  useEffect(() => {
    // Lazy-import socket.io-client to avoid SSR issues
    let socket: { on: Function; emit: Function; disconnect: Function; id?: string } | null = null;
    import('socket.io-client').then(({ io }) => {
      if (!socket) {
        const token = localStorage.getItem('token');
        socket = io(BACKEND_URL, { 
          transports: ['websocket', 'polling'],
          auth: { token }
        });
      }
      socket.on('connect', () => {
        setConnected(true);
        console.log('[Queue] WebSocket connected');
      });
      socket.on('disconnect', () => {
        setConnected(false);
        console.log('[Queue] WebSocket disconnected');
      });
      socket.on('queue_update', (payload: Record<string, unknown>) => {
        setEvents(prev => [...prev.slice(-49), { type: 'ENQUEUED', payload }]);
      });
      socket.on('doctor_status', (payload: Record<string, unknown>) => {
        setEvents(prev => [...prev.slice(-49), { type: 'DOCTOR_STATUS', payload }]);
      });
      socket.on('teleconsulta_iniciada', (payload: Record<string, unknown>) => {
        setEvents(prev => [...prev.slice(-49), { type: 'TELECONSULTA_INICIADA', payload }]);
      });
      socket.on('doctor_viewing_patient', (payload: Record<string, unknown>) => {
        setEvents(prev => [...prev.slice(-49), { type: 'DOCTOR_VIEWING_PATIENT', payload }]);
      });
      socketRef.current = socket;
    }).catch(() => {
      // socket.io-client not yet installed or SSR — use polling fallback
      console.info('[Queue] WebSocket unavailable, using polling');
    });
    return () => {
      socket?.disconnect();
    };
  }, []);
  const emitDoctorOnline = useCallback((doctorId: string) => {
    const s = socketRef.current as { emit: Function } | null;
    s?.emit('doctor_online', { doctorId });
  }, []);
  return { connected, events, emitDoctorOnline };
}
// ── REST API helpers ──────────────────────────────────────────────────────────
function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

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

export function getAuthToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}
export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...getAuthHeaders(), ...(options.headers ?? {}) },
  });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('profileId');
    }
    // Auth desabilitado — backend ainda tem guard JWT ativo.
    // Retorna shape vazio em vez de erro para UI não quebrar.
    console.warn(`[apiFetch] 401 em ${path} — auth desabilitada`);
    return { data: null, success: false };
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any)?.message || `HTTP ${res.status}`);
  }
  return res.json();
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
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}
// ── Solicitações (ExamRequest) — módulo novo do backend ───────────────────────
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
// ── Colaboradores ──────────────────────────────────────────────────────────────
export async function apiValidateInvite(data: { token: string; name: string; password: string }) {
  const res = await fetch(`${BACKEND_URL}/api/colaboradores`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  const result = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(result?.message?.[0] ?? result?.message ?? 'Token inválido ou expirado.');
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
  const raw = r?.data?.data ?? r?.data ?? [];
  return { data: Array.isArray(raw) ? raw : [] };
}
export async function apiGetExamTypes() {
  const r = await apiFetch('/api/exams/types');
  const arr = r?.data ?? r?.types ?? r ?? [];
  return { data: Array.isArray(arr) ? arr : [] };
}
export async function apiGetRequiredExams(cboCode: string) {
  const r = await apiFetch(`/api/exams/required?cboCode=${encodeURIComponent(cboCode)}`);
  const arr = r?.data?.requiredExams ?? r?.requiredExams ?? [];
  return { data: Array.isArray(arr) ? arr : [] };
}
export async function apiGetDocumentos(companyId: string) {
  return apiFetch(`/api/upload/documents/${companyId}`);
}
export async function apiUploadDocumento(_companyId: string, formData: FormData) {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('token') || localStorage.getItem('accessToken'))
    : null;
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BACKEND_URL}/api/upload/document`, {
    method: 'POST',
    headers,
    body: formData,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || 'Falha ao enviar documento');
  if (json?.success === false) throw new Error(json?.message || 'Falha ao enviar documento');
  return json;
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
// ── Admin ───────────────────────────────────────────────────────────────────────
export async function apiAdminStats() {
  return apiFetch('/api/admin/stats');
}
export async function apiAdminListCompanies(filters: Record<string, string> = {}) {
  const params = new URLSearchParams(filters);
  const qs = params.toString();
  const r = await apiFetch(`/api/admin/companies${qs ? '?' + qs : ''}`);
  const arr = Array.isArray(r) ? r : r?.data ?? [];
  return { data: Array.isArray(arr) ? arr : [] };
}
export async function apiAdminUpdateCompanyStatus(id: string, status: string) {
  return apiFetch(`/api/admin/companies/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
export async function apiAdminListClinics() {
  const r = await apiFetch('/api/admin/clinics');
  const arr = Array.isArray(r) ? r : r?.data ?? [];
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
  const arr = Array.isArray(r) ? r : r?.data ?? [];
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
  const arr = Array.isArray(r) ? r : r?.data ?? [];
  return { data: Array.isArray(arr) ? arr : [] };
}
export async function apiAdminApproveCompany(id: string, approvedBy: string) {
  return apiFetch(`/api/admin/companies/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ approvedBy }),
  });
}
export async function apiSearchCbo(query: string) {
  if (!query || query.length < 2) return [];
  const r = await apiFetch(`/api/exams/cbo-search?q=${encodeURIComponent(query)}`);
  return r?.data ?? [];
}
