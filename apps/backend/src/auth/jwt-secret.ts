function cleanEnvValue(value: string | undefined): string | undefined {
  const cleaned = value?.trim().replace(/^['"]|['"]$/g, '');
  return cleaned || undefined;
}

export function getJwtSecret(): string {
  const secret = cleanEnvValue(process.env.JWT_SECRET);

  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }

  return secret;
}

export function getJwtExpiresIn(): string {
  return cleanEnvValue(process.env.JWT_EXPIRES_IN) ?? '24h';
}
