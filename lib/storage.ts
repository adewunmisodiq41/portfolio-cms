import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export const ALLOWED_TYPES = Object.keys(EXT);
export const MAX_BYTES = 4 * 1024 * 1024; // Vercel limits request bodies to ~4.5MB

/** The Blob token is BLOB_READ_WRITE_TOKEN, or PREFIX_READ_WRITE_TOKEN if the store was connected with a custom prefix. */
function blobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  const key = Object.keys(process.env).find((k) => k.endsWith("_READ_WRITE_TOKEN") && process.env[k]);
  return key ? process.env[key] : undefined;
}

/** Stores an image and returns its public URL. Uses Vercel Blob when a token is set, otherwise local disk. */
export async function saveImage(file: File): Promise<string> {
  const ext = EXT[file.type];
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  const token = blobToken();
  if (token) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`portfolio/${name}`, file, { access: "public", addRandomSuffix: false, token });
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