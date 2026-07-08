'use client';
import React from 'react';

interface CardProps {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Card({ title, icon, children, footer }: CardProps) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {(title || icon) && (
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {icon && <div className="icon-circle icon-circle-primary" style={{ width: 36, height: 36 }}>{icon}</div>}
          {title && <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '16px' }}>{title}</h3>}
        </div>
      )}
      <div style={{ padding: '24px' }}>{children}</div>
      {footer && (
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-input)' }}>
          {footer}
        </div>
      )}
    </div>
  );
}
