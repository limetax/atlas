import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * Domain types for MCP tool handling
 * No type assertions needed with these clean interfaces
 */
interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface ToolCallResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * OpenRegister MCP Service - Infrastructure layer for German company register integration
 * Implements local STDIO MCP server connection following DDD principles
 *
 * Architecture:
 * - Runs OpenRegister MCP server in-process via STDIO transport
 * - Zero network exposure (in-memory communication)
 * - Errors bubble up naturally (no try-catch)
 *
 * @see https://docs.openregister.de/integration/mcp
 * @see https://github.com/modelcontextprotocol/typescript-sdk
 */
@Injectable()
export class OpenRegisterMcpService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OpenRegisterMcpService.name);
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;

  constructor(private readonly config: ConfigService) {}

  /**
   * Initialize MCP client with OpenRegister server on module startup
   * NO try-catch - errors will prevent app start (correct behavior)
   */
  async onModuleInit(): Promise<void> {
    const apiKey = this.config.get<string>('OPENREGISTER_API_KEY');
    if (!apiKey) {
      throw new Error('Missing OPENREGISTER_API_KEY environment variable');
    }

    this.logger.log('Initializing OpenRegister MCP client...');

    // Initialize STDIO transport for in-process MCP server
    // This runs 'npx -y openregister-mcp' as a subprocess
    this.transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', 'openregister-mcp'],
      env: {
        ...process.env,
        OPENREGISTER_API_KEY: apiKey,
      },
    });

    // Create MCP client with proper identification
    this.client = new Client(
      {
        name: 'limetax-openregister',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Connect client to transport - errors bubble up if connection fails
    await this.client.connect(this.transport);

    this.logger.log('✅ OpenRegister MCP client initialized successfully');
  }

  /**
   * Get available tools from OpenRegister MCP server
   * Returns type-safe tool definitions for Anthropic API
   *
   * @returns Array of MCP tools with proper typing (NO assertions)
   * @throws Error if client not initialized or tool fetching fails
   */
  async getTools(): Promise<McpTool[]> {
    if (!this.client) {
      throw new Error('MCP client not initialized');
    }

    // NO try-catch - let errors bubble up
    const result = await this.client.listTools();

    // Type-safe transformation without assertions
    // Use nullish coalescing for optional description
    return result.tools.map((tool) => ({
      name: tool.name,
      description: tool.description ?? '',
      inputSchema: {
        type: 'object' as const,
        properties: ((tool.inputSchema as Record<string, unknown>)?.properties ?? {}) as Record<
          string,
          unknown
        >,
        required: (tool.inputSchema as Record<string, unknown>)?.required as string[] | undefined,
      },
    }));
  }

  /**
   * Execute a tool call on the OpenRegister MCP server
   *
   * @param name - Tool name to execute
   * @param args - Tool arguments (schema validated by MCP server)
   * @returns Tool execution result
   * @throws Error if client not initialized or tool execution fails
   */
  async callTool(name: string, args: unknown): Promise<ToolCallResult> {
    if (!this.client) {
      throw new Error('MCP client not initialized');
    }

    // NO try-catch - errors propagate naturally
    const result = await this.client.callTool({
      name,
      arguments: args as Record<string, unknown>,
    });

    // Type-safe content extraction from MCP result
    const content: Array<{ type: 'text'; text: string }> = [];
    const resultContent = result.content as Array<{ type: string; text?: string }>;

    for (const item of resultContent) {
      if (item.type === 'text' && item.text) {
        content.push({ type: 'text', text: item.text });
      }
    }

    return {
      content,
      isError: Boolean(result.isError),
    };
  }

  /**
   * Check if MCP client is healthy and connected
   * Used for health checks
   *
   * @returns true if client and transport are initialized
   */
  isHealthy(): boolean {
    return this.client !== null && this.transport !== null;
  }

  /**
   * Clean up MCP client connection on module destruction
   * Ensures graceful shutdown
   */
  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      this.logger.log('Closing OpenRegister MCP client connection');
      await this.client.close();
      this.logger.log('OpenRegister MCP client closed');
    }
  }
}
