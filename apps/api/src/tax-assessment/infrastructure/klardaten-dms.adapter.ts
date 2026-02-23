import { KlardatenClient } from '@datev/infrastructure/klardaten.client';
import { Injectable, Logger } from '@nestjs/common';
import { DmsAdapter } from '@tax-assessment/domain/dms.adapter';
import type { DmsDocument, DmsStructureItem } from '@tax-assessment/domain/tax-assessment.entity';

const DMS_BASE = '/datevconnect/dms/v2';

/**
 * KlardatenDmsAdapter - Implements DmsAdapter using Klardaten DATEVconnect DMS v2 API
 * Reuses KlardatenClient's authenticated axios instance (with auto token refresh)
 */
@Injectable()
export class KlardatenDmsAdapter extends DmsAdapter {
  private readonly logger = new Logger(KlardatenDmsAdapter.name);

  constructor(private readonly klardatenClient: KlardatenClient) {
    super();
  }

  async getDocuments(filter: string): Promise<DmsDocument[]> {
    this.logger.debug(`Fetching DMS documents with filter: ${filter}`);
    const { data } = await this.klardatenClient.httpClient.get<
      { value: DmsDocument[] } | DmsDocument[]
    >(`${DMS_BASE}/documents`, { params: { filter } });

    const result = Array.isArray(data) ? data : (data.value ?? []);

    return result;
  }

  async getDocumentById(documentId: string): Promise<DmsDocument> {
    this.logger.debug(`Fetching DMS document by ID: ${documentId}`);

    const { data } = await this.klardatenClient.httpClient.get<DmsDocument>(
      `${DMS_BASE}/documents/${documentId}`
    );
    return data;
  }

  async getStructureItems(documentId: string): Promise<DmsStructureItem[]> {
    this.logger.debug(`Fetching structure items for document: ${documentId}`);
    const response = await this.klardatenClient.httpClient.get<
      { value: DmsStructureItem[] } | DmsStructureItem[]
    >(`${DMS_BASE}/documents/${documentId}/structure-items`);

    const data = response.data;
    return Array.isArray(data) ? data : (data.value ?? []);
  }

  async getFileContent(documentFileId: number): Promise<Buffer> {
    this.logger.debug(`Downloading DMS file: ${documentFileId}`);
    const response = await this.klardatenClient.httpClient.get<ArrayBuffer>(
      `${DMS_BASE}/document-files/${documentFileId}`,
      {
        responseType: 'arraybuffer',
        headers: { Accept: 'application/octet-stream' },
      }
    );
    return Buffer.from(response.data);
  }
}
