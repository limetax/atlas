import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { EmbeddingsService } from '@llm/application/embeddings.service';
import { TextExtractionService } from '@llm/application/text-extraction.service';
import { SupabaseService } from '@shared/infrastructure/supabase.service';
import { DocumentRepository } from '@document/domain/document.repository';
import { type ChatDocumentEntity } from '@document/domain/document.entity';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Document Service - Application layer for document processing
 * Handles PDF upload, parsing, chunking, embedding, and storage
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
   * Process and store a PDF file: upload to storage, parse, chunk, embed, store chunks
   * Runs synchronously so uploaded content is available for the immediate LLM response
   */
  async processAndStore(
    file: Express.Multer.File,
    chatId: string,
    advisorId: string
  ): Promise<ChatDocumentEntity> {
    this.validateFile(file);

    // Upload to Supabase Storage
    const storagePath = `${advisorId}/${chatId}/${randomUUID()}.pdf`;
    const { error: uploadError } = await this.supabase.db.storage
      .from('chat-documents')
      .upload(storagePath, file.buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Create document record (status: processing)
    const document = await this.documentRepo.create({
      chatId,
      advisorId,
      fileName: file.originalname,
      fileSize: file.size,
      storagePath,
    });

    // Process PDF: parse → chunk → embed → store
    try {
      const blob = new Blob([new Uint8Array(file.buffer)], { type: 'application/pdf' });
      const loader = new PDFLoader(blob);
      const pages = await loader.load();

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const chunks = await splitter.splitDocuments(pages);

      if (chunks.length === 0) {
        await this.documentRepo.updateStatus(document.id, 'error', 'PDF enthält keinen Text');
        return { ...document, status: 'error', errorMessage: 'PDF enthält keinen Text' };
      }

      this.logger.log(
        `Processing ${chunks.length} chunks for document ${document.id} (${file.originalname})`
      );

      // Generate embeddings for all chunks
      const embeddings = await this.embeddingsService.generateEmbeddings(
        chunks.map((c) => c.pageContent)
      );

      // Insert chunks with embeddings
      await this.documentRepo.insertChunks(
        chunks.map((chunk, i) => ({
          documentId: document.id,
          chatId,
          advisorId,
          content: chunk.pageContent,
          pageNumber: chunk.metadata?.loc?.pageNumber ?? undefined,
          chunkIndex: i,
          embedding: embeddings[i],
        }))
      );

      await this.documentRepo.updateStatus(document.id, 'ready', undefined, chunks.length);

      this.logger.log(`Document ${document.id} processed successfully (${chunks.length} chunks)`);
      return { ...document, status: 'ready', chunkCount: chunks.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Verarbeitungsfehler';
      this.logger.error(`Document processing failed for ${document.id}:`, error);
      await this.documentRepo.updateStatus(document.id, 'error', message);
      return { ...document, status: 'error', errorMessage: message };
    }
  }

  /**
   * Process and store a file using Claude for text extraction
   * Handles scanned PDFs automatically with built-in OCR
   * Uses Claude text extraction (~1k tokens per 3 pages) instead of PDFLoader
   */
  async processAndStoreWithClaude(
    file: Express.Multer.File,
    chatId: string,
    advisorId: string
  ): Promise<ChatDocumentEntity> {
    this.validateFile(file);

    // Upload to Supabase Storage
    const storagePath = `${advisorId}/${chatId}/${randomUUID()}.pdf`;
    const { error: uploadError } = await this.supabase.db.storage
      .from('chat-documents')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Create document record (status: processing)
    const document = await this.documentRepo.create({
      chatId,
      advisorId,
      fileName: file.originalname,
      fileSize: file.size,
      storagePath,
    });

    try {
      // Extract text using the text extractor service (abstracted via interface)
      const extractedText = await this.textExtractionService.extractText(file);

      // Chunk the extracted text
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const chunks = await splitter.splitText(extractedText);

      if (chunks.length === 0) {
        await this.documentRepo.updateStatus(document.id, 'error', 'Keine Chunks erstellt');
        return { ...document, status: 'error', errorMessage: 'Keine Chunks erstellt' };
      }

      this.logger.log(
        `Processing ${chunks.length} chunks for document ${document.id} (${file.originalname}) using Claude`
      );

      // Generate embeddings for all chunks
      const embeddings = await this.embeddingsService.generateEmbeddings(chunks);

      // Insert chunks with embeddings
      await this.documentRepo.insertChunks(
        chunks.map((content, i) => ({
          documentId: document.id,
          chatId,
          advisorId,
          content,
          chunkIndex: i,
          embedding: embeddings[i],
        }))
      );

      // Update status to ready with chunk count
      try {
        await this.documentRepo.updateStatus(document.id, 'ready', undefined, chunks.length);
        this.logger.log(
          `Document ${document.id} processed successfully with Claude (${chunks.length} chunks)`
        );
      } catch (statusError) {
        this.logger.error(
          `Failed to update document status to ready for ${document.id}`,
          statusError
        );
        // Even if status update fails, chunks are stored, so don't throw
      }

      return { ...document, status: 'ready', chunkCount: chunks.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Verarbeitungsfehler';
      this.logger.error(`Claude text extraction failed for ${document.id}:`, error);

      // Try to update status to error, but don't fail if this fails too
      try {
        await this.documentRepo.updateStatus(document.id, 'error', message);
      } catch (statusError) {
        this.logger.error(
          `Failed to update document status to error for ${document.id}`,
          statusError
        );
      }

      return { ...document, status: 'error', errorMessage: message };
    }
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

  async getDocumentsByChat(chatId: string, advisorId: string): Promise<ChatDocumentEntity[]> {
    return this.documentRepo.findByChatId(chatId, advisorId);
  }

  async deleteDocument(documentId: string, advisorId: string): Promise<boolean> {
    const doc = await this.documentRepo.findById(documentId, advisorId);
    if (!doc) return false;

    // Delete from storage
    await this.supabase.db.storage.from('chat-documents').remove([doc.storagePath]);

    // Delete from DB (cascade deletes chunks)
    return this.documentRepo.delete(documentId, advisorId);
  }
}
