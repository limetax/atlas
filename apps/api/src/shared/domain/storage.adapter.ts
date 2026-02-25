/**
 * StorageAdapter - Domain contract for file storage access.
 * Abstract class (required for NestJS DI injection tokens).
 * Implemented by SupabaseStorageAdapter in the infrastructure layer.
 */
export abstract class StorageAdapter {
  abstract downloadFile(bucket: string, path: string): Promise<Buffer>;
}
