import { ToolDefinition, ToolCall, ToolResult } from './tool.types';

/**
 * Tool Provider Adapter - Domain contract for tool providers
 *
 * Abstract class (not interface) so it can be used as injection token in NestJS.
 * No I-prefix following modern TypeScript conventions.
 */
export abstract class ToolProviderAdapter {
  /**
   * Get all available tools from this provider
   * @returns Promise resolving to array of available tools
   * @throws ToolError if tools cannot be fetched
   */
  abstract getTools(): Promise<ToolDefinition[]>;

  /**
   * Execute a tool call
   * @param call - The tool call to execute
   * @returns Promise resolving to the tool execution result
   * @throws ToolError if tool execution fails
   */
  abstract executeTool(call: ToolCall): Promise<ToolResult>;

  /**
   * Check if this provider is healthy and ready to serve requests
   * Used for health checks and graceful degradation
   * @returns true if provider is healthy, false otherwise
   */
  abstract isHealthy(): boolean;
}
