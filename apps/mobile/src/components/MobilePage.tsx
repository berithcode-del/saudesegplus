import type { ReactNode } from 'react';

interface MobilePageProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  bottomInset?: boolean;
}

export function MobilePage({ eyebrow, title, subtitle, children, bottomInset = true }: MobilePageProps) {
  return (
    <div className="mobile-page" style={{ paddingBottom: bottomInset ? undefined : 16 }}>
      {(eyebrow || title || subtitle) && (
        <header className="mobile-page-header">
          {eyebrow && <span className="mobile-eyebrow">{eyebrow}</span>}
          {title && <h1 className="mobile-title">{title}</h1>}
          {subtitle && <p className="mobile-subtitle">{subtitle}</p>}
        </header>
      )}
      {children}
    </div>
  );
}

export function MobileLoading({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="mobile-empty-state">
      <div className="mobile-spinner" />
      <p>{label}</p>
    </div>
  );
}
