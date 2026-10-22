import Link from "next/link";
import { getSiteData } from "@/lib/data";
import FolderIcon from "@/components/FolderIcon";

export const dynamic = "force-dynamic";

/** One paragraph: the first part in black, the rest in grey. */
function Bio({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  const cut = Math.ceil(words.length * 0.54);
  return (
    <p className="about">
      <span>{words.slice(0, cut).join(" ")}</span> <span className="dim">{words.slice(cut).join(" ")}</span>
    </p>
  );
}

export default async function Home() {
  const { settings, categories } = await getSiteData();

  return (
    <div className="view">
      {settings.bio.trim() && <Bio text={settings.bio} />}
      {categories.length === 0 && <p className="empty">Nothing here yet.</p>}
      <div className="folders">
        {categories.map((c) => (
          <div className="cell" key={c.id}>
            <Link href={`/${c.slug}`} className="folder" aria-label={`Open ${c.name}`}>
              <FolderIcon
                name={c.name}
                color1={c.color1}
                color2={c.color2}
                images={c.projects
                  .filter((p) => p.imageUrl)
                  .slice(0, 3)
                  .map((p) => p.imageUrl)}
              />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
