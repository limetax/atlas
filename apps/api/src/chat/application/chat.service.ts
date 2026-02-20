import { ChatContext, ChatMessageMetadata, MessageRole } from '@atlas/shared';
import { AdvisorRepository } from '@auth/domain/advisor.repository';
import { ChatRepository } from '@chat/domain/chat.repository';
import { ChatStreamChunk, Message } from '@chat/domain/message.entity';
import { ClientService } from '@datev/application/client.service';
import { DocumentService } from '@document/application/document.service';
import { LlmService } from '@llm/application/llm.service';
import type { LlmMessage } from '@llm/domain/llm.types';
import { encodeFileToContentBlock } from '@llm/infrastructure/file-encoding.util';
import { Injectable, Logger } from '@nestjs/common';
import { RAGService } from '@rag/application/rag.service';

import { CONTEXT_PROMPTS, TITLE_GENERATION_PROMPT } from './chat.prompts';

/**
 * Chat Service - Application layer for chat functionality
 * Orchestrates RAG and LLM services to provide conversational AI
 * Depends on application services from other domains
 * No try-catch - errors bubble up to controller/exception filter
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly llm: LlmService,
    private readonly rag: RAGService,
    private readonly clientService: ClientService,
    private readonly chatRepo: ChatRepository,
    private readonly documentService: DocumentService,
    private readonly advisorRepo: AdvisorRepository
  ) {}

  /**
   * Process a user message and stream the response
   * @param userMessage - The user's message
   * @param history - Previous messages in the conversation
   * @param customSystemPrompt - Optional custom system prompt (for assistants)
   * @param chatContext - Optional context for MCP tool selection and client filtering
   * @param chatId - Optional chat ID for RAG context
   * @param files - Optional uploaded files (PDFs, images)
   * @param advisorId - Optional advisor ID for RAG storage
   * @returns AsyncGenerator yielding response chunks and citations
   */
  async *processMessage(
    userMessage: string,
    history: Message[],
    customSystemPrompt?: string,
    chatContext?: ChatContext,
    chatId?: string,
    files?: Express.Multer.File[],
    advisorId?: string
  ): AsyncGenerator<ChatStreamChunk, void, unknown> {
    // 1. Extract and validate client filter
    let clientIdFilter: string | undefined;
    let selectedClientName: string | undefined;

    if (chatContext?.mandant) {
      const client = await this.clientService.getClientById(chatContext.mandant);
      if (!client) {
        yield {
          type: 'error',
          error: 'Der ausgewählte Mandant wurde nicht gefunden.',
        };
        yield { type: 'done' };
        return;
      }
      clientIdFilter = chatContext.mandant;
      selectedClientName = client.client_name;

      // Detect client name conflicts
      const conflictDetection = await this.detectClientConflict(userMessage, client.client_name);
      if (conflictDetection.hasConflict) {
        yield {
          type: 'text',
          content: `Ich habe bemerkt, dass Sie über "${conflictDetection.mentionedClient}" sprechen, aber aktuell ist "${client.client_name}" ausgewählt. Möchten Sie den Mandanten wechseln oder die Auswahl aufheben?`,
        };
        yield { type: 'done' };
        return;
      }
    }

    // 2. Get document IDs linked to this chat for RAG context
    const documentIds = chatId ? await this.documentService.getDocumentIdsByChatId(chatId) : [];

    // 3. Search for relevant context using RAG with client filter + document IDs
    const { context: ragContext, citations } = await this.rag.searchContext(
      userMessage,
      clientIdFilter,
      chatContext?.research,
      documentIds.length > 0 ? documentIds : undefined
    );

    // 4. Build system prompt with context
    const systemPrompt = customSystemPrompt
      ? this.buildAssistantPrompt(customSystemPrompt, ragContext, chatContext, selectedClientName)
      : this.buildSystemPrompt(ragContext, chatContext, selectedClientName);

    // 4. Convert message history to LLM format (type-safe, no assertions)
    const llmMessages: LlmMessage[] = [
      ...this.filterUserAssistantMessages(history),
      {
        role: 'user',
        content: files?.length
          ? [{ type: 'text', text: userMessage }, ...files.map(encodeFileToContentBlock)]
          : userMessage,
      },
    ];

    // 5. Yield citations first (if any)
    if (citations.length > 0) {
      yield { type: 'citations', citations };
    }

    // 5a. Acknowledge files received (with 'processing' status)
    if (files?.length && chatId) {
      const processingDocuments = files.map((file) => ({
        name: file.originalname,
        size: file.size,
      }));
      yield { type: 'files_processed', documents: processingDocuments };
    }

    // 5b. Fire-and-forget: Store files in RAG async (doesn't block response)
    if (files?.length && chatId && advisorId) {
      this.storeFilesInRagAsync(files, chatId, advisorId).catch((error: Error) => {
        this.logger.error('Background RAG storage failed', error.stack);
        // Silent failure - user already got their response
      });
    }

    // 6. Stream response from LLM with context for tool access
    for await (const chunk of this.llm.streamCompletion(llmMessages, systemPrompt, chatContext)) {
      if (typeof chunk === 'string') {
        yield { type: 'text', content: chunk };
      } else {
        yield { type: 'tool_call', toolCall: { name: chunk.name, status: chunk.status } };
      }
    }

    // 7. Yield done signal
    yield { type: 'done' };
  }

  /**
   * Detect if user message mentions a different client than the selected one
   * Uses simple case-insensitive string matching
   */
  private async detectClientConflict(
    userMessage: string,
    selectedClientName: string
  ): Promise<{ hasConflict: boolean; mentionedClient?: string }> {
    const messageLower = userMessage.toLowerCase();
    const selectedNameLower = selectedClientName.toLowerCase();

    // If message contains selected client name, no conflict
    if (messageLower.includes(selectedNameLower)) {
      return { hasConflict: false };
    }

    // Extract potential company names (GmbH, AG, etc.) - case-insensitive
    const companyNamePattern =
      /([a-zäöü][\wäöüß]*(?:\s+[\wäöüß]+)*\s+(?:gmbh|ag|kg|ohg|gbr|ug|e\.v\.|ev))\b/gi;
    const matches = userMessage.match(companyNamePattern);

    if (!matches || matches.length === 0) {
      return { hasConflict: false };
    }

    // Check if any mentioned company matches a different client
    for (const mentionedName of matches) {
      if (mentionedName.toLowerCase() === selectedNameLower) {
        continue;
      }

      const matchingClients = await this.clientService.searchClientsByName(mentionedName);

      if (matchingClients.length > 0) {
        return {
          hasConflict: true,
          mentionedClient: mentionedName,
        };
      }
    }

    return { hasConflict: false };
  }

  /**
   * Filter and transform messages to LLM format
   * Type-safe without assertions
   */
  private filterUserAssistantMessages(history: Message[]): LlmMessage[] {
    return history
      .filter(
        (msg): msg is Message & { role: MessageRole } =>
          msg.role === 'user' || msg.role === 'assistant'
      )
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
  }

  /**
   * Build assistant prompt by combining custom prompt with RAG context and chat context
   */
  private buildAssistantPrompt(
    assistantPrompt: string,
    ragContext: string,
    chatContext?: ChatContext,
    selectedClientName?: string
  ): string {
    let prompt = assistantPrompt;

    // Add context-specific instructions
    if (chatContext?.integration === 'datev') {
      prompt += `

DATEV-INTEGRATION:
- DATEV-Buchhaltungsdaten sind verfügbar
- Berücksichtige DATEV-spezifische Workflows`;
    }

    if (chatContext?.research?.includes('handelsregister')) {
      prompt += `

HANDELSREGISTER-ZUGRIFF:
- Du hast direkten Zugriff auf das deutsche Handelsregister via OpenRegister
- Nutze die verfügbaren Tools um Firmendaten abzurufen
- Verwende "find_companies_v1_search" für Unternehmenssuche
- Präsentiere die Daten strukturiert und lesefreundlich`;
      prompt += CONTEXT_PROMPTS.EFFICIENCY;
    }

    if (chatContext?.research?.includes('law_publishers')) {
      prompt += CONTEXT_PROMPTS.LAW_PUBLISHERS;
    }

    // Add email prompt unconditionally (LLM decides when to use it)
    prompt += CONTEXT_PROMPTS.EMAIL;

    if (chatContext?.mandant && selectedClientName) {
      prompt += `

WICHTIG - MANDANTENKONTEXT:
- Der Benutzer hat den Mandanten "${selectedClientName}" ausgewählt
- Alle bereitgestellten DATEV-Daten beziehen sich ausschließlich auf diesen Mandanten
- Fokussiere deine Antworten auf "${selectedClientName}"
- Falls der Benutzer nach einem anderen Unternehmen fragt, weise darauf hin, dass aktuell "${selectedClientName}" ausgewählt ist`;
    }

    prompt += `

---

Verfügbare Informationen aus der Wissensdatenbank:

${ragContext}

---

Beantworte die Frage des Nutzers basierend auf dem obigen Kontext.`;

    return prompt;
  }

  /**
   * Build system prompt with RAG context and chat context
   */
  private buildSystemPrompt(
    ragContext: string,
    chatContext?: ChatContext,
    selectedClientName?: string
  ): string {
    let basePrompt = `Du bist limetaxIQ, ein KI-Assistent für deutsche Steuerberater und Steuerkanzleien.

Deine Aufgaben:
- Beantworte steuerrechtliche Fragen präzise und mit Quellenangaben
- Unterstütze bei der Mandantenvorbereitung und Fristenverwaltung
- Erkläre komplexe Sachverhalte verständlich für Steuerberater`;

    // Add context-specific instructions

    if (chatContext?.integration === 'datev') {
      basePrompt += `

DATEV-INTEGRATION:
- DATEV-Buchhaltungsdaten sind verfügbar
- Berücksichtige DATEV-spezifische Workflows`;
    }

    if (chatContext?.research?.includes('handelsregister')) {
      basePrompt += `

HANDELSREGISTER-ZUGRIFF:
- Du hast direkten Zugriff auf das deutsche Handelsregister via OpenRegister
- Nutze die verfügbaren Tools um Firmendaten, Gesellschafter und Finanzdaten abzurufen
- Die Tools liefern aktuelle, offizielle Handelsregisterdaten

TOOL-AUSWAHL:
- Verwende "find_companies_v1_search" für die Suche nach Unternehmen (exakte Treffer)
- Verwende "autocomplete_companies_v1_search" nur für Vorschläge/Auto-Vervollständigung
- Verwende "get_details_v1_company" um vollständige Details zu einer gefundenen Firma zu erhalten
- Verwende "get_owners_v1_company" für Gesellschafter-Informationen
- Verwende "get_financials_v1_company" für Finanzdaten

WICHTIG - Antwortformat:
- Interpretiere die Handelsregisterdaten und präsentiere sie in klarer, strukturierter Form
- Gib NICHT die rohen JSON-Daten aus
- Formatiere Informationen lesefreundlich mit Überschriften und Listen
- Erkläre die Bedeutung der Daten im steuerrechtlichen Kontext wenn relevant`;
      basePrompt += CONTEXT_PROMPTS.EFFICIENCY;
    }

    if (chatContext?.research?.includes('law_publishers')) {
      basePrompt += CONTEXT_PROMPTS.LAW_PUBLISHERS;
    }

    // Add email prompt unconditionally (LLM decides when to use it)
    basePrompt += CONTEXT_PROMPTS.EMAIL;

    if (chatContext?.mandant && selectedClientName) {
      basePrompt += `

WICHTIG - MANDANTENKONTEXT:
- Der Benutzer hat den Mandanten "${selectedClientName}" ausgewählt
- Alle bereitgestellten DATEV-Daten beziehen sich ausschließlich auf diesen Mandanten
- Fokussiere deine Antworten auf "${selectedClientName}"
- Falls der Benutzer nach einem anderen Unternehmen fragt, weise darauf hin, dass aktuell "${selectedClientName}" ausgewählt ist
- Verwechsle nicht verschiedene Mandanten - bleibe beim ausgewählten Mandanten`;
    }

    basePrompt += `

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
  async getResponse(
    userMessage: string,
    history: Message[],
    chatContext?: ChatContext
  ): Promise<string> {
    // Extract client filter if present
    const clientIdFilter = chatContext?.mandant;

    const { context: ragContext } = await this.rag.searchContext(userMessage, clientIdFilter);
    const systemPrompt = this.buildSystemPrompt(ragContext, chatContext);

    const llmMessages: LlmMessage[] = this.filterUserAssistantMessages(history);
    llmMessages.push({ role: 'user', content: userMessage });

    return await this.llm.getCompletion(llmMessages, systemPrompt, chatContext);
  }

  /**
   * Full chat streaming flow: resolve/create chat, process files, persist messages, stream response.
   * The controller only needs to write yielded chunks to SSE and manage HTTP lifecycle.
   */
  async *streamChat(
    advisorId: string,
    message: string,
    history: Message[],
    chatId?: string,
    customSystemPrompt?: string,
    context?: ChatContext,
    files?: Express.Multer.File[],
    pendingDocumentIds?: string[]
  ): AsyncGenerator<ChatStreamChunk, void, unknown> {
    // 1. Resolve or create the chat
    let resolvedChatId = chatId;
    let isFirstMessage = false;

    if (!resolvedChatId) {
      const autoTitle = message.substring(0, 50) + (message.length > 50 ? '...' : '');
      const chat = await this.chatRepo.create(advisorId, autoTitle, context);
      resolvedChatId = chat.id;
      isFirstMessage = true;

      // Link any pending documents before emitting chat_created so they're available
      // for RAG in processMessage (which fetches linked docs from DB).
      if (pendingDocumentIds?.length) {
        await Promise.all(
          pendingDocumentIds.map((docId) =>
            this.documentService.linkDocumentToChat(resolvedChatId!, docId)
          )
        );
      }

      yield { type: 'chat_created', chatId: resolvedChatId };
    } else {
      const existingMessages = await this.chatRepo.findMessagesByChatId(resolvedChatId, advisorId);
      isFirstMessage = existingMessages.length === 0;
    }

    // 2. Fire-and-forget: generate AI title from first message
    if (isFirstMessage) {
      this.generateSmartTitle(resolvedChatId, advisorId, message).catch((err) =>
        this.logger.warn(`Failed to generate smart title: ${err.message}`)
      );
    }

    // 3. Log files received (RAG storage happens async in processMessage)
    this.logger.debug(`Files received: ${files?.length ?? 0} file(s)`);

    // 4. Persist user message — include file info in metadata so chips survive re-fetch
    const userMetadata: ChatMessageMetadata = files?.length
      ? { documents: files.map((f) => ({ name: f.originalname, size: f.size })) }
      : {};
    await this.chatRepo.addMessage(resolvedChatId, 'user', message, userMetadata);

    // 5. Stream response, accumulate for persistence
    let assistantContent = '';
    const toolCalls: Array<{ name: string; status: 'started' | 'completed' }> = [];

    for await (const chunk of this.processMessage(
      message,
      history,
      customSystemPrompt,
      context,
      resolvedChatId,
      files,
      advisorId
    )) {
      yield chunk;

      if (chunk.type === 'text') {
        assistantContent += chunk.content;
      }

      if (chunk.type === 'tool_call') {
        const existingIdx = toolCalls.findIndex((tc) => tc.name === chunk.toolCall.name);
        if (existingIdx >= 0) {
          toolCalls[existingIdx] = chunk.toolCall;
        } else {
          toolCalls.push(chunk.toolCall);
        }
      }
    }

    // 6. Persist assistant response with metadata
    if (assistantContent) {
      const metadata: ChatMessageMetadata = toolCalls.length > 0 ? { toolCalls } : {};
      await this.chatRepo.addMessage(resolvedChatId, 'assistant', assistantContent, metadata);
    }
  }

  /**
   * Generate an AI-powered title from the first user message and persist it.
   */
  private async generateSmartTitle(
    chatId: string,
    advisorId: string,
    firstMessage: string
  ): Promise<void> {
    const title = await this.llm.getCompletion(
      [{ role: 'user', content: firstMessage }],
      TITLE_GENERATION_PROMPT
    );

    const trimmedTitle = title.trim().substring(0, 100);
    if (trimmedTitle) {
      await this.chatRepo.updateTitle(chatId, advisorId, trimmedTitle);
      this.logger.debug(`Generated smart title for chat ${chatId}: "${trimmedTitle}"`);
    }
  }

  /**
   * Store files in RAG asynchronously (fire-and-forget).
   * Phase 1: initDocument() creates the DB record and links it to the chat immediately.
   * Phase 2: processDocumentAsync() runs in the background — status transitions to ready/error.
   * Errors are logged but don't block the user response.
   */
  private async storeFilesInRagAsync(
    files: Express.Multer.File[],
    chatId: string,
    advisorId: string
  ): Promise<void> {
    const advisor = await this.advisorRepo.findById(advisorId);
    if (!advisor?.advisory_id) {
      this.logger.warn(`No advisory found for advisor ${advisorId}, skipping file storage`);
      return;
    }

    const advisoryId = advisor.advisory_id;

    for (const file of files) {
      try {
        // Phase 1: upload + create record (fast, links document to chat immediately)
        const document = await this.documentService.initDocument(file, advisoryId, advisorId);
        await this.documentService.linkDocumentToChat(chatId, document.id);
        this.logger.log(`Document "${file.originalname}" initialized and linked to chat ${chatId}`);

        // Phase 2: fire-and-forget text extraction + embedding
        this.documentService.processDocumentAsync(document.id, file, advisoryId).catch((err) => {
          this.logger.error(
            `Background processing failed for "${file.originalname}" (${document.id})`,
            err instanceof Error ? err.stack : String(err)
          );
        });
      } catch (error) {
        this.logger.error(
          `Failed to init file "${file.originalname}" for chat ${chatId}`,
          error instanceof Error ? error.stack : String(error)
        );
        // Continue with other files
      }
    }
  }
}
