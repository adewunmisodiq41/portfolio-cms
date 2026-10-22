import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bad, guard, readJson, revalidateSite } from "@/lib/api";
import { RESERVED_SLUGS, isHex, slugify, str } from "@/lib/utils";
import { toCategory } from "@/lib/data";

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = await readJson(req);
  if (!body) return bad("Invalid JSON");

  const name = str(body.name, 80);
  if (!name) return bad("Name is required");

  let base = slugify(name);
  if (RESERVED_SLUGS.includes(base)) base = `${base}-folder`;
  let slug = base;
  for (let n = 2; await prisma.category.findUnique({ where: { slug } }); n++) slug = `${base}-${n}`;

  const last = await prisma.category.aggregate({ _max: { order: true } });
  const category = await prisma.category.create({
    data: {
      name,
      slug,
      intro: str(body.intro, 400),
      color1: isHex(body.color1) ? body.color1 : "#6c8cff",
      color2: isHex(body.color2) ? body.color2 : "#4a68de",
      published: body.published === undefined ? true : Boolean(body.published),
      order: (last._max.order ?? -1) + 1,
    },
  });
  revalidateSite();
  return NextResponse.json({ category: toCategory(category) }, { status: 201 });
}
