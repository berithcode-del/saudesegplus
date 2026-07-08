'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';
const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function AdminClinicaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [clinic, setClinic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const fetchClinic = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/admin/clinics/${id}`);
      const data = await res.json();
      setClinic(data);
      setForm({
        name: data.name ?? '',
        cnpj: data.cnpj ?? '',
        address: data.address ?? '',
        city: data.city ?? '',
        state: data.state ?? '',
      });
    } catch { setClinic(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClinic(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${BACKEND}/api/admin/clinics/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setEditing(false);
      fetchClinic();
    } catch { alert('Erro ao salvar.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Excluir a clínica "${clinic?.name}"? Esta ação não pode ser desfeita.`)) return;
    await fetch(`${BACKEND}/api/admin/clinics/${id}`, { method: 'DELETE' });
    router.push('/admin/clinicas');
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Carregando...</div>;
  if (!clinic) return <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>Clínica não encontrada.</div>;

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-ghost" style={{ padding: '8px' }} onClick={() => router.push('/admin/clinicas')}>
            <ArrowLeftIcon style={{ width: 20, height: 20 }} />
          </button>
          <BuildingStorefrontIcon style={{ width: 28, height: 28, color: '#4f46e5' }} />
          <div>
            <h2 style={{ margin: 0 }}>{clinic.name}</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
              {[clinic.city, clinic.state].filter(Boolean).join(' · ')} · CNPJ: {clinic.cnpj}
            </p>
          </div>
          <span style={{
            marginLeft: 'auto', padding: '4px 14px', borderRadius: '20px', fontSize: 13, fontWeight: 600,
            background: clinic.isActive ? '#dcfce7' : '#fee2e2',
            color: clinic.isActive ? '#16a34a' : '#dc2626',
          }}>
            {clinic.isActive ? '● Ativa' : '● Inativa'}
          </span>
        </div>
      </div>

      {/* Info Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Dados da Clínica</h3>
          {!editing ? (
            <button className="btn btn-ghost" onClick={() => setEditing(true)}>
              <PencilSquareIcon style={{ width: 16 }} /> Editar
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-success" onClick={handleSave} disabled={saving}>
                <CheckIcon style={{ width: 16 }} /> {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button className="btn btn-ghost" onClick={() => setEditing(false)}>
                <XMarkIcon style={{ width: 16 }} /> Cancelar
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Nome *</label>
              <input className="form-input" value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">CNPJ</label>
              <input className="form-input" value={form.cnpj} onChange={e => setForm((p: any) => ({ ...p, cnpj: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Endereço</label>
              <input className="form-input" value={form.address} onChange={e => setForm((p: any) => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Cidade</label>
              <input className="form-input" value={form.city} onChange={e => setForm((p: any) => ({ ...p, city: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="form-select" value={form.state} onChange={e => setForm((p: any) => ({ ...p, state: e.target.value }))}>
                <option value="">Selecione</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div className="form-grid">
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>CNPJ</span><p style={{ margin: '4px 0 0' }}>{clinic.cnpj}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Endereço</span><p style={{ margin: '4px 0 0' }}>{[clinic.address, clinic.city, clinic.state].filter(Boolean).join(', ') || '—'}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Empresas Vinculadas</span><p style={{ margin: '4px 0 0' }}>{clinic.companies?.length ?? 0}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Operadores</span><p style={{ margin: '4px 0 0' }}>{clinic.operators?.length ?? 0}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Exames Realizados</span><p style={{ margin: '4px 0 0' }}>{clinic.examRequests?.length ?? 0}</p></div>
          </div>
        )}
      </div>

      {/* Companies attached */}
      {clinic.companies?.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px' }}>Empresas Atendidas</h3>
          <table className="queue-table">
            <thead><tr><th>Razão Social</th><th>CNPJ</th><th>Status</th></tr></thead>
            <tbody>
              {clinic.companies.map((c: any) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.razaoSocial ?? c.name ?? '—'}</td>
                  <td>{c.cnpj}</td>
                  <td>{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Danger Zone */}
      <div className="card" style={{ border: '1px solid #fca5a5', background: '#fff5f5' }}>
        <h3 style={{ margin: '0 0 8px', color: '#dc2626' }}>Zona de Risco</h3>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6b7280' }}>Excluir esta clínica remove todos os dados de operadores e vínculos com empresas.</p>
        <button className="btn btn-danger" onClick={handleDelete}>
          <TrashIcon style={{ width: 16, height: 16 }} /> Excluir Clínica
        </button>
      </div>
    </>
  );
}
