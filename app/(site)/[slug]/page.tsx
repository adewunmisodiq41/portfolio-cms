import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteData } from "@/lib/data";
import ProjectGrid from "@/components/ProjectGrid";
import MiniAvatar from "@/components/MiniAvatar";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { categories } = await getSiteData();
  const c = categories.find((x) => x.slug === slug);
  if (!c) return {};
  return { title: c.name, description: c.intro || undefined };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const { categories, settings } = await getSiteData();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  return (
    <div className="view gallery">
      <div className="gallery-top">
        <Link href="/" className="back-btn">
          ← Back
        </Link>
        <MiniAvatar url={settings.portraitUrl} className="mini-me" />
      </div>
      <h2>{category.name}</h2>
      {category.intro && <p className="intro">{category.intro}</p>}
      <ProjectGrid projects={category.projects} c1={category.color1} c2={category.color2} />
    </div>
  );
}
