import Link from "next/link";
import type { CSSProperties } from "react";
import { getSiteData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { settings, categories } = await getSiteData();

  return (
    <div className="view">
      <h2 className="ws-label">{settings.workspaceLabel}</h2>
      {categories.length === 0 && <p className="empty">Nothing here yet.</p>}
      <div className="folders">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/${c.slug}`}
            className="folder"
            style={{ "--c1": c.color1, "--c2": c.color2 } as CSSProperties}
            aria-label={`Open ${c.name}`}
          >
            <div className="ico">
              <div className="tab" />
              <div className="back" />
              <div className="paper" />
              <div className="front" />
            </div>
            <span className="label">{c.name}</span>
            <small>
              {c.projects.length} {c.projects.length === 1 ? "project" : "projects"}
            </small>
          </Link>
        ))}
      </div>
    </div>
  );
}
