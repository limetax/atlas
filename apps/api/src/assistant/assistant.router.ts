import { Inject } from '@nestjs/common';
import { Router, Query, Input } from 'nestjs-trpc';
import { z } from 'zod';
import { AssistantService } from './assistant.service';

const GetAssistantInputSchema = z.object({
  id: z.string(),
});

// Public assistant schema (excludes systemPrompt for security)
const PublicAssistantSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  isBuiltIn: z.boolean(),
});

/**
 * Assistant tRPC Router
 * Provides endpoints to list and retrieve assistants
 */
@Router({ alias: 'assistant' })
export class AssistantRouter {
  constructor(@Inject(AssistantService) private readonly assistantService: AssistantService) {}

  /**
   * List all available assistants
   */
  @Query({
    output: z.array(PublicAssistantSchema),
  })
  list() {
    const assistants = this.assistantService.getAll();
    // Return without systemPrompt for listing (security)
    return assistants.map(({ systemPrompt: _, ...rest }) => rest);
  }

  /**
   * Get a specific assistant by ID
   */
  @Query({
    input: GetAssistantInputSchema,
    output: PublicAssistantSchema,
  })
  get(@Input('id') id: string) {
    const assistant = this.assistantService.getById(id);
    // Return without systemPrompt (security)
    const { systemPrompt: _, ...rest } = assistant;
    return rest;
  }
}
