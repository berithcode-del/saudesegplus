'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAuthToken } from '@/lib/api';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

interface Solicitacao {
  id: string;
  examPurpose: string;
  status: string;
  createdAt: string;
  patient: { name: string; cpf: string };
  clinic?: { name: string } | null;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  AGUARDANDO_COLETA: { label: 'Aguardando Coleta', color: '#f59e0b' },
  EM_COLETA: { label: 'Em Coleta', color: '#3b82f6' },
  NA_FILA_MEDICA: { label: 'Na Fila Médica', color: '#8b5cf6' },
  EM_ATENDIMENTO_MEDICO: { label: 'Em Atendimento', color: '#ec4899' },
  CONCLUIDO: { label: 'Concluído', color: '#22c55e' },
};

export default function PacientesPage() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
      const fetchData = async () => {
        try {
          const token = getAuthToken();
          const url = filter ? `${BACKEND_URL}/api/solicitacoes?status=${filter}` : `${BACKEND_URL}/api/solicitacoes`;
          const res = await fetch(url, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
        const result = await res.json();
        // O endpoint /api/solicitacoes retorna paginado: { success, data: { data: [], pagination } }
        const list = result.data?.data ?? result.data ?? [];
        setSolicitacoes(Array.isArray(list) ? list : []);
      } catch {
        console.error('Erro ao carregar pacientes');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filter]);

  const getStatusBadge = (status: string) => {
    const info = STATUS_LABEL[status];
    if (!info) return <span className="badge badge-waiting">{status}</span>;
    return (
      <span className="badge" style={{ background: `${info.color}18`, color: info.color, border: `1px solid ${info.color}30` }}>
        {info.label}
      </span>
    );
  };

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Pacientes</h2>
            <p>Lista de pacientes e solicitações da clínica</p>
          </div>
          <Link href="/consultorio/check-in" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Novo Check-in
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['', 'AGUARDANDO_COLETA', 'EM_COLETA', 'NA_FILA_MEDICA', 'EM_ATENDIMENTO_MEDICO', 'CONCLUIDO'].map((status) => (
            <button
              key={status}
              className={`btn ${filter === status ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 14px', fontSize: '12px' }}
              onClick={() => setFilter(status)}
            >
              {status ? STATUS_LABEL[status]?.label ?? status : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Carregando...</p>
        ) : solicitacoes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Nenhum paciente encontrado.</p>
        ) : (
          <table className="queue-table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>CPF</th>
                <th>Tipo de Exame</th>
                <th>Data</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {solicitacoes.map((sol) => (
                <tr key={sol.id}>
                  <td style={{ fontWeight: '600' }}>{sol.patient.name}</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{sol.patient.cpf}</td>
                  <td className="capitalize">{sol.examPurpose}</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {new Date(sol.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td>{getStatusBadge(sol.status)}</td>
                  <td>
                    {(sol.status === 'AGUARDANDO_COLETA' || sol.status === 'EM_COLETA') && (
                      <Link
                        href={`/consultorio/exames/${sol.id}`}
                        className="btn btn-primary"
                        style={{ padding: '6px 14px', fontSize: '12px', textDecoration: 'none' }}
                      >
                        Registrar Exames
                      </Link>
                    )}
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
