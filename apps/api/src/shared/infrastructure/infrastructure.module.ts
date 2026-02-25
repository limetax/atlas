import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { StorageAdapter } from '@shared/domain/storage.adapter';
import { SupabaseStorageAdapter } from '@shared/infrastructure/supabase-storage.adapter';
import { SupabaseService } from './supabase.service';

/**
 * Infrastructure Module - Provides shared infrastructure services
 * @Global so these services are available throughout the app
 *
 * Contains only truly shared infrastructure like database connections
 * Domain-specific infrastructure lives in domain folders
 */
@Global()
@Module({
  imports: [ConfigModule.forRoot()],
  providers: [SupabaseService, { provide: StorageAdapter, useClass: SupabaseStorageAdapter }],
  exports: [SupabaseService, StorageAdapter],
})
export class InfrastructureModule {}
