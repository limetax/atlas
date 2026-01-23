import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { TRPCModule } from './trpc/trpc.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { RAGModule } from './rag/rag.module';
import { HealthModule } from './health/health.module';
import { AuthRouter } from './auth/auth.router';
import { ChatRouter } from './chat/chat.router';
import { AppRouter } from './app.router';

/**
 * Root Application Module
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    InfrastructureModule,
    TRPCModule,
    AuthModule,
    ChatModule,
    RAGModule,
    HealthModule,
  ],
  providers: [
    AuthRouter,
    ChatRouter,
    AppRouter,
    {
      provide: 'APP_ROUTER',
      useFactory: (appRouter: AppRouter) => {
        return appRouter.createRouter();
      },
      inject: [AppRouter],
    },
  ],
  exports: ['APP_ROUTER', AppRouter],
})
export class AppModule {}
