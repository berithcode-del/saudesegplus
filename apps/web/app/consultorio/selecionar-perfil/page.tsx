'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircleIcon, ShieldCheckIcon, ArrowPathIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '../../lib/api';

type Actor = {
  id: string;
  type: 'OPERATOR' | 'DOCTOR';
  name: string;
  subtitle?: string;
  pinConfigured: boolean;
};

export default function SelectClinicActorPage() {
  const router = useRouter();
  const [actors, setActors] = useState<Actor[]>([]);
  const [selected, setSelected] = useState<Actor | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');

  const loadActors = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiFetch('/api/auth/clinic-workspace/actors');
      setActors(Array.isArray(result?.actors) ? result.actors : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar a equipe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadActors(); }, []);

  const activate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setActivating(true);
    setError('');
    try {
      const result = await apiFetch('/api/auth/clinic-workspace/activate', {
        method: 'POST',
        body: JSON.stringify({ actorType: selected.type, actorId: selected.id, pin }),
      });
      if (!result?.token) throw new Error('A sessão profissional não foi criada.');
      localStorage.setItem('token', result.token);
      sessionStorage.setItem('token', result.token);
      router.replace('/consultorio');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PIN inválido.');
    } finally {
      setActivating(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 40px)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 820 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 58, height: 58, borderRadius: 18, margin: '0 auto 14px', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white' }}>
            <ShieldCheckIcon style={{ width: 30 }} />
          </div>
          <h1 style={{ margin: 0, color: '#1e1b4b', fontSize: 28 }}>Quem está operando agora?</h1>
          <p style={{ color: '#6b7280', marginTop: 8 }}>Selecione seu perfil. Todas as ações ficarão registradas nesta sessão.</p>
        </div>

        {error && <div className="form-error-banner" style={{ marginBottom: 16 }}>{error}</div>}
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}><ArrowPathIcon style={{ width: 26, margin: 'auto' }} /> Carregando equipe...</div>
        ) : actors.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <UserCircleIcon style={{ width: 44, margin: '0 auto 12px', color: '#9ca3af' }} />
            <h3>Nenhum profissional disponível</h3>
            <p style={{ color: '#6b7280' }}>Cadastre um operador ou associe um médico antes de iniciar o atendimento.</p>
            <button className="btn btn-primary" onClick={() => router.push('/consultorio/configuracoes')}><Cog6ToothIcon className="icon" /> Gerenciar equipe</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
            {actors.map(actor => (
              <button key={`${actor.type}-${actor.id}`} onClick={() => { setSelected(actor); setPin(''); setError(''); }} className="card" style={{ border: selected?.id === actor.id ? '2px solid #4f46e5' : '1px solid #e5e7eb', textAlign: 'left', cursor: 'pointer', padding: 20, background: selected?.id === actor.id ? '#eef2ff' : 'white' }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', background: actor.type === 'DOCTOR' ? '#dcfce7' : '#e0e7ff', color: actor.type === 'DOCTOR' ? '#15803d' : '#4338ca', marginBottom: 12 }}>
                  <UserCircleIcon style={{ width: 26 }} />
                </div>
                <strong style={{ display: 'block', color: '#1f2937' }}>{actor.name}</strong>
                <span style={{ color: '#6b7280', fontSize: 13 }}>{actor.subtitle ?? (actor.type === 'DOCTOR' ? 'Médico' : 'Operador')}</span>
                {!actor.pinConfigured && <span style={{ display: 'block', color: '#b45309', fontSize: 12, marginTop: 8 }}>PIN ainda não configurado</span>}
              </button>
            ))}
          </div>
        )}

        {selected && selected.pinConfigured && (
          <form onSubmit={activate} className="card" style={{ marginTop: 18, display: 'flex', alignItems: 'end', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label className="form-label">PIN operacional de {selected.name}</label>
              <input autoFocus className="form-input" type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, ''))} placeholder="••••••" />
            </div>
            <button className="btn btn-primary" disabled={pin.length !== 6 || activating}>{activating ? 'Iniciando...' : 'Iniciar sessão'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
