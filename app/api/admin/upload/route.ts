import { NextResponse } from "next/server";
import { bad, guard } from "@/lib/api";
import {
  ALLOWED_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_BYTES,
  MAX_VIDEO_BYTES,
  saveMedia,
  uploadMode,
} from "@/lib/storage";

export const runtime = "nodejs";

/** Tells the admin page how to upload (the browser needs to know before sending a video). */
export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  return NextResponse.json({
    mode: uploadMode(),
    maxVideoBytes: MAX_VIDEO_BYTES,
    videoTypes: ALLOWED_VIDEO_TYPES,
  });
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("Invalid upload");
  }
  const file = form.get("file");
  if (!(file instanceof File)) return bad("No file received");

  if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
    // On Vercel, videos are too big for a server request: the browser sends them straight to storage
    // through /api/admin/upload/client. This path only handles videos when files are kept on local disk.
    if (uploadMode() !== "local") {
      return bad("Videos upload directly from the browser to storage. Reload the admin page and try again.");
    }
    if (file.size > MAX_VIDEO_BYTES) return bad(`Video is larger than ${MAX_VIDEO_BYTES / 1024 / 1024} MB`);
  } else {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return bad("Only JPG, PNG, WebP, GIF or AVIF images, or MP4, WebM or MOV videos, are allowed");
    }
    if (file.size > MAX_BYTES) return bad("Image is larger than 4 MB");
  }

  try {
    const url = await saveMedia(file);
    return NextResponse.json({ url });
  } catch (e) {
    return bad(e instanceof Error ? e.message : "Upload failed", 500);
  }
}
