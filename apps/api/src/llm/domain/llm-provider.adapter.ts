import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

/**
 * LLM Provider Adapter - Domain contract for LLM provider implementations
 *
 * Abstract class (not interface) so it can be used as injection token in NestJS.
 * Abstracts the LLM provider (Anthropic, OpenAI, Bedrock, etc.) behind a stable
 * boundary. Application layer depends only on this contract — never on vendor classes.
 *
 * LangChain is the committed AI framework, so BaseChatModel is the appropriate
 * return type: it works across all LangChain-supported providers with a uniform API
 * (stream, invoke, bindTools). Swapping Anthropic → OpenAI only requires a new
 * implementation of this class — zero application layer changes.
 */
export abstract class LlmProviderAdapter {
  /**
   * Create a configured LangChain chat model instance.
   * The returned BaseChatModel supports stream(), invoke(), and bindTools()
   * uniformly across all LangChain providers.
   */
  abstract createModel(): BaseChatModel;

  /**
   * Extract text content from a file using the LLM's vision/document capabilities.
   * @param file - The uploaded file (PDF, image, etc.)
   * @returns Promise resolving to extracted plain text
   */
  abstract extractText(file: Express.Multer.File): Promise<string>;
}
