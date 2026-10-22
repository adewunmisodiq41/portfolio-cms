import type { MetadataRoute } from "next";
import { getSiteData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const { categories } = await getSiteData();
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    ...categories.map((c) => ({ url: `${base}/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
