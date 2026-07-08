'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Cog6ToothIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { apiGetMedicoSolicitacoes, getProfileIdFromToken } from '../../lib/api';
import { Pagination } from '../../../components/ui/Pagination';

interface Solicitacao {
  id: string;
  examPurpose: string;
  status: string;
  createdAt: string;
  patient: { name: string; cpf: string };
  results?: Array<{ id: string }>;
  asoDocuments?: Array<{ decision: string }>;
}

export default function MedicoHistoricoPage() {
  const [doctorId, setDoctorId] = useState('');
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [dateFilter, setDateFilter] = useState('30');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setDoctorId(getProfileIdFromToken() ?? '');
  }, []);

  const fetchSolicitacoes = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await apiGetMedicoSolicitacoes(id);
      setSolicitacoes(Array.isArray(result.data) ? result.data : []);
    } catch {
      console.error('Erro ao buscar histórico');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctorId) fetchSolicitacoes(doctorId);
  }, [doctorId]);

  const filteredSolicitacoes = useMemo(() => {
    let list = solicitacoes;
    if (statusFilter !== 'TODOS') {
      list = list.filter(s => s.status === statusFilter);
    }
    if (dateFilter !== 'all') {
      const days = parseInt(dateFilter, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      list = list.filter(s => new Date(s.createdAt) >= cutoff);
    }
    return list;
  }, [solicitacoes, statusFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSolicitacoes.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSolicitacoes.slice(start, start + pageSize);
  }, [filteredSolicitacoes, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateFilter]);

  return (
    <>
      <div className="page-header">
        <h2>Histórico de Atendimentos</h2>
        <p>Consultas realizadas e solicitações vinculadas ao médico</p>
      </div>

      <div className="card">
        {doctorId && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="TODOS">Todos os status</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="EM_ATENDIMENTO">Em Atendimento</option>
                <option value="AGUARDANDO">Aguardando</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <select className="form-select" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="all">Todos</option>
              </select>
            </div>
          </div>
        )}
        {!doctorId ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Nenhum médico selecionado. Selecione um médico na página de configuração.
            </p>
            <Link href="/medico/configuracao" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              <Cog6ToothIcon className="icon icon-sm" /> Configurar Médico
            </Link>
          </div>
        ) : loading && solicitacoes.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>Carregando...</p>
        ) : filteredSolicitacoes.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>Nenhum atendimento encontrado.</p>
        ) : (
          <>
            <table className="queue-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>CPF</th>
                  <th>Tipo de Exame</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Resultado ASO</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((sol) => (
                <tr key={sol.id}>
                  <td style={{ fontWeight: 600 }}>{sol.patient.name}</td>
                  <td>{sol.patient.cpf}</td>
                  <td className="capitalize">{sol.examPurpose}</td>
                  <td>{new Date(sol.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <span className={`badge ${
                      sol.status === 'CONCLUIDO' ? 'badge-done' :
                      sol.status === 'EM_ATENDIMENTO' ? 'badge-in-progress' :
                      'badge-waiting'
                    }`}>{sol.status}</span>
                  </td>
                  <td>
                    {sol.asoDocuments?.[0]?.decision ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        color: sol.asoDocuments[0].decision === 'APTO' ? '#22c55e' :
                               sol.asoDocuments[0].decision === 'INAPTO' ? '#dc2626' : '#f5a623',
                        fontWeight: 600, fontSize: '13px',
                      }}>
                        <DocumentTextIcon className="icon icon-sm" />
                        {sol.asoDocuments[0].decision === 'APTO' ? 'Apto' :
                         sol.asoDocuments[0].decision === 'APTO_COM_RESTRICAO' ? 'Apto c/ Restrição' :
                         sol.asoDocuments[0].decision === 'INAPTO' ? 'Inapto' : sol.asoDocuments[0].decision}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>---</span>
                    )}
                  </td>
                  <td>
                    <Link
                      href={`/medico/consulta/${sol.id}`}
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '12px', textDecoration: 'none' }}
                    >
                      Ver Consulta
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            <Pagination page={page} totalPages={totalPages} total={filteredSolicitacoes.length} onPageChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}
