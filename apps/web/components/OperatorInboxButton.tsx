'use client';

import { useEffect, useState } from 'react';
import { BellIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  apiMessagingConversations,
  apiMessagingCreateConversation,
  apiMessagingMessages,
  apiMessagingNotifications,
  apiMessagingRecipients,
  apiMessagingSend,
} from '../app/lib/api';

interface Conversation {
  id: string;
  title?: string | null;
  unread?: boolean;
  participants?: Array<{ userId: string; displayName?: string | null }>;
  messages?: Message[];
}

interface Message {
  id: string;
  authorId: string;
  authorName?: string | null;
  content: string;
  sentAt: string;
}

interface Recipient {
  userId: string;
  name: string;
  role: string;
  email: string;
}

export default function OperatorInboxButton() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = () => {
    apiMessagingConversations()
      .then((data) => setConversations(Array.isArray(data) ? data as Conversation[] : []))
      .catch(() => setConversations([]));
    apiMessagingNotifications(true)
      .then((data) => setUnreadCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setUnreadCount(0));
  };

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 20000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    apiMessagingRecipients(recipientQuery)
      .then((data) => setRecipients(Array.isArray(data) ? data as Recipient[] : []))
      .catch(() => setRecipients([]));
  }, [open, recipientQuery]);

  useEffect(() => {
    if (!activeId) return;
    apiMessagingMessages(activeId)
      .then((data) => {
        setMessages(Array.isArray(data) ? data as Message[] : []);
        refresh();
      })
      .catch(() => setMessages([]));
  }, [activeId]);

  const createConversation = async (recipientId: string) => {
    const conversation = await apiMessagingCreateConversation([recipientId]) as Conversation;
    setActiveId(conversation.id);
    setRecipientQuery('');
    refresh();
  };

  const send = async () => {
    if (!activeId || !content.trim()) return;
    await apiMessagingSend(activeId, content);
    setContent('');
    const data = await apiMessagingMessages(activeId);
    setMessages(Array.isArray(data) ? data as Message[] : []);
    refresh();
  };

  const titleFor = (conversation: Conversation) =>
    conversation.title ||
    conversation.participants?.map((participant) => participant.displayName).filter(Boolean).join(', ') ||
    'Conversa';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          border: '1.5px solid #e5e7eb',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
        }}
        aria-label="Mensagens operacionais"
      >
        <BellIcon style={{ width: 18, height: 18, color: '#6b7280' }} />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,23,42,.35)', display: 'flex', justifyContent: 'flex-end' }}>
          <aside className="card" style={{ width: 'min(760px, 100vw)', height: '100%', borderRadius: 0, margin: 0, padding: 0, display: 'grid', gridTemplateColumns: '280px 1fr' }}>
            <div style={{ borderRight: '1px solid var(--border-light)', padding: 16, overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Mensagens</h2>
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} aria-label="Fechar mensagens">
                  <XMarkIcon className="icon icon-sm" />
                </button>
              </div>
              <input className="form-input" value={recipientQuery} onChange={(event) => setRecipientQuery(event.target.value)} placeholder="Nova conversa" style={{ marginBottom: 10 }} />
              {recipientQuery && recipients.map((recipient) => (
                <button key={recipient.userId} type="button" className="btn btn-ghost" onClick={() => void createConversation(recipient.userId)} style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 6 }}>
                  {recipient.name} · {recipient.role}
                </button>
              ))}
              <div style={{ marginTop: 12 }}>
                {conversations.map((conversation) => (
                  <button key={conversation.id} type="button" onClick={() => setActiveId(conversation.id)} className={activeId === conversation.id ? 'btn btn-primary' : 'btn btn-ghost'} style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 6 }}>
                    {conversation.unread ? '• ' : ''}{titleFor(conversation)}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateRows: '1fr auto', minWidth: 0 }}>
              <div style={{ padding: 18, overflowY: 'auto' }}>
                {!activeId ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Selecione uma conversa ou busque um destinatário.</p>
                ) : messages.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Ainda não há mensagens nesta conversa.</p>
                ) : messages.map((message) => (
                  <div key={message.id} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{message.authorName ?? 'Operador'} · {new Date(message.sentAt).toLocaleString('pt-BR')}</div>
                    <div style={{ padding: '10px 12px', background: '#f4f5fb', borderRadius: 8, fontSize: 14 }}>{message.content}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, padding: 14, borderTop: '1px solid var(--border-light)' }}>
                <input className="form-input" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Escreva uma mensagem" disabled={!activeId} onKeyDown={(event) => { if (event.key === 'Enter') void send(); }} />
                <button type="button" className="btn btn-primary" onClick={() => void send()} disabled={!activeId || !content.trim()} aria-label="Enviar mensagem">
                  <PaperAirplaneIcon className="icon icon-sm" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
