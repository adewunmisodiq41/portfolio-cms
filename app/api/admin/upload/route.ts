import { NextResponse } from "next/server";
import { bad, guard } from "@/lib/api";
import { ALLOWED_TYPES, MAX_BYTES, saveImage } from "@/lib/storage";

export const runtime = "nodejs";

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
  if (!ALLOWED_TYPES.includes(file.type)) return bad("Only JPG, PNG, WebP, GIF or AVIF images are allowed");
  if (file.size > MAX_BYTES) return bad("Image is larger than 4 MB");

  try {
    const url = await saveImage(file);
    return NextResponse.json({ url });
  } catch (e) {
    return bad(e instanceof Error ? e.message : "Upload failed", 500);
  }
}
