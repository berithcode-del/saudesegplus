'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

interface AsoData {
  decisao: string;
  validade: string;
  nome?: string;
}

export default function AsoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = React.use(params);
  const router = useRouter();
  const [data, setData] = useState<AsoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAso = async () => {
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
        if (processo?.aso) {
          setData(processo.aso);
        }
      } catch {
        setError('Erro ao carregar ASO.');
      } finally {
        setLoading(false);
      }
    };
    fetchAso();
  }, [token, router]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const portalToken = sessionStorage.getItem('portalToken');
      const res = await fetch(`${BACKEND_URL}/api/portal/aso`, {
        headers: { Authorization: `Bearer ${portalToken}` },
      });
      if (!res.ok) throw new Error('Erro ao baixar ASO.');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aso-${token}.pdf`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao baixar.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Carregando...</div>;
  }

  const isApto = data?.decisao === 'APTO';

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '32px 24px',
      boxShadow: '0 2px 12px rgba(31,38,135,0.08)',
      border: '1px solid #e5e7eb',
      textAlign: 'center',
    }}>
      {error && (
        <div style={{
          padding: '12px 14px', borderRadius: '12px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          color: '#dc2626', fontSize: '13px',
          marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      <div style={{
        width: '72px', height: '72px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
        background: isApto ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
      }}>
        {isApto ? (
          <CheckCircleIcon style={{ width: '36px', height: '36px', color: '#22c55e' }} />
        ) : (
          <XCircleIcon style={{ width: '36px', height: '36px', color: '#ef4444' }} />
        )}
      </div>

      <h2 style={{
        fontSize: '24px', fontWeight: 800, marginBottom: '8px',
        color: isApto ? '#16a34a' : '#dc2626',
      }}>
        {isApto ? 'APTO' : 'INAPTO'}
      </h2>

      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
        Atestado de Saúde Ocupacional
      </p>

      {data?.validade && (
        <div style={{
          padding: '14px 16px', borderRadius: '12px',
          background: 'rgba(79,70,229,0.05)',
          border: '1px solid rgba(79,70,229,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          marginBottom: '24px', fontSize: '14px', color: '#1e1b4b',
        }}>
          <CalendarDaysIcon style={{ width: '18px', height: '18px', color: '#4f46e5' }} />
          <span>Validade: <strong>{new Date(data.validade).toLocaleDateString('pt-BR')}</strong></span>
        </div>
      )}

      <button
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', marginBottom: '16px' }}
        onClick={handleDownload}
        disabled={downloading}
      >
        <DocumentArrowDownIcon style={{ width: '18px', height: '18px' }} />
        {downloading ? 'Baixando...' : 'Baixar ASO (PDF)'}
      </button>

      <p style={{ fontSize: '12px', color: '#9ca3af' }}>
        Guarde este documento. Ele é seu comprovante de aptidão para a função.
      </p>
    </div>
  );
}
