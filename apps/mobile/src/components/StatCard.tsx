interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export function StatCard({ label, value, icon, color, bgColor }: StatCardProps) {
  return (
    <div
      className="card"
      style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
