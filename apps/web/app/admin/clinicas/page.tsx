'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowPathIcon, PlusIcon, XMarkIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import { apiAdminListClinics, apiAdminCreateClinic } from '../../../app/lib/api';

interface Clinic {
  id: string;
  name: string;
  city: string;
  state: string;
  capacity?: number;
}

export default function AdminClinicasPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', cnpj: '', city: '', state: '', capacity: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdCreds, setCreatedCreds] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchClinics = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await apiAdminListClinics();
      setClinics(Array.isArray(r.data) ? r.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clinicas.');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClinics(); }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        email: form.email.trim() + '@saudeseg.com',  // Force @saudeseg.com domain
        capacity: form.capacity ? Number(form.capacity) : undefined
      };
      const result = await apiAdminCreateClinic(payload);
      setShowForm(false);
      setForm({ name: '', cnpj: '', city: '', state: '', capacity: '', email: '' });
      setClinics((current) => {
        const created = result && typeof result === 'object' ? result as Clinic : null;
        if (!created?.id || current.some((clinic) => clinic.id === created.id)) return current;
        return [...current, created].sort((a, b) => a.name.localeCompare(b.name));
      });
      await fetchClinics();
      if (result?.tempPassword) {
        setCreatedCreds({ email: result.email, tempPassword: result.tempPassword });
        setCopied(false);
      }
    } catch { alert('Erro ao cadastrar clínica.'); }
    finally { setSaving(false); }
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

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Clínicas</h2>
            <p>Gerencie as clínicas credenciadas</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <PlusIcon className="icon" /> Nova Clínica
          </button>
        </div>
      </div>

      {createdCreds && (
        <div className="card" style={{ marginBottom: '20px', border: '2px solid #22c55e', background: '#f0fdf4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 12px', color: '#16a34a', fontSize: '16px' }}>
                <CheckIcon className="icon" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Clínica cadastrada com sucesso!
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
                {copied ? 'A senha foi removida da tela. A clínica deve alterá-la no primeiro acesso.' : 'Copie a senha abaixo. Após copiar, ela será removida da tela.'}
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

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cadastrar Clínica</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}><XMarkIcon className="icon" /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">CNPJ *</label>
                  <input className="form-input" value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Cidade *</label>
                  <input className="form-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Estado *</label>
                  <select className="form-select" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} required>
                    <option value="">Selecione</option>
                    {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
  <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(79,70,229,0.05)', borderRadius: '12px', border: '1px solid rgba(79,70,229,0.12)' }}> 
    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}> 
      Acesso ao Sistema 
    </p>
    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}> 
      Uma senha temporária será gerada automaticamente e exibida após o cadastro.
    </p>
    <div className="form-group">
      <label className="form-label">E-mail de Acesso *</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}> 
        <input 
          className="form-input"
          type="text" 
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          placeholder="clinica.sp"
          required
          style={{ flex: 1, borderRight: 'none', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
        />
        <span style={{ 
          background: '#f3f4f6', 
          padding: '0 12px', 
          border: '1px solid #d1d5db', 
          borderLeft: 'none',
          borderRadius: '0 6px 6px 0', 
          whiteSpace: 'nowrap',
          height: '46px',  // Matches input height
          display: 'flex',
          alignItems: 'center',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          @saudeseg.com
        </span>
      </div>
    </div>
  </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Carregando...</p>
        ) : error ? (
          <div style={{ color: '#dc2626', textAlign: 'center', padding: '40px' }}>
            <p style={{ marginBottom: '12px', fontWeight: 600 }}>Nao foi possivel carregar as clinicas.</p>
            <p style={{ marginBottom: '16px', fontSize: '14px' }}>{error}</p>
            <button className="btn btn-ghost" onClick={fetchClinics}>Tentar novamente</button>
          </div>
        ) : clinics.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Nenhuma clínica cadastrada.</p>
        ) : (
          <table className="queue-table">
            <thead>
              <tr><th>Nome</th><th>Cidade</th><th>Estado</th><th>CNPJ</th><th>Empresas</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {clinics.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>{c.city}</td>
                  <td>{c.state}</td>
                  <td>{(c as any).cnpj ?? '—'}</td>
                  <td>{(c as any).companies?.length ?? 0}</td>
                  <td>
                    <Link href={`/admin/clinicas/${c.id}`} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '12px', textDecoration: 'none' }}>
                      Ver perfil
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
