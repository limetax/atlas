import { ChatModule } from '@chat/chat.module';
import { DatevModule } from '@datev/datev.module';
import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@shared/infrastructure/infrastructure.module';
import { TaxAssessmentService } from '@tax-assessment/application/tax-assessment.service';
import { DmsAdapter } from '@tax-assessment/domain/dms.adapter';
import { KlardatenDmsAdapter } from '@tax-assessment/infrastructure/klardaten-dms.adapter';
import { TaxAssessmentController } from '@tax-assessment/tax-assessment.controller';
import { TaxAssessmentRouter } from '@tax-assessment/tax-assessment.router';

/**
 * TaxAssessmentModule - Income tax assessment review feature
 *
 * Imports:
 * - DatevModule: provides KlardatenClient (exported after our change)
 * - ChatModule: provides ChatRepository for session persistence
 * - InfrastructureModule: provides SupabaseService for auth
 */
@Module({
  imports: [DatevModule, ChatModule, InfrastructureModule],
  controllers: [TaxAssessmentController],
  providers: [
    TaxAssessmentService,
    TaxAssessmentRouter,
    {
      provide: DmsAdapter,
      useClass: KlardatenDmsAdapter,
    },
  ],
})
export class TaxAssessmentModule {}
