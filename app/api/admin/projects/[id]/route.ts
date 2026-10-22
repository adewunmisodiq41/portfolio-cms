import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bad, guard, readJson, revalidateSite } from "@/lib/api";
import { safeUrl, str } from "@/lib/utils";
import { toProject } from "@/lib/data";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return bad("Invalid id");
  const body = await readJson(req);
  if (!body) return bad("Invalid JSON");

  const data: Record<string, string | boolean | number> = {};
  if ("title" in body) {
    data.title = str(body.title, 120);
    if (!data.title) return bad("Title cannot be empty");
  }
  if ("meta" in body) data.meta = str(body.meta, 80);
  if ("description" in body) data.description = str(body.description, 2000);
  if ("tall" in body) data.tall = Boolean(body.tall);
  if ("published" in body) data.published = Boolean(body.published);
  if ("imageUrl" in body) {
    const raw = str(body.imageUrl, 1000);
    const clean = safeUrl(raw);
    if (raw && !clean) return bad("Image URL must start with https://, http:// or /");
    data.imageUrl = clean;
  }
  if ("linkUrl" in body) {
    const raw = str(body.linkUrl, 1000);
    const clean = safeUrl(raw);
    if (raw && !clean) return bad("Link must start with https://, http://, mailto: or tel:");
    data.linkUrl = clean;
  }
  if ("categoryId" in body) {
    const categoryId = Number(body.categoryId);
    const exists = Number.isInteger(categoryId) && (await prisma.category.findUnique({ where: { id: categoryId } }));
    if (!exists) return bad("Folder not found", 404);
    data.categoryId = categoryId;
  }

  try {
    const project = await prisma.project.update({ where: { id }, data });
    revalidateSite();
    return NextResponse.json({ project: toProject(project) });
  } catch {
    return bad("Project not found", 404);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return bad("Invalid id");
  try {
    await prisma.project.delete({ where: { id } });
    revalidateSite();
    return NextResponse.json({ ok: true });
  } catch {
    return bad("Project not found", 404);
  }
}
