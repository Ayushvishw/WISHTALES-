import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * Object storage for uploaded media. Files are stored under random keys,
 * outside any executable path, and served only through /api/media.
 * Production: S3-compatible bucket (Cloudflare R2 or AWS S3).
 * Development: files on disk under .data/uploads.
 */
export interface Storage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}

const KEY_RE = /^[a-z]+\/[A-Za-z0-9]+(\.[a-z0-9]+)?$/;
export function assertKey(key: string) {
  if (!KEY_RE.test(key)) throw new Error("Invalid storage key");
}

class DiskStorage implements Storage {
  constructor(private root: string) {}
  private file(key: string) {
    assertKey(key);
    return path.join(this.root, key);
  }
  async put(key: string, body: Buffer) {
    const f = this.file(key);
    await mkdir(path.dirname(f), { recursive: true });
    await writeFile(f, body, { mode: 0o600 });
  }
  async get(key: string) {
    try {
      return await readFile(this.file(key));
    } catch {
      return null;
    }
  }
  async delete(key: string) {
    await unlink(this.file(key)).catch(() => {});
  }
}

class S3Storage implements Storage {
  private client: S3Client;
  constructor(private bucket: string) {
    this.client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! },
    });
  }
  async put(key: string, body: Buffer, contentType: string) {
    assertKey(key);
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }));
  }
  async get(key: string) {
    assertKey(key);
    try {
      const r = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      return r.Body ? Buffer.from(await r.Body.transformToByteArray()) : null;
    } catch {
      return null;
    }
  }
  async delete(key: string) {
    assertKey(key);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

let instance: Storage | null = null;
export function storage(): Storage {
  if (!instance) {
    instance = process.env.S3_BUCKET
      ? new S3Storage(process.env.S3_BUCKET)
      : new DiskStorage(process.env.UPLOAD_DIR ?? ".data/uploads");
  }
  return instance;
}
