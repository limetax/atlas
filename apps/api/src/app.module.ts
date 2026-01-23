import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfrastructureModule } from '@shared/infrastructure/infrastructure.module';
import { TRPCModule } from '@shared/trpc/trpc.module';
import { LlmModule } from '@llm/llm.module';
import { AuthModule } from '@auth/auth.module';
import { ChatModule } from '@chat/chat.module';
import { RAGModule } from '@rag/rag.module';
import { DatevModule } from '@datev/datev.module';
import { HealthModule } from '@/health/health.module';
import { AuthRouter } from '@auth/auth.router';
import { ChatRouter } from '@chat/chat.router';
import { DatevRouter } from '@datev/datev.router';
import { AppRouter } from '@/app.router';

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
    LlmModule,
    TRPCModule,
    AuthModule,
    ChatModule,
    RAGModule,
    DatevModule,
    HealthModule,
  ],
  providers: [
    AuthRouter,
    ChatRouter,
    DatevRouter,
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
