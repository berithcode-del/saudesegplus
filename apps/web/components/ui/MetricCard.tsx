'use client';
import React from 'react';

/**
 * MetricCard — card de métrica padrão (ícone com badge colorido + número
 * grande), reutilizável em qualquer dashboard (empresa, médico, clínica).
 *
 * Usa as classes .stat-card / .stat-icon-wrap / .stat-icon-* / .stat-label /
 * .stat-value já definidas em app/globals.css (paleta de tokens UiMed).
 */

export type MetricCardColor = 'purple' | 'orange' | 'teal' | 'green';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: MetricCardColor;
  loading?: boolean;
  sub?: string;
}

export default function MetricCard({
  label,
  value,
  icon,
  color = 'purple',
  loading = false,
  sub,
}: MetricCardProps) {
  return (
    <div className="stat-card">
      <div className={`stat-icon-wrap stat-icon-${color}`}>{icon}</div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{loading ? '...' : value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}
