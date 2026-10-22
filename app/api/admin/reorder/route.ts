import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bad, guard, readJson, revalidateSite } from "@/lib/api";

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = await readJson(req);
  if (!body || (body.type !== "category" && body.type !== "project") || !Array.isArray(body.ids)) {
    return bad('Expected { type: "category" | "project", ids: number[] }');
  }
  const ids = (body.ids as unknown[]).map(Number);
  if (ids.some((n) => !Number.isInteger(n))) return bad("ids must be integers");

  if (body.type === "category") {
    await prisma.$transaction(ids.map((id, order) => prisma.category.update({ where: { id }, data: { order } })));
  } else {
    await prisma.$transaction(ids.map((id, order) => prisma.project.update({ where: { id }, data: { order } })));
  }
  revalidateSite();
  return NextResponse.json({ ok: true });
}
