import type { CSSProperties } from "react";

// Icon details are "knocked out" in the card colour, so they read as cut-outs in a solid black shape.
const knock: CSSProperties = { fill: "var(--card)" };
const knockLine: CSSProperties = { stroke: "var(--card)", fill: "none" };

export type IconKind = "facebook" | "x" | "instagram" | "linkedin" | "youtube" | "framer" | "email";

export function detectKind(name: string, url: string): IconKind | null {
  const s = `${name} ${url}`.toLowerCase();
  if (/facebook|fb\.com|fb\.me/.test(s)) return "facebook";
  if (/instagram|instagr\.am/.test(s)) return "instagram";
  if (/linkedin/.test(s)) return "linkedin";
  if (/youtube|youtu\.be/.test(s)) return "youtube";
  if (/framer/.test(s)) return "framer";
  if (/^mailto:/i.test(url.trim())) return "email";
  if (/twitter\.com|\/\/(www\.)?x\.com/.test(s) || name.trim().toLowerCase() === "x") return "x";
  return null;
}

export default function SocialIcon({ kind, label }: { kind: IconKind | null; label: string }) {
  switch (kind) {
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="12" fill="currentColor" />
          <path
            style={knock}
            d="M13.2 24V13.4h2.5l.4-2.9h-2.9V8.7c0-.8.3-1.4 1.4-1.4h1.6V4.7c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.1H7.6v2.9h2.5V24z"
          />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect width="24" height="24" rx="5.5" fill="currentColor" />
          <path
            style={knock}
            transform="translate(5.28 5.28) scale(.56)"
            d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
          />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect width="24" height="24" rx="6.6" fill="currentColor" />
          <circle cx="12" cy="12" r="4.4" strokeWidth="2.1" style={knockLine} />
          <circle cx="17.7" cy="6.3" r="1.3" style={knock} />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect width="24" height="24" rx="4.5" fill="currentColor" />
          <circle cx="7" cy="7.2" r="1.7" style={knock} />
          <rect x="5.6" y="10" width="2.8" height="8.2" style={knock} />
          <path
            style={knock}
            d="M10.4 10H13.2V11.2C13.7 10.4 14.6 9.8 16 9.8C18.5 9.8 19.4 11.4 19.4 13.9V18.2H16.6V14.5C16.6 13.5 16.5 12.4 15.3 12.4C14 12.4 13.2 13.3 13.2 14.5V18.2H10.4Z"
          />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect y="3.5" width="24" height="17" rx="5" fill="currentColor" />
          <path style={knock} d="M9.8 8.6v6.8l5.9-3.4z" />
        </svg>
      );
    case "framer":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect width="24" height="24" rx="6.6" fill="currentColor" />
          <path style={knock} transform="translate(6 6) scale(.5)" d="M4 0h16v8h-8zM4 8h8l8 8H4zM4 16h8v8z" />
        </svg>
      );
    case "email":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="currentColor" />
          <rect x="5" y="7" width="14" height="10" rx="1.8" strokeWidth="1.7" style={knockLine} />
          <path d="M5.8 8.4 12 13l6.2-4.6" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={knockLine} />
        </svg>
      );
    default:
      return (
        <span className="si-fallback" aria-hidden="true">
          {label}
        </span>
      );
  }
}
