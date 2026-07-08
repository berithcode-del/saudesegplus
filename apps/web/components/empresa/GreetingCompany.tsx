'use client';

interface GreetingCompanyProps {
  name?: string;
}

export default function GreetingCompany({ name }: GreetingCompanyProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const displayName = name || 'Empresa Parceira';

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
          background: 'linear-gradient(130deg, #eff6ff 0%, #e0e7ff 60%, #f3e8ff 100%)',
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
          <span style={{ color: '#3b82f6' }}>{displayName}</span>
        </h1>
        <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '14px' }}>
          Aqui está o resumo da saúde ocupacional dos seus colaboradores.
        </p>
      </div>

      <img
        src="/illustrations/empresa3d.png"
        alt="Empresa 3D"
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
          filter: 'drop-shadow(0 8px 24px rgba(59, 130, 246, 0.15))',
        }}
        onError={(e) => {
          // Fallback se a imagem não existir ainda
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}
