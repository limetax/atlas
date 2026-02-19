import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnthropicProvider } from '@llm/infrastructure/anthropic.provider';
import { GteEmbeddingsAdapter } from '@llm/infrastructure/gte-embeddings.adapter';
import { OpenRegisterMcpService } from '@llm/infrastructure/mcp/openregister-mcp.service';
import { McpToolProviderAdapter } from '@llm/infrastructure/mcp/mcp-tool-provider.adapter';
import { LlmService } from '@llm/application/llm.service';
import { EmbeddingsService } from '@llm/application/embeddings.service';
import { TextExtractionService } from '@llm/application/text-extraction.service';
import { ToolResolutionService } from '@llm/application/tool-resolution.service';
import { ToolOrchestrationService } from '@llm/application/tool-orchestration.service';
import { EmbeddingsAdapter } from '@llm/domain/embeddings.adapter';
import { ToolProviderAdapter } from '@llm/domain/tool-provider.adapter';

/**
 * LLM Module - Provides language model and embeddings services
 * @Global so these services are available throughout the app
 *
 * Architecture (DDD with LangChain as foundation):
 * - Domain: LangChain types + business types (Tool, ChatContext) + abstract classes
 * - Application: Business logic using domain abstract classes (vendor-agnostic)
 * - Infrastructure: Vendor connections (AnthropicProvider, GteEmbeddingsAdapter, McpToolProviderAdapter)
 *
 * Provider pattern (Abstract Class → Implementation):
 * - EmbeddingsAdapter → GteEmbeddingsAdapter (local Transformers.js)
 * - ToolProviderAdapter → McpToolProviderAdapter (MCP connection)
 * - TextExtractionService → delegates to AnthropicProvider (Claude text extraction with OCR)
 * - LLM → AnthropicProvider (Anthropic API connection)
 */
@Global()
@Module({
  imports: [ConfigModule.forRoot()],
  providers: [
    // Infrastructure (vendor connections)
    AnthropicProvider,
    GteEmbeddingsAdapter,
    OpenRegisterMcpService,
    McpToolProviderAdapter,

    // Domain abstract class providers (NestJS DI pattern)
    {
      provide: EmbeddingsAdapter,
      useClass: GteEmbeddingsAdapter,
    },
    {
      provide: ToolProviderAdapter,
      useClass: McpToolProviderAdapter,
    },

    // Application services
    TextExtractionService,
    ToolResolutionService,
    ToolOrchestrationService,
    LlmService,
    EmbeddingsService,
  ],
  exports: [
    EmbeddingsAdapter,
    ToolProviderAdapter,
    AnthropicProvider,
    TextExtractionService,
    LlmService,
    EmbeddingsService,
    ToolResolutionService,
    ToolOrchestrationService,
    OpenRegisterMcpService,
  ],
})
export class LlmModule {}
