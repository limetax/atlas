import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnthropicProvider } from '@llm/infrastructure/anthropic.provider';
import { EmbeddingsClient } from '@llm/infrastructure/embeddings.client';
import { OpenRegisterMcpService } from '@llm/infrastructure/mcp/openregister-mcp.service';
import { McpToolProviderAdapter } from '@llm/infrastructure/mcp/mcp-tool-provider.adapter';
import { LlmService } from '@llm/application/llm.service';
import { EmbeddingsService } from '@llm/application/embeddings.service';
import { ToolResolutionService } from '@llm/application/tool-resolution.service';
import { ToolOrchestrationService } from '@llm/application/tool-orchestration.service';
import { IEmbeddingsProvider } from '@llm/domain/embeddings-provider.interface';
import { IToolProvider } from '@llm/domain/tool-provider.interface';
import { ITextExtractor } from '@llm/domain/text-extractor.interface';

/**
 * LLM Module - Provides language model and embeddings services
 * @Global so these services are available throughout the app
 *
 * Architecture (DDD with LangChain as foundation):
 * - Domain: LangChain types + business types (Tool, ChatContext) + interfaces
 * - Application: Business logic using domain interfaces (vendor-agnostic)
 * - Infrastructure: Vendor connections (AnthropicProvider, EmbeddingsClient, McpToolProviderAdapter)
 *
 * Provider pattern (Interface → Implementation):
 * - IEmbeddingsProvider → EmbeddingsClient (local Transformers.js)
 * - IToolProvider → McpToolProviderAdapter (MCP connection)
 * - ITextExtractor → AnthropicProvider (Claude text extraction with OCR)
 * - LLM → AnthropicProvider (Anthropic API connection + text extraction)
 *
 * To switch to OpenAI: Create OpenAIProvider implementing ITextExtractor, update bindings here
 */
@Global()
@Module({
  imports: [ConfigModule.forRoot()],
  providers: [
    // Infrastructure (vendor connections)
    AnthropicProvider,
    EmbeddingsClient,
    OpenRegisterMcpService,
    McpToolProviderAdapter,

    // Domain interface providers (NestJS DI pattern)
    {
      provide: IEmbeddingsProvider,
      useClass: EmbeddingsClient,
    },
    {
      provide: IToolProvider,
      useClass: McpToolProviderAdapter,
    },
    {
      provide: ITextExtractor,
      useExisting: AnthropicProvider,
    },

    // Application services
    ToolResolutionService,
    ToolOrchestrationService,
    LlmService,
    EmbeddingsService,
  ],
  exports: [
    IEmbeddingsProvider,
    IToolProvider,
    ITextExtractor,
    AnthropicProvider,
    LlmService,
    EmbeddingsService,
    ToolResolutionService,
    ToolOrchestrationService,
    OpenRegisterMcpService,
  ],
})
export class LlmModule {}
