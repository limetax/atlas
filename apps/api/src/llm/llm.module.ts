import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnthropicClient } from '@llm/infrastructure/anthropic.client';
import { EmbeddingsClient } from '@llm/infrastructure/embeddings.client';
import { OpenRegisterMcpService } from '@llm/infrastructure/mcp/openregister-mcp.service';
import { LlmService } from '@llm/application/llm.service';
import { EmbeddingsService } from '@llm/application/embeddings.service';
import { ILlmProvider } from '@llm/domain/llm-provider.interface';
import { IEmbeddingsProvider } from '@llm/domain/embeddings-provider.interface';

/**
 * LLM Module - Provides language model and embeddings services
 * @Global so these services are available throughout the app
 *
 * Uses provider pattern to inject interfaces:
 * - ILlmProvider → AnthropicClient
 * - IEmbeddingsProvider → EmbeddingsClient
 *
 * Includes OpenRegister MCP service for German company register integration
 */
@Global()
@Module({
  imports: [ConfigModule.forRoot()],
  providers: [
    // Infrastructure implementations
    AnthropicClient,
    EmbeddingsClient,
    OpenRegisterMcpService,
    // Domain abstract class providers (NestJS DI pattern)
    {
      provide: ILlmProvider,
      useClass: AnthropicClient,
    },
    {
      provide: IEmbeddingsProvider,
      useClass: EmbeddingsClient,
    },
    // Application services
    LlmService,
    EmbeddingsService,
  ],
  exports: [
    ILlmProvider,
    IEmbeddingsProvider,
    LlmService,
    EmbeddingsService,
    OpenRegisterMcpService,
  ],
})
export class LlmModule {}
