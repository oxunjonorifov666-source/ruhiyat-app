import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as express from 'express';
import { join } from 'path';
import { mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  if (process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
  }

  app.setGlobalPrefix('api');

  const expressApp = app.getHttpAdapter().getInstance();
  if (process.env.ENFORCE_HTTPS === 'true') {
    expressApp.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      const p = req.path || '';
      if (p.includes('/health')) return next();
      const proto = req.get('x-forwarded-proto');
      if (proto && proto.split(',')[0].trim() !== 'https') {
        const host = req.get('host') || '';
        return res.redirect(301, `https://${host}${req.originalUrl}`);
      }
      next();
    });
  }

  app.use(
    helmet(
      process.env.NODE_ENV === 'production'
        ? {
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false,
            hsts: { maxAge: 15552000, includeSubDomains: true, preload: true },
          }
        : {},
    ),
  );

  const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  expressApp.use(express.urlencoded({ extended: true }));

  // Serve uploaded files (chat attachments, etc.)
  const uploadsDir = join(process.cwd(), 'uploads');
  mkdirSync(uploadsDir, { recursive: true });
  mkdirSync(join(uploadsDir, 'chat'), { recursive: true });
  mkdirSync(join(uploadsDir, 'chat-avatars'), { recursive: true });
  mkdirSync(join(uploadsDir, 'avatars'), { recursive: true });
  app.use(
    '/uploads',
    express.static(uploadsDir, {
      fallthrough: false,
      setHeaders: (res) => {
        // prevent content-type sniffing
        res.setHeader('X-Content-Type-Options', 'nosniff');
        // attachments can be cached by clients; adjust if you need strict privacy
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Ruhiyat API running on port ${port}`);
}

bootstrap();
