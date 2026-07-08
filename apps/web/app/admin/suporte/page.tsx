'use client';

import { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import {
  apiAdminListTickets,
  apiAdminGetTicket,
  apiAdminSendMessage,
  apiAdminUpdateTicketStatus,
  useSupportSocket,
  Ticket,
  Message,
} from '../../../lib/support';

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'ABERTO', label: 'Aberto' },
  { value: 'EM_ATENDIMENTO', label: 'Em atendimento' },
  { value: 'RESOLVIDO', label: 'Resolvido' },
];

const statusBadge: Record<string, { bg: string; color: string; label: string }> = {
  ABERTO: { bg: '#f3f4f6', color: '#6b7280', label: 'Aberto' },
  EM_ATENDIMENTO: { bg: '#fef9c3', color: '#92400e', label: 'Em atendimento' },
  RESOLVIDO: { bg: '#d1fae5', color: '#065f46', label: 'Resolvido' },
};

const profileLabel: Record<string, string> = {
  EMPRESA: 'Empresa',
  CLINICA: 'Clínica',
  MEDICO: 'Médico',
};

export default function AdminSuportePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const { joinAdmin, on } = useSupportSocket();

  const loadTickets = useCallback(async (status?: string) => {
    setLoading(true);
    const r = await apiAdminListTickets(status || undefined);
    if (r.success) setTickets(r.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTickets(filterStatus);
  }, [filterStatus, loadTickets]);

  useEffect(() => {
    joinAdmin();
  }, [joinAdmin]);

  useEffect(() => {
    const unsub1 = on('new_ticket', () => loadTickets(filterStatus));
    const unsub2 = on('new_message', () => {
      loadTickets(filterStatus);
      if (selectedTicket) {
        apiAdminGetTicket(selectedTicket.id).then((r) => {
          if (r.success) setSelectedTicket(r.data);
        });
      }
    });
    const unsub3 = on('ticket_updated', () => loadTickets(filterStatus));
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [on, loadTickets, filterStatus, selectedTicket]);

  const handleSelectTicket = async (id: string) => {
    const r = await apiAdminGetTicket(id);
    if (r.success) setSelectedTicket(r.data);
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    const r = await apiAdminSendMessage(selectedTicket.id, replyText.trim());
    if (r.success) {
      setReplyText('');
      const updated = await apiAdminGetTicket(selectedTicket.id);
      if (updated.success) setSelectedTicket(updated.data);
      loadTickets(filterStatus);
    }
  };

  const handleResolve = async (id: string) => {
    await apiAdminUpdateTicketStatus(id, 'RESOLVIDO');
    loadTickets(filterStatus);
    if (selectedTicket?.id === id) {
      const updated = await apiAdminGetTicket(id);
      if (updated.success) setSelectedTicket(updated.data);
    }
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Atendimentos</h2>
          <p>Gerencie os chamados de suporte</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={`btn ${filterStatus === opt.value ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 13 }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Carregando...</p>
      ) : tickets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-secondary)' }}>Nenhum chamado encontrado.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectTicket(t.id)}
                style={{
                  textAlign: 'left', padding: '14px 18px', borderRadius: 12,
                  border: `1.5px solid ${selectedTicket?.id === t.id ? 'var(--accent-primary)' : '#e5e7eb'}`,
                  background: selectedTicket?.id === t.id ? 'rgba(79,70,229,0.04)' : '#fff',
                  cursor: 'pointer', width: '100%',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, marginRight: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{t.subject}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      {profileLabel[t.userProfile] || t.userProfile} · {t.user?.email}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: 11, padding: '2px 10px', borderRadius: 10,
                      background: statusBadge[t.status]?.bg || '#f3f4f6',
                      color: statusBadge[t.status]?.color || '#6b7280',
                    }}>
                      {statusBadge[t.status]?.label || t.status}
                    </span>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                      {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedTicket && (
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 500 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{selectedTicket.subject}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    {profileLabel[selectedTicket.userProfile] || selectedTicket.userProfile} · {selectedTicket.user?.email}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <XMarkIcon style={{ width: 20, height: 20, color: '#6b7280' }} />
                </button>
              </div>

              <div style={{
                flex: 1, overflowY: 'auto', maxHeight: 400,
                display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16,
              }}>
                {(selectedTicket.messages || []).map((msg: Message) => (
                  <div
                    key={msg.id}
                    style={{
                      padding: '10px 14px', borderRadius: 12,
                      background: msg.authorRole === 'ADMIN' ? '#eef2ff' : '#f3f4f6',
                      alignSelf: msg.authorRole === 'ADMIN' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%', fontSize: 13, lineHeight: 1.4,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 11, color: '#6b7280', marginBottom: 2 }}>
                      {msg.authorRole === 'ADMIN' ? 'Admin' : 'Usuário'}
                    </div>
                    {msg.content}
                  </div>
                ))}
              </div>

              {selectedTicket.status !== 'RESOLVIDO' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                    placeholder="Digite sua resposta..."
                    className="form-input"
                    style={{ flex: 1, fontSize: 13 }}
                  />
                  <button onClick={handleSendReply} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }}>
                    Responder
                  </button>
                  <button
                    onClick={() => handleResolve(selectedTicket.id)}
                    className="btn btn-ghost"
                    style={{ padding: '8px 12px', fontSize: 13, color: '#065f46' }}
                    title="Resolver"
                  >
                    <CheckCircleIcon style={{ width: 18, height: 18 }} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
