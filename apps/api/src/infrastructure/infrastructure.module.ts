import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';
import { AnthropicService } from './anthropic.service';
import { EmbeddingsService } from './embeddings.service';

/**
 * Infrastructure Module - Provides external service clients
 * @Global so these services are available throughout the app
 */
@Global()
@Module({
  imports: [ConfigModule.forRoot()],
  providers: [SupabaseService, AnthropicService, EmbeddingsService],
  exports: [SupabaseService, AnthropicService, EmbeddingsService],
})
export class InfrastructureModule {}
