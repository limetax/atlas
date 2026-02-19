import { Module } from '@nestjs/common';
import { SupabaseAuthAdapter } from '@auth/infrastructure/supabase-auth.adapter';
import { SupabaseAdvisorRepository } from '@auth/infrastructure/supabase-advisor.repository';
import { AuthService } from '@auth/application/auth.service';
import { AuthRouter } from '@auth/auth.router';
import { InfrastructureModule } from '@shared/infrastructure/infrastructure.module';
import { AuthAdapter } from '@auth/domain/auth.adapter';
import { AdvisorRepository } from '@auth/domain/advisor.repository';

/**
 * Auth Module - Provides authentication and advisor services
 *
 * Uses provider pattern to inject abstract classes:
 * - AuthAdapter → SupabaseAuthAdapter
 * - AdvisorRepository → SupabaseAdvisorRepository
 */
@Module({
  imports: [InfrastructureModule],
  providers: [
    // Infrastructure implementations
    SupabaseAuthAdapter,
    SupabaseAdvisorRepository,
    // Domain abstract class providers (proper NestJS DI)
    {
      provide: AuthAdapter,
      useClass: SupabaseAuthAdapter,
    },
    {
      provide: AdvisorRepository,
      useClass: SupabaseAdvisorRepository,
    },
    // Application service
    AuthService,
    // tRPC Router
    AuthRouter,
  ],
  exports: [AuthAdapter, AdvisorRepository, AuthService],
})
export class AuthModule {}
