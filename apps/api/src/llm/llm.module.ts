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

/**
 * LLM Module - Provides language model and embeddings services
 * @Global so these services are available throughout the app
 *
 * Architecture (DDD with LangChain as foundation):
 * - Domain: LangChain types + business types (Tool, ChatContext)
 * - Application: Business logic using LangChain framework (AgentExecutor, MultiQueryRetriever)
 * - Infrastructure: Vendor connections (AnthropicProvider, McpToolProviderAdapter)
 *
 * Provider pattern:
 * - IEmbeddingsProvider → EmbeddingsClient (local Transformers.js)
 * - IToolProvider → McpToolProviderAdapter (MCP connection)
 * - LLM → AnthropicProvider (Anthropic API connection)
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

    // Domain abstract class providers (NestJS DI pattern)
    {
      provide: IEmbeddingsProvider,
      useClass: EmbeddingsClient,
    },
    {
      provide: IToolProvider,
      useClass: McpToolProviderAdapter,
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
    AnthropicProvider,
    LlmService,
    EmbeddingsService,
    ToolResolutionService,
    ToolOrchestrationService,
    OpenRegisterMcpService,
  ],
})
export class LlmModule {}
