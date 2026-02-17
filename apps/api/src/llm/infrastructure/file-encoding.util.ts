import { ContentBlock } from '@llm/domain/llm-provider.interface';

/**
 * Supported MIME types for file uploads
 * Maps MIME types to their corresponding content block type
 */
const SUPPORTED_MIME_TYPES = {
  'application/pdf': 'document',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
} as const;

/**
 * Encodes an uploaded file to an Anthropic content block
 * Converts file buffer to base64 and wraps in appropriate content block format
 *
 * @param file - Express Multer file upload
 * @returns ContentBlock with base64-encoded file data
 * @throws Error if file type is not supported
 */
export const encodeFileToContentBlock = (file: Express.Multer.File): ContentBlock => {
  const blockType = SUPPORTED_MIME_TYPES[file.mimetype as keyof typeof SUPPORTED_MIME_TYPES];
  if (!blockType) {
    throw new Error(`Unsupported file type: ${file.mimetype}`);
  }

  const base64Data = Buffer.from(file.buffer).toString('base64');

  return {
    type: blockType,
    source: {
      type: 'base64',
      media_type: file.mimetype,
      data: base64Data,
    },
  } satisfies ContentBlock;
};
