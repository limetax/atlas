import { Injectable } from '@nestjs/common';
import { router, publicProcedure } from '@shared/trpc/trpc.service';
import { z } from 'zod';
import { AssistantService } from './assistant.service';

/**
 * Assistant tRPC Router
 * Provides endpoints to list and retrieve assistants
 */
@Injectable()
export class AssistantRouter {
  constructor(private readonly assistantService: AssistantService) {}

  createRouter() {
    return router({
      /**
       * List all available assistants
       */
      list: publicProcedure.query(() => {
        const assistants = this.assistantService.getAll();
        // Return without systemPrompt for listing (security)
        return assistants.map(({ systemPrompt, ...rest }) => rest);
      }),

      /**
       * Get a specific assistant by ID
       */
      get: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => {
        const assistant = this.assistantService.getById(input.id);
        // Return without systemPrompt (security)
        const { systemPrompt, ...rest } = assistant;
        return rest;
      }),
    });
  }
}
