/**
 * Domain types for tool execution
 * Minimal type definitions compatible with LangChain/Anthropic
 */

/**
 * Tool definition - Compatible with Anthropic.Tool and ChatAnthropic.bindTools()
 * This is the exact format expected by LangChain's Anthropic integration
 */
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Tool call request
 */
export interface ToolCall {
  id: string;
  name: string;
  input: unknown;
}

/**
 * Tool execution result
 */
export interface ToolResult {
  toolCallId: string;
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError: boolean;
}

/**
 * Domain errors for tool execution
 */
export class ToolError extends Error {
  constructor(
    message: string,
    public readonly toolName: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'ToolError';
  }

  /**
   * Create a user-friendly error for tool not found
   */
  static notFound(toolName: string): ToolError {
    return new ToolError(`Tool "${toolName}" not found`, toolName);
  }

  /**
   * Create a user-friendly error for tool execution failure
   */
  static executionFailed(toolName: string, error: unknown): ToolError {
    const message = error instanceof Error ? error.message : String(error);
    return new ToolError(`Tool "${toolName}" execution failed: ${message}`, toolName, error);
  }

  /**
   * Create a localized error message for missing data (404)
   */
  static dataNotAvailable(toolName: string, language: 'de' | 'en' = 'de'): ToolError {
    const messages = {
      de: 'Die angefragten Daten sind nicht verfügbar.',
      en: 'The requested data is not available.',
    };
    return new ToolError(messages[language], toolName);
  }
}
