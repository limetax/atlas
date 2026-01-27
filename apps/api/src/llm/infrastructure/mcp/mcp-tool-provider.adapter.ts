import { Injectable, Logger } from '@nestjs/common';
import { IToolProvider } from '@llm/domain/tool-provider.interface';
import { Tool, ToolCall, ToolResult, ToolError } from '@llm/domain/tool.types';
import { OpenRegisterMcpService } from './openregister-mcp.service';

/**
 * MCP Tool Provider Adapter - Adapts MCP services to domain tool provider interface
 * Infrastructure layer adapter that implements domain contract
 *
 * Responsibilities:
 * - Maps MCP types to domain models
 * - Handles MCP-specific errors
 * - Provides error localization
 * - Decouples application layer from MCP implementation details
 */
@Injectable()
export class McpToolProviderAdapter implements IToolProvider {
  private readonly logger = new Logger(McpToolProviderAdapter.name);

  constructor(private readonly mcpService: OpenRegisterMcpService) {}

  /**
   * Get all available tools from the MCP service
   * Maps MCP tool format to domain Tool type
   */
  async getTools(): Promise<Tool[]> {
    const mcpTools = await this.mcpService.getTools();

    // Map MCP tools to domain tools (already compatible format)
    const tools: Tool[] = mcpTools.map((mcpTool) => ({
      name: mcpTool.name,
      description: mcpTool.description,
      inputSchema: mcpTool.inputSchema,
    }));

    this.logger.debug(`Mapped ${tools.length} MCP tools to domain tools`);

    return tools;
  }

  /**
   * Execute a tool call via MCP service
   * Handles MCP-specific errors and provides localized error messages
   */
  async executeTool(call: ToolCall): Promise<ToolResult> {
    this.logger.debug(`Executing MCP tool: ${call.name}`, { input: call.input });

    try {
      const mcpResult = await this.mcpService.callTool(call.name, call.input);

      // Map MCP result to domain ToolResult
      const toolResult: ToolResult = {
        toolCallId: call.id,
        content: mcpResult.content,
        isError: mcpResult.isError ?? false,
      };

      if (toolResult.isError) {
        this.logger.warn(`Tool ${call.name} returned error result`, {
          content: toolResult.content,
        });
      }

      return toolResult;
    } catch (error) {
      // Handle MCP-specific errors and provide localized messages
      this.logger.error(`MCP tool ${call.name} execution failed`, error);

      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check for specific error patterns and localize
      if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        // Return localized error as tool result (don't throw)
        return {
          toolCallId: call.id,
          content: [
            {
              type: 'text',
              text: 'Die angefragten Daten sind im Handelsregister nicht verfügbar oder die Firma wurde nicht gefunden.',
            },
          ],
          isError: true,
        };
      }

      // For other errors, return generic localized message
      return {
        toolCallId: call.id,
        content: [
          {
            type: 'text',
            text: `Fehler bei der Abfrage: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Check if the MCP service is healthy
   */
  isHealthy(): boolean {
    return this.mcpService.isHealthy();
  }
}
