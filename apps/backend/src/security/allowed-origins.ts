const DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:8081',
  'http://10.0.2.2:3000',
];

export function getAllowedOrigins(): string[] {
  const configured = process.env.CORS_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured?.length) return configured;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CORS_ORIGINS must be configured in production');
  }
  return DEVELOPMENT_ORIGINS;
}
