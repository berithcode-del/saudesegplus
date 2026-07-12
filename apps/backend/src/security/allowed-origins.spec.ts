import { getAllowedOrigins } from './allowed-origins';

describe('getAllowedOrigins', () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('always includes capacitor mobile origins when configured origins are present', () => {
    process.env.CORS_ORIGINS = 'https://saudesegplus.vercel.app';
    delete process.env.APP_BASE_URL;
    delete process.env.PUBLIC_APP_URL;
    delete process.env.FRONTEND_URL;
    delete process.env.WEB_URL;

    const origins = getAllowedOrigins();

    expect(origins).toEqual(
      expect.arrayContaining([
        'https://localhost',
        'capacitor://localhost',
        'https://saudesegplus.vercel.app',
      ]),
    );
  });
});
