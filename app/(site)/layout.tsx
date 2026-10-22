import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { getSiteData } from "@/lib/data";
import SocialIcon, { detectKind } from "@/components/SocialIcon";

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
    <svg viewBox="0 0 243 335" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Portrait placeholder">
      <rect width="243" height="335" fill="#dcd9d2" />
      <circle cx="121" cy="136" r="50" fill="#bdb9b0" />
      <path d="M20 335c6-76 48-112 101-112s95 36 101 112z" fill="#bdb9b0" />
    </svg>
  );
}

const isExternal = (url: string) => /^https?:/i.test(url);

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { settings: s, stats, socials } = await getSiteData();
  const hasRating = s.showRating && (s.ratingScore || s.ratingText);

  return (
    <div className="site" style={{ "--bg": s.bgColor, "--accent": s.accentColor } as CSSProperties}>
      <aside className="profile" aria-label="Profile">
        <div className="p-in">
          <div className="p-top">
            <div className="portrait">
              <Portrait url={s.portraitUrl} name={s.name} />
            </div>
            <h1 className="name">
              {s.greeting && <span>{s.greeting}</span>}
              <span>{s.name}</span>
              {s.location && (
                <span>
                  {s.locationPrefix} {s.location}
                </span>
              )}
            </h1>
          </div>

          {hasRating && (
            <div className="rating">
              <div className="rating-row">
                <span className="stars" aria-hidden="true">
                  ★★★★★
                </span>
                {s.ratingScore && <span>{s.ratingScore}</span>}
              </div>
              {s.ratingText && <p className="rating-text">{s.ratingText}</p>}
            </div>
          )}

          {socials.length > 0 && (
            <nav className="socials" aria-label="Social links">
              {socials.map((l) => (
                <a
                  key={l.url + l.name}
                  href={l.url}
                  aria-label={l.name}
                  {...(isExternal(l.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  <SocialIcon kind={detectKind(l.name, l.url)} label={l.label} />
                </a>
              ))}
            </nav>
          )}
        </div>
      </aside>

      <main>
        {(stats.length > 0 || s.bookingUrl) && (
          <header className="top">
            <div className="stats">
              {stats.map((st, i) => (
                <div className="stat" key={i}>
                  <b>{st.value}</b>
                  <span>{st.label}</span>
                </div>
              ))}
            </div>
            {s.bookingUrl && (
              <a
                className="btn"
                href={s.bookingUrl}
                {...(isExternal(s.bookingUrl) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {s.bookingLabel}
                <span aria-hidden="true">→</span>
              </a>
            )}
          </header>
        )}

        {children}

        <footer className="foot">
          © {new Date().getFullYear()} {s.name}
          {s.footerText ? ` · ${s.footerText}` : ""}
        </footer>
      </main>
    </div>
  );
}
