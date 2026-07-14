const DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:8081',
  'http://10.0.2.2:3000',
];

const MOBILE_APP_ORIGINS = [
  'https://localhost',
  'capacitor://localhost',
];

const ORIGIN_ENV_KEYS = [
  'APP_BASE_URL',
  'PUBLIC_APP_URL',
  'FRONTEND_URL',
  'WEB_URL',
] as const;

function normalizeOrigin(origin: string): string | undefined {
  const value = origin.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!value) return undefined;

  if (value.startsWith('capacitor://')) {
    return value;
  }

  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
}

export function getAllowedOrigins(): string[] {
  const configured = [
    ...MOBILE_APP_ORIGINS,
    ...(process.env.CORS_ORIGINS?.split(',') ?? []),
    ...ORIGIN_ENV_KEYS.map((key) => process.env[key]).filter(
      (origin): origin is string => Boolean(origin),
    ),
  ]
    .map((origin) => normalizeOrigin(origin))
    .filter((origin): origin is string => Boolean(origin));

  if (configured.length) return Array.from(new Set(configured));
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CORS_ORIGINS must be configured in production');
  }
  return DEVELOPMENT_ORIGINS;
}
