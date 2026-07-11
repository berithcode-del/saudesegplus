import { Link } from 'react-router-dom';

interface QuickAction {
  label: string;
  to: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary';
  gradient?: string;
  shadow?: string;
}

interface QuickActionsProps {
  title?: string;
  actions: QuickAction[];
}

export function QuickActions({ title = 'Ações Rápidas', actions }: QuickActionsProps) {
  return (
    <div className="card" style={{ padding: 20 }}>
      {title && (
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 16,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          {title}
        </h3>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        {actions.map((action, i) => {
          const isPrimary = action.variant === 'primary';

          return (
            <Link
              key={i}
              to={action.to}
              style={{
                textDecoration: 'none',
                flex: 1,
                borderRadius: 14,
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                minHeight: 72,
                justifyContent: 'center',
                background: isPrimary
                  ? action.gradient || 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                  : '#ffffff',
                color: isPrimary ? '#ffffff' : 'var(--text-primary)',
                border: isPrimary ? 'none' : '1px solid var(--border-light)',
                boxShadow: isPrimary
                  ? action.shadow || '0 4px 14px rgba(79, 70, 229, 0.35)'
                  : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {action.icon}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  textAlign: 'center',
                }}
              >
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
