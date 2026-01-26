import { Module } from '@nestjs/common';
import { SupabaseAuthAdapter } from '@auth/infrastructure/supabase-auth.adapter';
import { SupabaseAdvisorRepository } from '@auth/infrastructure/supabase-advisor.repository';
import { AuthService } from '@auth/application/auth.service';
import { AuthRouter } from '@auth/auth.router';
import { InfrastructureModule } from '@shared/infrastructure/infrastructure.module';
import { IAuthAdapter } from '@auth/domain/auth-adapter.interface';
import { IAdvisorRepository } from '@auth/domain/advisor.entity';

/**
 * Auth Module - Provides authentication and advisor services
 *
 * Uses provider pattern to inject interfaces:
 * - IAuthAdapter → SupabaseAuthAdapter
 * - IAdvisorRepository → SupabaseAdvisorRepository
 */
@Module({
  imports: [InfrastructureModule],
  providers: [
    // Infrastructure implementations
    SupabaseAuthAdapter,
    SupabaseAdvisorRepository,
    // Domain abstract class providers (proper NestJS DI)
    {
      provide: IAuthAdapter,
      useClass: SupabaseAuthAdapter,
    },
    {
      provide: IAdvisorRepository,
      useClass: SupabaseAdvisorRepository,
    },
    // Application service
    AuthService,
    // tRPC Router
    AuthRouter,
  ],
  exports: [IAuthAdapter, IAdvisorRepository, AuthService],
})
export class AuthModule {}
