import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KlardatenClient } from '@datev/infrastructure/klardaten.client';
import { KlardatenDatevAdapter } from '@datev/infrastructure/klardaten-datev.adapter';
import { DatevSyncService } from '@datev/application/datev-sync.service';
import { ClientService } from '@datev/application/client.service';
import { DatevRouter } from '@datev/datev.router';
import { InfrastructureModule } from '@shared/infrastructure/infrastructure.module';
import { LlmModule } from '@llm/llm.module';
import { IDatevAdapter } from '@datev/domain/datev-adapter.interface';
import { IClientRepository } from '@datev/domain/client.repository';
import { SupabaseClientRepository } from '@datev/infrastructure/repositories/supabase-client.repository';

/**
 * DATEV Module - Provides DATEV data synchronization services
 *
 * Uses provider pattern to inject interfaces:
 * - IDatevAdapter → KlardatenDatevAdapter
 */
@Module({
  imports: [ConfigModule.forRoot(), InfrastructureModule, LlmModule],
  providers: [
    // Infrastructure implementations
    KlardatenClient,
    KlardatenDatevAdapter,
    // Domain abstract class provider (proper NestJS DI)
    {
      provide: IDatevAdapter,
      useClass: KlardatenDatevAdapter,
    },
    {
      provide: IClientRepository,
      useClass: SupabaseClientRepository,
    },
    // Application services
    DatevSyncService,
    ClientService,
    // tRPC Router
    DatevRouter,
  ],
  exports: [IDatevAdapter, DatevSyncService, ClientService],
})
export class DatevModule {}
