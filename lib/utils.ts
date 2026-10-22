export const RESERVED_SLUGS = [
  "admin",
  "login",
  "api",
  "uploads",
  "sitemap.xml",
  "robots.txt",
  "favicon.ico",
  "_next",
];

export function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || "category";
}

/** Only allow http(s), mailto, tel and site-relative URLs. Anything else becomes "". */
export function safeUrl(v: unknown): string {
  const s = String(v ?? "").trim();
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(s)) return s;
  return "";
}

export function isHex(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
}

export function str(v: unknown, max = 2000): string {
  return String(v ?? "").trim().slice(0, max);
}
