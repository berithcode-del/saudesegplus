'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  apiCreateTicket,
  apiListUserTickets,
  apiGetTicket,
  apiSendMessage,
  useSupportSocket,
  Ticket,
  Message,
} from '../lib/support';

interface ChatWidgetProps {
  perfil: 'EMPRESA' | 'CLINICA' | 'MEDICO';
  companyId?: string;
  clinicId?: string;
  doctorId?: string;
}

export default function ChatWidget({ perfil, companyId, clinicId, doctorId }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const { connected, joinTicket, leaveTicket, on } = useSupportSocket();

  const loadTickets = useCallback(async () => {
    const r = await apiListUserTickets();
    if (r.success) setTickets(r.data);
  }, []);

  const loadActiveTicket = useCallback(async (id: string) => {
    const r = await apiGetTicket(id);
    if (r.success) setActiveTicket(r.data);
  }, []);

  useEffect(() => {
    if (open) loadTickets();
  }, [open, loadTickets]);

  useEffect(() => {
    if (activeTicketId) {
      joinTicket(activeTicketId);
      loadActiveTicket(activeTicketId);
      return () => { leaveTicket(activeTicketId); };
    }
  }, [activeTicketId, joinTicket, leaveTicket, loadActiveTicket]);

  useEffect(() => {
    const unsub = on('new_message', (payload: { ticketId: string }) => {
      if (payload.ticketId === activeTicketId) {
        loadActiveTicket(payload.ticketId);
      }
      loadTickets();
    });
    return () => { unsub(); };
  }, [on, activeTicketId, loadActiveTicket, loadTickets]);

  const handleCreate = async () => {
    if (!newSubject.trim()) return;
    setCreating(true);
    const r = await apiCreateTicket({
      subject: newSubject.trim(),
      userProfile: perfil,
      companyId,
      clinicId,
      doctorId,
    });
    setCreating(false);
    if (r.success) {
      setShowNewForm(false);
      setNewSubject('');
      setActiveTicketId(r.data.id);
      await loadTickets();
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeTicketId) return;
    const r = await apiSendMessage(activeTicketId, newMessage.trim());
    if (r.success) {
      setNewMessage('');
      await loadActiveTicket(activeTicketId);
      loadTickets();
    }
  };

  const statusLabel: Record<string, string> = {
    ABERTO: 'Aberto',
    EM_ATENDIMENTO: 'Em atendimento',
    RESOLVIDO: 'Resolvido',
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--accent-primary)', color: '#fff',
          border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <ChatBubbleLeftRightIcon style={{ width: 24, height: 24 }} />
      </button>

      {open && (
        <div
          style={{
            position: 'fixed', bottom: 92, right: 24, zIndex: 999,
            width: 380, maxHeight: 'calc(100vh - 140px)',
            background: '#fff', borderRadius: 16,
            boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 20px', background: 'var(--accent-primary)',
              color: '#fff', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 15 }}>Suporte</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, opacity: 0.8 }}>
                {connected ? 'Conectado' : 'Offline'}
              </span>
              <button
                onClick={() => { setOpen(false); setActiveTicketId(null); setActiveTicket(null); setShowNewForm(false); }}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}
              >
                <XMarkIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {activeTicketId && activeTicket ? (
              <div>
                <button
                  onClick={() => { setActiveTicketId(null); setActiveTicket(null); }}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: 'var(--accent-primary)', padding: 0, marginBottom: 12,
                  }}
                >
                  ← Voltar
                </button>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{activeTicket.subject}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                  Status: {statusLabel[activeTicket.status] || activeTicket.status}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  {(activeTicket.messages || []).map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        padding: '10px 14px', borderRadius: 12,
                        background: msg.authorRole === 'ADMIN' ? '#f3f4f6' : '#eef2ff',
                        alignSelf: msg.authorRole === 'ADMIN' ? 'flex-start' : 'flex-end',
                        maxWidth: '85%', fontSize: 13, lineHeight: 1.4,
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 11, color: '#6b7280', marginBottom: 2 }}>
                        {msg.authorRole === 'ADMIN' ? 'Admin' : 'Você'}
                      </div>
                      {msg.content}
                    </div>
                  ))}
                </div>
                {activeTicket.status !== 'RESOLVIDO' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Digite sua mensagem..."
                      className="form-input"
                      style={{ flex: 1, fontSize: 13 }}
                    />
                    <button
                      onClick={handleSend}
                      className="btn btn-primary"
                      style={{ padding: '8px 12px' }}
                    >
                      <PaperAirplaneIcon style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                )}
              </div>
            ) : showNewForm ? (
              <div>
                <button
                  onClick={() => setShowNewForm(false)}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: 'var(--accent-primary)', padding: 0, marginBottom: 12,
                  }}
                >
                  ← Voltar
                </button>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                  Novo chamado
                </div>
                <input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Descreva sua dúvida..."
                  className="form-input"
                  style={{ width: '100%', marginBottom: 12, fontSize: 13 }}
                />
                <button
                  onClick={handleCreate}
                  className="btn btn-primary"
                  disabled={creating || !newSubject.trim()}
                  style={{ width: '100%' }}
                >
                  {creating ? 'Enviando...' : 'Abrir chamado'}
                </button>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setShowNewForm(true)}
                  className="btn btn-primary"
                  style={{ width: '100%', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <PlusIcon style={{ width: 16, height: 16 }} />
                  Novo chamado
                </button>
                {tickets.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>
                    Nenhum chamado ainda
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {tickets.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => { setActiveTicketId(t.id); loadActiveTicket(t.id); }}
                        style={{
                          textAlign: 'left', padding: '12px 14px', borderRadius: 12,
                          border: '1px solid #e5e7eb', background: '#fff',
                          cursor: 'pointer', width: '100%',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, flex: 1, marginRight: 8 }}>
                            {t.subject}
                          </span>
                          <span style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 10,
                            background: t.status === 'RESOLVIDO' ? '#d1fae5' :
                                         t.status === 'EM_ATENDIMENTO' ? '#fef9c3' : '#f3f4f6',
                            color: t.status === 'RESOLVIDO' ? '#065f46' :
                                   t.status === 'EM_ATENDIMENTO' ? '#92400e' : '#6b7280',
                            whiteSpace: 'nowrap',
                          }}>
                            {statusLabel[t.status] || t.status}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                          {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
