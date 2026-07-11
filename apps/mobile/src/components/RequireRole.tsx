import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { mobileStorage } from '../lib/storage';

interface RequireRoleProps {
  roles: string[];
  children: ReactNode;
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const token = mobileStorage.getItem('token');
  const role = mobileStorage.getItem('userRole');

  if (!token || !role || !roles.includes(role)) {
    return <Navigate to="/profissional/login" replace />;
  }

  return <>{children}</>;
}
