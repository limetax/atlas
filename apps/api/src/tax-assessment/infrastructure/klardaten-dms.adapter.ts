import { isAxiosError } from 'axios';

import { KlardatenClient } from '@datev/infrastructure/klardaten.client';
import { Injectable, Logger } from '@nestjs/common';
import { DmsAdapter } from '@tax-assessment/domain/dms.adapter';
import type { DmsDocument, DmsStructureItem } from '@tax-assessment/domain/tax-assessment.entity';

/**
 * KlardatenDmsAdapter - Implements DmsAdapter using Klardaten DATEVconnect DMS v2 API
 * Uses KlardatenClient.dmsRequest() for authenticated requests (httpClient stays private).
 * Resource paths are relative to the DMS base URL (handled inside dmsRequest).
 */
@Injectable()
export class KlardatenDmsAdapter extends DmsAdapter {
  private readonly logger = new Logger(KlardatenDmsAdapter.name);

  constructor(private readonly klardatenClient: KlardatenClient) {
    super();
  }

  async getDocuments(filter: string): Promise<DmsDocument[]> {
    this.logger.debug(`Fetching DMS documents with filter: ${filter}`);
    const data = await this.klardatenClient.dmsRequest<{ value: DmsDocument[] } | DmsDocument[]>(
      'GET',
      '/documents',
      { params: { filter } }
    );
    return Array.isArray(data) ? data : (data.value ?? []);
  }

  async getDocumentById(documentId: string): Promise<DmsDocument | null> {
    this.logger.debug(`Fetching DMS document by ID: ${documentId}`);
    try {
      return await this.klardatenClient.dmsRequest<DmsDocument>('GET', `/documents/${documentId}`);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  }

  async getStructureItems(documentId: string): Promise<DmsStructureItem[]> {
    this.logger.debug(`Fetching structure items for document: ${documentId}`);
    const data = await this.klardatenClient.dmsRequest<
      { value: DmsStructureItem[] } | DmsStructureItem[]
    >('GET', `/documents/${documentId}/structure-items`);
    return Array.isArray(data) ? data : (data.value ?? []);
  }

  async getFileContent(documentFileId: number): Promise<Buffer> {
    this.logger.debug(`Downloading DMS file: ${documentFileId}`);
    const data = await this.klardatenClient.dmsRequest<ArrayBuffer>(
      'GET',
      `/document-files/${documentFileId}`,
      { responseType: 'arraybuffer', headers: { Accept: 'application/octet-stream' } }
    );
    return Buffer.from(data);
  }
}
