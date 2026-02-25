import type { ChatStreamChunk, OpenAssessmentView } from '@atlas/shared';
import { CONTEXT_PROMPTS } from '@chat/application/chat.prompts';
import { ChatRepository } from '@chat/domain/chat.repository';
import { ClientService } from '@datev/application/client.service';
import { DmsAdapter } from '@datev/dms/domain/dms.adapter';
import { LlmService } from '@llm/application/llm.service';
import type { ToolCallEvent } from '@llm/application/tool-orchestration.service';
import type { LlmMessage } from '@llm/domain/llm.types';
import {
  detectMimeTypeFromBuffer,
  encodeBufferToContentBlocks,
} from '@llm/infrastructure/file-encoding.util';
import { Injectable, Logger } from '@nestjs/common';
import { RAGService } from '@rag/application/rag.service';
import { SupabaseService } from '@shared/infrastructure/supabase.service';

import { BESCHEID_PRUEFUNG_SYSTEM_PROMPT } from './tax-assessment.prompts';

const SYSTEM_PROMPT = BESCHEID_PRUEFUNG_SYSTEM_PROMPT + CONTEXT_PROMPTS.EMAIL;

const INCOME_TAX_ORDER_NAME = 'Einkommensteuererklärung';

const buildClientContextSection = (context: string | null | undefined): string =>
  context
    ? `\n\n---\n\nMANDANTEN-STAMMDATEN (aus DATEV):\n${context}\n\nWichtig: Verwende die oben angegebene E-Mail-Adresse als Empfänger in der Mandantenmitteilung (Abschnitt 11). Falls mehrere Kontakte vorhanden sind, wähle die hauptverantwortliche Kontaktperson.`
    : '';

// Sandbox demo fixtures
const SANDBOX_BUCKET = 'sandbox';
const SANDBOX_ESTB_PATH = 'bescheidpruefung/estb.pdf';
const SANDBOX_ESTE_PATH = 'bescheidpruefung/este.pdf';
const SANDBOX_DOCUMENT_ID = 'sandbox-estb-2024';
const SANDBOX_YEAR = 2024;
const SANDBOX_CLIENT_GUID = 'client-max-muster-45001';

// NOTE: These IDs are specific to the bPlus DATEV DMS instance and must not be reused for other tenants.
const BPLUS_DATEV_FOLDER_ID = 198; // DMS folder: Steuerakten
const BPLUS_DATEV_DOMAIN_ID = 1; // Domain: Steuerberatung
const BPLUS_DATEV_REGISTER_ID = 489; // Register: Einkommensteuerbescheid
const BPLUS_DATEV_STATE_OPEN_ID = 5; // Document state: Zur Prüfung bereit
const OPEN_ASSESSMENT_FILTER = `folder.id eq ${BPLUS_DATEV_FOLDER_ID} and domain.id eq ${BPLUS_DATEV_DOMAIN_ID} and register.id eq ${BPLUS_DATEV_REGISTER_ID} and state.id eq ${BPLUS_DATEV_STATE_OPEN_ID}`;

const MAX_TOTAL_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isToolCallEvent = (chunk: string | ToolCallEvent): chunk is ToolCallEvent =>
  typeof chunk !== 'string';

/**
 * File extensions we can actually send to the Anthropic API.
 * DMS documents can contain .msg (Outlook emails), .doc, etc. — skip those.
 */
const PROCESSABLE_EXTENSIONS = new Set(['pdf', 'tif', 'tiff', 'jpg', 'jpeg', 'png', 'gif', 'webp']);

const isProcessableFile = (name: string): boolean =>
  PROCESSABLE_EXTENSIONS.has(name.split('.').pop()?.toLowerCase() ?? '');

/**
 * TaxAssessmentService - Orchestrates income tax assessment review
 *
 * Fetches DMS documents, encodes them, then streams an LLM review via LlmService.
 * Uses the shared LlmService so email templates, tool calls, and all chat features
 * work in the resulting chat session.
 */
@Injectable()
export class TaxAssessmentService {
  private readonly logger = new Logger(TaxAssessmentService.name);

  constructor(
    private readonly dmsAdapter: DmsAdapter,
    private readonly chatRepository: ChatRepository,
    private readonly llm: LlmService,
    private readonly clientService: ClientService,
    private readonly ragService: RAGService,
    private readonly supabase: SupabaseService
  ) {}

  private async downloadSandboxFile(path: string): Promise<Buffer> {
    const { data, error } = await this.supabase.db.storage.from(SANDBOX_BUCKET).download(path);
    if (error || !data) {
      throw new Error(`Sandbox file not found: ${path}`);
    }
    return Buffer.from(await data.arrayBuffer());
  }

