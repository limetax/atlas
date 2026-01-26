import { Module } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { AssistantRouter } from './assistant.router';

/**
 * Assistant Module
 * Provides pre-configured tax assistants
 * No database dependencies - uses static config
 */
@Module({
  providers: [
    AssistantService,
    // tRPC Router
    AssistantRouter,
  ],
  exports: [AssistantService],
})
export class AssistantModule {}
