'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowPathIcon, PlusIcon, CheckIcon, TrashIcon, XMarkIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import { apiAdminListDoctors, apiAdminCreateDoctor, apiAdminVerifyDoctor } from '../../../app/lib/api';
import { FIELD_LIMITS, BR_STATE_OPTIONS, onlyDigits } from '../../../lib/formatUtils';

const EMAIL_DOMAIN = '@saudeseg.com';
const EMAIL_LOCAL_LIMIT = FIELD_LIMITS.EMAIL - EMAIL_DOMAIN.length;

function sanitizeEmailLocal(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, EMAIL_LOCAL_LIMIT);
}

interface Doctor {
  id: string;
  name: string;
  gender?: string | null;
  crmNumber: string;
  crmState: string;
  city?: string;
  state?: string;
  specialties?: string;
  verifiedAt?: string | null;
}

export default function AdminMedicosPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', gender: 'male', crmNumber: '', crmState: '', city: '', state: '', specialties: '', email: '' });
  const [createdCreds, setCreatedCreds] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const r = await apiAdminListDoctors();
      setDoctors(Array.isArray(r.data) ? r.data : []);
    } catch { setDoctors([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchDoctors();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); }
  }, []);

const handleVerify = async (id: string) => {
  try {
    await apiAdminVerifyDoctor(id);
    await fetchDoctors();
  } catch (err) {
    alert('Erro ao verificar médico');
  }
};