  async listOpenAssessments(sandboxMode = false): Promise<OpenAssessmentView[]> {
    if (sandboxMode) {
      const client = await this.clientService.getClientById(SANDBOX_CLIENT_GUID);
      return [
        {
          documentId: SANDBOX_DOCUMENT_ID,
          clientName: client?.client_name ?? SANDBOX_CLIENT_GUID,
          taxType: INCOME_TAX_ORDER_NAME,
          year: SANDBOX_YEAR,
          stateId: BPLUS_DATEV_STATE_OPEN_ID.toString(),
          createdAt: new Date().toISOString(),
        },
      ];
    }

    const docs = await this.dmsAdapter.getDocuments(OPEN_ASSESSMENT_FILTER);
    const filtered = docs.filter((doc) => doc.order?.name === INCOME_TAX_ORDER_NAME);

    // Batch-resolve client names from datev_clients via correspondence_partner_guid
    const uniqueGuids = [...new Set(filtered.map((d) => d.correspondence_partner_guid))];
    const clientResults = await Promise.all(
      uniqueGuids.map((guid) => this.clientService.getClientById(guid))
    );
    const clientNameByGuid = new Map(
      uniqueGuids.map((guid, i) => [guid, clientResults[i]?.client_name ?? guid])
    );

    return filtered.map((doc) => ({
      documentId: doc.id,
      clientName:
        clientNameByGuid.get(doc.correspondence_partner_guid) ?? doc.correspondence_partner_guid,
      taxType: doc.order!.name!,
      year: doc.year,
      stateId: doc.state.id.toString(),
      createdAt: doc.change_date_time,
    }));
  }

  async *streamReview(
    assessmentDocumentId: string,
    advisorId: string,
    sandboxMode = false
  ): AsyncGenerator<ChatStreamChunk> {
    let clientName: string;
    let clientContextSection: string;
    let year: number;
    let assessmentFiles: { buffer: Buffer; name: string }[];
    let declarationFiles: { buffer: Buffer; name: string }[];

    if (sandboxMode) {
      // Sandbox: skip DMS — load fixture PDFs from Supabase Storage
      this.logger.log('Sandbox mode: loading fixture PDFs from Supabase Storage');

      const [client, ragClientResult, estbBuffer, esteBuffer] = await Promise.all([
        this.clientService.getClientById(SANDBOX_CLIENT_GUID),
        this.ragService.getDatevClientById(SANDBOX_CLIENT_GUID),
        this.downloadSandboxFile(SANDBOX_ESTB_PATH),
        this.downloadSandboxFile(SANDBOX_ESTE_PATH),
      ]);

      clientName = client?.client_name ?? SANDBOX_CLIENT_GUID;
      clientContextSection = buildClientContextSection(ragClientResult.context);
      year = SANDBOX_YEAR;
      assessmentFiles = [{ buffer: estbBuffer, name: 'estb.pdf' }];
      declarationFiles = [{ buffer: esteBuffer, name: 'este.pdf' }];
    } else {
      // 1. Fetch assessment document metadata
      const assessmentDoc = await this.dmsAdapter.getDocumentById(assessmentDocumentId);

      if (!assessmentDoc) {
        yield { type: 'error', error: 'Bescheid nicht gefunden' };
        return;
      }

      const [client, ragClientResult] = await Promise.all([
        this.clientService.getClientById(assessmentDoc.correspondence_partner_guid),
        this.ragService.getDatevClientById(assessmentDoc.correspondence_partner_guid),
      ]);

      clientName = client?.client_name ?? assessmentDoc.correspondence_partner_guid;
      clientContextSection = buildClientContextSection(ragClientResult.context);
      year = assessmentDoc.year;

      // 2. Fetch and download assessment PDFs
      this.logger.log(`Fetching assessment PDFs for document ${assessmentDocumentId}`);
      const assessmentItems = await this.dmsAdapter.getStructureItems(assessmentDocumentId);
      this.logger.log(`Assessment structure items: ${JSON.stringify(assessmentItems)}`);
      const assessmentFileItems = assessmentItems.filter(
        (item) => item.type === 1 && isProcessableFile(item.name)
      );

      assessmentFiles = await Promise.all(
        assessmentFileItems.map(async (item) => ({
          buffer: await this.dmsAdapter.getFileContent(item.document_file_id),
          name: item.name,
        }))
      );
      assessmentFiles.forEach(({ buffer, name }, i) => {
        const header = buffer.subarray(0, 8).toString('hex');
        const detectedMime = detectMimeTypeFromBuffer(buffer, name);
        this.logger.log(
          `Assessment file[${i}]: ${buffer.length} bytes, name="${name}", header=0x${header}, detectedMime="${detectedMime}"`
        );
      });

      // 3. Find matching declaration (same client GUID + EStE year)
      const guid = assessmentDoc.correspondence_partner_guid;
      if (!UUID_REGEX.test(guid)) {
        this.logger.error(`Invalid GUID in DMS document: "${guid}"`);
        yield { type: 'error', error: 'Ungültige Dokument-ID' };
        return;
      }
      const allClientDocs = await this.dmsAdapter.getDocuments(
        `correspondence_partner_guid eq '${guid}'`
      );
      const declarationDoc = allClientDocs.find(
        (doc) =>
          doc.description.startsWith('EStE') && doc.year === year && doc.id !== assessmentDocumentId
      );

      if (!declarationDoc) {
        yield {
          type: 'error',
          error: `Keine passende Einkommensteuererklärung für ${clientName} (${year}) gefunden`,
        };
        return;
      }

      // 4. Fetch and download declaration PDFs
      this.logger.log(`Fetching declaration PDFs for document ${declarationDoc.id}`);
      const declarationItems = await this.dmsAdapter.getStructureItems(declarationDoc.id);
      const declarationFileItems = declarationItems.filter(
        (item) => item.type === 1 && isProcessableFile(item.name)
      );

      declarationFiles = await Promise.all(
        declarationFileItems.map(async (item) => ({
          buffer: await this.dmsAdapter.getFileContent(item.document_file_id),
          name: item.name,
        }))
      );
      declarationFiles.forEach(({ buffer, name }, i) => {
        const header = buffer.subarray(0, 8).toString('hex');
        const detectedMime = detectMimeTypeFromBuffer(buffer, name);
        this.logger.log(
          `Declaration file[${i}]: ${buffer.length} bytes, name="${name}", header=0x${header}, detectedMime="${detectedMime}"`
        );
      });
    }

    // 5. Check total size
    const totalSize = [...assessmentFiles, ...declarationFiles].reduce(
      (sum, { buffer }) => sum + buffer.length,
      0
    );
    this.logger.log(
      `Total file size: ${(totalSize / 1024 / 1024).toFixed(1)} MB (${assessmentFiles.length + declarationFiles.length} files)`
    );

    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      yield {
        type: 'error',
        error: 'Dokumente zu groß für die Prüfung (max. 25 MB gesamt)',
      };
      return;
    }

