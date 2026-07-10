export function getBaseUrl(): string {
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
      return 'https://backend-production-fdc1.up.railway.app';
    }
  } catch { /* not in Node.js */ }

  return 'http://localhost:3001';
}
