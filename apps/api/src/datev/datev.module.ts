import { KlardatenDatevAdapter } from '@/datev/infrastructure/klardaten/klardaten-datev.adapter';
import { KlardatenClientModule } from '@/datev/infrastructure/klardaten/klardaten.module';
import { ClientService } from '@datev/application/client.service';
import { DatevSyncService } from '@datev/application/datev-sync.service';
import { DatevRouter } from '@datev/datev.router';
import { ClientRepository } from '@datev/domain/client.repository';
import { DatevAdapter } from '@datev/domain/datev.adapter';
import { SupabaseClientRepository } from '@datev/infrastructure/repositories/supabase-client.repository';
import { LlmModule } from '@llm/llm.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfrastructureModule } from '@shared/infrastructure/infrastructure.module';

/**
 * DATEV Module - Provides DATEV data synchronization services
 *
 * Uses provider pattern to inject abstract classes:
 * - DatevAdapter → KlardatenDatevAdapter
 *
 * TODO(future): split into datev/masterdata/, datev/accounting/, datev/hr/ sub-modules
 * TODO(future): datev-webhook/ orchestrator module will import DatevModule + TaxAssessmentModule
 *               for bidirectional workflows (e.g. new DMS doc → trigger tax review)
 */
@Module({
  imports: [ConfigModule.forRoot(), InfrastructureModule, LlmModule, KlardatenClientModule],
  providers: [
    KlardatenDatevAdapter,
    // Domain abstract class provider (proper NestJS DI)
    {
      provide: DatevAdapter,
      useClass: KlardatenDatevAdapter,
    },
    {
      provide: ClientRepository,
      useClass: SupabaseClientRepository,
    },
    // Application services
    DatevSyncService,
    ClientService,
    // tRPC Router
    DatevRouter,
  ],
  exports: [DatevAdapter, DatevSyncService, ClientService],
})
export class DatevModule {}
