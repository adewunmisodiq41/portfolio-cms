import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bad, guard, readJson, revalidateSite } from "@/lib/api";
import { safeUrl, str } from "@/lib/utils";
import { toProject } from "@/lib/data";

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = await readJson(req);
  if (!body) return bad("Invalid JSON");

  const categoryId = Number(body.categoryId);
  if (!Number.isInteger(categoryId)) return bad("categoryId is required");
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return bad("Folder not found", 404);

  const title = str(body.title, 120) || "New project";
  const imageRaw = str(body.imageUrl, 1000);
  const linkRaw = str(body.linkUrl, 1000);
  if (imageRaw && !safeUrl(imageRaw)) return bad("Image URL must start with https://, http:// or /");
  if (linkRaw && !safeUrl(linkRaw)) return bad("Link must start with https://, http://, mailto: or tel:");

  const last = await prisma.project.aggregate({ where: { categoryId }, _max: { order: true } });
  const project = await prisma.project.create({
    data: {
      categoryId,
      title,
      meta: str(body.meta, 80),
      description: str(body.description, 2000),
      imageUrl: safeUrl(imageRaw),
      linkUrl: safeUrl(linkRaw),
      tall: Boolean(body.tall),
      published: body.published === undefined ? true : Boolean(body.published),
      order: (last._max.order ?? -1) + 1,
    },
  });
  revalidateSite();
  return NextResponse.json({ project: toProject(project) }, { status: 201 });
}
