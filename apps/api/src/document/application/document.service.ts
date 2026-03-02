import { randomUUID } from 'crypto';

import type { DocumentSource } from '@atlas/shared';
import { type DocumentEntity, DocumentRepository } from '@document/domain/document.entity';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { EmbeddingsService } from '@llm/application/embeddings.service';
import { TextExtractionService } from '@llm/application/text-extraction.service';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '@shared/infrastructure/supabase.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const STORAGE_BUCKET = 'documents';
const SIGNED_URL_EXPIRY_SECONDS = Number(process.env.SIGNED_URL_EXPIRY_SECONDS ?? '900'); // 15 min
const UPLOAD_CACHE_CONTROL = '3600';

/**
 * Document Service - Application layer for advisory-scoped document management
 * Handles file upload, parsing, chunking, embedding, storage, and chat linking
 */
@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    private readonly documentRepo: DocumentRepository,
    private readonly embeddingsService: EmbeddingsService,
    private readonly supabase: SupabaseService,
    private readonly textExtractionService: TextExtractionService
  ) {}

  /**
   * Phase 1 — Upload file to storage and create the document record (status: processing).
   * Fast: returns immediately. Call processDocumentAsync() in the background to finish.
   */
  async initDocument(
    file: Express.Multer.File,
    advisoryId: string,
    uploadedBy: string,
    options?: { source?: DocumentSource; datevDocumentId?: string }
  ): Promise<DocumentEntity> {
    this.validateFile(file);
    return this.uploadAndCreate(
      file.buffer,
      file.originalname,
      file.mimetype,
      advisoryId,
      uploadedBy,
      options
    );
  }

  /**
   * Ingest a document from a raw buffer: upload, create record, link to chat, and kick off processing.
   * For programmatic ingestion (e.g. DMS documents) — skips HTTP upload validation.
   * Deduplicates by datevDocumentId: re-links the existing document and returns early if already stored.
   * processDocumentAsync fires in the background; errors are logged, not thrown.
   */
  async ingestDocument(
    input: { buffer: Buffer; name: string; mimeType: string },
    advisoryId: string,
    uploadedBy: string,
    chatId: string,
    options?: { source?: DocumentSource; datevDocumentId?: string }
  ): Promise<void> {
    const { buffer, name, mimeType } = input;

    if (options?.datevDocumentId) {
      const existing = await this.documentRepo.findByDatevDocumentId(
        options.datevDocumentId,
        advisoryId
      );
      if (existing) {
        this.logger.log(
          `Document "${name}" (${options.datevDocumentId}) already exists, linking to chat ${chatId}`
        );
        await this.documentRepo.linkToChat(chatId, existing.id);
        return;
      }
    }

    const document = await this.uploadAndCreate(
      buffer,
      name,
      mimeType,
      advisoryId,
      uploadedBy,
      options
    );
    await this.documentRepo.linkToChat(chatId, document.id);
    this.logger.log(`Document "${name}" initialized and linked to chat ${chatId}`);

    const multerFile = {
      buffer,
      originalname: name,
      mimetype: mimeType,
      size: buffer.length,
      fieldname: 'file',
      encoding: '7bit',
      stream: null as never,
      destination: '',
      filename: name,
      path: '',
    } satisfies Express.Multer.File;

    this.processDocumentAsync(document.id, multerFile, advisoryId).catch((err) => {
      this.logger.error(
        `Background processing failed for "${name}" (${document.id})`,
        err instanceof Error ? err.stack : String(err)
      );
    });
  }

  /**
   * Phase 2 — Extract text, chunk, embed, and update document status.
   * Long-running: intended to run in the background after initDocument().
   * Status is set to 'ready' on success or 'error' on failure — never left as 'processing'.
   */
  async processDocumentAsync(
    documentId: string,
    file: Express.Multer.File,
    advisoryId: string
  ): Promise<void> {
    try {
      const extractedText = await this.textExtractionService.extractText(file);

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const chunks = await splitter.splitText(extractedText);

      if (chunks.length === 0) {
        await this.documentRepo.updateStatus(documentId, 'error', 'Keine Chunks erstellt');
        return;
      }

      this.logger.log(
        `Processing ${chunks.length} chunks for document ${documentId} (${file.originalname})`
      );

      const embeddings = await this.embeddingsService.generateEmbeddings(chunks);

      await this.documentRepo.insertChunks(
        chunks.map((content, i) => ({
          documentId,
          advisoryId,
          content,
          chunkIndex: i,
          embedding: embeddings[i],
        }))
      );

      await this.documentRepo.updateStatus(documentId, 'ready', undefined, chunks.length);
      this.logger.log(`Document ${documentId} processed successfully (${chunks.length} chunks)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Verarbeitungsfehler';
      this.logger.error(`Document processing failed for ${documentId}:`, error);
      await this.documentRepo.updateStatus(documentId, 'error', message);
    }
  }

  // --- Query methods ---

  async getDocumentsByAdvisory(advisoryId: string): Promise<DocumentEntity[]> {
    return this.documentRepo.findByAdvisoryId(advisoryId);
  }

  async getDocumentById(documentId: string): Promise<DocumentEntity | null> {
    return this.documentRepo.findById(documentId);
  }

  async getDocumentsByChatId(chatId: string): Promise<DocumentEntity[]> {
    return this.documentRepo.findByChatId(chatId);
  }

  async getDocumentIdsByChatId(chatId: string): Promise<string[]> {
    return this.documentRepo.findDocumentIdsByChatId(chatId);
  }

  async findByDatevDocumentId(
    datevDocumentId: string,
    advisoryId: string
  ): Promise<DocumentEntity | null> {
    return this.documentRepo.findByDatevDocumentId(datevDocumentId, advisoryId);
  }

  // --- Chat linking ---

  async linkDocumentToChat(chatId: string, documentId: string): Promise<void> {
    await this.documentRepo.linkToChat(chatId, documentId);
  }

  async unlinkDocumentFromChat(chatId: string, documentId: string): Promise<void> {
    await this.documentRepo.unlinkFromChat(chatId, documentId);
  }

  // --- Download ---

  async getDownloadUrl(documentId: string): Promise<{ url: string }> {
    const doc = await this.documentRepo.findById(documentId);
    if (!doc) throw new BadRequestException('Dokument nicht gefunden');

    const { data, error } = await this.supabase.db.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(doc.storagePath, SIGNED_URL_EXPIRY_SECONDS);

    if (error) {
      throw new Error(`Failed to create download URL: ${error.message}`);
    }

    return { url: data.signedUrl };
  }

  // --- Delete ---

  async deleteDocument(documentId: string): Promise<boolean> {
    const doc = await this.documentRepo.findById(documentId);
    if (!doc) return false;

    // Delete from storage
    await this.supabase.db.storage.from(STORAGE_BUCKET).remove([doc.storagePath]);

    // Delete from DB (cascade deletes chunks + chat_documents links)
    return this.documentRepo.delete(documentId);
  }

  // --- Helpers ---

  private async uploadAndCreate(
    buffer: Buffer,
    name: string,
    mimeType: string,
    advisoryId: string,
    uploadedBy: string,
    options?: { source?: DocumentSource; datevDocumentId?: string }
  ): Promise<DocumentEntity> {
    const docId = randomUUID();
    const storagePath = `${advisoryId}/shared/${docId}/${name}`;

    const { error: uploadError } = await this.supabase.db.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        cacheControl: UPLOAD_CACHE_CONTROL,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    return this.documentRepo.create({
      advisoryId,
      uploadedBy,
      name,
      sizeBytes: buffer.length,
      storagePath,
      mimeType,
      source: options?.source,
      datevDocumentId: options?.datevDocumentId,
    });
  }

  private validateFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Nur PDF-Dateien und Bilder (JPEG, PNG, GIF, WebP) sind erlaubt'
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Datei darf maximal 10MB groß sein');
    }
  }
}
