import { ChatModule } from '@chat/chat.module';
import { DatevModule } from '@datev/datev.module';
import { DmsModule } from '@datev/dms/dms.module';
import { Module } from '@nestjs/common';
import { RAGModule } from '@rag/rag.module';
import { InfrastructureModule } from '@shared/infrastructure/infrastructure.module';
import { TaxAssessmentService } from '@tax-assessment/application/tax-assessment.service';
import { TaxAssessmentController } from '@tax-assessment/tax-assessment.controller';
import { TaxAssessmentRouter } from '@tax-assessment/tax-assessment.router';

/**
 * TaxAssessmentModule - Income tax assessment review feature
 *
 * Imports:
 * - DmsModule: provides DmsAdapter for DMS document access (DATEV product, Klardaten-backed)
 * - DatevModule: provides ClientService for client context
 * - ChatModule: provides ChatRepository for session persistence
 * - InfrastructureModule: provides SupabaseService for auth
 */
@Module({
  imports: [DmsModule, DatevModule, ChatModule, InfrastructureModule, RAGModule],
  controllers: [TaxAssessmentController],
  providers: [TaxAssessmentService, TaxAssessmentRouter],
})
export class TaxAssessmentModule {}
