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

/** Stores an image and returns its public URL. Uses Vercel Blob when a token is set, otherwise local disk. */
export async function saveImage(file: File): Promise<string> {
  const ext = EXT[file.type];
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`portfolio/${name}`, file, { access: "public", addRandomSuffix: false });
    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new Error("Image storage is not configured. Add a Vercel Blob store (BLOB_READ_WRITE_TOKEN).");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
