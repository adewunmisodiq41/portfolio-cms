# Portfolio site + admin dashboard

A portfolio website (profile card, stats, colourful folders, galleries, project previews, booking button)
where **everything on the public site is editable from `/admin`**: no code changes needed.

**Stack:** Next.js 15 · TypeScript · Prisma · PostgreSQL (Neon) · NextAuth · Vercel Blob (image uploads)

## What you can edit in `/admin`

| Tab | Controls |
|---|---|
| Site & profile | name, title, greeting, location, profile photo, availability text, booking button text + link, rating line (show/hide), intro paragraph, label above folders, footer text, page background + accent colour, SEO title + description |
| Stats | add / remove / reorder the numbers row |
| Social links | add / remove / reorder the round buttons and their links |
| Folders | add, rename, recolour, change page address, describe, reorder, hide, delete |
| Projects | add, edit, reorder, move between folders, hide, delete; upload images, set preview link, tall/regular thumbnail |
| Account | change your admin password |

Changes go live on the public site immediately.

## Deploy it live (Vercel + Neon), step by step

1. **Database.** In your Neon account create a project and copy two connection strings:
   the *pooled* one (`DATABASE_URL`) and the *direct* one (`DIRECT_URL`).
2. **Run it locally once to create the tables and your admin login:**
   ```bash
   npm install
   cp .env.example .env        # then fill in the values (see below)
   npm run setup               # creates tables + your admin user + sample content
   npm run dev                 # http://localhost:3000  (admin at /admin)
   ```
3. **Push to GitHub**, then **Import the repo in Vercel**.
4. In Vercel → Storage, **create a Blob store** and connect it to the project (this adds `BLOB_READ_WRITE_TOKEN`).
5. In Vercel → Settings → Environment Variables add:
   `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (your live URL, e.g. `https://yourname.com`),
   `NEXT_PUBLIC_SITE_URL` (same live URL). `ADMIN_EMAIL` / `ADMIN_PASSWORD` are only needed when you run `npm run setup`.
6. **Deploy.** Open `https://your-site/admin`, sign in, and replace the sample content.

Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`.

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Neon pooled / direct Postgres URLs |
| `NEXTAUTH_SECRET` | random secret that signs login sessions |
| `NEXTAUTH_URL` | the site's public URL |
| `NEXT_PUBLIC_SITE_URL` | public URL used in the sitemap / SEO |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | first admin account (used by `npm run setup`, 10+ char password) |
| `BLOB_READ_WRITE_TOKEN` | image uploads on Vercel |
| `UPLOAD_DIR` | optional: where uploads are stored when *not* using Blob (VPS/Docker; mount a persistent volume) |

## Notes

* **Images:** uploads are limited to 4 MB (JPG, PNG, WebP, GIF, AVIF). Large photos are shrunk automatically in the browser before upload. SVG uploads are blocked on purpose.
* **Links** you enter (booking, socials, project previews) must start with `https://`, `http://`, `mailto:` or `tel:`. `javascript:` links are rejected.
* **Forgot your password?** Set `RESET_ADMIN_PASSWORD=1` and a new `ADMIN_PASSWORD` in `.env`, then run `npm run db:seed`.
* **Re-running `npm run setup` is safe:** it never overwrites content you already edited.
* **Login protection:** there is no built-in login rate limit. On Vercel, enable the Firewall / Attack Challenge protection for `/api/auth/*`, and use a long password.
* **Not on Vercel?** Run `npm run build && npm start` on any Node 20+ server, leave `BLOB_READ_WRITE_TOKEN` empty and mount a persistent folder for `UPLOAD_DIR`.

## Project layout

```
app/(site)/        public site (home, /[folder] galleries)
app/admin/         admin dashboard UI
app/login/         sign-in page
app/api/admin/     secured edit endpoints (settings, stats, socials, categories, projects, reorder, upload, password)
lib/               database, auth, caching, storage helpers
prisma/            schema + seed
components/        ProjectGrid (gallery + preview modal)
```
