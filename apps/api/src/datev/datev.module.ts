import { ClientService } from '@datev/application/client.service';
import { DatevSyncService } from '@datev/application/datev-sync.service';
import { DatevRouter } from '@datev/datev.router';
import { ClientRepository } from '@datev/domain/client.repository';
import { DatevAdapter } from '@datev/domain/datev.adapter';
import { KlardatenDatevAdapter } from '@datev/infrastructure/klardaten-datev.adapter';
import { KlardatenClient } from '@datev/infrastructure/klardaten.client';
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
 */
@Module({
  imports: [ConfigModule.forRoot(), InfrastructureModule, LlmModule],
  providers: [
    // Infrastructure implementations
    KlardatenClient,
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
  // TODO(TEC-119): Don't export Axios Clients here — this violates DDD boundaries.
  // DATEV folder is most likely too big; needs to be split into smaller DATEV products.
  exports: [DatevAdapter, DatevSyncService, ClientService, KlardatenClient],
})
export class DatevModule {}
