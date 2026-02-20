import { Request } from 'express';

import { AdvisorRepository } from '@auth/domain/advisor.repository';
import { DocumentService } from '@document/application/document.service';
import { type DocumentEntity } from '@document/domain/document.entity';
import {
  BadRequestException,
  Controller,
  FileTypeValidator,
  Logger,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Req,
  UnauthorizedException,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SupabaseService } from '@shared/infrastructure/supabase.service';

/**
 * Document Controller - HTTP endpoint for standalone document upload (outside of chat)
 *
 * Upload flow:
 *   1. initDocument()        — upload to storage, create DB record (status: processing) — fast
 *   2. processDocumentAsync() — extract text, chunk, embed, update status — fire-and-forget
 *
 * Returns document entities immediately (status: processing). The client polls/re-fetches
 * to see the final status (ready or error).
 */
@Controller('documents')
export class DocumentController {
  private readonly logger = new Logger(DocumentController.name);

  constructor(
    private readonly documentService: DocumentService,
    private readonly supabase: SupabaseService,
    private readonly advisorRepo: AdvisorRepository
  ) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadDocuments(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: /(application\/pdf|image\/(jpeg|png|gif|webp))/,
          }),
        ],
        fileIsRequired: true,
      })
    )
    files: Express.Multer.File[],
    @Req() req: Request
  ): Promise<DocumentEntity[]> {
    const advisorId = await this.authenticateRequest(req);

    const advisor = await this.advisorRepo.findById(advisorId);
    if (!advisor?.advisory_id) {
      throw new BadRequestException('Keine Kanzlei für diesen Benutzer gefunden');
    }

    const advisoryId = advisor.advisory_id;

    // Phase 1: upload to storage + create DB records (returns immediately with status: processing)
    const documents = await Promise.all(
      files.map((file) => this.documentService.initDocument(file, advisoryId, advisorId))
    );

    // Phase 2: fire-and-forget text extraction + embedding for each document
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const file = files[i];
      this.documentService.processDocumentAsync(doc.id, file, advisoryId).catch(() => {
        // processDocumentAsync handles all errors internally and sets status to 'error'
        this.logger.error(
          `Background processing failed for document ${doc.id} (${file.originalname})`
        );
      });
    }

    return documents;
  }

  private async authenticateRequest(req: Request): Promise<string> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Anmeldung erforderlich');
    }

    const token = authHeader.slice(7);
    const { data, error } = await this.supabase.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Ungültiges Token');
    }

    return data.user.id;
  }
}
