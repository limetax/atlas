import { Message, Citation, LLMMessage } from "@/types";
import { getLLMAdapter } from "@/lib/adapters/llm.adapter";
import { getRAGService } from "@/lib/services/rag.service";

/**
 * Chat Service - Core business logic for chat functionality
 * Orchestrates RAG, LLM, and message handling
 */
export class ChatService {
  private llmAdapter = getLLMAdapter();
  private ragService = getRAGService();

  /**
   * Process a user message and stream the response
   * @param userMessage - The user's message
   * @param history - Previous messages in the conversation
   * @returns AsyncGenerator yielding response chunks and citations
   */
  async *processMessage(
    userMessage: string,
    history: Message[]
  ): AsyncGenerator<
    | { type: "text"; content: string }
    | { type: "citations"; citations: Citation[] },
    void,
    unknown
  > {
    try {
      // 1. Search for relevant context using RAG
      const { context, citations } = this.ragService.searchContext(userMessage);

      // 2. Build system prompt with context
      const systemPrompt = this.buildSystemPrompt(context);

      // 3. Convert message history to LLM format
      const llmMessages: LLMMessage[] = [
        ...history.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: "user" as const,
          content: userMessage,
        },
      ];

      // 4. Yield citations first (if any)
      if (citations.length > 0) {
        yield { type: "citations", citations };
      }

      // 5. Stream response from LLM
      for await (const chunk of this.llmAdapter.streamChat(
        llmMessages,
        systemPrompt
      )) {
        yield { type: "text", content: chunk };
      }
    } catch (error) {
      console.error("Chat service error:", error);
      throw new Error("Fehler bei der Verarbeitung Ihrer Nachricht");
    }
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
    const { context } = this.ragService.searchContext(userMessage);
    const systemPrompt = this.buildSystemPrompt(context);

    const llmMessages: LLMMessage[] = [
      ...history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: userMessage,
      },
    ];

    return await this.llmAdapter.getCompletion(llmMessages, systemPrompt);
  }
}

// Singleton instance
let chatServiceInstance: ChatService | null = null;

export function getChatService(): ChatService {
  if (!chatServiceInstance) {
    chatServiceInstance = new ChatService();
  }
  return chatServiceInstance;
}
