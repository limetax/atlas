import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ILlmProvider, LlmMessage } from '@llm/domain/llm-provider.interface';
import { ChatContext } from '@atlas/shared';
import { OpenRegisterMcpService } from '@llm/infrastructure/mcp/openregister-mcp.service';

/**
 * Anthropic Client - Infrastructure implementation for Claude API
 * Implements ILlmProvider interface using Anthropic's SDK
 * Supports MCP (Model Context Protocol) for tool access via OpenRegister
 * No try-catch - errors bubble up to application layer
 */

const MAX_TOOL_ROUNDS = 5; // Prevent infinite loops

@Injectable()
export class AnthropicClient implements ILlmProvider, OnModuleInit {
  private readonly logger = new Logger(AnthropicClient.name);
  private client!: Anthropic;
  private readonly MODEL = 'claude-sonnet-4-20250514';

  constructor(private readonly mcpService: OpenRegisterMcpService) {}

  onModuleInit(): void {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY environment variable');
    }

    this.client = new Anthropic({ apiKey });
    this.logger.log('✅ Anthropic client initialized');
  }

  /**
   * Stream a chat completion from Claude with optional tool support
   * When handelsregister research is enabled, provides OpenRegister tools
   * Errors are thrown and handled by caller
   */
  async *streamMessage(
    messages: LlmMessage[],
    systemPrompt: string,
    context?: ChatContext
  ): AsyncGenerator<string, void, unknown> {
    // Check if handelsregister tools should be enabled
    const enableTools = context?.research?.includes('handelsregister') ?? false;

    // Fetch tools from MCP service if enabled
    const mcpTools = enableTools ? await this.mcpService.getTools() : undefined;

    if (enableTools && mcpTools) {
      this.logger.debug(`Enabling ${mcpTools.length} OpenRegister tools for this request`);
    }

    // Map MCP tools to Anthropic tool format (inputSchema → input_schema)
    const anthropicTools = mcpTools?.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }));

    // Multi-turn tool calling: Keep track of conversation in Anthropic's format
    const anthropicMessages: Anthropic.MessageParam[] = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    let currentRound = 0;

    while (currentRound < MAX_TOOL_ROUNDS) {
      currentRound++;

      // Make API call with current conversation state
      const stream = await this.client.messages.stream({
        model: this.MODEL,
        max_tokens: 4096,
        temperature: 0.3,
        system: systemPrompt,
        messages: anthropicMessages,
        ...(anthropicTools && anthropicTools.length > 0 && { tools: anthropicTools }),
      });

      // Stream response chunks
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield chunk.delta.text;
        }
      }

      // Get the complete message
      const message = await stream.finalMessage();

      // Check if Claude made tool calls
      if (message.stop_reason === 'tool_use') {
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        // Execute all tool calls in this round
        for (const block of message.content) {
          if (block.type === 'tool_use') {
            this.logger.debug(`[Round ${currentRound}] Tool call: ${block.name}`);
            this.logger.debug(`Tool input: ${JSON.stringify(block.input)}`);

            // Execute tool via MCP service with error boundary
            // We catch errors at this integration boundary to prevent stream crashes
            // and allow Claude to respond gracefully to tool failures
            let toolResultText: string;
            let isError = false;

            try {
              const result = await this.mcpService.callTool(block.name, block.input);

              if (result.isError) {
                this.logger.warn(`Tool ${block.name} returned error`, result);
                isError = true;
              } else {
                this.logger.debug(`Tool ${block.name} executed successfully`);
              }

              toolResultText = result.content
                .map((c) => (c.type === 'text' ? c.text : ''))
                .join('\n');
            } catch (error) {
              // Handle tool execution errors gracefully
              this.logger.error(`Tool ${block.name} execution failed:`, error);
              isError = true;

              // Extract error message for Claude
              const errorMessage = error instanceof Error ? error.message : String(error);
              toolResultText = `Error: ${errorMessage}`;

              // Check for specific error patterns
              if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
                toolResultText =
                  'Die angefragten Daten sind im Handelsregister nicht verfügbar oder die Firma wurde nicht gefunden.';
              }
            }

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: toolResultText || 'No data returned',
              is_error: isError,
            });
          }
        }

        // Add assistant message and tool results to conversation
        anthropicMessages.push({
          role: 'assistant',
          content: message.content,
        });
        anthropicMessages.push({
          role: 'user',
          content: toolResults,
        });

        // Add visual separator for next round
        yield '\n\n';

        // Continue loop to process tool results (Claude may make more tool calls)
        continue;
      }

      // If no tool calls, we're done
      break;
    }

    if (currentRound >= MAX_TOOL_ROUNDS) {
      this.logger.warn(`Reached maximum tool rounds (${MAX_TOOL_ROUNDS})`);
    }
  }

  /**
   * Get a single completion (non-streaming) with optional tool support
   * When handelsregister research is enabled, provides OpenRegister tools
   */
  async getMessage(
    messages: LlmMessage[],
    systemPrompt: string,
    context?: ChatContext
  ): Promise<string> {
    // Check if handelsregister tools should be enabled
    const enableTools = context?.research?.includes('handelsregister') ?? false;

    // Fetch tools from MCP service if enabled
    const mcpTools = enableTools ? await this.mcpService.getTools() : undefined;

    if (enableTools && mcpTools) {
      this.logger.debug(`Enabling ${mcpTools.length} OpenRegister tools for this request`);
    }

    // Map MCP tools to Anthropic tool format (inputSchema → input_schema)
    const anthropicTools = mcpTools?.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }));

    // Build request parameters with conditional tool inclusion
    const requestParams = {
      model: this.MODEL,
      max_tokens: 4096,
      temperature: 0.3,
      system: systemPrompt,
      messages,
      ...(anthropicTools && anthropicTools.length > 0 && { tools: anthropicTools }),
    };

    const response = await this.client.messages.create(requestParams);

    // Handle tool use in response (if any)
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    if (toolUseBlocks.length > 0) {
      this.logger.debug(`Response contains ${toolUseBlocks.length} tool calls`);

      // Execute tools and collect results
      const toolResults = [];
      for (const block of toolUseBlocks) {
        const result = await this.mcpService.callTool(block.name, block.input);
        toolResults.push({
          tool: block.name,
          result: result.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n'),
        });
      }

      // Format tool results for response
      const toolResultsText = toolResults
        .map((tr) => `[Tool: ${tr.tool}]\n${tr.result}`)
        .join('\n\n');

      return toolResultsText;
    }

    // No tool use - return text content
    const textContent = response.content.find((block) => block.type === 'text');

    if (textContent && textContent.type === 'text') {
      return textContent.text;
    }

    return '';
  }
}
