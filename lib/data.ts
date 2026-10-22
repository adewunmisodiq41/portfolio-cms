import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import type { CategoryDTO, ProjectDTO, SettingsDTO, SiteData } from "./types";

export function toSettings(s: SettingsDTO & Record<string, unknown>): SettingsDTO {
  return {
    name: s.name,
    title: s.title,
    greeting: s.greeting,
    locationPrefix: s.locationPrefix,
    location: s.location,
    availability: s.availability,
    bio: s.bio,
    portraitUrl: s.portraitUrl,
    bookingUrl: s.bookingUrl,
    bookingLabel: s.bookingLabel,
    ratingScore: s.ratingScore,
    ratingText: s.ratingText,
    showRating: s.showRating,
    workspaceLabel: s.workspaceLabel,
    footerText: s.footerText,
    seoTitle: s.seoTitle,
    seoDescription: s.seoDescription,
    accentColor: s.accentColor,
    bgColor: s.bgColor,
  };
}

export function toCategory(c: CategoryDTO): CategoryDTO {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    intro: c.intro,
    color1: c.color1,
    color2: c.color2,
    order: c.order,
    published: c.published,
  };
}

export function toProject(p: ProjectDTO): ProjectDTO {
  return {
    id: p.id,
    categoryId: p.categoryId,
    title: p.title,
    meta: p.meta,
    description: p.description,
    imageUrl: p.imageUrl,
    linkUrl: p.linkUrl,
    tall: p.tall,
    order: p.order,
    published: p.published,
  };
}

async function loadSiteData(): Promise<SiteData> {
  const [settings, stats, socials, categories] = await Promise.all([
    prisma.siteSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
    prisma.stat.findMany({ orderBy: { order: "asc" } }),
    prisma.socialLink.findMany({ orderBy: { order: "asc" } }),
    prisma.category.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      include: { projects: { where: { published: true }, orderBy: { order: "asc" } } },
    }),
  ]);

  return {
    settings: toSettings(settings),
    stats: stats.map((s) => ({ value: s.value, label: s.label })),
    socials: socials.map((s) => ({ label: s.label, name: s.name, url: s.url })),
    categories: categories.map((c) => ({
      ...toCategory(c),
      projects: c.projects.map(toProject),
    })),
  };
}

/** Cached public content. Admin mutations call revalidateTag("site"). */
export const getSiteData = unstable_cache(loadSiteData, ["site-data"], {
  tags: ["site"],
  revalidate: 3600,
});
