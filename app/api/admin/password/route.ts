import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { bad, guard, readJson } from "@/lib/api";

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const body = await readJson(req);
  if (!body) return bad("Invalid JSON");

  const current = String(body.currentPassword ?? "");
  const next = String(body.newPassword ?? "");
  if (next.length < 10) return bad("New password must be at least 10 characters");

  const user = await prisma.adminUser.findUnique({ where: { email: session!.user!.email!.toLowerCase() } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) {
    return bad("Current password is incorrect", 403);
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(next, 12) },
  });
  return NextResponse.json({ ok: true });
}
