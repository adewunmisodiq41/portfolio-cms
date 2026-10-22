import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { getSiteData } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { settings: s } = await getSiteData();
  const title = s.seoTitle || `${s.name} — ${s.title} & Portfolio`;
  const description =
    s.seoDescription || `${s.name}'s portfolio: ${s.title.toLowerCase()} work, projects and ways to get in touch.`;
  return {
    title: { default: title, template: `%s | ${s.name}` },
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

function Portrait({ url, name }: { url: string; name: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={`Portrait of ${name}`} />;
  }
  return (
    <svg viewBox="0 0 344 380" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Portrait placeholder">
      <rect width="344" height="380" fill="#d9d6cf" />
      <circle cx="172" cy="150" r="58" fill="#bdb9b0" />
      <path d="M40 380c8-80 60-120 132-120s124 40 132 120z" fill="#bdb9b0" />
    </svg>
  );
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { settings: s, stats, socials } = await getSiteData();
  const external = (url: string) => /^https?:/i.test(url);

  return (
    <div className="site" style={{ "--bg": s.bgColor, "--accent": s.accentColor } as CSSProperties}>
      <div className="shell">
        <aside className="profile" aria-label="Profile">
          <div className="portrait">
            <Portrait url={s.portraitUrl} name={s.name} />
          </div>
          <div>
            {s.greeting && <p className="hello">{s.greeting}</p>}
            <h1 className="name">{s.name}</h1>
            {s.location && (
              <p className="loc">
                {s.locationPrefix} {s.location}
              </p>
            )}
          </div>
          {s.showRating && (s.ratingScore || s.ratingText) && (
            <div className="rating">
              <span className="stars" aria-hidden="true">
                ★★★★★
              </span>
              {s.ratingScore && <b>{s.ratingScore}</b>}
              {s.ratingText && <span>{s.ratingText}</span>}
            </div>
          )}
          {socials.length > 0 && (
            <nav className="socials" aria-label="Social links">
              {socials.map((l) => (
                <a
                  key={l.url + l.name}
                  href={l.url}
                  aria-label={l.name}
                  {...(external(l.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {l.label}
                </a>
              ))}
            </nav>
          )}
          {s.bookingUrl && (
            <a
              className="btn block"
              href={s.bookingUrl}
              {...(external(s.bookingUrl) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {s.bookingLabel}
            </a>
          )}
        </aside>

        <main>
          <header className="top">
            <div className="avail">
              <i className="dot" />
              <span>{s.availability}</span>
            </div>
            {s.bookingUrl && (
              <a
                className="btn"
                href={s.bookingUrl}
                {...(external(s.bookingUrl) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {s.bookingLabel}
              </a>
            )}
          </header>

          {stats.length > 0 && (
            <section className="stats" aria-label="Highlights">
              {stats.map((st, i) => (
                <div className="stat" key={i}>
                  <h3>{st.value}</h3>
                  <p>{st.label}</p>
                </div>
              ))}
            </section>
          )}

          {s.bio && <section className="about">{s.bio}</section>}

          <section className="workspace">{children}</section>

          <footer className="foot">
            © {new Date().getFullYear()} {s.name}
            {s.footerText ? ` · ${s.footerText}` : ""}
          </footer>
        </main>
      </div>
    </div>
  );
}
