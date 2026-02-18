import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './application/email.service';
import { EmailAdapter } from './domain/email.adapter';
import { ResendEmailAdapter } from './infrastructure/resend-email.adapter';

/**
 * Email Module - Provides email sending capabilities using Resend
 *
 * This module follows DDD principles with clean dependency injection:
 * - Domain: EmailAdapter (abstract class)
 * - Infrastructure: ResendEmailAdapter (concrete implementation)
 * - Application: EmailService (business logic)
 *
 * The module exports both EmailAdapter and EmailService for consumption by other modules.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    ResendEmailAdapter,
    EmailService,
    {
      provide: EmailAdapter,
      useClass: ResendEmailAdapter,
    },
  ],
  exports: [EmailAdapter, EmailService],
})
export class EmailModule {}
