'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  VideoCameraIcon,
  SpeakerWaveIcon,
  SunIcon,
  ArrowLeftIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export default function TeleconsultaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = React.use(params);
  const router = useRouter();
  const [linkSala, setLinkSala] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSala = async () => {
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
        setLinkSala(processo?.teleconsulta?.linkSala ?? processo?.linkSala ?? null);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchSala();
  }, [token, router]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Carregando...</div>;
  }


  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '32px 24px',
      boxShadow: '0 2px 12px rgba(31,38,135,0.08)',
      border: '1px solid #e5e7eb',
      textAlign: 'center',
    }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%',
        background: 'rgba(79,70,229,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <VideoCameraIcon style={{ width: '32px', height: '32px', color: '#4f46e5' }} />
      </div>

      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e1b4b', marginBottom: '8px' }}>
        {linkSala ? 'O médico está pronto para te atender' : 'Preparando sua sala, aguarde...'}
      </h2>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', lineHeight: 1.5 }}>
        {linkSala
          ? 'Clique no botão abaixo para entrar na sala de teleconsulta.'
          : 'Estamos preparando sua sala de teleconsulta. Isso pode levar alguns instantes.'}
      </p>

      {!linkSala && (
        <div style={{
          padding: '16px', borderRadius: '12px',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          marginBottom: '24px', fontSize: '14px', color: '#d97706',
        }}>
          <ClockIcon style={{ width: '18px', height: '18px' }} />
          Sala sendo criada...
        </div>
      )}

      {linkSala && (
        <div style={{ width: '100%', height: 'calc(100vh - 280px)', minHeight: '400px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
          <iframe
            src={linkSala}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Teleconsulta Jitsi Meet"
          />
        </div>
      )}

      {/* Dicas */}
      <div style={{
        padding: '16px', borderRadius: '12px',
        background: 'rgba(79,70,229,0.04)',
        border: '1px solid rgba(79,70,229,0.1)',
        textAlign: 'left',
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '10px' }}>
          Dicas para a consulta
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { Icon: SpeakerWaveIcon, text: 'Use fones de ouvido para melhor áudio' },
            { Icon: SunIcon, text: 'Escolha um lugar tranquilo e bem iluminado' },
            { Icon: VideoCameraIcon, text: 'Mantenha a câmera ligada durante a consulta' },
          ].map(({ Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b7280' }}>
              <Icon style={{ width: '16px', height: '16px', color: '#4f46e5', flexShrink: 0 }} />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
