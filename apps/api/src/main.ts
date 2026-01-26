import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '@/app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // CORS for development and production
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
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
