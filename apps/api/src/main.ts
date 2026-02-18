import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '@/app.module';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security headers with Helmet.js (TEC-89)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173'],
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
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const allowedOrigins = isDevelopment
    ? ['http://localhost:5173', 'http://localhost:3000']
    : [process.env.FRONTEND_URL].filter(Boolean);

  // Validate production CORS configuration
  if (!isDevelopment && allowedOrigins.length === 0) {
    throw new Error('FRONTEND_URL environment variable must be set in production');
  }

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
