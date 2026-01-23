import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';

/**
 * Auth Module - Provides authentication functionality
 */
@Module({
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
