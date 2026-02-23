import sharp from 'sharp';

import type { ContentBlock } from '@llm/domain/llm.types';

/**
 * Supported MIME types for direct (synchronous) encoding.
 * TIFF is intentionally excluded — it requires async conversion via sharp.
 * Maps MIME types to their corresponding Anthropic content block type:
 *   - 'document': Anthropic PDF document block (only application/pdf accepted)
 *   - 'image': Anthropic image block (jpeg, png, gif, webp)
 */
const SUPPORTED_MIME_TYPES = {
  'application/pdf': 'document',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
} as const;

/**
 * Maps a file extension to a MIME type.
 * Returns null when the extension is unknown.
 */
const detectMimeTypeFromExtension = (filename: string): string | null => {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'tif':
    case 'tiff':
      return 'image/tiff';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return null;
  }
};

/**
 * Detects the MIME type of a buffer from its magic bytes.
 *
 * Detection order:
 * 1. Magic bytes (most reliable for standard formats)
 * 2. File extension hint from `filenameHint` (covers DATEV-specific TIFF variants)
 * 3. Falls back to 'application/pdf'
 */
export const detectMimeTypeFromBuffer = (buffer: Buffer, filenameHint?: string): string => {
  if (buffer.length < 4)
    return filenameHint
      ? (detectMimeTypeFromExtension(filenameHint) ?? 'application/pdf')
      : 'application/pdf';

  // PDF: %PDF
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'application/pdf';
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }
  // GIF: GIF8
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'image/gif';
  }
  // RIFF/WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.length >= 12 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }
  // TIFF little-endian: II*\0 (standard) or II+\0 (BigTIFF)
  if (
    buffer[0] === 0x49 &&
    buffer[1] === 0x49 &&
    (buffer[2] === 0x2a || buffer[2] === 0x2b) &&
    buffer[3] === 0x00
  ) {
    return 'image/tiff';
  }
  // TIFF big-endian: MM\0* (standard) or MM\0+ (BigTIFF)
  if (
    buffer[0] === 0x4d &&
    buffer[1] === 0x4d &&
    buffer[2] === 0x00 &&
    (buffer[3] === 0x2a || buffer[3] === 0x2b)
  ) {
    return 'image/tiff';
  }

  // Magic bytes unrecognised — fall back to file extension
  if (filenameHint) {
    const extMime = detectMimeTypeFromExtension(filenameHint);
    if (extMime !== null) return extMime;
  }

  return 'application/pdf';
};

type SupportedMimeType = keyof typeof SUPPORTED_MIME_TYPES;

/**
 * Type guard to check if a MIME type is supported for direct (synchronous) encoding.
 */
const isSupportedMimeType = (mime: string): mime is SupportedMimeType => {
  return mime in SUPPORTED_MIME_TYPES;
};

/**
 * Converts a multi-page TIFF buffer to JPEG ContentBlocks (one per page).
 *
 * Anthropic's API does not support TIFF natively. This converts each page to
 * JPEG at 95% quality using sharp (libvips), which handles all common TIFF
 * compression formats including CCITT G4/G3 used by document scanners.
 */
const encodeTiffToContentBlocks = async (buffer: Buffer): Promise<ContentBlock[]> => {
  const metadata = await sharp(buffer).metadata();
  const pageCount = metadata.pages ?? 1;

  const jpegBuffers = await Promise.all(
    Array.from({ length: pageCount }, (_, pageIndex) =>
      sharp(buffer, { page: pageIndex }).jpeg({ quality: 95 }).toBuffer()
    )
  );

  return jpegBuffers.map((jpegBuffer) => ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: 'image/jpeg',
      data: jpegBuffer.toString('base64'),
    },
  }));
};

/**
 * Encodes a raw Buffer to one or more Anthropic content blocks (async).
 * Use this for DMS file downloads where TIFF conversion may be needed.
 *
 * - PDF → single `document` block (`application/pdf`)
 * - TIFF → one `image/jpeg` block per page (converted via sharp)
 * - JPEG/PNG/GIF/WebP → single `image` block
 *
 * @param buffer - File content as Buffer
 * @param mimeType - MIME type (use detectMimeTypeFromBuffer to determine)
 * @returns Array of ContentBlocks (multiple for multi-page TIFFs)
 * @throws Error if file type is not supported
 */
export const encodeBufferToContentBlocks = async (
  buffer: Buffer,
  mimeType: string
): Promise<ContentBlock[]> => {
  if (mimeType === 'image/tiff') {
    return encodeTiffToContentBlocks(buffer);
  }

  return [encodeBufferToContentBlock(buffer, mimeType)];
};

/**
 * Encodes an uploaded file to an Anthropic content block (sync).
 * For multer file uploads (user-uploaded files, not DMS downloads).
 *
 * @param file - Express Multer file upload
 * @returns ContentBlock with base64-encoded file data
 * @throws Error if file type is not supported
 */
export const encodeFileToContentBlock = (file: Express.Multer.File): ContentBlock => {
  if (!isSupportedMimeType(file.mimetype)) {
    throw new Error(`Unsupported file type: ${file.mimetype}`);
  }

  const blockType = SUPPORTED_MIME_TYPES[file.mimetype];
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

/**
 * Encodes a raw Buffer to an Anthropic content block (sync).
 * Does not support TIFF — use encodeBufferToContentBlocks for DMS files.
 *
 * @param buffer - File content as Buffer
 * @param mimeType - MIME type of the file (use detectMimeTypeFromBuffer to determine)
 * @returns ContentBlock with base64-encoded file data
 * @throws Error if file type is not supported
 */
export const encodeBufferToContentBlock = (buffer: Buffer, mimeType: string): ContentBlock => {
  if (!isSupportedMimeType(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  const blockType = SUPPORTED_MIME_TYPES[mimeType];
  const base64Data = buffer.toString('base64');

  return {
    type: blockType,
    source: {
      type: 'base64',
      media_type: mimeType,
      data: base64Data,
    },
  } satisfies ContentBlock;
};
