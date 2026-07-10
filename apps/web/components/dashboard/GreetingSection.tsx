'use client';

interface GreetingSectionProps {
  name?: string;
  gender?: string | null;
}

function getDoctorPrefix(gender?: string | null) {
  if (gender === 'female') return 'Dra.';
  if (gender === 'male') return 'Dr.';
  return 'Dr(a).';
}

function getIllustration(gender?: string | null) {
  return gender === 'female'
    ? '/illustrations/medica3d.png'
    : '/illustrations/medico3d.png';
}

export default function GreetingSection({
  name,
  gender,
}: GreetingSectionProps) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const displayName = name || 'Médico(a)';
  const prefix = getDoctorPrefix(gender);
  const illustrationSrc = getIllustration(gender);
  const illustrationAlt = gender === 'female' ? 'Médica 3D' : 'Médico 3D';

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
          background:
            'linear-gradient(130deg, #f5f3ff 0%, #eff6ff 60%, #f0fdf4 100%)',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '32px',
          maxWidth: '58%',
        }}
      >
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#1e1b4b',
            lineHeight: 1.3,
          }}
        >
          {greeting},{' '}
          <span style={{ color: '#f59e0b' }}>
            {prefix} {displayName}
          </span>
        </h1>
        <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '14px' }}>
          Tenha um ótimo dia de trabalho
        </p>
      </div>

      <img
        src={illustrationSrc}
        alt={illustrationAlt}
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
          filter: 'drop-shadow(0 8px 24px rgba(79, 70, 229, 0.15))',
        }}
      />
    </div>
  );
}
