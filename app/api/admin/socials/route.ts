import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bad, guard, readJson, revalidateSite } from "@/lib/api";
import { safeUrl, str } from "@/lib/utils";

export async function PUT(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = await readJson(req);
  if (!body || !Array.isArray(body.items)) return bad("Expected { items: [...] }");
  if (body.items.length > 12) return bad("Maximum 12 social links");

  const items: { label: string; name: string; url: string }[] = [];
  for (const raw of body.items as Record<string, unknown>[]) {
    const label = str(raw.label, 6);
    const name = str(raw.name, 40);
    const urlRaw = str(raw.url, 1000);
    if (!label && !name && !urlRaw) continue;
    const url = safeUrl(urlRaw);
    if (!url) return bad(`Link for "${name || label}" must start with https://, http://, mailto: or tel:`);
    items.push({ label: label || name.slice(0, 2), name: name || label, url });
  }

  await prisma.$transaction([
    prisma.socialLink.deleteMany(),
    prisma.socialLink.createMany({ data: items.map((i, order) => ({ ...i, order })) }),
  ]);
  revalidateSite();
  return NextResponse.json({ items });
}
