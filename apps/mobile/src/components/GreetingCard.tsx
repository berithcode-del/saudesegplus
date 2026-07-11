interface GreetingCardProps {
  name?: string;
  role?: string;
  subtitle?: string;
  illustration?: string;
  illustrationAlt?: string;
  gradient?: string;
  accentColor?: string;
  dropShadow?: string;
}

export function GreetingCard({
  name,
  role = 'Profissional',
  subtitle = 'Tenha um ótimo dia de trabalho',
  illustration,
  illustrationAlt = 'Ilustração',
  gradient = 'linear-gradient(130deg, #f5f3ff 0%, #eff6ff 60%, #f0fdf4 100%)',
  accentColor = '#f59e0b',
  dropShadow = '0 8px 24px rgba(79, 70, 229, 0.15)',
}: GreetingCardProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const displayName = name || role;

  return (
    <div
      style={{
        position: 'relative',
        height: 180,
        borderRadius: 20,
        background: '#ffffff',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'visible',
      }}
    >
      {/* Gradient background — clips to card radius */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 20,
          background: gradient,
          zIndex: 0,
        }}
      />

      {/* Text content — above gradient, below image */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: 32,
          maxWidth: illustration ? '58%' : '100%',
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          {greeting},{' '}
          <span style={{ color: accentColor }}>{displayName}</span>
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            marginTop: 8,
            fontSize: 14,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* 3D illustration — overflows the card bottom */}
      {illustration && (
        <img
          src={illustration}
          alt={illustrationAlt}
          style={{
            position: 'absolute',
            bottom: 0,
            right: 24,
            height: 240,
            width: 'auto',
            objectFit: 'contain',
            objectPosition: 'bottom',
            zIndex: 2,
            pointerEvents: 'none',
            filter: `drop-shadow(${dropShadow})`,
          }}
        />
      )}
    </div>
  );
}
