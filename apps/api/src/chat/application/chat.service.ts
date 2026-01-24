import { Injectable, Logger } from '@nestjs/common';
import { RAGService } from '@rag/application/rag.service';
import { LlmService } from '@llm/application/llm.service';
import { Message, ChatStreamChunk } from '@chat/domain/message.entity';

/**
 * Chat Service - Application layer for chat functionality
 * Orchestrates RAG and LLM services to provide conversational AI
 * Depends on application services from other domains
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly llm: LlmService,
    private readonly rag: RAGService
  ) {}

  /**
   * Process a user message and stream the response
   * @param userMessage - The user's message
   * @param history - Previous messages in the conversation
   * @param customSystemPrompt - Optional custom system prompt (for assistants)
   * @returns AsyncGenerator yielding response chunks and citations
   */
  async *processMessage(
    userMessage: string,
    history: Message[],
    customSystemPrompt?: string
  ): AsyncGenerator<ChatStreamChunk, void, unknown> {
    try {
      // 1. Search for relevant context using RAG
      const { context, citations } = await this.rag.searchContext(userMessage);

      // 2. Build system prompt with context (use custom if provided)
      const systemPrompt = customSystemPrompt
        ? this.buildAssistantPrompt(customSystemPrompt, context)
        : this.buildSystemPrompt(context);

      // 3. Convert message history to LLM format (filter out system messages)
      const llmMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
        ...history
          .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
          .map((msg) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })),
        {
          role: 'user' as const,
          content: userMessage,
        },
      ];

      // 4. Yield citations first (if any)
      if (citations.length > 0) {
        yield { type: 'citations', citations };
      }

      // 5. Stream response from LLM
      for await (const chunk of this.llm.streamCompletion(llmMessages, systemPrompt)) {
        yield { type: 'text', content: chunk };
      }

      // 6. Yield done signal
      yield { type: 'done' };
    } catch (error) {
      this.logger.error('Chat service error:', error);
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
      };
    }
  }

  /**
   * Build assistant prompt by combining custom prompt with RAG context
   */
  private buildAssistantPrompt(assistantPrompt: string, ragContext: string): string {
    return `${assistantPrompt}

---

Verfügbare Informationen aus der Wissensdatenbank:

${ragContext}

---

Beantworte die Frage des Nutzers basierend auf dem obigen Kontext.`;
  }

  /**
   * Build system prompt with RAG context
   */
  private buildSystemPrompt(ragContext: string): string {
    const basePrompt = `Du bist limetaxIQ, ein KI-Assistent für deutsche Steuerberater und Steuerkanzleien.

Deine Aufgaben:
- Beantworte steuerrechtliche Fragen präzise und mit Quellenangaben
- Unterstütze bei der Mandantenvorbereitung und Fristenverwaltung
- Erkläre komplexe Sachverhalte verständlich für Steuerberater

WICHTIG - Zitierweise:
- Zitiere Paragraphen DIREKT im Text, nicht nur am Ende
- Schreibe z.B.: "Gemäß § 146a AO müssen..." oder "Nach § 18 UStG ist..."
- Verwende die EXAKTE Schreibweise aus der Wissensdatenbank (z.B. "§ 146a AO", "§ 18 UStG")
- Zitiere bei JEDER rechtlichen Aussage die Quelle inline
- Nutze PRIMÄR die bereitgestellten Informationen aus der Wissensdatenbank unten
- Wenn du Paragraphen erwähnst, die NICHT in der Wissensdatenbank sind, kennzeichne sie mit "(aus allgemeinem Wissen, nicht verifiziert)"

Beispiel für gute Zitierweise:
❌ SCHLECHT: "Die Frist beträgt 10 Tage. Das steht in § 18 UStG."
✅ GUT: "Nach § 18 UStG beträgt die Frist 10 Tage nach Ablauf des Voranmeldungszeitraums."

❌ SCHLECHT: "Es gibt Verspätungszuschläge."
✅ GUT: "Bei verspäteter Abgabe droht ein Verspätungszuschlag nach § 152 AO von mindestens 25 Euro pro Monat."

Verfügbare Informationen aus der Wissensdatenbank:

${ragContext}

---

Beantworte die Frage des Nutzers. Integriere Quellenangaben DIREKT in deine Sätze, nicht nur am Ende. Verwende die exakte Schreibweise der Paragraphen.`;

    return basePrompt;
  }

  /**
   * Get a non-streaming response (useful for testing)
   */
  async getResponse(userMessage: string, history: Message[]): Promise<string> {
    const { context } = await this.rag.searchContext(userMessage);
    const systemPrompt = this.buildSystemPrompt(context);

    const llmMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...history
        .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
        .map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      {
        role: 'user' as const,
        content: userMessage,
      },
    ];

    return await this.llm.getCompletion(llmMessages, systemPrompt);
  }
}
