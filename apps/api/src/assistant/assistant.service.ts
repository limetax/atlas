import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TAX_ASSISTANTS, Assistant } from './assistant.config';

/**
 * Assistant Service
 * Provides access to pre-configured tax assistants
 * No database - reads from static config
 */
@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  /**
   * Get all available assistants
   */
  getAll(): Assistant[] {
    this.logger.debug(`Returning ${TAX_ASSISTANTS.length} assistants`);
    return TAX_ASSISTANTS;
  }

  /**
   * Get assistant by ID
   * @throws NotFoundException if assistant not found
   */
  getById(id: string): Assistant {
    const assistant = TAX_ASSISTANTS.find((a) => a.id === id);

    if (!assistant) {
      this.logger.warn(`Assistant not found: ${id}`);
      throw new NotFoundException(`Assistant with id "${id}" not found`);
    }

    this.logger.debug(`Found assistant: ${assistant.name}`);
    return assistant;
  }

  /**
   * Get system prompt for an assistant
   * Returns undefined if assistant not found (for optional lookups)
   */
  getSystemPrompt(id: string): string | undefined {
    const assistant = TAX_ASSISTANTS.find((a) => a.id === id);
    return assistant?.systemPrompt;
  }
}
