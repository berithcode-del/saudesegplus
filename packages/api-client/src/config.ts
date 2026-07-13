export function getBaseUrl(): string {
  if (typeof process !== 'undefined') {
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
      return process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, '');
    }
    if (process.env.VITE_BACKEND_URL) {
      return process.env.VITE_BACKEND_URL.replace(/\/$/, '');
    }
    if (process.env.NODE_ENV === 'production') {
      return 'https://backend-production-fdc1.up.railway.app';
    }
  }

  return 'http://localhost:3001';
}
