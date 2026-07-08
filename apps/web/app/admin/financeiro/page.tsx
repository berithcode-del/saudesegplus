'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  CurrencyDollarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  BuildingOffice2Icon, UserCircleIcon, WrenchScrewdriverIcon,
  CheckCircleIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon,
  CalendarIcon, Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

type Tab = 'dashboard' | 'transacoes' | 'medicos' | 'clinicas' | 'despesas' | 'configuracoes';

interface Summary { receita: number; despesas: number; repasseClinica: number; repasseMedico: number; lucroLiquido: number; pendentesClinica: number; pendentesMedico: number; }
interface Transaction { id: string; type: string; category: string; description: string; amount: number; status: string; transactionDate: string; method?: string; notes?: string; clinic?: { name: string }; doctor?: { name: string }; company?: { razaoSocial: string; nomeFantasia?: string }; }
interface ServicePrice { id: string; name: string; description?: string; basePrice: number; clinicFeePercent: number; doctorFeePercent: number; platformFeePercent: number; isActive: boolean; }
interface Config { id: string; defaultClinicFeePercent: number; defaultDoctorFeePercent: number; defaultPlatformFeePercent: number; }

export default function AdminFinanceiroPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState<ServicePrice | null>(null);
  const [priceForm, setPriceForm] = useState({ name: '', description: '', basePrice: '250', clinicFeePercent: '30', doctorFeePercent: '40', platformFeePercent: '30' });
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', notes: '', method: 'PIX' });
  const [configForm, setConfigForm] = useState({ defaultClinicFeePercent: '30', defaultDoctorFeePercent: '40', defaultPlatformFeePercent: '30' });
  const [saving, setSaving] = useState(false);

  const loadSummary = useCallback(async () => {
    const r = await fetch(`${BACKEND_URL}/api/financial/summary?month=${month}&year=${year}`);
    const j = await r.json();
    setSummary(j.data);
  }, [month, year]);

  const loadTransactions = useCallback(async () => {
    const r = await fetch(`${BACKEND_URL}/api/financial/transactions?month=${month}&year=${year}`);
    const j = await r.json();
    setTransactions(Array.isArray(j.data) ? j.data : []);
  }, [month, year]);

  const loadConfigs = useCallback(async () => {
    const [pr, cf] = await Promise.all([
      fetch(`${BACKEND_URL}/api/financial/service-prices`).then(r => r.json()),
      fetch(`${BACKEND_URL}/api/financial/config`).then(r => r.json()),
    ]);
    setServicePrices(Array.isArray(pr.data) ? pr.data : []);
    if (cf.data) {
      setConfig(cf.data);
      setConfigForm({ defaultClinicFeePercent: String(cf.data.defaultClinicFeePercent), defaultDoctorFeePercent: String(cf.data.defaultDoctorFeePercent), defaultPlatformFeePercent: String(cf.data.defaultPlatformFeePercent) });
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadSummary(), loadTransactions(), loadConfigs()]).finally(() => setLoading(false));
  }, [loadSummary, loadTransactions, loadConfigs]);

  const handleSaveConfig = async () => {
    setSaving(true);
    await fetch(`${BACKEND_URL}/api/financial/config`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ defaultClinicFeePercent: Number(configForm.defaultClinicFeePercent), defaultDoctorFeePercent: Number(configForm.defaultDoctorFeePercent), defaultPlatformFeePercent: Number(configForm.defaultPlatformFeePercent) }) });
    await loadConfigs();
    setSaving(false);
    alert('Configurações salvas!');
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { name: priceForm.name, description: priceForm.description, basePrice: Number(priceForm.basePrice), clinicFeePercent: Number(priceForm.clinicFeePercent), doctorFeePercent: Number(priceForm.doctorFeePercent), platformFeePercent: Number(priceForm.platformFeePercent) };
    if (editingPrice) {
      await fetch(`${BACKEND_URL}/api/financial/service-prices/${editingPrice.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      await fetch(`${BACKEND_URL}/api/financial/service-prices`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    await loadConfigs();
    setShowPriceModal(false);
    setEditingPrice(null);
    setPriceForm({ name: '', description: '', basePrice: '250', clinicFeePercent: '30', doctorFeePercent: '40', platformFeePercent: '30' });
    setSaving(false);
  };

  const handleMarkAsPaid = async (id: string) => {
    await fetch(`${BACKEND_URL}/api/financial/transactions/${id}/pay`, { method: 'PATCH' });
    await loadTransactions();
    await loadSummary();
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`${BACKEND_URL}/api/financial/transactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'DESPESA', category: 'CUSTO_OPERACIONAL', description: expenseForm.description, amount: Number(expenseForm.amount), method: expenseForm.method, notes: expenseForm.notes }) });
    await Promise.all([loadTransactions(), loadSummary()]);
    setShowExpenseModal(false);
    setExpenseForm({ description: '', amount: '', notes: '', method: 'PIX' });
    setSaving(false);
  };

  const tabs: { id: Tab; label: string; icon: typeof CurrencyDollarIcon }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: CurrencyDollarIcon },
    { id: 'transacoes', label: 'Transações', icon: ArrowTrendingUpIcon },
    { id: 'medicos', label: 'Repasse Médicos', icon: UserCircleIcon },
    { id: 'clinicas', label: 'Repasse Clínicas', icon: BuildingOffice2Icon },
    { id: 'despesas', label: 'Despesas', icon: ArrowTrendingDownIcon },
    { id: 'configuracoes', label: 'Configurações', icon: Cog6ToothIcon },
  ];

  const repassesMedicos = transactions.filter(t => t.category === 'HONORARIO_MEDICO');
  const repassesClinicas = transactions.filter(t => t.category === 'TAXA_CLINICA');
  const despesas = transactions.filter(t => t.type === 'DESPESA');

  return (
    <div>
      <div className="page-header">
        <h2>Financeiro</h2>
        <p>Gestão de receitas, repasses e despesas da plataforma</p>
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

      {/* Abas */}
      <div className="card" style={{ padding: 0, marginBottom: '20px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '14px 18px', background: 'transparent', border: 'none', borderBottom: tab === t.id ? '2px solid #3b6ff5' : '2px solid transparent', color: tab === t.id ? '#3b6ff5' : 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <t.icon className="icon icon-sm" />{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── DASHBOARD ── */}
      {tab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Receita Bruta', value: summary?.receita, color: '#16a34a', bg: 'rgba(22,163,74,0.1)', icon: ArrowTrendingUpIcon },
              { label: 'Repasse Clínicas', value: summary?.repasseClinica, color: '#3b6ff5', bg: 'rgba(59,111,245,0.1)', icon: BuildingOffice2Icon },
              { label: 'Honorários Médicos', value: summary?.repasseMedico, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', icon: UserCircleIcon },
              { label: 'Despesas', value: summary?.despesas, color: '#dc2626', bg: 'rgba(220,38,38,0.1)', icon: ArrowTrendingDownIcon },
              { label: 'Lucro Líquido', value: summary?.lucroLiquido, color: (summary?.lucroLiquido ?? 0) >= 0 ? '#16a34a' : '#dc2626', bg: (summary?.lucroLiquido ?? 0) >= 0 ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', icon: CurrencyDollarIcon },
            ].map(card => (
              <div key={card.label} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ padding: '8px', borderRadius: '10px', background: card.bg }}><card.icon className="icon icon-sm" style={{ color: card.color }} /></div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{card.label}</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: card.color }}>{loading ? '—' : fmt(card.value ?? 0)}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Repasses Pendentes</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(59,111,245,0.06)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '14px' }}>Para Clínicas</span>
                  <span style={{ fontWeight: 700, color: '#3b6ff5' }}>{fmt(summary?.pendentesClinica ?? 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(124,58,237,0.06)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '14px' }}>Para Médicos</span>
                  <span style={{ fontWeight: 700, color: '#7c3aed' }}>{fmt(summary?.pendentesMedico ?? 0)}</span>
                </div>
              </div>
            </div>
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Últimas Transações</h3>
              {transactions.slice(0, 4).map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: t.type === 'RECEITA' ? '#16a34a' : '#dc2626' }}>{t.type === 'RECEITA' ? '+' : '-'}{fmt(t.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TRANSAÇÕES ── */}
      {tab === 'transacoes' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Todas as Transações</h3>
          </div>
          <table className="queue-table">
            <thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor</th><th>Status</th></tr></thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td style={{ fontSize: '13px' }}>{new Date(t.transactionDate).toLocaleDateString('pt-BR')}</td>
                  <td style={{ fontSize: '13px', maxWidth: '220px' }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.company?.razaoSocial ?? t.clinic?.name ?? t.doctor?.name ?? ''}</div></td>
                  <td><span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: t.type === 'RECEITA' ? 'rgba(22,163,74,0.1)' : t.type === 'REPASSE' ? 'rgba(59,111,245,0.1)' : 'rgba(220,38,38,0.1)', color: t.type === 'RECEITA' ? '#16a34a' : t.type === 'REPASSE' ? '#3b6ff5' : '#dc2626' }}>{t.type}</span></td>
                  <td style={{ fontWeight: 700, color: t.type === 'RECEITA' ? '#16a34a' : '#dc2626' }}>{t.type === 'RECEITA' ? '+' : '-'}{fmt(t.amount)}</td>
                  <td><span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: t.status === 'PAGO' ? 'rgba(22,163,74,0.1)' : 'rgba(245,166,35,0.1)', color: t.status === 'PAGO' ? '#16a34a' : '#d97706' }}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── REPASSE MÉDICOS ── */}
      {tab === 'medicos' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Honorários Médicos</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{repassesMedicos.filter(t => t.status === 'PENDENTE').length} pendente(s)</span>
          </div>
          <table className="queue-table">
            <thead><tr><th>Data</th><th>Médico</th><th>Exame</th><th>Valor</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>
              {repassesMedicos.map(t => (
                <tr key={t.id}>
                  <td style={{ fontSize: '13px' }}>{new Date(t.transactionDate).toLocaleDateString('pt-BR')}</td>
                  <td style={{ fontWeight: 600 }}>{t.doctor?.name ?? '—'}</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t.description}</td>
                  <td style={{ fontWeight: 700, color: '#7c3aed' }}>{fmt(t.amount)}</td>
                  <td><span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: t.status === 'PAGO' ? 'rgba(22,163,74,0.1)' : 'rgba(245,166,35,0.1)', color: t.status === 'PAGO' ? '#16a34a' : '#d97706' }}>{t.status}</span></td>
                  <td>{t.status === 'PENDENTE' && <button className="btn btn-success" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => handleMarkAsPaid(t.id)}><CheckCircleIcon className="icon icon-xs" /> Pagar</button>}</td>
                </tr>
              ))}
              {repassesMedicos.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Nenhum honorário no período</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ── REPASSE CLÍNICAS ── */}
      {tab === 'clinicas' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Repasses para Clínicas</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{repassesClinicas.filter(t => t.status === 'PENDENTE').length} pendente(s)</span>
          </div>
          <table className="queue-table">
            <thead><tr><th>Data</th><th>Clínica</th><th>Descrição</th><th>Valor</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>
              {repassesClinicas.map(t => (
                <tr key={t.id}>
                  <td style={{ fontSize: '13px' }}>{new Date(t.transactionDate).toLocaleDateString('pt-BR')}</td>
                  <td style={{ fontWeight: 600 }}>{t.clinic?.name ?? '—'}</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t.description}</td>
                  <td style={{ fontWeight: 700, color: '#3b6ff5' }}>{fmt(t.amount)}</td>
                  <td><span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: t.status === 'PAGO' ? 'rgba(22,163,74,0.1)' : 'rgba(245,166,35,0.1)', color: t.status === 'PAGO' ? '#16a34a' : '#d97706' }}>{t.status}</span></td>
                  <td>{t.status === 'PENDENTE' && <button className="btn btn-success" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => handleMarkAsPaid(t.id)}><CheckCircleIcon className="icon icon-xs" /> Pagar</button>}</td>
                </tr>
              ))}
              {repassesClinicas.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Nenhum repasse no período</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ── DESPESAS ── */}
      {tab === 'despesas' && (
        <>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setShowExpenseModal(true)}><PlusIcon className="icon icon-sm" /> Nova Despesa</button>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <table className="queue-table">
              <thead><tr><th>Data</th><th>Descrição</th><th>Notas</th><th>Valor</th><th>Método</th></tr></thead>
              <tbody>
                {despesas.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontSize: '13px' }}>{new Date(t.transactionDate).toLocaleDateString('pt-BR')}</td>
                    <td style={{ fontWeight: 600 }}>{t.description}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t.notes ?? '—'}</td>
                    <td style={{ fontWeight: 700, color: '#dc2626' }}>-{fmt(t.amount)}</td>
                    <td style={{ fontSize: '13px' }}>{t.method ?? '—'}</td>
                  </tr>
                ))}
                {despesas.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Nenhuma despesa no período</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── CONFIGURAÇÕES ── */}
      {tab === 'configuracoes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Config Global */}
          <div className="card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Porcentagens Globais de Repasse</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Estes valores são usados como padrão quando um exame não tem um preço específico configurado.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              {[
                { label: '% Repasse Clínica', key: 'defaultClinicFeePercent', color: '#3b6ff5' },
                { label: '% Honorário Médico', key: 'defaultDoctorFeePercent', color: '#7c3aed' },
                { label: '% Margem Plataforma', key: 'defaultPlatformFeePercent', color: '#16a34a' },
              ].map(field => (
                <div key={field.key} className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: field.color }}>{field.label}</label>
                  <input type="number" min="0" max="100" className="form-input" value={(configForm as any)[field.key]} onChange={e => setConfigForm(p => ({ ...p, [field.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Soma: {Number(configForm.defaultClinicFeePercent) + Number(configForm.defaultDoctorFeePercent) + Number(configForm.defaultPlatformFeePercent)}% (deve ser 100%)
            </p>
            <button className="btn btn-primary" disabled={saving} onClick={handleSaveConfig}>Salvar Configurações</button>
          </div>

          {/* Preços por Tipo de Exame */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Preços por Tipo de Exame</h3>
              <button className="btn btn-primary" onClick={() => { setEditingPrice(null); setPriceForm({ name: '', description: '', basePrice: '250', clinicFeePercent: '30', doctorFeePercent: '40', platformFeePercent: '30' }); setShowPriceModal(true); }}><PlusIcon className="icon icon-sm" /> Novo Preço</button>
            </div>
            <table className="queue-table">
              <thead><tr><th>Nome</th><th>Preço Base</th><th>% Clínica</th><th>% Médico</th><th>% Plataforma</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {servicePrices.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}><div>{p.name}</div>{p.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.description}</div>}</td>
                    <td style={{ fontWeight: 700, color: '#16a34a' }}>{fmt(p.basePrice)}</td>
                    <td>{p.clinicFeePercent}%</td>
                    <td>{p.doctorFeePercent}%</td>
                    <td>{p.platformFeePercent}%</td>
                    <td><span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: p.isActive ? 'rgba(22,163,74,0.1)' : 'rgba(107,114,128,0.1)', color: p.isActive ? '#16a34a' : '#6b7280' }}>{p.isActive ? 'Ativo' : 'Inativo'}</span></td>
                    <td>
                      <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => { setEditingPrice(p); setPriceForm({ name: p.name, description: p.description ?? '', basePrice: String(p.basePrice), clinicFeePercent: String(p.clinicFeePercent), doctorFeePercent: String(p.doctorFeePercent), platformFeePercent: String(p.platformFeePercent) }); setShowPriceModal(true); }}>Editar</button>
                    </td>
                  </tr>
                ))}
                {servicePrices.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Nenhum preço cadastrado</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Nova Despesa */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px' }}>Lançar Despesa Operacional</h3>
            <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Descrição *</label><input className="form-input" required value={expenseForm.description} onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Valor (R$) *</label><input type="number" step="0.01" className="form-input" required value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} /></div>
              <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Método</label><select className="form-select" value={expenseForm.method} onChange={e => setExpenseForm(p => ({ ...p, method: e.target.value }))}><option>PIX</option><option>BOLETO</option><option>TRANSFERENCIA</option><option>DINHEIRO</option></select></div>
              <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Notas</label><textarea className="form-input" rows={2} value={expenseForm.notes} onChange={e => setExpenseForm(p => ({ ...p, notes: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowExpenseModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Preço de Serviço */}
      {showPriceModal && (
        <div className="modal-overlay" onClick={() => setShowPriceModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px' }}>{editingPrice ? 'Editar Preço' : 'Novo Preço de Serviço'}</h3>
            <form onSubmit={handleSavePrice} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Nome do Exame *</label><input className="form-input" required value={priceForm.name} onChange={e => setPriceForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Exame Admissional" /></div>
              <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Descrição</label><input className="form-input" value={priceForm.description} onChange={e => setPriceForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Preço Base (R$) *</label><input type="number" step="0.01" className="form-input" required value={priceForm.basePrice} onChange={e => setPriceForm(p => ({ ...p, basePrice: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label" style={{ color: '#3b6ff5' }}>% Clínica</label><input type="number" className="form-input" value={priceForm.clinicFeePercent} onChange={e => setPriceForm(p => ({ ...p, clinicFeePercent: e.target.value }))} /></div>
                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label" style={{ color: '#7c3aed' }}>% Médico</label><input type="number" className="form-input" value={priceForm.doctorFeePercent} onChange={e => setPriceForm(p => ({ ...p, doctorFeePercent: e.target.value }))} /></div>
                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label" style={{ color: '#16a34a' }}>% Plataforma</label><input type="number" className="form-input" value={priceForm.platformFeePercent} onChange={e => setPriceForm(p => ({ ...p, platformFeePercent: e.target.value }))} /></div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Soma: {Number(priceForm.clinicFeePercent) + Number(priceForm.doctorFeePercent) + Number(priceForm.platformFeePercent)}%</p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowPriceModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
