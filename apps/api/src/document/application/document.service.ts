import { randomUUID } from 'crypto';

import { type DocumentEntity, DocumentRepository } from '@document/domain/document.entity';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { EmbeddingsService } from '@llm/application/embeddings.service';
import { TextExtractionService } from '@llm/application/text-extraction.service';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '@shared/infrastructure/supabase.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const STORAGE_BUCKET = 'documents';

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
    uploadedBy: string
  ): Promise<DocumentEntity> {
    this.validateFile(file);

    const docId = randomUUID();
    const storagePath = `${advisoryId}/shared/${docId}/${file.originalname}`;

    const { error: uploadError } = await this.supabase.db.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    return this.documentRepo.create({
      advisoryId,
      uploadedBy,
      name: file.originalname,
      sizeBytes: file.size,
      storagePath,
      mimeType: file.mimetype,
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
      .createSignedUrl(doc.storagePath, 3600); // 1 hour

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
