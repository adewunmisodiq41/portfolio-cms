import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCategory, toProject, toSettings } from "@/lib/data";
import AdminApp from "./AdminApp";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [settings, stats, socials, categories, projects] = await Promise.all([
    prisma.siteSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
    prisma.stat.findMany({ orderBy: { order: "asc" } }),
    prisma.socialLink.findMany({ orderBy: { order: "asc" } }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.project.findMany({ orderBy: [{ categoryId: "asc" }, { order: "asc" }] }),
  ]);

  return (
    <AdminApp
      email={session.user.email ?? ""}
      initial={{
        settings: toSettings(settings),
        stats: stats.map((s) => ({ value: s.value, label: s.label })),
        socials: socials.map((s) => ({ label: s.label, name: s.name, url: s.url })),
        categories: categories.map(toCategory),
        projects: projects.map(toProject),
      }}
    />
  );
}
