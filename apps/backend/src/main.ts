import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { getAllowedOrigins } from './security/allowed-origins';
import { SafeExceptionFilter } from './security/safe-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Antes não havia nenhuma validação automática de DTOs — campos
  // obrigatórios ausentes ou malformados só eram detectados (ou nem
  // isso) dentro de cada service, na hora de gravar no banco.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new SafeExceptionFilter());

  // Prevenção contra Massive Payloads
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  app.use((_request, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    );
    if (process.env.NODE_ENV === 'production') {
      response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // Servir uploads como arquivos estáticos — usa process.cwd() para garantir
  // que o caminho seja correto tanto em dev (ts-node) quanto em prod (dist/)
  app.useStaticAssets(join(process.cwd(), 'uploads', 'files'), { prefix: '/uploads/files' });

  const allowedOrigins = getAllowedOrigins();

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`SaudeSeg+ Backend running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start SaudeSeg+ Backend', error);
  process.exit(1);
});
