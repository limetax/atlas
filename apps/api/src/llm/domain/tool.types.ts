/**
 * Domain models for tool-based LLM interactions
 * Provider-agnostic types that work with any LLM or tool provider
 */

/**
 * Represents an available tool that can be called by an LLM
 */
export interface Tool {
  /** Unique identifier for the tool */
  name: string;
  /** Human-readable description of what the tool does */
  description: string;
  /** JSON schema describing the tool's input parameters */
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Represents a request from an LLM to execute a tool
 */
export interface ToolCall {
  /** Unique identifier for this tool call (for matching with results) */
  id: string;
  /** Name of the tool to execute */
  name: string;
  /** Arguments to pass to the tool (must match the tool's input schema) */
  input: unknown;
}

/**
 * Represents the result of executing a tool
 */
export interface ToolResult {
  /** ID of the tool call this result corresponds to */
  toolCallId: string;
  /** Content returned by the tool */
  content: Array<{
    type: 'text';
    text: string;
  }>;
  /** Whether the tool execution resulted in an error */
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
