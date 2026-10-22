import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bad, guard, readJson, revalidateSite } from "@/lib/api";
import { str } from "@/lib/utils";

export async function PUT(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = await readJson(req);
  if (!body || !Array.isArray(body.items)) return bad("Expected { items: [...] }");
  if (body.items.length > 12) return bad("Maximum 12 stats");

  const items = (body.items as Record<string, unknown>[])
    .map((i) => ({ value: str(i.value, 30), label: str(i.label, 80) }))
    .filter((i) => i.value || i.label);

  await prisma.$transaction([
    prisma.stat.deleteMany(),
    prisma.stat.createMany({ data: items.map((i, order) => ({ ...i, order })) }),
  ]);
  revalidateSite();
  return NextResponse.json({ items });
}
