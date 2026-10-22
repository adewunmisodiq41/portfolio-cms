import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bad, guard, readJson, revalidateSite } from "@/lib/api";
import { isHex, safeUrl, str } from "@/lib/utils";
import { toSettings } from "@/lib/data";

const TEXT_FIELDS = [
  "name",
  "title",
  "greeting",
  "locationPrefix",
  "location",
  "availability",
  "bookingLabel",
  "ratingScore",
  "ratingText",
  "workspaceLabel",
  "footerText",
  "seoTitle",
  "seoDescription",
] as const;

const URL_FIELDS = ["portraitUrl", "bookingUrl"] as const;

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const s = await prisma.siteSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  return NextResponse.json({ settings: toSettings(s) });
}

export async function PUT(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = await readJson(req);
  if (!body) return bad("Invalid JSON");

  const data: Record<string, string | boolean> = {};
  for (const k of TEXT_FIELDS) if (k in body) data[k] = str(body[k], k === "seoDescription" ? 400 : 200);
  if ("bio" in body) data.bio = str(body.bio, 4000);
  for (const k of URL_FIELDS) {
    if (k in body) {
      const raw = str(body[k], 1000);
      const clean = safeUrl(raw);
      if (raw && !clean) return bad(`"${k}" must start with https://, http://, mailto:, tel: or /`);
      data[k] = clean;
    }
  }
  if ("showRating" in body) data.showRating = Boolean(body.showRating);
  for (const k of ["accentColor", "bgColor"] as const) {
    if (k in body) {
      if (!isHex(body[k])) return bad(`"${k}" must be a hex color like #141414`);
      data[k] = body[k] as string;
    }
  }
  if ("name" in data && !data.name) return bad("Name cannot be empty");

  const s = await prisma.siteSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  revalidateSite();
  return NextResponse.json({ settings: toSettings(s) });
}
