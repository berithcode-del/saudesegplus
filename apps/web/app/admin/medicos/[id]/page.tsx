'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/app/lib/api';
import {
  ArrowLeftIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

export default function AdminMedicoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === 'novo';
  
  const [doctor, setDoctor] = useState<any>(isNew ? {} : null);
  const [loading, setLoading] = useState(!isNew);
  const [editing, setEditing] = useState(isNew);
  const [form, setForm] = useState<any>({ gender: 'male' });
  const [saving, setSaving] = useState(false);

  const fetchDoctor = async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/admin/doctors/${id}`);
      setDoctor(data);
      setForm({
        name: data.name ?? '',
        gender: data.gender ?? 'male',
        crmNumber: data.crmNumber ?? '',
        crmState: data.crmState ?? '',
        city: data.city ?? '',
        state: data.state ?? '',
        specialties: data.specialties ?? '',
        rqeNumber: data.rqeNumber ?? '',
        phone: data.phone ?? '',
        contactEmail: data.contactEmail ?? '',
        accessEmail: data.accessEmail ?? data.user?.email ?? '',
      });
    } catch { setDoctor(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDoctor(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew) {
        await apiFetch('/api/admin/doctors', {
          method: 'POST',
          body: JSON.stringify({ ...form, gender: form.gender ?? 'male', email: form.accessEmail }),
        });
        router.push('/admin/medicos');
      } else {
        await apiFetch(`/api/admin/doctors/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(form),
        });
        setEditing(false);
        fetchDoctor();
      }
    } catch (error) { alert(error instanceof Error ? error.message : 'Erro ao salvar.'); }
    finally { setSaving(false); }
  };

  const handleVerify = async () => {
    if (!window.confirm('Aprovar este médico?')) return;
    await apiFetch(`/api/admin/doctors/${id}/verify`, { method: 'POST' });
    fetchDoctor();
  };

  const handleDelete = async () => {
    if (!window.confirm(`Excluir o Dr(a). "${doctor?.name}"? Esta ação não pode ser desfeita.`)) return;
    await apiFetch(`/api/admin/doctors/${id}`, { method: 'DELETE' });
    router.push('/admin/medicos');
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Carregando...</div>;
  if (!doctor) return <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>Médico não encontrado.</div>;

  const isVerified = !!doctor.verifiedAt;

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-ghost" style={{ padding: '8px' }} onClick={() => router.push('/admin/medicos')}>
            <ArrowLeftIcon style={{ width: 20, height: 20 }} />
          </button>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 18,
          }}>
            {isNew ? '+' : (doctor?.name?.[0]?.toUpperCase() || 'M')}
          </div>
          <div>
            <h2 style={{ margin: 0 }}>{isNew ? 'Novo Médico' : `Dr(a). ${doctor?.name}`}</h2>
            {!isNew && (
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                CRM {doctor?.crmNumber}/{doctor?.crmState} · {doctor?.user?.email}
              </p>
            )}
          </div>
          {!isNew && (
            <span style={{
              marginLeft: 'auto', padding: '4px 14px', borderRadius: '20px', fontSize: 13, fontWeight: 600,
              background: isVerified ? '#dcfce7' : '#fef9c3',
              color: isVerified ? '#16a34a' : '#b45309',
            }}>
              {isVerified ? '✓ Verificado' : '⏳ Pendente'}
            </span>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>{isNew ? 'Preencha os dados' : 'Dados do Médico'}</h3>
          {!editing ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {!isVerified && (
                <button className="btn btn-success" onClick={handleVerify}>
                  <CheckBadgeIcon style={{ width: 16 }} /> Aprovar Médico
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => setEditing(true)}>
                <PencilSquareIcon style={{ width: 16 }} /> Editar
              </button>
            </div>
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
              { label: 'Nome Completo', key: 'name' },
              { label: 'Sexo', key: 'gender' },
              { label: 'CRM', key: 'crmNumber' },
              { label: 'Estado CRM', key: 'crmState' },
              { label: 'Cidade', key: 'city' },
              { label: 'Estado', key: 'state' },
              { label: 'Especialidades', key: 'specialties' },
              { label: 'RQE', key: 'rqeNumber' },
              { label: 'Telefone', key: 'phone' },
              { label: 'E-mail de Contato', key: 'contactEmail' },
              { label: 'E-mail de Acesso', key: 'accessEmail' },
            ].map(({ label, key }) => (
              <div className="form-group" key={key}>
                <label className="form-label">{label}</label>
                {key === 'gender' ? (
                  <select className="form-input" value={form[key] ?? 'male'} onChange={e => setForm((p: any) => ({ ...p, [key]: e.target.value }))}>
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                  </select>
                ) : (
                  <input className="form-input" value={form[key] ?? ''} onChange={e => setForm((p: any) => ({ ...p, [key]: e.target.value }))} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="form-grid">
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Sexo</span><p style={{ margin: '4px 0 0' }}>{doctor.gender === 'female' ? 'Feminino' : doctor.gender === 'male' ? 'Masculino' : '—'}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>CRM</span><p style={{ margin: '4px 0 0' }}>{doctor.crmNumber}/{doctor.crmState}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Especialidades</span><p style={{ margin: '4px 0 0' }}>{doctor.specialties ?? '—'}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Cidade / Estado</span><p style={{ margin: '4px 0 0' }}>{[doctor.city, doctor.state].filter(Boolean).join(' / ') || '—'}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>RQE</span><p style={{ margin: '4px 0 0' }}>{doctor.rqeNumber ?? '—'}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>E-mail de Acesso</span><p style={{ margin: '4px 0 0' }}>{doctor.user?.email ?? '—'}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Telefone</span><p style={{ margin: '4px 0 0' }}>{doctor.phone ?? '—'}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>E-mail de Contato</span><p style={{ margin: '4px 0 0' }}>{doctor.contactEmail ?? '—'}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Cadastrado em</span><p style={{ margin: '4px 0 0' }}>{doctor.user?.createdAt ? new Date(doctor.user.createdAt).toLocaleDateString('pt-BR') : '—'}</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Teleconsultas</span><p style={{ margin: '4px 0 0' }}>{doctor.teleconsultations?.length ?? 0} realizadas</p></div>
            <div><span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>ASOs Emitidos</span><p style={{ margin: '4px 0 0' }}>{doctor.asoDocuments?.length ?? 0}</p></div>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      {!isNew && (
        <div className="card" style={{ border: '1px solid #fca5a5', background: '#fff5f5' }}>
          <h3 style={{ margin: '0 0 8px', color: '#dc2626' }}>Zona de Risco</h3>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6b7280' }}>Excluir este médico removerá o acesso à plataforma e todos os dados vinculados.</p>
          <button className="btn btn-danger" onClick={handleDelete}>
            <TrashIcon style={{ width: 16, height: 16 }} /> Excluir Médico
          </button>
        </div>
      )}
    </>
  );
}
