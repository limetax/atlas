import { ToolDefinition, ToolCall, ToolResult } from './tool.types';

/**
 * Tool Provider - Domain contract for tool providers
 *
 * Abstract class (not interface) so it can be used as injection token in NestJS
 * This defines what we expect from any tool provider,
 * regardless of the underlying implementation (MCP, REST APIs, custom tools, etc.)
 *
 * Implementations should handle:
 * - Fetching available tools
 * - Executing tool calls
 * - Error handling and recovery
 * - Provider-specific type conversions
 */
export abstract class IToolProvider {
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
