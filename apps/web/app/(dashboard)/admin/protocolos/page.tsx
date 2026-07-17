'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowPathIcon, MagnifyingGlassIcon, FunnelIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { asoProtocoloApi } from '@/lib/api/aso-protocolo';
import type { ProtocoloASO, StatusProtocolo, ProtocoloListResponse } from '@/lib/types/aso-protocolo';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

const STATUS_COLOR: Record<StatusProtocolo, { bg: string; color: string }> = {
  AGUARDANDO_COLETA: { bg: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' },
  EM_COLETA: { bg: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' },
  NA_FILA_MEDICA: { bg: 'rgba(249, 115, 22, 0.12)', color: '#ea580c' },
  EM_ATENDIMENTO: { bg: 'rgba(6, 182, 212, 0.12)', color: '#0891b2' },
  DOCUMENTOS_PENDENTES: { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706' },
  CONCLUIDO: { bg: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' },
  CANCELADO: { bg: 'rgba(156, 163, 175, 0.12)', color: '#6b7280' },
};

export default function AdminProtocolosPage() {
  const router = useRouter();
  const [protocolos, setProtocolos] = useState<ProtocoloASO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    numeroProtocolo: '',
    status: '',
    empresaId: '',
    clinicaId: '',
    tipoExame: '',
    dataInicio: '',
    dataFim: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const loadProtocolos = async () => {
    setLoading(true);
    try {
      const response = await asoProtocoloApi.list({
        page,
        limit: 20,
        ...filters,
      });
      setProtocolos(response.data);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (error) {
      console.error('Erro ao carregar protocolos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProtocolos();
  }, [page, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
    loadProtocolos();
  };

  const handleClearFilters = () => {
    setFilters({
      numeroProtocolo: '',
      status: '',
      empresaId: '',
      clinicaId: '',
      tipoExame: '',
      dataInicio: '',
      dataFim: '',
    });
    setPage(1);
    loadProtocolos();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: StatusProtocolo) => {
    const style = STATUS_COLOR[status] || { bg: 'rgba(156, 163, 175, 0.12)', color: '#6b7280' };
    return (
      <span style={{
        background: style.bg,
        color: style.color,
        padding: '4px 10px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'capitalize',
      }}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const handleView = (protocolo: ProtocoloASO) => {
    router.push(`/admin/protocolos/${protocolo.id}`);
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1e1b4b' }}>Protocolos ASO</h2>
            <p style={{ color: '#6b7280', marginTop: '4px' }}>Gerenciamento completo de protocolos - visualização, edição e exclusão</p>
          </div>
          <button className="btn btn-secondary" onClick={loadProtocolos} disabled={loading}>
            <ArrowPathIcon className="icon" /> Atualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(160px, 1fr))', marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-label">Total Protocolos</div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Esta Página</div>
          <div className="stat-value">{protocolos.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Página</div>
          <div className="stat-value">{page} / {totalPages}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Concluídos</div>
          <div className="stat-value" style={{ color: '#16a34a' }}>
            {protocolos.filter(p => p.status === 'CONCLUIDO').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="btn btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: showFilters ? '16px' : '0', width: 'fit-content' }}
        >
          <FunnelIcon className="icon" /> {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
        </button>

        {showFilters && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label>Nº Protocolo</label>
              <input
                type="text"
                className="form-input"
                placeholder="ASO-2026-0001"
                value={filters.numeroProtocolo}
                onChange={e => handleFilterChange('numeroProtocolo', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                className="form-input"
                value={filters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="AGUARDANDO_COLETA">Aguardando Coleta</option>
                <option value="EM_COLETA">Em Coleta</option>
                <option value="NA_FILA_MEDICA">Na Fila Médica</option>
                <option value="EM_ATENDIMENTO">Em Atendimento</option>
                <option value="DOCUMENTOS_PENDENTES">Documentos Pendentes</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tipo Exame</label>
              <select
                className="form-input"
                value={filters.tipoExame}
                onChange={e => handleFilterChange('tipoExame', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="ADMISSIONAL">Admissional</option>
                <option value="PERIODICO">Periódico</option>
                <option value="DEMISSIONAL">Demissional</option>
                <option value="MUDANCA_FUNCAO">Mudança de Função</option>
                <option value="RETORNO_TRABALHO">Retorno ao Trabalho</option>
              </select>
            </div>
            <div className="form-group">
              <label>Empresa ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="ID da empresa"
                value={filters.empresaId}
                onChange={e => handleFilterChange('empresaId', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Clínica ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="ID da clínica"
                value={filters.clinicaId}
                onChange={e => handleFilterChange('clinicaId', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Data Início</label>
              <input
                type="date"
                className="form-input"
                value={filters.dataInicio}
                onChange={e => handleFilterChange('dataInicio', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Data Fim</label>
              <input
                type="date"
                className="form-input"
                value={filters.dataFim}
                onChange={e => handleFilterChange('dataFim', e.target.value)}
              />
            </div>
            <div className="form-group" style={{ alignSelf: 'end' }}>
              <button className="btn btn-primary" onClick={handleSearch} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <MagnifyingGlassIcon className="icon" /> Buscar
              </button>
            </div>
            <div className="form-group" style={{ alignSelf: 'end' }}>
              <button className="btn btn-ghost" onClick={handleClearFilters} style={{ width: '100%' }}>
                Limpar Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Carregando protocolos...</p>
        ) : protocolos.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Nenhum protocolo encontrado.</p>
        ) : (
          <>
            <table className="queue-table">
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Paciente</th>
                  <th>CPF</th>
                  <th>Empresa</th>
                  <th>Clínica</th>
                  <th>Médico</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Abertura</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {protocolos.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, color: '#4f46e5', fontSize: '12px', cursor: 'pointer' }} onClick={() => handleView(p)}>
                      {p.numeroProtocolo}
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.paciente?.name || '—'}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{p.paciente?.cpf || '—'}</td>
                    <td>{p.empresa?.nomeFantasia || p.empresa?.razaoSocial || '—'}</td>
                    <td>{p.clinica?.name || '—'}</td>
                    <td>
                      {p.medico ? (
                        <>
                          {p.medico.name} ({p.medico.crmNumber || ''} {p.medico.crmState || ''})
                        </>
                      ) : '—'}
                    </td>
                    <td className="capitalize">{p.tipoExame?.replace(/_/g, ' ')}</td>
                    <td>{getStatusBadge(p.status)}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatDate(p.dataAbertura)}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                        onClick={() => handleView(p)}
                      >
                        <DocumentTextIcon className="icon-sm" /> Visualizar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Anterior
                </button>
                <span style={{ padding: '0 16px', color: 'var(--text-secondary)' }}>
                  Página {page} de {totalPages}
                </span>
                <button
                  className="btn btn-ghost"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}