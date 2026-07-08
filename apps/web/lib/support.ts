'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { apiFetch } from '../app/lib/api';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export interface Ticket {
  id: string;
  userId: string;
  userProfile: string;
  companyId?: string;
  clinicId?: string;
  doctorId?: string;
  subject: string;
  status: 'ABERTO' | 'EM_ATENDIMENTO' | 'RESOLVIDO';
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
  user?: { email: string };
  _count?: { messages: number };
}

export interface Message {
  id: string;
  ticketId: string;
  content: string;
  authorId: string;
  authorRole: 'USER' | 'ADMIN';
  createdAt: string;
}

export async function apiCreateTicket(dto: {
  subject: string;
  userProfile: string;
  companyId?: string;
  clinicId?: string;
  doctorId?: string;
}) {
  const r = await apiFetch('/api/support/tickets', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  return r as { success: boolean; data: Ticket; message?: string };
}

export async function apiListUserTickets() {
  const r = await apiFetch('/api/support/tickets');
  return r as { success: boolean; data: Ticket[] };
}

export async function apiGetTicket(id: string) {
  const r = await apiFetch(`/api/support/tickets/${id}`);
  return r as { success: boolean; data: Ticket };
}

export async function apiSendMessage(ticketId: string, content: string) {
  const r = await apiFetch(`/api/support/tickets/${ticketId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  return r as { success: boolean; data: Message };
}

export async function apiAdminListTickets(status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  const r = await apiFetch(`/api/support/admin/tickets${q}`);
  return r as { success: boolean; data: Ticket[] };
}

export async function apiAdminGetTicket(id: string) {
  const r = await apiFetch(`/api/support/admin/tickets/${id}`);
  return r as { success: boolean; data: Ticket };
}

export async function apiAdminSendMessage(ticketId: string, content: string) {
  const r = await apiFetch(`/api/support/admin/tickets/${ticketId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  return r as { success: boolean; data: Message };
}

export async function apiAdminUpdateTicketStatus(ticketId: string, status: string) {
  const r = await apiFetch(`/api/support/admin/tickets/${ticketId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return r as { success: boolean; data: Ticket };
}

export function useSupportSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<any>(null);
  const listenersRef = useRef<Map<string, Set<(...args: any[]) => void>>>(new Map());

  useEffect(() => {
    let socket: any = null;
    import('socket.io-client').then(({ io }) => {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      socket = io(`${BACKEND_URL}/support`, {
        transports: ['websocket', 'polling'],
        auth: { token },
      });
      socket.on('connect', () => setConnected(true));
      socket.on('disconnect', () => setConnected(false));
      socket.on('new_message', (payload: any) => {
        const cbs = listenersRef.current.get('new_message');
        cbs?.forEach((cb) => cb(payload));
      });
      socket.on('ticket_updated', (payload: any) => {
        const cbs = listenersRef.current.get('ticket_updated');
        cbs?.forEach((cb) => cb(payload));
      });
      socketRef.current = socket;
    }).catch(() => {});

    return () => {
      socket?.disconnect();
    };
  }, []);

  const joinTicket = useCallback((ticketId: string) => {
    socketRef.current?.emit('join_ticket', { ticketId });
  }, []);

  const leaveTicket = useCallback((ticketId: string) => {
    socketRef.current?.emit('leave_ticket', { ticketId });
  }, []);

  const joinAdmin = useCallback(() => {
    socketRef.current?.emit('join_admin');
  }, []);

  const on = useCallback((event: string, cb: (...args: any[]) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(cb);
    return () => listenersRef.current.get(event)?.delete(cb);
  }, []);

  return { connected, joinTicket, leaveTicket, joinAdmin, on };
}