const handleCopyPassword = async () => {
  if (!createdCreds) return;
  try {
    await navigator.clipboard.writeText(createdCreds.tempPassword);
    setCopied(true);
    timerRef.current = setTimeout(() => {
      setCreatedCreds(null);
      setCopied(false);
    }, 4000);
  } catch {
    alert('Não foi possível copiar. Selecione a senha manualmente.');
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const crmNumber = onlyDigits(form.crmNumber);
    if (!form.name.trim() || !crmNumber || !form.crmState.trim()) {
      setError('Preencha nome, CRM e estado do CRM.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        gender: form.gender,
        crmNumber,
        crmState: form.crmState.trim().toUpperCase(),
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        specialties: form.specialties.trim() || undefined,
        email: form.email.trim() ? `${form.email.trim()}${EMAIL_DOMAIN}` : undefined,
      };
      const result = await apiAdminCreateDoctor(payload);
      setShowModal(false);
      setForm({ name: '', gender: 'male', crmNumber: '', crmState: '', city: '', state: '', specialties: '', email: '' });
      await fetchDoctors();
      if (result?.tempPassword) {
        setCreatedCreds({ email: result.email, tempPassword: result.tempPassword });
        setCopied(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar médico');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Médicos</h2>
        <p>Gerencie os médicos cadastrados na plataforma</p>
      </div>
      <div className="card">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <PlusIcon className="icon icon-sm" /> Novo Médico
          </button>
          <button className="btn btn-ghost" onClick={fetchDoctors}><ArrowPathIcon className="icon icon-sm" /> Atualizar</button>
        </div>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Carregando...</p>
        ) : doctors.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Nenhum médico cadastrado.</p>
        ) : (
          <table className="queue-table">
            <thead>
              <tr><th>Nome</th><th>Sexo</th><th>CRM</th><th>Estado</th><th>Cidade</th><th>Especialidades</th><th>Status</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {doctors.map(d => {
                const isVerified = !!d.verifiedAt;
                return (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td>{d.gender === 'female' ? 'Feminino' : d.gender === 'male' ? 'Masculino' : '—'}</td>
                    <td>{d.crmNumber}/{d.crmState}</td>
                    <td>{d.state ?? '—'}</td>
                    <td>{d.city ?? '—'}</td>
                    <td>{d.specialties ?? '—'}</td>
                    <td>
                      <span style={{ color: isVerified ? '#16a34a' : '#d97706', fontWeight: 600, fontSize: '13px' }}>
                        {isVerified ? 'Verificado' : 'Pendente'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={`/admin/medicos/${d.id}`} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '12px', textDecoration: 'none' }}>Ver perfil</Link>
                        {!isVerified && (
                          <button
                            className="btn btn-success"
                            style={{ padding: '4px 8px', fontSize: '12px', gap: '4px' }}
                            onClick={() => handleVerify(d.id)}
                          >
                            <CheckIcon style={{ width: '14px', height: '14px' }} />
                            Aprovar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
</div>

{createdCreds && (
  <div className="card" style={{ marginBottom: '20px', border: '2px solid #22c55e', background: '#f0fdf4' }}> 
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}> 
      <div style={{ flex: 1 }}> 
        <h3 style={{ margin: '0 0 12px', color: '#16a34a', fontSize: '16px' }}> 
          <CheckIcon className="icon" style={{ verticalAlign: 'middle', marginRight: '6px' }} /> 
          Médico cadastrado com sucesso! 
        </h3> 
        <div style={{ fontSize: '14px', color: '#15803d', lineHeight: '1.8' }}> 
          <strong>E-mail:</strong> {createdCreds.email}<br /> 
          <strong>Senha temporária:</strong>{' '} 
          {copied ? ( 
            <span style={{ color: '#16a34a', fontWeight: 600 }}>Copiada ✓</span> 
          ) : ( 
            <code style={{ 
              background: '#dcfce7', padding: '2px 8px', borderRadius: '6px', 
              fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px', 
              fontFamily: 'monospace', 
            }}> 
              {createdCreds.tempPassword} 
            </code> 
          )} 
        </div> 
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}> 
          {copied ? 'A senha foi removida da tela. O médico deve alterá-la no primeiro acesso.' : 'Copie a senha abaixo. Após copiar, ela será removida da tela.'} 
        </p> 
      </div> 
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}> 
        {!copied && ( 
          <button className="btn btn-success" onClick={handleCopyPassword}> 
            <ClipboardIcon className="icon" style={{ width: 16, height: 16 }} /> Copiar Senha 
          </button> 
        )} 
        <button className="btn btn-ghost" onClick={() => { setCreatedCreds(null); setCopied(false); }}> 
          <XMarkIcon className="icon" style={{ width: 16, height: 16 }} /> 
        </button> 
      </div> 
    </div> 
  </div>
)}

{showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Novo Médico</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><XMarkIcon className="icon" /></button>
            </div>
            <form onSubmit={handleSubmit}>
          <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome completo" required maxLength={FIELD_LIMITS.NAME} />
          </div>
          <div className="form-group">
            <label className="form-label">Sexo *</label>
            <select className="form-input" value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} required>
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">CRM *</label>
            <input className="form-input" value={form.crmNumber} onChange={e => setForm(p => ({ ...p, crmNumber: onlyDigits(e.target.value).slice(0, FIELD_LIMITS.CRM_NUMBER) }))} placeholder="Número do CRM" inputMode="numeric" maxLength={FIELD_LIMITS.CRM_NUMBER} required />
          </div>
          <div className="form-group">
            <label className="form-label">Estado CRM *</label>
            <select className="form-input" value={form.crmState} onChange={e => setForm(p => ({ ...p, crmState: e.target.value }))} required>
              <option value="">UF</option>
              {BR_STATE_OPTIONS}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Cidade</label>
            <input className="form-input" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Cidade" maxLength={FIELD_LIMITS.CITY} />
          </div>
          <div className="form-group">
            <label className="form-label">Estado</label>
            <select className="form-input" value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))}>
              <option value="">UF</option>
              {BR_STATE_OPTIONS}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Especialidades</label>
            <input className="form-input" value={form.specialties} onChange={e => setForm(p => ({ ...p, specialties: e.target.value }))} placeholder="Ex: Medicina do Trabalho" maxLength={FIELD_LIMITS.SPECIALTIES} />
          </div>
          <div className="form-group">
            <label className="form-label">E-mail de Acesso</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
              <input
                className="form-input"
                type="text"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: sanitizeEmailLocal(e.target.value) }))}
                placeholder="medico.crm"
                maxLength={EMAIL_LOCAL_LIMIT}
                style={{ flex: 1, borderRight: 'none', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
              />
              <span style={{
                background: '#f3f4f6',
                padding: '0 12px',
                border: '1px solid #d1d5db',
                borderLeft: 'none',
                borderRadius: '0 6px 6px 0',
                whiteSpace: 'nowrap',
                height: '46px',
                display: 'flex',
                alignItems: 'center',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                {EMAIL_DOMAIN}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>Opcional — se não informado, será gerado automaticamente.</p>
          </div>
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: '14px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
          </div>
        </div>
      )}
    </>
  );
}
