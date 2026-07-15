'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '../../lib/api';
import FaqHelp from '../../../components/FaqHelp';

interface CompanyData {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  address: string;
  cep: string;
  city: string;
  state: string;
  status?: string;
  phone?: string;
  contactEmail?: string;
  clinicId?: string;
  clinic?: { id: string; name: string; isMatriz: boolean; parentClinicId?: string; city?: string; state?: string };
}

const formatCNPJ = (val: string) => {
  const clean = val.replace(/\D/g, '');
  return clean
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
};

const formatCEP = (val: string) => {
  const clean = val.replace(/\D/g, '');
  return clean
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .substring(0, 9);
};

export default function ConfiguracoesPage() {
  const [companyId, setCompanyId] = useState('');
  const [companyData, setCompanyData] = useState<CompanyData>({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    address: '',
    cep: '',
    city: '',
    state: '',
    status: '',
    phone: '',
    contactEmail: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [statusCheck, setStatusCheck] = useState<{ pcmso: boolean; ppra: boolean; clinicAssigned: boolean; pcmsoValid?: boolean; ppraValid?: boolean } | null>(null);
  const [statusCheckLoading, setStatusCheckLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    let id: string | null = null;

    if (token) {
      try {
        const parts = token.split('.');
        const payload = JSON.parse(atob(parts[1] ?? ''));
        id = payload?.profileId || payload?.companyId;
      } catch (err) {
        console.error('Erro ao decodificar token:', err);
      }
    }

    if (!id && typeof window !== 'undefined') {
      id = window.localStorage.getItem('companyId');
    }

    if (id && typeof window !== 'undefined') {
      window.localStorage.setItem('companyId', id);
    }

    setCompanyId(id ?? '');
  }, []);

  useEffect(() => {
      if (!companyId) return;
      setLoading(true);
      apiFetch(`/api/company/${companyId}`)
        .then((result) => {
          if (result.data) {
            setCompanyData({
              razaoSocial: result.data.razaoSocial ?? '',
              nomeFantasia: result.data.nomeFantasia ?? '',
              cnpj: formatCNPJ(result.data.cnpj ?? ''),
              address: result.data.address ?? '',
              cep: formatCEP(result.data.cep ?? ''),
              city: result.data.city ?? '',
              state: result.data.state ?? '',
              status: result.data.status ?? '',
              phone: result.data.phone ?? '',
              contactEmail: result.data.contactEmail ?? '',
              clinicId: result.data.clinicId ?? '',
              clinic: result.data.clinic ?? undefined,
            });
          }
        })
        .catch(() => console.error('Falha ao carregar dados da empresa'))
        .finally(() => setLoading(false));
    }, [companyId]);

    const [clinics, setClinics] = useState<{ id: string; name: string; isMatriz: boolean; parentClinicId?: string; city?: string; state?: string }[]>([]);

    useEffect(() => {
      if (!companyData.state) return;
      apiFetch(`/api/clinics?state=${companyData.state}&city=${companyData.city}`)
        .then((result) => {
          if (result.data) {
            setClinics(result.data);
          }
        })
        .catch(() => console.error('Falha ao carregar clínicas'));
    }, [companyData.state, companyData.city]);

  useEffect(() => {
    if (!companyId) return;
    setStatusCheckLoading(true);
    apiFetch(`/api/company/${companyId}/status-check`)
      .then(result => {
        if (result.data) {
          setStatusCheck({
            pcmso: result.data.hasPcmso ?? false,
            ppra: result.data.hasPpra ?? false,
            clinicAssigned: result.data.hasClinicAssigned ?? false,
            pcmsoValid: result.data.pcmsoValid,
            ppraValid: result.data.ppraValid,
          });
        }
      })
      .catch(() => {})
      .finally(() => setStatusCheckLoading(false));
  }, [companyId]);

  const handleSave = async () => {
      setSaving(true);
      try {
        let clinicIdToSend = companyData.clinicId;
        if (clinicIdToSend === '__MATRIZ__') {
          // Find user's own clinic (Matriz)
          const result = await apiFetch(`/api/clinic/clinics?state=${companyData.state}&city=${companyData.city}`);
          const matriz = result.data?.find((c: any) => c.isMatriz);
          clinicIdToSend = matriz?.id;
        }
        const result = await apiFetch(`/api/company/${companyId}`, {
          method: 'PUT',
          body: JSON.stringify({
            nomeFantasia: companyData.nomeFantasia,
            address: companyData.address,
            cep: companyData.cep.replace(/\D/g, ''),
            city: companyData.city,
            state: companyData.state,
            phone: companyData.phone,
            contactEmail: companyData.contactEmail,
            clinicId: clinicIdToSend,
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
        <h2>Configurações da Empresa</h2>
        <p>Dados cadastrais da empresa</p>
      </div>

      <div className="card">
        {companyData.status && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
            background: companyData.status === 'LIBERADA' ? 'rgba(34,197,94,0.12)' :
                        companyData.status === 'PENDENTE' ? 'rgba(245,158,11,0.12)' :
                        'rgba(107,114,128,0.12)',
            color: companyData.status === 'LIBERADA' ? '#16a34a' :
                   companyData.status === 'PENDENTE' ? '#d97706' :
                   '#6b7280',
            marginBottom: '16px',
          }}>
            <CheckCircleIcon style={{ width: '14px', height: '14px' }} />
            {companyData.status === 'LIBERADA' ? 'Empresa Liberada' :
             companyData.status === 'PENDENTE' ? 'Documentação Pendente' :
             companyData.status}
          </div>
        )}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Nome Fantasia</label>
            <input
              type="text"
              className="form-input"
              value={companyData.nomeFantasia}
              onChange={(e) => setCompanyData({ ...companyData, nomeFantasia: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Razão Social</label>
            <input
              type="text"
              className="form-input"
              value={companyData.razaoSocial}
              disabled
              style={{ background: '#f9fafb', color: '#6b7280' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">CNPJ</label>
            <input
              type="text"
              className="form-input"
              value={companyData.cnpj}
              disabled
              style={{ background: '#f9fafb', color: '#6b7280' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">CEP</label>
            <input
              type="text"
              className="form-input"
              value={companyData.cep}
              onChange={(e) => setCompanyData({ ...companyData, cep: formatCEP(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Endereço</label>
            <input
              type="text"
              className="form-input"
              value={companyData.address}
              onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Telefone de Contato</label>
            <input
              type="text"
              className="form-input"
              value={companyData.phone ?? ''}
              onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
              placeholder="(00) 0000-0000"
            />
          </div>
          <div className="form-group">
            <label className="form-label">E-mail de Contato</label>
            <input
              type="email"
              className="form-input"
              value={companyData.contactEmail ?? ''}
                onChange={(e) => setCompanyData({ ...companyData, contactEmail: e.target.value })}
                placeholder="contato@empresa.com.br"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cidade</label>
            <input
              type="text"
              className="form-input"
              value={companyData.city}
              onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
            />
          </div>
          <div className="form-group">
                      <label className="form-label">Estado</label>
                      <select
                        className="form-select"
                        value={companyData.state}
                        onChange={(e) => setCompanyData({ ...companyData, state: e.target.value })}
                      >
                        <option value="">Selecione</option>
                        <option value="AC">AC</option>
                        <option value="AL">AL</option>
                        <option value="AP">AP</option>
                        <option value="AM">AM</option>
                        <option value="BA">BA</option>
                        <option value="CE">CE</option>
                        <option value="DF">DF</option>
                        <option value="ES">ES</option>
                        <option value="GO">GO</option>
                        <option value="MA">MA</option>
                        <option value="MT">MT</option>
                        <option value="MS">MS</option>
                        <option value="MG">MG</option>
                        <option value="PA">PA</option>
                        <option value="PB">PB</option>
                        <option value="PR">PR</option>
                        <option value="PE">PE</option>
                        <option value="PI">PI</option>
                        <option value="RJ">RJ</option>
                        <option value="RN">RN</option>
                        <option value="RS">RS</option>
                        <option value="RO">RO</option>
                        <option value="RR">RR</option>
                        <option value="SC">SC</option>
                        <option value="SP">SP</option>
                        <option value="SE">SE</option>
                        <option value="TO">TO</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Clínica Atribuída</label>
                      <select
                        className="form-select"
                        value={companyData.clinicId ?? ''}
                        onChange={(e) => setCompanyData({ ...companyData, clinicId: e.target.value || undefined })}
                      >
                        <option value="">— Selecionar automaticamente por proximidade —</option>
                        <option value="__MATRIZ__">🏢 Minha Clínica Matriz</option>
                        {clinics.map((c) => (
                          <option key={c.id} value={c.id} style={{ fontStyle: c.isMatriz ? 'italic' : 'normal', fontWeight: c.isMatriz ? 600 : 400 }}>
                            {c.isMatriz ? '🏢 ' : '🏥 '}{c.name} {c.city && `(${c.city}/${c.state})`} {c.isMatriz && '— MATRIZ'}
                          </option>
                        ))}
                      </select>
                      {companyData.clinic && (
                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                          Atual: {companyData.clinic.name} {companyData.clinic.isMatriz && '🏢 MATRIZ'}
                        </p>
                      )}
                    </div>
        </div>

        {statusCheck && (
          <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(79,70,229,0.04)', borderRadius: '12px', border: '1px solid rgba(79,70,229,0.1)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1e1b4b', marginBottom: '12px' }}>Checklist de Requisitos</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { 
                  ok: statusCheck.pcmso, 
                  valid: statusCheck.pcmsoValid,
                  label: 'PCMSO', 
                  link: '/empresa/documentos' 
                },
                { 
                  ok: statusCheck.ppra, 
                  valid: statusCheck.ppraValid,
                  label: 'PPRA/PGR', 
                  link: '/empresa/documentos' 
                },
                { 
                  ok: statusCheck.clinicAssigned, 
                  valid: true,
                  label: 'Clínica atribuída' 
                },
              ].map(item => {
                const isExpired = item.ok && !item.valid;
                return (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: isExpired ? '#d97706' : item.ok ? '#16a34a' : '#dc2626' }}>
                      {isExpired ? '⚠️' : item.ok ? '✅' : '❌'}
                    </span>
                    <span style={{ color: isExpired ? '#d97706' : item.ok ? '#16a34a' : '#6b7280', fontWeight: item.ok ? 600 : 400, flex: 1 }}>
                      {item.label} {isExpired && '(vencido)'}
                    </span>
                    {!item.ok && item.link && (
                      <Link href={item.link} style={{ fontSize: '12px', color: '#3b6ff5', textDecoration: 'none' }}>
                        Resolver →
                      </Link>
                    )}
                    {isExpired && item.link && (
                      <Link href={item.link} style={{ fontSize: '12px', color: '#d97706', textDecoration: 'none' }}>
                        Renovar →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px', padding: '12px 14px', border: '1px solid #c7d2fe', borderRadius: '8px', background: '#eef2ff', color: '#3730a3', fontSize: '13px', lineHeight: 1.5 }}>
          Para alterar CNPJ ou razão social, entre em contato com o administrador da plataforma.
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          {saved && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#22c55e', fontSize: '13px', alignSelf: 'center' }}>
              <CheckCircleIcon className="icon icon-sm" />
              Salvo com sucesso!
            </span>
          )}
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <><ClockIcon className="icon" /> Salvando...</> : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      <FaqHelp perfil="EMPRESA" />
    </>
  );
}
