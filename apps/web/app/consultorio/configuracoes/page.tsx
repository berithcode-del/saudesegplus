'use client';
import { useEffect, useState } from 'react';
import { CheckCircleIcon, ClockIcon, XMarkIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '../../lib/api';
import FaqHelp from '../../../components/FaqHelp';
import React from 'react';

interface ClinicData {
  name: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  contactEmail: string;
}

interface ApiOperator {
  id: string;
  email: string;
  user: {
    email: string;
  };
}

const OpCard = ({ id, email, onRemove, onError }: { id: string; email: string; onRemove: () => void; onError: (msg: string) => void }) => {
  const [removing, setRemoving] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleRemoveOperator = async () => {
    const confirmed = window.confirm('Remover este operador? Ele não poderá acessar o sistema novamente.');
    if (!confirmed) return;

    try {
      setRemoving(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'}/api/clinic/operators/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
        },
      });
      const body = await response.json().catch(() => ({ success: false, message: 'Erro desconhecido' }));
      if (!response.ok) {
        onError(body.message || body.error || 'Erro ao remover operador. Verifique se o operador não possui registros.');
        return;
      }
      if (!body.success) {
        onError(body.message || 'Erro ao remover operador');
        return;
      }
      onRemove();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erro de conexão');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="operator-card" style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <div className="operator-avatar" style={{ width: '36px', height: '36px', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-primary)' }}>
            {email.charAt(0).toUpperCase()}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>{email}</span>
          <span style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Operador</span>
        </div>
        <div style={{ position: 'relative' }}>
          <button className="btn btn-ghost btn-circle" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="dropdown-menu" style={{ position: 'absolute', right: 0, top: '40px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', minWidth: '140px', zIndex: 10 }}>
              <button
                className="dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  handleRemoveOperator();
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', width: '100%', fontSize: '14px', color: '#dc2626', fontWeight: 500, backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                disabled={removing}
              >
                {removing ? <><ClockIcon className="icon" /> Removendo...</> : <XMarkIcon className="icon" />}
                Remover
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const formatCNPJ = (val: string) => {
  const clean = val.replace(/\D/g, '');
  return clean
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
};

type TabType = 'perfil' | 'operadores' | 'seguranca';

