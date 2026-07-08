'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const token = pathname.split('/')[2];

  useEffect(() => {
    const portalToken = sessionStorage.getItem('portalToken');
    const isValidationPage = pathname === `/p/${token}` || pathname === `/p/${token}/`;
    if (!portalToken && !isValidationPage) {
      router.replace(`/p/${token}`);
    } else {
      setAuthorized(true);
    }
  }, [pathname, token, router]);

  if (!authorized) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f7fa',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        padding: '16px',
        flex: 1,
      }}>
        <header style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '24px',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '16px',
            fontWeight: 700,
            flexShrink: 0,
          }}>
            <svg viewBox="0 0 105.23 102.14" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
              <path d="m73.4,3.64v23.83c0,24.17-19.6,43.77-43.77,43.77H3.92c-2.16,0-3.92-1.75-3.92-3.92v-23.66c0-7.05,5.72-12.77,12.77-12.77h10.55c4.7,0,8.51-3.81,8.51-8.51v-9.62c0-7.05,5.72-12.77,12.77-12.77h25.17c2.01,0,3.64,1.63,3.64,3.64Z" fill="#fff"/>
            </svg>
          </div>
          <div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.3px' }}>
              Saúde<span style={{ color: '#4f46e5' }}>Seg</span>+
            </span>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
