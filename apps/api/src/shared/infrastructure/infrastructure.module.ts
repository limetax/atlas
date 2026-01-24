import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class InfrastructureModule {}
