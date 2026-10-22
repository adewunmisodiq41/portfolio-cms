import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bad, guard, readJson, revalidateSite } from "@/lib/api";
import { RESERVED_SLUGS, isHex, slugify, str } from "@/lib/utils";
import { toCategory } from "@/lib/data";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return bad("Invalid id");
  const body = await readJson(req);
  if (!body) return bad("Invalid JSON");

  const data: Record<string, string | boolean> = {};
  if ("name" in body) {
    data.name = str(body.name, 80);
    if (!data.name) return bad("Name cannot be empty");
  }
  if ("intro" in body) data.intro = str(body.intro, 400);
  if ("published" in body) data.published = Boolean(body.published);
  for (const k of ["color1", "color2"] as const) {
    if (k in body) {
      if (!isHex(body[k])) return bad(`"${k}" must be a hex color like #ff8a5b`);
      data[k] = body[k] as string;
    }
  }
  if ("slug" in body) {
    const slug = slugify(str(body.slug, 80));
    if (RESERVED_SLUGS.includes(slug)) return bad(`"${slug}" is reserved, choose another URL`);
    const clash = await prisma.category.findUnique({ where: { slug } });
    if (clash && clash.id !== id) return bad(`The URL "${slug}" is already used by another folder`);
    data.slug = slug;
  }

  try {
    const category = await prisma.category.update({ where: { id }, data });
    revalidateSite();
    return NextResponse.json({ category: toCategory(category) });
  } catch {
    return bad("Folder not found", 404);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return bad("Invalid id");
  try {
    await prisma.category.delete({ where: { id } });
    revalidateSite();
    return NextResponse.json({ ok: true });
  } catch {
    return bad("Folder not found", 404);
  }
}
