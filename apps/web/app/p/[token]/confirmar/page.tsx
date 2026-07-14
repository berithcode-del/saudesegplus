'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

interface PacienteData {
  nome?: string;
  cpf?: string;
  nascimento?: string;
  telefone?: string;
  email?: string;
}

export default function ConfirmarDadosPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = React.use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paciente, setPaciente] = useState<PacienteData>({});
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const portalToken = sessionStorage.getItem('portalToken');
      if (!portalToken) {
        router.replace(`/p/${token}`);
        return;
      }
      try {
        const res = await fetch(`${BACKEND_URL}/api/portal/processo`, {
          headers: { Authorization: `Bearer ${portalToken}` },
        });
        const json = await res.json();
        const processo = json.data ?? json;
        if (processo?.paciente) {
          const p = processo.paciente;
          setPaciente(p);
          setTelefone(p.telefone ?? '');
          setEmail(p.email ?? '');
        }
      } catch {
        setError('Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSaving(true);
      try {
        const portalToken = sessionStorage.getItem('portalToken');
        const processId = sessionStorage.getItem('processId');
        const res = await fetch(`${BACKEND_URL}/api/portal/confirmar-dados`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${portalToken}`,
          },
          body: JSON.stringify({ phone: telefone, email }),
        });
        if (!res.ok) throw new Error('Erro ao confirmar dados.');
        setSuccess(true);
        setTimeout(() => router.push(`/p/${token}/processo`), 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar.');
      } finally {
        setSaving(false);
      }
    };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Carregando...</div>;
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '28px 24px',
      boxShadow: '0 2px 12px rgba(31,38,135,0.08)',
      border: '1px solid #e5e7eb',
    }}>
      {success ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CheckCircleIcon style={{ width: '48px', height: '48px', color: '#22c55e', marginBottom: '12px' }} />
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#1e1b4b' }}>Dados confirmados com sucesso!</p>
        </div>
      ) : (
        <>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e1b4b', marginBottom: '4px' }}>Confirmar Dados</h2>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>
            Confirme se seus dados estão corretos
          </p>

          {error && (
            <div style={{
              padding: '12px 14px', borderRadius: '12px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#dc2626', fontSize: '13px',
              marginBottom: '20px',
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <div style={{
              padding: '14px 16px', borderRadius: '12px',
              background: '#f4f5fb', border: '1px solid #e5e7eb',
              marginBottom: '10px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>Nome</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e1b4b' }}>{paciente.nome ?? '---'}</div>
            </div>
            <div style={{
              padding: '14px 16px', borderRadius: '12px',
              background: '#f4f5fb', border: '1px solid #e5e7eb',
              marginBottom: '10px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>CPF</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e1b4b' }}>{paciente.cpf ?? '---'}</div>
            </div>
            <div style={{
              padding: '14px 16px', borderRadius: '12px',
              background: '#f4f5fb', border: '1px solid #e5e7eb',
              marginBottom: '10px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>Data de Nascimento</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e1b4b' }}>{paciente.nascimento ?? '---'}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" htmlFor="telefone">Telefone</label>
              <input
                id="telefone"
                className="form-input"
                placeholder="(11) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label" htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => router.push(`/p/${token}/processo`)}
              >
                <ArrowLeftIcon style={{ width: '16px', height: '16px' }} />
                Voltar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Confirmar dados'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
