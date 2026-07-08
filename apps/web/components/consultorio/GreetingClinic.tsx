'use client';

interface GreetingClinicProps {
  name?: string;
}

export default function GreetingClinic({ name }: GreetingClinicProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const displayName = name || 'Clínica Parceira';

  return (
    <div
      style={{
        position: 'relative',
        height: '180px',
        borderRadius: '20px',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 20px -2px rgba(149, 157, 165, 0.15)',
        overflow: 'visible',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '20px',
          background: 'linear-gradient(130deg, #ecfeff 0%, #ccfbf1 60%, #dcfce3 100%)',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '32px',
          maxWidth: '65%',
        }}
      >
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1e1b4b', lineHeight: 1.3 }}>
          {greeting},{' '}
          <span style={{ color: '#0d9488' }}>{displayName}</span>
        </h1>
        <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '14px' }}>
          Confira o fluxo de pacientes e solicitações em tempo real.
        </p>
      </div>

      <img
        src="/illustrations/clinica3d.png"
        alt="Clínica 3D"
        style={{
          position: 'absolute',
          bottom: 0,
          right: '24px',
          height: '240px',
          width: 'auto',
          objectFit: 'contain',
          objectPosition: 'bottom',
          zIndex: 2,
          pointerEvents: 'none',
          filter: 'drop-shadow(0 8px 24px rgba(13, 148, 136, 0.15))',
        }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}
