import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TRPCModule } from 'nestjs-trpc';
import { InfrastructureModule } from '@shared/infrastructure/infrastructure.module';
import { AppContext } from '@shared/trpc/app.context';
import { AuthMiddleware } from '@shared/trpc/auth.middleware';
import { LlmModule } from '@llm/llm.module';
import { AuthModule } from '@auth/auth.module';
import { ChatModule } from '@chat/chat.module';
import { RAGModule } from '@rag/rag.module';
import { DatevModule } from '@datev/datev.module';
import { AssistantModule } from '@/assistant/assistant.module';
import { DocumentModule } from '@/document/document.module';
import { HealthModule } from '@/health/health.module';
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
    // nestjs-trpc module with auto-schema generation
    TRPCModule.forRoot({
      autoSchemaFile: './src/@generated',
      context: AppContext,
      basePath: '/api/trpc',
    }),
    AuthModule,
    ChatModule,
    RAGModule,
    DatevModule,
    AssistantModule,
    DocumentModule,
    HealthModule,
  ],
  providers: [AppContext, AuthMiddleware],
})
export class AppModule {}
