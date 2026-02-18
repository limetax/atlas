import helmet from 'helmet';

import { AppModule } from '@/app.module';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Trust proxy for accurate IP detection (Coolify with Traefik)
  // Traefik adds X-Forwarded-* headers, so we trust 1 proxy level
  const trustProxyLevel = process.env.TRUST_PROXY ?? '1';
  app.getHttpAdapter().getInstance().set('trust proxy', trustProxyLevel);
  logger.log(`Trust proxy set to: ${trustProxyLevel}`);

  // Validate environment configuration (TEC-89, TEC-90)
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    logger.error('FRONTEND_URL environment variable is not set!');
    throw new Error('FRONTEND_URL environment variable must be set');
  }

  logger.log(`Frontend URL: ${frontendUrl}`);

  // Security headers with Helmet.js (TEC-89)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          connectSrc: ["'self'", frontendUrl],
          imgSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  // CORS configuration with environment-aware whitelist (TEC-90)
  const allowedOrigins = frontendUrl;

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // Allow requests with no origin (e.g., mobile apps, Postman, webhooks)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // nestjs-trpc automatically mounts all routers at /api/trpc
  // Routers: auth, chat, datev, assistant

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`🚀 NestJS API running on http://localhost:${port}`);
  logger.log(`📡 tRPC endpoint: http://localhost:${port}/api/trpc`);
  logger.log(`🏥 Health check: http://localhost:${port}/api/health`);
}

bootstrap();