    // 6. Create chat session
    const chatTitle = `Bescheidprüfung: ${clientName} EStB ${year}`;
    const chat = await this.chatRepository.create(advisorId, chatTitle);

    // 7. Yield chat_created so frontend can navigate to the chat
    yield { type: 'chat_created', chatId: chat.id };

    // 8. Build LLM messages with all PDFs/TIFFs as content blocks
    // encodeBufferToContentBlocks is async: TIFFs are converted page-by-page to JPEG
    // (Anthropic only accepts application/pdf for documents; TIFF is not supported natively)
    const fileContentBlocks = await Promise.all([
      ...assessmentFiles.map(({ buffer, name }) =>
        encodeBufferToContentBlocks(buffer, detectMimeTypeFromBuffer(buffer, name))
      ),
      ...declarationFiles.map(({ buffer, name }) =>
        encodeBufferToContentBlocks(buffer, detectMimeTypeFromBuffer(buffer, name))
      ),
    ]);
    const pdfBlocks = fileContentBlocks.flat();

    const userMessageText = `Bitte prüfen Sie den beigefügten Einkommensteuerbescheid gegen die Einkommensteuererklärung für ${clientName} (${year}). Bescheid: ${assessmentFiles.length} Datei(en), Erklärung: ${declarationFiles.length} Datei(en).`;

    // 9. Persist user message
    await this.chatRepository.addMessage(chat.id, 'user', userMessageText);

    // 10. Stream LLM review via LlmService (email templates, tool calls, all features included)
    const llmMessages: LlmMessage[] = [
      {
        role: 'user',
        content: [{ type: 'text', text: userMessageText }, ...pdfBlocks],
      },
    ];

    let fullResponse = '';
    try {
      for await (const chunk of this.llm.streamCompletion(
        llmMessages,
        SYSTEM_PROMPT + clientContextSection
      )) {
        if (typeof chunk === 'string') {
          fullResponse += chunk;
          yield { type: 'text', content: chunk };
        } else if (isToolCallEvent(chunk)) {
          yield { type: 'tool_call', toolCall: { name: chunk.name, status: chunk.status } };
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`LLM streaming failed: ${message}`, stack);
      yield { type: 'error', error: 'Fehler beim Generieren der Bescheidprüfung' };
      return;
    }

    // 11. Persist assistant response
    await this.chatRepository.addMessage(chat.id, 'assistant', fullResponse);

    yield { type: 'done' };
  }
}
