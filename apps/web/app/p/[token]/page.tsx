'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { maskCPF, FIELD_LIMITS, onlyDigits } from '../../../lib/formatUtils';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

const normalizeBirthDate = (value: string) => {
  const trimmed = value.trim();
  const digits = onlyDigits(trimmed);
  if (/^\d{8}$/.test(digits)) {
    return `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
  }
  const isoDate = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
  return trimmed;
};

const maskBirthDate = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export default function ValidarIdentidadePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = React.use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkExpirado, setLinkExpirado] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [patientName, setPatientName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/portal/preview/${token}`);
        const data = await res.json();
        if (data.expirado) {
          setError('Este link não está mais disponível. Entre em contato com a empresa.');
          setLinkExpirado(true);
          return;
        }
        setInviteName(data.empresaNome ?? '');
      } catch {
        // silent — fallback abaixo
      }
    };
    fetchInvite();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/portal/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          cpf: onlyDigits(cpf),
          birthDate: normalizeBirthDate(birthDate),
        }),
      });
      const data = await res.json();
      const sessionToken = data.sessionToken || data.data?.sessionToken;
      const processId = data.processId || data.data?.processId;
      const companyName = data.companyName || data.data?.companyName || '';
      const patientName = data.patientName || data.data?.patientName || '';
      const examPurpose = data.examPurpose || data.data?.examPurpose || '';

      if (!res.ok || !sessionToken) {
        if (data?.expirado) {
          throw new Error('Este link não está mais disponível. Entre em contato com a empresa.');
        }
        throw new Error('CPF ou data de nascimento não conferem.');
      }
      sessionStorage.setItem('portalToken', sessionToken);
      sessionStorage.setItem('processId', processId);
      sessionStorage.setItem('companyName', companyName);
      sessionStorage.setItem('patientName', patientName);
      sessionStorage.setItem('examPurpose', examPurpose);
      router.push(`/p/${token}/processo`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CPF ou data de nascimento não conferem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '32px 24px',
        boxShadow: '0 2px 12px rgba(31,38,135,0.08)',
        border: '1px solid #e5e7eb',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(79,70,229,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <ShieldCheckIcon style={{ width: '28px', height: '28px', color: '#4f46e5' }} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1e1b4b', marginBottom: '4px' }}>
            Confirmar Identidade
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            {inviteName ? `Convite de ${inviteName}` : 'Verifique seus dados para acessar o portal'}
          </p>
          {patientName && (
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
              Paciente: <strong style={{ color: '#1e1b4b' }}>{patientName}</strong>
            </p>
          )}
        </div>

        {error && (
          <div style={{
            padding: '12px 14px', borderRadius: '12px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#dc2626', fontSize: '13px',
            marginBottom: '20px', textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {linkExpirado && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(239,68,68,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg style={{ width: '28px', height: '28px', color: '#dc2626' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626', marginBottom: '8px' }}>
              Link expirado
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
              Este link não está mais disponível. Entre em contato com a empresa para solicitar um novo convite.
            </p>
          </div>
        )}
        {!linkExpirado && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: 600,
                color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px',
                marginBottom: '7px',
              }} htmlFor="cpf">
                CPF
              </label>
              <input
                              id="cpf"
                              className="form-input"
                              placeholder="000.000.000-00"
                              value={cpf}
                              onChange={(e) => setCpf(maskCPF(e.target.value))}
                              maxLength={FIELD_LIMITS.CPF}
                              required
                            />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: 600,
                color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px',
                marginBottom: '7px',
              }} htmlFor="birthDate">
                Data de Nascimento
              </label>
              <input
                id="birthDate"
                type="text"
                inputMode="numeric"
                pattern="\d{2}/\d{2}/\d{4}"
                className="form-input"
                placeholder="DD/MM/AAAA"
                value={birthDate}
                onChange={(e) => setBirthDate(maskBirthDate(e.target.value))}
                maxLength={10}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Verificando...' : 'Confirmar minha identidade'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
