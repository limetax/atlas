import { Module } from '@nestjs/common';
import { TRPCService } from './trpc.service';
import { TRPCContextProvider } from './trpc.context';

/**
 * tRPC Module - Provides tRPC setup for the application
 */
@Module({
  providers: [TRPCService, TRPCContextProvider],
  exports: [TRPCService, TRPCContextProvider],
})
export class TRPCModule {}
