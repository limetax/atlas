import { Injectable, Logger } from '@nestjs/common';
import { ChatContext } from '@atlas/shared';
import { IToolProvider } from '@llm/domain/tool-provider.interface';
import { Tool } from '@llm/domain/tool.types';

/**
 * Tool Resolution Service - Application layer service for resolving tools based on context
 *
 * Business logic for determining which tools should be available for a given request.
 * Maps ChatContext to appropriate tool providers and fetches available tools.
 *
 * This separates the concern of "which tools are needed" (application logic)
 * from "how to get tools" (infrastructure via IToolProvider)
 */
@Injectable()
export class ToolResolutionService {
  private readonly logger = new Logger(ToolResolutionService.name);

  constructor(
    // In the future, we can inject multiple tool providers here
    // For now, we have one: MCP tool provider for OpenRegister
    private readonly mcpToolProvider: IToolProvider
  ) {}

  /**
   * Resolve which tools should be available based on chat context
   * Contains business logic for context → tools mapping
   *
   * @param context - Optional chat context from user request
   * @returns Promise resolving to array of available tools (empty if no tools needed)
   */
  async resolveTools(context?: ChatContext): Promise<Tool[]> {
    // If no context, no tools needed
    if (!context) {
      this.logger.debug('No context provided, returning no tools');
      return [];
    }

    const tools: Tool[] = [];

    // Business rule: Handelsregister research requires OpenRegister MCP tools
    if (context.research?.includes('handelsregister')) {
      this.logger.debug('Handelsregister research requested, fetching OpenRegister tools');

      // Check if provider is healthy before fetching
      if (!this.mcpToolProvider.isHealthy()) {
        this.logger.warn('MCP tool provider is not healthy, skipping tools');
        return [];
      }

      const mcpTools = await this.mcpToolProvider.getTools();
      tools.push(...mcpTools);

      this.logger.debug(`Resolved ${mcpTools.length} tools from MCP provider`);
    }

    // Future: Add more business rules here
    // if (context.research?.includes('german_law')) {
    //   const lawTools = await this.lawToolProvider.getTools();
    //   tools.push(...lawTools);
    // }

    // Future: Filter tools based on other context properties
    // if (context.mandant) {
    //   tools = tools.filter(tool => tool supports mandant context);
    // }

    return tools;
  }

  /**
   * Get a specific tool provider for executing tool calls
   * Currently returns the MCP provider for all tools
   * In the future, could route to different providers based on tool name
   *
   * @param toolName - Name of the tool to execute
   * @returns The appropriate tool provider for this tool
   */
  getProviderForTool(toolName: string): IToolProvider {
    // For now, all tools come from MCP provider
    // In the future, we could route based on tool name:
    // if (toolName.startsWith('law_')) return lawToolProvider;
    // if (toolName.startsWith('datev_')) return datevToolProvider;

    this.logger.debug(`Routing tool "${toolName}" to MCP provider`);
    return this.mcpToolProvider;
  }
}
