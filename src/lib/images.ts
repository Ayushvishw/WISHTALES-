import sharp, { type Metadata } from "sharp";

export const IMAGE_RULES = {
  types: ["image/jpeg", "image/png", "image/webp"] as const,
  maxBytes: 10 * 1024 * 1024,
  maxInputSide: 12000,
  deliverySide: 1600,
  thumbSide: 400,
};

export class ImageError extends Error {}

export type ProcessedImage = {
  full: Buffer;
  thumb: Buffer;
  width: number;
  height: number;
};

/**
 * Validates and re-encodes an uploaded photo. Re-encoding drops EXIF and
 * location metadata, applies the camera's rotation, and guarantees we never
 * serve the customer's original bytes.
 */
export async function processPhoto(input: Buffer, declaredType: string): Promise<ProcessedImage> {
  if (!IMAGE_RULES.types.includes(declaredType as (typeof IMAGE_RULES.types)[number])) {
    throw new ImageError("Use a JPG, PNG or WebP image.");
  }
  if (input.byteLength > IMAGE_RULES.maxBytes) throw new ImageError("Each photo must be 10 MB or smaller.");

  let meta: Metadata;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw new ImageError("That file isn't a readable image.");
  }
  // Trust the decoded format, not the browser's declared type.
  if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format)) throw new ImageError("Use a JPG, PNG or WebP image.");
  if (!meta.width || !meta.height || Math.max(meta.width, meta.height) > IMAGE_RULES.maxInputSide) {
    throw new ImageError(`Photos can be at most ${IMAGE_RULES.maxInputSide} pixels on the longest side.`);
  }

  const base = sharp(input, { limitInputPixels: IMAGE_RULES.maxInputSide ** 2 }).rotate();
  const full = await base
    .clone()
    .resize({ width: IMAGE_RULES.deliverySide, height: IMAGE_RULES.deliverySide, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  const thumb = await base
    .clone()
    .resize({ width: IMAGE_RULES.thumbSide, height: IMAGE_RULES.thumbSide, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();
  return { full: full.data, thumb, width: full.info.width, height: full.info.height };
}
