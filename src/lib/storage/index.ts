import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { del as blobDel, get as blobGet, put as blobPut } from "@vercel/blob";

/**
 * Object storage for uploaded media. Files are stored under random keys,
 * outside any executable path, and served only through /api/media.
 * Production: Vercel Blob (when BLOB_READ_WRITE_TOKEN is set), or an
 * S3-compatible bucket such as Cloudflare R2 or AWS S3 (when S3_BUCKET is set).
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

/**
 * Vercel Blob. Prefers a private store; if the store was created as public it
 * falls back to public access. Keys are random either way, and files are still
 * served through /api/media.
 */
class VercelBlobStorage implements Storage {
  private access: "private" | "public" = process.env.BLOB_ACCESS === "public" ? "public" : "private";
  async put(key: string, body: Buffer, contentType: string) {
    assertKey(key);
    const opts = { contentType, addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 31536000 };
    try {
      await blobPut(key, body, { ...opts, access: this.access });
    } catch (e) {
      if (this.access !== "private") throw e;
      await blobPut(key, body, { ...opts, access: "public" });
      this.access = "public";
    }
  }
  async get(key: string) {
    assertKey(key);
    try {
      const r = await blobGet(key, { access: this.access });
      if (!r || r.statusCode !== 200) return null;
      return Buffer.from(await new Response(r.stream).arrayBuffer());
    } catch {
      return null;
    }
  }
  async delete(key: string) {
    assertKey(key);
    await blobDel(key).catch(() => {});
  }
}

let instance: Storage | null = null;
export function storage(): Storage {
  if (!instance) {
    if (process.env.BLOB_READ_WRITE_TOKEN) instance = new VercelBlobStorage();
    else if (process.env.S3_BUCKET) instance = new S3Storage(process.env.S3_BUCKET);
    else if (process.env.VERCEL) throw new Error("No file storage configured. Connect a Vercel Blob store to the project.");
    else instance = new DiskStorage(process.env.UPLOAD_DIR ?? ".data/uploads");
  }
  return instance;
}
