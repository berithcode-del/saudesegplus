import { NextRequest, NextResponse } from 'next/server';

const ACCESS: Array<{ prefix: string; roles: string[] }> = [
  { prefix: '/admin', roles: ['ADMIN'] },
  { prefix: '/empresa', roles: ['COMPANY_ADMIN'] },
  { prefix: '/medico', roles: ['DOCTOR'] },
  { prefix: '/consultorio', roles: ['CLINIC', 'OPERATOR'] },
];

export function proxy(request: NextRequest) {
  const rule = ACCESS.find(({ prefix }) =>
    request.nextUrl.pathname.startsWith(prefix),
  );
  if (!rule) return NextResponse.next();

  const role = request.cookies.get('app_role')?.value;
  if (role && rule.roles.includes(role)) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/empresas/login';
  loginUrl.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/empresa/:path*',
    '/medico/:path*',
    '/consultorio/:path*',
  ],
};
