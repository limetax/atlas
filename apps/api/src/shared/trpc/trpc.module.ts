import { Module } from '@nestjs/common';
import { TRPCService } from './trpc.service';
import { TRPCContextProvider } from './trpc.context';
import { InfrastructureModule } from '@shared/infrastructure/infrastructure.module';

/**
 * tRPC Module - Provides tRPC setup for the application
 */
@Module({
  imports: [InfrastructureModule],
  providers: [TRPCService, TRPCContextProvider],
  exports: [TRPCService, TRPCContextProvider],
})
export class TRPCModule {}
