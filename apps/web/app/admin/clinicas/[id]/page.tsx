'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/app/lib/api';
import {
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function AdminClinicaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [clinic, setClinic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [settingMatriz, setSettingMatriz] = useState(false);

  const fetchClinic = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/admin/clinics/${id}`);
      setClinic(data);
      setForm({
        name: data.name ?? '',
        cnpj: data.cnpj ?? '',
        address: data.address ?? '',
        city: data.city ?? '',
        state: data.state ?? '',
        phone: data.phone ?? '',
        contactEmail: data.contactEmail ?? '',
        accessEmail: data.accessEmail ?? data.user?.email ?? '',
      });
    } catch { setClinic(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClinic(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/admin/clinics/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      setEditing(false);
      fetchClinic();
    } catch (error) { alert(error instanceof Error ? error.message : 'Erro ao salvar.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Excluir a clínica "${clinic?.name}"? Esta ação não pode ser desfeita.`)) return;
    await apiFetch(`/api/admin/clinics/${id}`, { method: 'DELETE' });
    router.push('/admin/clinicas');
  };

  const handleSetMatriz = async (setAsMatriz: boolean) => {
    const message = setAsMatriz
      ? `Tem certeza que deseja definir "${clinic?.name}" como Clínica Matriz? Isso removerá o status de Matriz de qualquer outra clínica no mesmo estado.`
      : `Tem certeza que deseja remover o status de Clínica Matriz de "${clinic?.name}"?`;
    if (!window.confirm(message)) return;
    setSettingMatriz(true);
    try {
      await apiFetch(`/api/admin/clinics/${id}/matriz`, {
        method: 'PATCH',
        body: JSON.stringify({ setAsMatriz }),
      });
      fetchClinic();
    } catch (error) { alert(error instanceof Error ? error.message : 'Erro ao alterar status de Matriz.'); }
    finally { setSettingMatriz(false); }
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <span style={{
              marginLeft: 'auto', padding: '4px 14px', borderRadius: '20px', fontSize: 13, fontWeight: 600,
              background: clinic.isActive ? '#dcfce7' : '#fee2e2',
              color: clinic.isActive ? '#16a34a' : '#dc2626',
            }}>
              {clinic.isActive ? '● Ativa' : '● Inativa'}
            </span>
            {clinic.isMatriz && (
              <span style={{
                padding: '4px 14px', borderRadius: '20px', fontSize: 13, fontWeight: 600,
                background: '#fef3c7', color: '#92400e',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <BuildingStorefrontIcon style={{ width: 14, height: 14 }} /> Matriz
              </span>
            )}
          </div>
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
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm((p: any) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail de Contato</label>
              <input type="email" className="form-input" value={form.contactEmail} onChange={e => setForm((p: any) => ({ ...p, contactEmail: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail de Acesso</label>
              <input type="email" className="form-input" value={form.accessEmail} onChange={e => setForm((p: any) => ({ ...p, accessEmail: e.target.value }))} />
            </div>
          </div>
        ) : (
          <div className="form-grid">
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>CNPJ</span><p style={{ margin: '4px 0 0' }}>{clinic.cnpj}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Endereço</span><p style={{ margin: '4px 0 0' }}>{[clinic.address, clinic.city, clinic.state].filter(Boolean).join(', ') || '—'}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Telefone</span><p style={{ margin: '4px 0 0' }}>{clinic.phone ?? '—'}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>E-mail de Contato</span><p style={{ margin: '4px 0 0' }}>{clinic.contactEmail ?? '—'}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>E-mail de Acesso</span><p style={{ margin: '4px 0 0' }}>{clinic.accessEmail ?? clinic.user?.email ?? '—'}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Empresas Vinculadas</span><p style={{ margin: '4px 0 0' }}>{clinic.companies?.length ?? 0}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Operadores</span><p style={{ margin: '4px 0 0' }}>{clinic.operators?.length ?? 0}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Exames Realizados</span><p style={{ margin: '4px 0 0' }}>{clinic.examRequests?.length ?? 0}</p></div>
          </div>
        )}
      </div>

      {/* Matriz Toggle */}
      <div className="card" style={{ marginBottom: 20, border: '1px solid #fcd34d', background: '#fffbeb' }}>
        <h3 style={{ margin: '0 0 8px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BuildingStorefrontIcon style={{ width: 20, height: 20 }} /> Status de Clínica Matriz
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6b7280' }}>
          A Clínica Matriz é a clínica prioritária para receber pacientes quando não for encontrada uma clínica mais próxima por geolocalização.
          Apenas uma clínica por estado pode ser Matriz.
        </p>
        {clinic.isMatriz ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ color: '#92400e', fontWeight: 600, fontSize: 14 }}>
              🏢 Esta clínica está definida como <strong>Matriz</strong> para o estado de <strong>{clinic.state}</strong>.
            </span>
            <button
              className="btn btn-ghost"
              onClick={() => handleSetMatriz(false)}
              disabled={settingMatriz}
            >
              {settingMatriz ? <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span className="icon" style={{ animation: 'spin 1s linear infinite' }}>⟳</span> Removendo...</span> : 'Remover status de Matriz'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ color: '#6b7280', fontSize: 14 }}>
              Esta clínica <strong>não</strong> é uma Matriz.
            </span>
            <button
              className="btn btn-success"
              onClick={() => handleSetMatriz(true)}
              disabled={settingMatriz}
            >
              {settingMatriz ? <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span className="icon" style={{ animation: 'spin 1s linear infinite' }}>⟳</span> Definindo...</span> : 'Definir como Matriz'}
            </button>
          </div>
        )}
        <style jsx>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
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