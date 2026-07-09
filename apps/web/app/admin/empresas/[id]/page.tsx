'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/app/lib/api';
import {
  ArrowLeftIcon,
  BuildingOffice2Icon,
  TrashIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  LIBERADA: { label: 'Liberada', color: '#16a34a' },
  CADASTRO_INCOMPLETO: { label: 'Incompleto', color: '#d97706' },
  EM_ANALISE: { label: 'Em análise', color: '#3b82f6' },
  DOCUMENTACAO_VENCIDA: { label: 'Vencida', color: '#dc2626' },
};

export default function AdminEmpresaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === 'nova';
  
  const [company, setCompany] = useState<any>(isNew ? {} : null);
  const [loading, setLoading] = useState(!isNew);
  const [editing, setEditing] = useState(isNew);
  const [form, setForm] = useState<any>({ status: 'CADASTRO_INCOMPLETO' });
  const [saving, setSaving] = useState(false);

  const fetchCompany = async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/admin/companies/${id}`);
      setCompany(data);
      setForm({
        razaoSocial: data.razaoSocial ?? '',
        nomeFantasia: data.nomeFantasia ?? '',
        cnpj: data.cnpj ?? '',
        address: data.address ?? '',
        cep: data.cep ?? '',
        city: data.city ?? '',
        state: data.state ?? '',
        phone: data.phone ?? '',
        contactEmail: data.contactEmail ?? '',
        accessEmail: data.accessEmail ?? data.admins?.[0]?.user?.email ?? '',
        status: data.status ?? '',
      });
    } catch { setCompany(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCompany(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew) {
        await apiFetch('/api/admin/companies', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        router.push('/admin/empresas');
      } else {
        await apiFetch(`/api/admin/companies/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(form),
        });
        setEditing(false);
        fetchCompany();
      }
    } catch (error) { alert(error instanceof Error ? error.message : 'Erro ao salvar.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Excluir empresa "${company?.razaoSocial}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await apiFetch(`/api/admin/companies/${id}`, { method: 'DELETE' });
      router.push('/admin/empresas');
    } catch { alert('Erro ao excluir.'); }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Carregando...</div>;
  if (!company) return <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>Empresa não encontrada.</div>;

  const statusCfg = STATUS_CFG[company.status] ?? { label: company.status, color: '#6b7280' };

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-ghost" style={{ padding: '8px' }} onClick={() => router.push('/admin/empresas')}>
            <ArrowLeftIcon style={{ width: 20, height: 20 }} />
          </button>
          <BuildingOffice2Icon style={{ width: 28, height: 28, color: '#4f46e5' }} />
          <div>
            <h2 style={{ margin: 0 }}>{isNew ? 'Nova Empresa' : (company.razaoSocial ?? company.nomeFantasia ?? 'Empresa')}</h2>
            {!isNew && <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>CNPJ: {company.cnpj}</p>}
          </div>
          {!isNew && (
            <span style={{
              marginLeft: 'auto',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: 13,
              fontWeight: 600,
              background: `${statusCfg.color}18`,
              color: statusCfg.color,
            }}>
              {statusCfg.label}
            </span>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>{isNew ? 'Preencha os dados' : 'Dados da Empresa'}</h3>
          {!editing ? (
            <button className="btn btn-ghost" onClick={() => setEditing(true)}>
              <PencilSquareIcon style={{ width: 16, height: 16 }} /> Editar
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-success" onClick={handleSave} disabled={saving}>
                <CheckIcon style={{ width: 16 }} /> {saving ? 'Salvando...' : 'Salvar'}
              </button>
              {!isNew && (
                <button className="btn btn-ghost" onClick={() => setEditing(false)}>
                  <XMarkIcon style={{ width: 16 }} /> Cancelar
                </button>
              )}
            </div>
          )}
        </div>

        {editing ? (
          <div className="form-grid">
            {[
              { label: 'Razão Social', key: 'razaoSocial' },
              { label: 'Nome Fantasia', key: 'nomeFantasia' },
              { label: 'CNPJ', key: 'cnpj' },
              { label: 'Endereço', key: 'address' },
              { label: 'CEP', key: 'cep' },
              { label: 'Cidade', key: 'city' },
              { label: 'Estado', key: 'state' },
              { label: 'Telefone', key: 'phone' },
              { label: 'E-mail de Contato', key: 'contactEmail' },
              { label: 'E-mail de Acesso', key: 'accessEmail' },
            ].map(({ label, key }) => (
              <div className="form-group" key={key}>
                <label className="form-label">{label}</label>
                <input className="form-input" value={form[key] ?? ''} onChange={e => setForm((p: any) => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm((p: any) => ({ ...p, status: e.target.value }))}>
                <option value="CADASTRO_INCOMPLETO">Incompleto</option>
                <option value="EM_ANALISE">Em análise</option>
                <option value="LIBERADA">Liberada</option>
                <option value="DOCUMENTACAO_VENCIDA">Documentação Vencida</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="form-grid">
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Razão Social</span><p style={{ margin: '4px 0 0' }}>{company.razaoSocial ?? '—'}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Nome Fantasia</span><p style={{ margin: '4px 0 0' }}>{company.nomeFantasia ?? '—'}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>CNPJ</span><p style={{ margin: '4px 0 0' }}>{company.cnpj}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Endereço</span><p style={{ margin: '4px 0 0' }}>{[company.address, company.city, company.state].filter(Boolean).join(', ') || '—'}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Telefone</span><p style={{ margin: '4px 0 0' }}>{company.phone ?? '—'}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>E-mail de Contato</span><p style={{ margin: '4px 0 0' }}>{company.contactEmail ?? '—'}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>E-mail de Acesso</span><p style={{ margin: '4px 0 0' }}>{company.accessEmail ?? company.admins?.[0]?.user?.email ?? '—'}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Cadastro</span><p style={{ margin: '4px 0 0' }}>{new Date(company.createdAt).toLocaleDateString('pt-BR')}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Funcionários</span><p style={{ margin: '4px 0 0' }}>{company.patients?.length ?? 0}</p></div>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      {!isNew && (
        <div className="card" style={{ border: '1px solid #fca5a5', background: '#fff5f5' }}>
          <h3 style={{ margin: '0 0 8px', color: '#dc2626' }}>Zona de Risco</h3>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6b7280' }}>Esta ação é irreversível e removerá todos os dados associados à empresa.</p>
          <button className="btn btn-danger" onClick={handleDelete}>
            <TrashIcon style={{ width: 16, height: 16 }} /> Excluir Empresa
          </button>
        </div>
      )}
    </>
  );
}
