import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TRPCModule } from 'nestjs-trpc';
import { InfrastructureModule } from '@shared/infrastructure/infrastructure.module';
import { AppContext } from '@shared/trpc/app.context';
import { AuthMiddleware } from '@shared/trpc/auth.middleware';
import { RateLimitMiddleware } from '@shared/trpc/rate-limit.middleware';
import { LlmModule } from '@llm/llm.module';
import { EmailModule } from '@/email/email.module';
import { AuthModule } from '@auth/auth.module';
import { ChatModule } from '@chat/chat.module';
import { RAGModule } from '@rag/rag.module';
import { DatevModule } from '@datev/datev.module';
import { DmsModule } from '@datev/dms/dms.module';
import { AssistantModule } from '@/assistant/assistant.module';
import { DocumentModule } from '@/document/document.module';
import { HealthModule } from '@/health/health.module';
import { TaxAssessmentModule } from '@/tax-assessment/tax-assessment.module';
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
    EmailModule,
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
    DmsModule,
    AssistantModule,
    DocumentModule,
    HealthModule,
    TaxAssessmentModule,
  ],
  providers: [AppContext, AuthMiddleware, RateLimitMiddleware],
})
export class AppModule {}
