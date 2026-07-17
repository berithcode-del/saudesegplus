'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowPathIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  XMarkIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { asoProtocoloApi } from '@/lib/api/aso-protocolo';
import type {
  ProtocoloASO,
  ProtocoloQueryDto,
  StatusProtocolo,
  TipoExame,
} from '@/lib/types/aso-protocolo';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

const statusColors: Record<StatusProtocolo, string> = {
  AGUARDANDO_COLETA: 'blue',
  EM_COLETA: 'purple',
  NA_FILA_MEDICA: 'orange',
  EM_ATENDIMENTO: 'cyan',
  DOCUMENTOS_PENDENTES: 'gold',
  CONCLUIDO: 'green',
  CANCELADO: 'red',
};

const statusLabels: Record<StatusProtocolo, string> = {
  AGUARDANDO_COLETA: 'Aguardando Coleta',
  EM_COLETA: 'Em Coleta',
  NA_FILA_MEDICA: 'Na Fila Médica',
  EM_ATENDIMENTO: 'Em Atendimento',
  DOCUMENTOS_PENDENTES: 'Documentos Pendentes',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

const tipoExameOptions = [
  { value: 'ADMISSIONAL', label: 'Admissional' },
  { value: 'PERIODICO', label: 'Periódico' },
  { value: 'DEMISSIONAL', label: 'Demissional' },
  { value: 'MUDANCA_FUNCAO', label: 'Mudança de Função' },
  { value: 'RETORNO_TRABALHO', label: 'Retorno ao Trabalho' },
];

const statusOptions = [
  { value: 'AGUARDANDO_COLETA', label: 'Aguardando Coleta' },
  { value: 'EM_COLETA', label: 'Em Coleta' },
  { value: 'NA_FILA_MEDICA', label: 'Na Fila Médica' },
  { value: 'EM_ATENDIMENTO', label: 'Em Atendimento' },
  { value: 'DOCUMENTOS_PENDENTES', label: 'Documentos Pendentes' },
  { value: 'CONCLUIDO', label: 'Concluído' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

export default function ProtocolosPage() {
  const router = useRouter();
  const [protocolos, setProtocolos] = useState<ProtocoloASO[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState<ProtocoloQueryDto>({ page: 1, limit: 20 });
  const [searchValue, setSearchValue] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await asoProtocoloApi.list({ ...filters, page: pagination.current, limit: pagination.pageSize });
      setProtocolos(res.data);
      setPagination((prev) => ({ ...prev, total: res.total }));
    } catch (err) {
      console.error(err);
      setProtocolos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, numeroProtocolo: searchValue || undefined }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setSearchValue('');
    setFilters({ page: 1, limit: 20 });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleStatusChange = (value: StatusProtocolo) => {
    setFilters((prev) => ({ ...prev, status: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTipoChange = (value: TipoExame) => {
    setFilters((prev) => ({ ...prev, tipoExame: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleDateChange = (dates: [Date, Date] | [null, null]) => {
    if (dates[0] && dates[1]) {
      setFilters((prev) => ({
        ...prev,
        dataInicio: dates[0].toISOString(),
        dataFim: dates[1].toISOString(),
      }));
    } else {
      setFilters((prev) => {
        const { dataInicio, dataFim, ...rest } = prev;
        return rest;
      });
    }
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const columns = [
    {
      title: 'Protocolo',
      dataIndex: 'numeroProtocolo',
      key: 'numeroProtocolo',
      width: 160,
    },
    {
      title: 'Paciente',
      dataIndex: 'paciente',
      key: 'paciente',
      render: (p: any) => p?.name || '-',
      width: 180,
    },
    {
      title: 'CPF',
      dataIndex: 'paciente',
      key: 'cpf',
      render: (p: any) => p?.cpf || '-',
      width: 140,
    },
    {
      title: 'Empresa',
      dataIndex: 'empresa',
      key: 'empresa',
      render: (e: any) => e?.nomeFantasia || e?.razaoSocial || e?.name || '-',
      width: 160,
    },
    {
      title: 'Clínica',
      dataIndex: 'clinica',
      key: 'clinica',
      render: (c: any) => c?.name || '-',
      width: 160,
    },
    {
      title: 'Tipo Exame',
      dataIndex: 'tipoExame',
      key: 'tipoExame',
      width: 120,
    },
    {
      title: 'Data',
      dataIndex: 'dataAbertura',
      key: 'dataAbertura',
      render: (v: string) => new Date(v).toLocaleDateString('pt-BR'),
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: StatusProtocolo) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
            background: `rgba(${statusColors[status] === 'blue' ? '59, 130, 246' : statusColors[status] === 'purple' ? '168, 85, 247' : statusColors[status] === 'orange' ? '249, 115, 22' : statusColors[status] === 'cyan' ? '6, 182, 212' : statusColors[status] === 'gold' ? '234, 179, 8' : statusColors[status] === 'green' ? '34, 197, 94' : '239, 68, 68'}, 0.12)`,
            color: statusColors[status] === 'blue' ? '#2563eb' : statusColors[status] === 'purple' ? '#9333ea' : statusColors[status] === 'orange' ? '#ea580c' : statusColors[status] === 'cyan' ? '#0891b2' : statusColors[status] === 'gold' ? '#ca8a04' : statusColors[status] === 'green' ? '#16a34a' : '#dc2626',
          }}
        >
          {statusLabels[status]}
        </span>
      ),
      width: 160,
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 120,
      render: (_: any, record: ProtocoloASO) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href={`/aso/protocolos/${record.id}`}>
            <button className="btn btn-secondary" style={{ padding: '6px 10px', minHeight: 'unset' }}>
              <MagnifyingGlassIcon className="icon-sm" />
            </button>
          </a>
          <a href={`/aso/protocolos/${record.id}/editar`}>
            <button className="btn btn-secondary" style={{ padding: '6px 10px', minHeight: 'unset' }}>
              <PencilIcon className="icon-sm" />
            </button>
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2>Protocolos ASO</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Gerencie e acompanhe todos os processos de ASO</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="/aso/protocolos/novo">
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DocumentArrowDownIcon className="icon" /> Novo Protocolo
            </button>
          </a>
          <button className="btn btn-secondary" onClick={() => fetchData()}>
            <ArrowPathIcon className="icon" /> Atualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label className="label">Nº Protocolo</label>
            <input
              type="text"
              className="input"
              placeholder="ASO-2026-0001"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ minWidth: '160px' }}>
            <label className="label">Status</label>
            <select className="select" value={filters.status || ''} onChange={(e) => handleStatusChange(e.target.value as StatusProtocolo)} style={{ width: '100%' }}>
              <option value="">Todos</option>
              {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div style={{ minWidth: '160px' }}>
            <label className="label">Tipo Exame</label>
            <select className="select" value={filters.tipoExame || ''} onChange={(e) => handleTipoChange(e.target.value as TipoExame)} style={{ width: '100%' }}>
              <option value="">Todos</option>
              {tipoExameOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div style={{ minWidth: '320px' }}>
            <label className="label">Período</label>
            <input
              type="date"
              className="input"
              value={filters.dataInicio ? filters.dataInicio.split('T')[0] : ''}
              onChange={(e) => {
                const inicio = e.target.value;
                const fim = filters.dataFim?.split('T')[0];
                if (inicio && fim) handleDateChange([new Date(inicio), new Date(fim)]);
              }}
              style={{ width: '100%', display: 'inline-block' }}
            />
            {' '}até{' '}
            <input
              type="date"
              className="input"
              value={filters.dataFim ? filters.dataFim.split('T')[0] : ''}
              onChange={(e) => {
                const fim = e.target.value;
                const inicio = filters.dataInicio?.split('T')[0];
                if (inicio && fim) handleDateChange([new Date(inicio), new Date(fim)]);
              }}
              style={{ width: '100%', display: 'inline-block' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MagnifyingGlassIcon className="icon" /> Buscar
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FunnelIcon className="icon" /> Limpar
          </button>
        </form>
      </div>

      {/* Tabela */}
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
                  {columns.map((col) => (
                    <th key={col.key} style={{ width: col.width }}>
                      {col.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {protocolos.map((proto) => (
                  <tr key={proto.id}>
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render ? col.render(proto[col.dataIndex as keyof ProtocoloASO], proto) : proto[col.dataIndex as keyof ProtocoloASO] as React.ReactNode}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <span>Total: {pagination.total} registros</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  disabled={pagination.current === 1}
                  onClick={() => setPagination((prev) => ({ ...prev, current: prev.current - 1 }))}
                >
                  Anterior
                </button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                  Página {pagination.current} de {Math.ceil(pagination.total / pagination.pageSize) || 1}
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                  onClick={() => setPagination((prev) => ({ ...prev, current: prev.current + 1 }))}
                >
                  Próxima
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}