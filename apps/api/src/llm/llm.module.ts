import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnthropicClient } from '@llm/infrastructure/anthropic.client';
import { EmbeddingsClient } from '@llm/infrastructure/embeddings.client';
import { OpenRegisterMcpService } from '@llm/infrastructure/mcp/openregister-mcp.service';
import { McpToolProviderAdapter } from '@llm/infrastructure/mcp/mcp-tool-provider.adapter';
import { LlmService } from '@llm/application/llm.service';
import { EmbeddingsService } from '@llm/application/embeddings.service';
import { ToolResolutionService } from '@llm/application/tool-resolution.service';
import { ToolOrchestrationService } from '@llm/application/tool-orchestration.service';
import { ILlmProvider } from '@llm/domain/llm-provider.interface';
import { IEmbeddingsProvider } from '@llm/domain/embeddings-provider.interface';
import { IToolProvider } from '@llm/domain/tool-provider.interface';

/**
 * LLM Module - Provides language model and embeddings services
 * @Global so these services are available throughout the app
 *
 * Architecture (DDD):
 * - Domain: Interfaces and types (ILlmProvider, IToolProvider, Tool types)
 * - Application: Services with business logic (LlmService, ToolOrchestrationService, ToolResolutionService)
 * - Infrastructure: External service adapters (AnthropicClient, OpenRegisterMcpService, McpToolProviderAdapter)
 *
 * Provider pattern maps domain interfaces to infrastructure implementations:
 * - ILlmProvider → AnthropicClient
 * - IEmbeddingsProvider → EmbeddingsClient
 * - IToolProvider → McpToolProviderAdapter
 */
@Global()
@Module({
  imports: [ConfigModule.forRoot()],
  providers: [
    // Infrastructure implementations
    AnthropicClient,
    EmbeddingsClient,
    OpenRegisterMcpService,
    McpToolProviderAdapter,

    // Domain abstract class providers (NestJS DI pattern)
    {
      provide: ILlmProvider,
      useClass: AnthropicClient,
    },
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
    ILlmProvider,
    IEmbeddingsProvider,
    IToolProvider,
    LlmService,
    EmbeddingsService,
    ToolResolutionService,
    ToolOrchestrationService,
    OpenRegisterMcpService,
  ],
})
export class LlmModule {}
