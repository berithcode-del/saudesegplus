const RAILWAY_BACKEND_URL = 'https://backend-production-fdc1.up.railway.app';

export function getBaseUrl(): string {
  const viteBackendUrl = import.meta.env.VITE_BACKEND_URL;
  if (viteBackendUrl) {
    return viteBackendUrl.replace(/\/$/, '');
  }

  if (import.meta.env.PROD) {
    return RAILWAY_BACKEND_URL;
  }

  // Try process.env first (Node.js / SSR / Next.js)
  try {
    const p = globalThis.process as { env?: Record<string, string | undefined> } | undefined;
    if (p?.env?.NEXT_PUBLIC_BACKEND_URL) {
      return p.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, '');
    }
    if (p?.env?.VITE_BACKEND_URL) {
      return p.env.VITE_BACKEND_URL.replace(/\/$/, '');
    }
    if (p?.env?.NODE_ENV === 'production') {
      return RAILWAY_BACKEND_URL;
    }
  } catch { /* not in Node.js */ }

  return 'http://localhost:3001';
}
