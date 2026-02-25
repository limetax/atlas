import { Injectable } from '@nestjs/common';

import { StorageAdapter } from '@shared/domain/storage.adapter';
import { SupabaseService } from '@shared/infrastructure/supabase.service';

/**
 * SupabaseStorageAdapter - Implements StorageAdapter using Supabase Storage.
 */
@Injectable()
export class SupabaseStorageAdapter extends StorageAdapter {
  constructor(private readonly supabase: SupabaseService) {
    super();
  }

  async downloadFile(bucket: string, path: string): Promise<Buffer> {
    const { data, error } = await this.supabase.db.storage.from(bucket).download(path);
    if (error || !data) {
      throw new Error(`Storage file not found: ${bucket}/${path}`);
    }
    return Buffer.from(await data.arrayBuffer());
  }
}
