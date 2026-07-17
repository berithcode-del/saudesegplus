'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowPathIcon, HeartIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { apiGetQueue, apiAcceptPatient, getProfileIdFromToken } from '../../lib/api';

interface QueueEntry {
  id: string;
  status: string;
  enteredQueueAt: string;
  isOnline?: boolean;
  city?: string;
  state?: string;
  request: {
    id: string;
    examPurpose: string;
    patient: { name: string; cpf: string; functionCboCode: string };
    numeroProtocolo?: string;
    processoAsoId?: string;
  };
}

export default function MedicoFilaPage() {
  const router = useRouter();
  const [doctorId, setDoctorId] = useState('');
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    setDoctorId(getProfileIdFromToken() ?? '');
  }, []);

  const fetchQueue = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const result = await apiGetQueue(id);
      setQueue(Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : []);
    } catch {
      setError('Não foi possível carregar a fila.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (doctorId) fetchQueue(doctorId);
    const interval = setInterval(() => {
      if (doctorId) fetchQueue(doctorId);
    }, 15000);
    return () => clearInterval(interval);
  }, [doctorId, fetchQueue]);

  const handleAccept = async (entry: QueueEntry) => {
    setAccepting(entry.id);
    try {
      await apiAcceptPatient(entry.id, doctorId);
      router.push(`/medico/consulta/${entry.request.id}`);
    } catch {
      alert('Falha ao aceitar paciente.');
      setAccepting(null);
    }
  };

  const getWaitTime = (since: string) => {
    const mins = Math.floor((Date.now() - new Date(since).getTime()) / 60000);
    if (mins < 60) return `${mins}min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}min`;
  };

  return (
    <>
      <div className="page-header">
        <h2>Fila de Pacientes</h2>
        <p>Pacientes aguardando atendimento, ordenados por proximidade</p>
      </div>

      {error && (
        <div className="login-hint" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#dc2626', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div className="card">
        {!doctorId ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Nao foi possivel identificar o medico autenticado. Faca login novamente.
            </p>
            <Link href="/medico/configuracao" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              <Cog6ToothIcon className="icon icon-sm" /> Configurar Médico
            </Link>
          </div>
        ) : loading && queue.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>Carregando...</p>
        ) : queue.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>Nenhum paciente na fila.</p>
        ) : (
          <table className="queue-table">
            <thead>
                          <tr>
                            <th>Paciente</th>
                            <th>Tipo de Exame</th>
                            <th>Localização</th>
                            <th>Tempo de Espera</th>
                            <th>Status</th>
                            <th>Protocolo</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
            <tbody>
              {queue.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{entry.request.patient.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{entry.request.patient.cpf}</div>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{entry.request.examPurpose}</td>
                  <td>{entry.city ?? '—'} {entry.state ? `— ${entry.state}` : ''}</td>
                  <td>{getWaitTime(entry.enteredQueueAt)}</td>
                  <td>
                                      <span className={`badge ${entry.status === 'IN_PROGRESS' ? 'badge-in-progress' : 'badge-waiting'}`}>
                                        {entry.status === 'IN_PROGRESS' ? 'Em Atendimento' : 'Aguardando'}
                                      </span>
                                      <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        marginLeft: '8px', padding: '3px 8px', borderRadius: '999px',
                                        background: entry.isOnline ? 'rgba(34,197,94,0.08)' : 'rgba(156,163,175,0.12)',
                                        color: entry.isOnline ? '#16a34a' : 'var(--text-muted)',
                                        fontSize: '11px', fontWeight: 700,
                                      }}>
                                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: entry.isOnline ? '#22c55e' : '#9ca3af' }} />
                                        {entry.isOnline ? 'Online' : 'Sem sinal'}
                                      </span>
                                    </td>
                                    <td>
                                      {entry.request.numeroProtocolo ? (
                                        <a
                                          href={`/admin/protocolos/${entry.request.processoAsoId}`}
                                          style={{ color: '#4f46e5', textDecoration: 'underline', fontSize: '12px' }}
                                        >
                                          {entry.request.numeroProtocolo}
                                        </a>
                                      ) : (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                                      )}
                                    </td>
                                    <td>
                                      <button
                                        className="btn btn-primary"
                                        style={{ padding: '6px 14px', fontSize: '12px' }}
                                        disabled={entry.status === 'IN_PROGRESS' || accepting === entry.id}
                                        onClick={() => handleAccept(entry)}
                                      >
                                        {accepting === entry.id ? 'Abrindo...' : (<><HeartIcon className="icon icon-sm" /> Atender</>)}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
          </table>
        )}
      </div>
    </>
  );
}
