'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowPathIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { apiAdminListCompanies } from '../../../app/lib/api';

interface Company {
  id: string;
  razaoSocial?: string;
  cnpj: string;
  status: string;
  createdAt: string;
  pcmsoValid?: boolean;
  ppraValid?: boolean;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  LIBERADA: { label: 'Liberada', color: '#16a34a' },
  CADASTRO_INCOMPLETO: { label: 'Incompleto', color: '#d97706' },
  EM_ANALISE: { label: 'Em análise', color: '#3b82f6' },
  DOCUMENTACAO_VENCIDA: { label: 'Vencida', color: '#dc2626' },
};

export default function AdminEmpresasPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCompanies = async (status?: string) => {
    setLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (status) filters.status = status;
      const r = await apiAdminListCompanies(filters);
      setCompanies(Array.isArray(r.data) ? r.data : []);
    } catch { setCompanies([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const pendingCount = companies.filter(c => 
    c.status === 'CADASTRO_INCOMPLETO' || c.status === 'EM_ANALISE'
  ).length;

  return (
    <>
      <div className="page-header">
        <h2>Empresas</h2>
        <p>Gerencie as empresas cadastradas na plataforma</p>
      </div>
      
      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {[
          { label: 'Total', value: companies.length, color: '#4f46e5' },
          { label: 'Liberadas', value: companies.filter(c => c.status === 'LIBERADA').length, color: '#16a34a' },
          { label: 'Pendentes', value: pendingCount, color: '#f59e0b' },
          { label: 'Vencidas', value: companies.filter(c => c.status === 'DOCUMENTACAO_VENCIDA').length, color: '#dc2626' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
            <select className="form-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); fetchCompanies(e.target.value); }}>
              <option value="">Todas</option>
              <option value="LIBERADA">Liberada</option>
              <option value="CADASTRO_INCOMPLETO">Incompleto</option>
              <option value="EM_ANALISE">Em análise</option>
              <option value="DOCUMENTACAO_VENCIDA">Vencida</option>
            </select>
          </div>
          <button className="btn btn-ghost" onClick={() => fetchCompanies(statusFilter)}>
            <ArrowPathIcon className="icon icon-sm" /> Atualizar
          </button>
          {pendingCount > 0 && (
            <Link 
              href="/admin/empresas/pendentes" 
              className="btn btn-primary"
              style={{ 
                padding: '8px 16px', 
                fontSize: '13px', 
                textDecoration: 'none',
                background: '#f59e0b',
                marginLeft: 'auto'
              }}
            >
              <DocumentTextIcon className="icon icon-sm" />
              Aprovar Documentação ({pendingCount})
            </Link>
          )}
        </div>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Carregando...</p>
        ) : companies.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Nenhuma empresa encontrada.</p>
        ) : (
          <table className="queue-table">
            <thead>
              <tr>
                <th>Razão Social</th>
                <th>CNPJ</th>
                <th>Status</th>
                <th>Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(c => {
                const cfg = STATUS_LABELS[c.status] ?? { label: c.status, color: '#6b7280' };
                return (
                  <tr key={c.id}>
                    <td>{c.razaoSocial ?? '—'}</td>
                    <td>{c.cnpj}</td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: `${cfg.color}18`, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td>{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <Link href={`/admin/empresas/${c.id}`} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px', textDecoration: 'none' }}>
                        Ver detalhes
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
