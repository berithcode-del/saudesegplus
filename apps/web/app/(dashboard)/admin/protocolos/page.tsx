'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowPathIcon, MagnifyingGlassIcon, FunnelIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { asoProtocoloApi } from '@/lib/api/aso-protocolo';
import type { ProtocoloASO, StatusProtocolo, ProtocoloListResponse, ProtocoloQueryDto, TipoExame } from '@/lib/types/aso-protocolo';

const STATUS_COLOR: Record<StatusProtocolo, { bg: string; color: string }> = {
  AGUARDANDO_COLETA: { bg: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' },
  EM_COLETA: { bg: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' },
  NA_FILA_MEDICA: { bg: 'rgba(249, 115, 22, 0.12)', color: '#ea580c' },
  EM_ATENDIMENTO: { bg: 'rgba(6, 182, 212, 0.12)', color: '#0891b2' },
  DOCUMENTOS_PENDENTES: { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706' },
  CONCLUIDO: { bg: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' },
  CANCELADO: { bg: 'rgba(156, 163, 175, 0.12)', color: '#6b7280' },
};

const TIPO_EXAME_LABEL: Record<TipoExame, string> = {
  ADMISSIONAL: 'Admissional',
  PERIODICO: 'Periódico',
  DEMISSIONAL: 'Demissional',
  MUDANCA_FUNCAO: 'Mudança de Função',
  RETORNO_TRABALHO: 'Retorno ao Trabalho',
};

export default function AdminProtocolosPage() {
  const router = useRouter();
  const [protocolos, setProtocolos] = useState<ProtocoloASO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Omit<ProtocoloQueryDto, 'page' | 'limit'>>({
    numeroProtocolo: '',
    status: undefined,
    empresaId: '',
    clinicaId: '',
    tipoExame: undefined,
    dataInicio: '',
    dataFim: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const loadProtocolos = async () => {
    setLoading(true);
    try {
      const query: ProtocoloQueryDto = {
        page,
        limit: 20,
        numeroProtocolo: filters.numeroProtocolo || undefined,
        status: (filters.status as StatusProtocolo) || undefined,
        empresaId: filters.empresaId || undefined,
        clinicaId: filters.clinicaId || undefined,
        tipoExame: (filters.tipoExame as TipoExame) || undefined,
        dataInicio: filters.dataInicio || undefined,
        dataFim: filters.dataFim || undefined,
      };
      const response = await asoProtocoloApi.list(query);
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

  const handleFilterChange = (key: keyof ProtocoloQueryDto, value: string) => {
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
      status: undefined,
      empresaId: '',
      clinicaId: '',
      tipoExame: undefined,
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
      <span className="badge" style={{ background: style.bg, color: style.color }}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const handleView = (protocolo: ProtocoloASO) => {
    router.push(`/admin/protocolos/${protocolo.id}`);
  };

  const stats = [
    { label: 'Total Protocolos', value: total, color: '#4f46e5' },
    { label: 'Esta Página', value: protocolos.length, color: '#0ea5e9' },
    { label: 'Página', value: `${page} / ${totalPages}`, color: '#f59e0b' },
    { label: 'Concluídos', value: protocolos.filter(p => p.status === 'CONCLUIDO').length, color: '#16a34a' },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Protocolos ASO</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>
            Gerenciamento completo de protocolos - visualização, edição e exclusão
          </p>
        </div>
        <button className="btn btn-primary" onClick={loadProtocolos} disabled={loading} style={{ padding: '10px 20px' }}>
          <ArrowPathIcon className="icon" /> Atualizar
        </button>
      </div>

      {/* Stats Grid - usando padrão do design system */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(160px, 1fr))', marginBottom: '20px' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters Card */}
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

      {/* Table Card */}
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
                    <td className="capitalize">{TIPO_EXAME_LABEL[p.tipoExame] || p.tipoExame}</td>
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
    </>
  );
}