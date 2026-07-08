'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  CurrencyDollarIcon, ArrowTrendingUpIcon, CheckCircleIcon, ClockIcon, CalendarIcon,
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

interface Transaction { id: string; description: string; amount: number; status: string; transactionDate: string; examRequest?: { examPurpose: string }; company?: { razaoSocial: string }; }

export default function ConsultorioFinanceiroPage() {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Pega o clinicId do localStorage (salvo no login do operador)
  const clinicId = typeof window !== 'undefined' ? localStorage.getItem('clinicId') : null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month: String(month), year: String(year), category: 'TAXA_CLINICA' });
      if (clinicId) params.set('clinicId', clinicId);
      const r = await fetch(`${BACKEND_URL}/api/financial/transactions?${params}`);
      const j = await r.json();
      setTransactions(Array.isArray(j.data) ? j.data : []);
    } catch { setTransactions([]); }
    finally { setLoading(false); }
  }, [month, year, clinicId]);

  useEffect(() => { load(); }, [load]);

  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  const recebido = transactions.filter(t => t.status === 'PAGO').reduce((sum, t) => sum + t.amount, 0);
  const pendente = transactions.filter(t => t.status === 'PENDENTE').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div>
      <div className="page-header">
        <h2>Financeiro da Clínica</h2>
        <p>Seus repasses por exames realizados</p>
      </div>

      {/* Filtro período */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
        <CalendarIcon className="icon icon-sm" style={{ color: 'var(--text-secondary)' }} />
        <select className="form-select" style={{ width: 'auto' }} value={month} onChange={e => setMonth(Number(e.target.value))}>
          {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto' }} value={year} onChange={e => setYear(Number(e.target.value))}>
          {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {[
          { label: 'Total do Período', value: total, color: '#3b6ff5', icon: CurrencyDollarIcon },
          { label: 'Já Recebido', value: recebido, color: '#16a34a', icon: CheckCircleIcon },
          { label: 'A Receber', value: pendente, color: '#d97706', icon: ClockIcon },
        ].map(card => (
          <div key={card.label} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: `${card.color}18` }}>
                <card.icon className="icon icon-sm" style={{ color: card.color }} />
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{card.label}</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: card.color }}>{loading ? '—' : fmt(card.value)}</div>
          </div>
        ))}
      </div>

      {/* Tabela de repasses */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Repasses por Exame</h3>
        </div>
        {loading ? (
          <p style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</p>
        ) : (
          <table className="queue-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Empresa</th>
                <th>Valor do Repasse</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td style={{ fontSize: '13px' }}>{new Date(t.transactionDate).toLocaleDateString('pt-BR')}</td>
                  <td style={{ fontWeight: 600 }}>{t.description}</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t.company?.razaoSocial ?? '—'}</td>
                  <td style={{ fontWeight: 700, color: '#3b6ff5' }}>{fmt(t.amount)}</td>
                  <td>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: t.status === 'PAGO' ? 'rgba(22,163,74,0.1)' : 'rgba(217,119,6,0.1)', color: t.status === 'PAGO' ? '#16a34a' : '#d97706' }}>
                      {t.status === 'PAGO' ? '✓ Recebido' : '⏳ Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Nenhum repasse encontrado neste período
                </td></tr>
              )}
            </tbody>
          </table>
        )}
        {transactions.length > 0 && (
          <div style={{ padding: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{transactions.length} repasse(s) no período</span>
          </div>
        )}
      </div>
    </div>
  );
}
