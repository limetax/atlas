import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnthropicLlmAdapter } from '@llm/infrastructure/anthropic-llm.adapter';
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
import { LlmProviderAdapter } from '@llm/domain/llm-provider.adapter';

/**
 * LLM Module - Provides language model and embeddings services
 * @Global so these services are available throughout the app
 *
 * Architecture (DDD with LangChain as framework):
 * - Domain: Abstract adapters + domain types (LlmMessage, ToolDefinition, etc.)
 * - Application: Business logic depending only on domain contracts
 * - Infrastructure: Vendor implementations (AnthropicLlmAdapter, GteEmbeddingsAdapter, etc.)
 *
 * Provider bindings (Abstract → Implementation):
 * - LlmProviderAdapter → AnthropicLlmAdapter (swap for OpenAI, Bedrock, etc.)
 * - EmbeddingsAdapter  → GteEmbeddingsAdapter (local Transformers.js)
 * - ToolProviderAdapter → McpToolProviderAdapter (MCP connection)
 */
@Global()
@Module({
  imports: [ConfigModule.forRoot()],
  providers: [
    // Infrastructure (vendor implementations)
    AnthropicLlmAdapter,
    GteEmbeddingsAdapter,
    OpenRegisterMcpService,
    McpToolProviderAdapter,

    // Domain adapter bindings (token → implementation)
    {
      provide: LlmProviderAdapter,
      useExisting: AnthropicLlmAdapter,
    },
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
    LlmProviderAdapter,
    EmbeddingsAdapter,
    ToolProviderAdapter,
    TextExtractionService,
    LlmService,
    EmbeddingsService,
    ToolResolutionService,
    ToolOrchestrationService,
    OpenRegisterMcpService,
  ],
})
export class LlmModule {}
