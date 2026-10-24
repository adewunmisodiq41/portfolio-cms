import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

const VIDEO_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export const ALLOWED_TYPES = Object.keys(IMAGE_EXT);
export const ALLOWED_VIDEO_TYPES = Object.keys(VIDEO_EXT);
export const MAX_BYTES = 4 * 1024 * 1024; // images go through the server; Vercel limits request bodies to ~4.5MB
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // videos go straight from the browser to storage

/** The Blob token is BLOB_READ_WRITE_TOKEN, or PREFIX_READ_WRITE_TOKEN if the store was connected with a custom prefix. */
export function blobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  const key = Object.keys(process.env).find((k) => k.endsWith("_READ_WRITE_TOKEN") && process.env[k]);
  return key ? process.env[key] : undefined;
}

/**
 * How uploads are stored:
 *  - "token":     Vercel Blob with a read/write token (older stores)
 *  - "presigned": Vercel Blob connected through BLOB_STORE_ID (newer stores, no read/write token)
 *  - "local":     files on this server's disk (local development or a VPS with a persistent volume)
 */
export type UploadMode = "token" | "presigned" | "local";

export function uploadMode(): UploadMode {
  if (blobToken()) return "token";
  if (process.env.BLOB_STORE_ID) return "presigned";
  return "local";
}

/** Stores an image or video and returns its public URL. Uses Vercel Blob when configured, otherwise local disk. */
export async function saveMedia(file: File): Promise<string> {
  const ext = IMAGE_EXT[file.type] ?? VIDEO_EXT[file.type];
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  // Newer Blob stores connect with BLOB_STORE_ID and sign in automatically (no read/write token).
  const token = blobToken();
  if (token || process.env.BLOB_STORE_ID) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`portfolio/${name}`, file, {
      access: "public",
      addRandomSuffix: false,
      ...(token ? { token } : {}),
    });
    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Image storage is not configured: no Blob token found. Connect a Blob store to this project in Vercel (Storage tab), then redeploy.",
    );
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