export default function ConsultorioConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('perfil');
  const tabs = {
    perfil: { label: 'Perfil', description: 'Dados cadastrais da clínica' },
    operadores: { label: 'Operadores', description: 'Gestão de funcionários' },
    seguranca: { label: 'Segurança', description: 'Alterar senha' }
  };

  const [clinicData, setClinicData] = useState<ClinicData>({
    name: '',
    cnpj: '',
    address: '',
    city: '',
    state: '',
    email: '',
    phone: '',
    contactEmail: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [operators, setOperators] = useState<ApiOperator[]>([]);
  const [operatorModalOpen, setOperatorModalOpen] = useState(false);
  const [newOperatorEmail, setNewOperatorEmail] = useState('');
  const [newOperatorName, setNewOperatorName] = useState('');
  const [operatorError, setOperatorError] = useState('');
  const [operatorSuccess, setOperatorSuccess] = useState('');
  const [loadingOperators, setLoadingOperators] = useState(true);
  const [creatingOperator, setCreatingOperator] = useState(false);
  const [operatorAdded, setOperatorAdded] = useState(false);

  const loadOperators = async () => {
    try {
      setLoadingOperators(true);
      const result = await apiFetch('/api/clinic/operators');
      if (result.success && result.data) {
        setOperators(result.data);
      } else {
        console.error('Erro ao carregar operadores');
      }
    } catch (err) {
      console.error('Erro ao carregar operadores:', err);
    } finally {
      setLoadingOperators(false);
    }
  };

  const createOperator = async () => {
    try {
      setCreatingOperator(true);
      setOperatorError('');
      const result = await apiFetch('/api/clinic/operators', {
        method: 'POST',
        body: JSON.stringify({ name: newOperatorName || undefined }),
      });
      if (result.success && result.data?.tempPassword) {
        const tempPassword = result.data.tempPassword;
        const email = result.data.email;
        alert(`Operador cadastrado com sucesso!\n\nE-mail: ${email}\nSenha provisória: ${tempPassword}\n\nAtenção: anote esta senha imediatamente.\nEla só é exibida uma vez.`);

        await navigator.clipboard.writeText(tempPassword);
        
        loadOperators();
        setNewOperatorName('');
        setOperatorModalOpen(false);
        setOperatorAdded(true);
        setTimeout(() => setOperatorAdded(false), 3000);
      } else {
        setOperatorError(result.message || 'Erro ao cadastrar operador');
      }
    } catch (err) {
      console.error('Erro ao cadastrar operador:', err);
      setOperatorError('Erro de conexão');
    } finally {
      setCreatingOperator(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    apiFetch('/api/clinic/profile')
      .then((result) => {
        if (result) {
          setClinicData({
            name: result.name ?? '',
            cnpj: formatCNPJ(result.cnpj ?? ''),
            address: result.address ?? '',
            city: result.city ?? '',
            state: result.state ?? '',
            email: result.email ?? '',
            phone: result.phone ?? '',
            contactEmail: result.contactEmail ?? '',
          });
        }
      })
      .catch(() => console.error('Erro ao carregar perfil da clínica'))
      .finally(() => setLoading(false));
    
    loadOperators();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const result = await apiFetch('/api/clinic/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          address: clinicData.address,
          city: clinicData.city,
          state: clinicData.state,
          phone: clinicData.phone,
          contactEmail: clinicData.contactEmail,
        }),
      });
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(result.message ?? 'Erro ao salvar');
      }
    } catch {
      alert('Erro de conexão com o servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setChangingPassword(true);
    try {
      const result = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      if (result.success) {
        setPasswordChanged(true);
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => setPasswordChanged(false), 3000);
      } else {
        setPasswordError(result.message ?? 'Erro ao alterar senha');
      }
    } catch {
      setPasswordError('Erro de conexão com o servidor');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="page-center">
        <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h2>Configurações da Clínica</h2>
        <div className="tabs-bar">
          {(Object.keys(tabs) as Array<TabType>).map(tab => (
            <button
              key={tab}
              className={`tab-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tabs[tab].label}
            </button>
          ))}
        </div>
        <p>{tabs[activeTab].description}</p>
      </div>

      {activeTab === 'perfil' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e1b4b', marginBottom: '16px' }}>Perfil da Clínica</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Nome</label>
              <input type="text" className="form-input" value={clinicData.name} disabled style={{ background: '#f9fafb', color: '#6b7280' }} />
            </div>
            <div className="form-group">
              <label className="form-label">CNPJ</label>
              <input type="text" className="form-input" value={clinicData.cnpj} disabled style={{ background: '#f9fafb', color: '#6b7280' }} />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input type="text" className="form-input" value={clinicData.email} disabled style={{ background: '#f9fafb', color: '#6b7280' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Endereço</label>
              <input type="text" className="form-input" value={clinicData.address} onChange={(e) => setClinicData({ ...clinicData, address: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Telefone de Contato</label>
              <input type="text" className="form-input" value={clinicData.phone} onChange={(e) => setClinicData({ ...clinicData, phone: e.target.value })} placeholder="(00) 0000-0000" />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail de Contato</label>
              <input type="email" className="form-input" value={clinicData.contactEmail} onChange={(e) => setClinicData({ ...clinicData, contactEmail: e.target.value })} placeholder="contato@clinica.com.br" />
            </div>
            <div className="form-group">
              <label className="form-label">Cidade</label>
              <input type="text" className="form-input" value={clinicData.city} onChange={(e) => setClinicData({ ...clinicData, city: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="form-select" value={clinicData.state} onChange={(e) => setClinicData({ ...clinicData, state: e.target.value })}>
                <option value="">Selecione</option>
                {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginTop: '20px', padding: '12px 14px', border: '1px solid #c7d2fe', borderRadius: '8px', background: '#eef2ff', color: '#3730a3', fontSize: '13px', lineHeight: 1.5 }}>
            Para alterar nome cadastral, CNPJ ou e-mail de acesso, entre em contato com o administrador da plataforma.
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            {saved && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#22c55e', fontSize: '13px', alignSelf: 'center' }}>
                <CheckCircleIcon className="icon icon-sm" /> Salvo com sucesso!
              </span>
            )}
            <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
              {saving ? <><ClockIcon className="icon" /> Salvando...</> : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'seguranca' && (
        <div className="card" style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e1b4b', marginBottom: '16px' }}>Alterar Senha</h3>
          <form onSubmit={handleChangePassword}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Senha Atual</label>
                <input type="password" className="form-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Digite sua senha atual" required />
              </div>
              <div className="form-group">
                <label className="form-label">Nova Senha</label>
                <input type="password" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Digite a nova senha" minLength={6} required />
              </div>
            </div>
            {passwordError && <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '12px' }}>{passwordError}</p>}
            {passwordChanged && (
              <p style={{ color: '#22c55e', fontSize: '14px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircleIcon className="icon icon-sm" /> Senha alterada com sucesso!
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary" disabled={changingPassword}>
                {changingPassword ? <><ClockIcon className="icon" /> Alterando...</> : 'Alterar Senha'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'operadores' && (
        <div className="card" style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e1b4b', marginBottom: '16px' }}>Operadores</h3>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>Registre os funcionários da clínica autorizados a registrar exames dos pacientes.</p>
          {operatorError && <p className="form-error-banner">{operatorError}</p>}
          {operatorSuccess && (
            <p style={{ color: '#22c55e', fontSize: '14px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircleIcon className="icon icon-sm" /> {operatorSuccess}
            </p>
          )}
          {loadingOperators ? (
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Carregando...</p>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}> 
                {operators.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    {operators.map((op) => (
                      <OpCard
                        key={op.id}
                        id={op.id}
                        email={op.user.email}
                        onRemove={() => {
                          loadOperators();
                          setOperatorSuccess('Operador removido com sucesso');
                          setTimeout(() => setOperatorSuccess(''), 3000);
                        }}
                        onError={(msg) => {
                          setOperatorError(msg);
                          setTimeout(() => setOperatorError(''), 6000);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>Nenhum operador cadastrado.</p>
                )}
              </div>
              {operatorAdded && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#22c55e', fontSize: '13px', alignSelf: 'center', margin: '16px 0' }}>
                  <CheckCircleIcon className="icon icon-sm" /> Operador cadastrado com sucesso!
                </span>
              )}
            </>
          )}
          <button className="btn btn-primary" onClick={() => setOperatorModalOpen(true)}>
            <PlusCircleIcon className="icon" /> Cadastrar Operador
          </button>
        </div>
      )}

      {operatorModalOpen && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setOperatorModalOpen(false);
            setNewOperatorName('');
            setOperatorError('');
          }
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cadastrar Operador</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setOperatorModalOpen(false);
                  setNewOperatorEmail('');
                  setOperatorError('');
                }}
              >
                <XMarkIcon className="icon" />
              </button>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nome do Operador (opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={newOperatorName}
                  onChange={(e) => setNewOperatorName(e.target.value)}
                  placeholder="Ex: João Silva"
                />
              </div>
            </div>
            <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '8px' }}>
              O e-mail será gerado automaticamente com base no nome da clínica.<br />
              Ex: operador1@suaclinica.com
            </p>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => {
                setOperatorModalOpen(false);
                setNewOperatorEmail('');
                setOperatorError('');
              }}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={createOperator}
                disabled={creatingOperator}
              >
                {creatingOperator ? <><ClockIcon className="icon" /> Criando...</> : 'Criar Operador'}
              </button>
            </div>
          </div>
        </div>
      )}

      <FaqHelp perfil="CLINICA" />
    </>
  );
}
