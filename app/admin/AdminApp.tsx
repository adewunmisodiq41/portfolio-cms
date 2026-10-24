"use client";

import { useRef, useState } from "react";
import { signOut } from "next-auth/react";
import type { CategoryDTO, ProjectDTO, SettingsDTO } from "@/lib/types";
import { isVideoUrl } from "@/lib/utils";

type Pair = Record<string, string>;
type Notify = (text: string, ok?: boolean) => void;
type Initial = {
  settings: SettingsDTO;
  stats: Pair[];
  socials: Pair[];
  categories: CategoryDTO[];
  projects: ProjectDTO[];
};

async function api<T = Record<string, unknown>>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error || `Request failed (${res.status})`);
  return json as T;
}

/** Shrinks big photos in the browser so uploads stay under the 4 MB limit. */
async function prepareImage(file: File): Promise<File> {
  if (file.type === "image/gif" || file.size < 900_000) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2200 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/webp", 0.86));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

const VIDEO_MIME: Record<string, string> = { mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime" };
const mb = (bytes: number) => Math.round((bytes / 1024 / 1024) * 10) / 10;

/** The video's content type, from the file itself or (when the browser leaves it blank) its extension. */
function videoMime(file: File): string | null {
  if (Object.values(VIDEO_MIME).includes(file.type)) return file.type;
  const ext = file.name.toLowerCase().match(/\.(mp4|webm|mov)$/)?.[1];
  return ext ? VIDEO_MIME[ext] : null;
}

/** Local-disk uploads: a normal form upload, with progress. */
function xhrUpload(file: File, onProgress: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(json.url);
        else reject(new Error(json.error || "Upload failed"));
      } catch {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your internet connection."));
    xhr.send(form);
  });
}

/** Sends a video from the browser straight to storage (it is too big to pass through the server). */
async function uploadVideo(file: File, mime: string, onProgress: (pct: number) => void): Promise<string> {
  const info = await api<{ mode: "token" | "presigned" | "local"; maxVideoBytes: number }>("/api/admin/upload", "GET");
  if (file.size > info.maxVideoBytes) {
    throw new Error(
      `This video is ${mb(file.size)} MB and the limit is ${mb(info.maxVideoBytes)} MB. Export it smaller (1080p MP4) and try again.`,
    );
  }
  if (info.mode === "local") return xhrUpload(file, onProgress);

  const ext = Object.keys(VIDEO_MIME).find((k) => VIDEO_MIME[k] === mime)!;
  const pathname = `portfolio/videos/${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const blob = await import("@vercel/blob/client");
  const options = {
    access: "public" as const,
    handleUploadUrl: "/api/admin/upload/client",
    contentType: mime,
    onUploadProgress: (e: { percentage: number }) => onProgress(Math.round(e.percentage)),
  };
  const result =
    info.mode === "presigned"
      ? await blob.uploadPresigned(pathname, file, options)
      : await blob.upload(pathname, file, options);
  return result.url;
}

function MediaField({
  label,
  value,
  onChange,
  notify,
  help,
  allowVideo = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  notify: Notify;
  help?: string;
  allowVideo?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);

  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    setPct(0);
    try {
      const looksLikeVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|mkv|avi)$/i.test(file.name);
      if (looksLikeVideo) {
        if (!allowVideo) throw new Error("This field takes an image. You can add videos to a project.");
        const mime = videoMime(file);
        if (!mime) throw new Error("Please use an MP4, WebM or MOV video.");
        onChange(await uploadVideo(file, mime, setPct));
        notify("Video uploaded. Remember to save.");
      } else {
        const ready = await prepareImage(file);
        const form = new FormData();
        form.append("file", ready);
        const res = await fetch("/api/admin/upload", { method: "POST", body: form });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Upload failed");
        onChange(json.url);
        notify("Image uploaded. Remember to save.");
      }
    } catch (e) {
      notify(e instanceof Error ? e.message : "Upload failed", false);
    } finally {
      setBusy(false);
      setPct(0);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="ad-field">
      <span>
        {label} {help && <small>{help}</small>}
      </span>
      <div className="ad-img">
        {isVideoUrl(value) ? (
          <video className="prev" src={`${value}#t=0.1`} muted playsInline preload="metadata" aria-label="Video preview" />
        ) : (
          <div className="prev" style={value ? { backgroundImage: `url("${value}")` } : undefined} />
        )}
        <div className="ctl">
          <input
            type="text"
            value={value}
            placeholder={allowVideo ? "Paste an image or video URL, or upload" : "Paste an image URL, or upload"}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="ad-row">
            <button type="button" className="ad-btn" disabled={busy} onClick={() => input.current?.click()}>
              {busy ? (pct > 0 ? `Uploading… ${pct}%` : "Uploading…") : allowVideo ? "Upload image or video" : "Upload image"}
            </button>
            {value && !busy && (
              <button type="button" className="ad-btn" onClick={() => onChange("")}>
                Remove
              </button>
            )}
            <input
              ref={input}
              type="file"
              accept={
                allowVideo
                  ? "image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  : "image/jpeg,image/png,image/webp,image/gif,image/avif"
              }
              hidden
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </div>
          {busy && pct > 0 && (
            <div className="ad-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <i style={{ width: `${pct}%` }} />
            </div>
          )}
          {allowVideo && !busy && (
            <small className="ad-muted">Videos: MP4, WebM or MOV, up to 100 MB. MP4 (H.264) plays everywhere.</small>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Site & profile ---------------- */

type FieldDef = { key: keyof SettingsDTO; label: string; kind?: "text" | "area" | "url" | "color" | "image" | "bool"; help?: string; wide?: boolean };

const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "Profile card",
    fields: [
      { key: "name", label: "Your name" },
      { key: "title", label: "Professional title", help: "(used in the browser tab / search title)" },
      { key: "greeting", label: "First line of the heading", help: "(e.g. Hey, I’m)" },
      { key: "locationPrefix", label: "Word before location", help: '(e.g. "from")' },
      { key: "location", label: "Location" },
      { key: "portraitUrl", label: "Profile photo", kind: "image", wide: true },
      { key: "showRating", label: "Show the rating line", kind: "bool" },
      { key: "ratingScore", label: "Rating score", help: "(shown next to the stars, e.g. 4.9/5. Only use a real one)" },
      { key: "ratingText", label: "Line under the rating", wide: true },
    ],
  },
  {
    title: "Booking button",
    fields: [
      { key: "bookingLabel", label: "Button text" },
      { key: "bookingUrl", label: "Button link", kind: "url", help: "(calendar link, WhatsApp link, or mailto:you@email.com)" },
    ],
  },
  {
    title: "Page content",
    fields: [
      { key: "bio", label: "Intro paragraph", kind: "area", wide: true },
      { key: "workspaceLabel", label: "Label above the folders" },
      { key: "footerText", label: "Footer text" },
    ],
  },
  {
    title: "Look",
    fields: [
      { key: "bgColor", label: "Page background", kind: "color" },
      { key: "accentColor", label: "Buttons & accents", kind: "color" },
    ],
  },
  {
    title: "Search engines (SEO)",
    fields: [
      { key: "seoTitle", label: "Page title", help: "(leave empty to build it from your name and title)", wide: true },
      { key: "seoDescription", label: "Page description", kind: "area", wide: true },
    ],
  },
];

function SettingsTab({ initial, notify }: { initial: SettingsDTO; notify: Notify }) {
  const [s, setS] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof SettingsDTO>(k: K, v: SettingsDTO[K]) => setS((p) => ({ ...p, [k]: v }));

  async function save() {
    setBusy(true);
    try {
      const res = await api<{ settings: SettingsDTO }>("/api/admin/settings", "PUT", s);
      setS(res.settings);
      notify("Saved. Your live site is updated.");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not save", false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ad-stack">
      {SECTIONS.map((sec) => (
        <div className="ad-card" key={sec.title}>
          <h2 className="ad-h">{sec.title}</h2>
          <div className="ad-grid" style={{ marginTop: 14 }}>
            {sec.fields.map((f) => {
              const v = s[f.key];
              const cls = f.wide || f.kind === "image" || f.kind === "area" ? "wide" : "";
              if (f.kind === "image")
                return (
                  <div className={cls} key={f.key}>
                    <MediaField label={f.label} value={String(v)} onChange={(x) => set(f.key, x as never)} notify={notify} help={f.help} />
                  </div>
                );
              if (f.kind === "bool")
                return (
                  <label className="ad-check" key={f.key}>
                    <input type="checkbox" checked={Boolean(v)} onChange={(e) => set(f.key, e.target.checked as never)} />
                    {f.label}
                  </label>
                );
              if (f.kind === "color")
                return (
                  <label className="ad-field" key={f.key}>
                    <span>{f.label}</span>
                    <div className="ad-color">
                      <input type="color" value={String(v)} onChange={(e) => set(f.key, e.target.value as never)} />
                      <input type="text" value={String(v)} onChange={(e) => set(f.key, e.target.value as never)} />
                    </div>
                  </label>
                );
              return (
                <label className={`ad-field ${cls}`} key={f.key}>
                  <span>
                    {f.label} {f.help && <small>{f.help}</small>}
                  </span>
                  {f.kind === "area" ? (
                    <textarea value={String(v)} onChange={(e) => set(f.key, e.target.value as never)} />
                  ) : (
                    <input type="text" value={String(v)} onChange={(e) => set(f.key, e.target.value as never)} />
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <div>
        <button className="ad-btn ad-primary" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Stats & social links (simple lists) ---------------- */

function ListTab({
  title,
  help,
  initial,
  fields,
  endpoint,
  notify,
  blank,
}: {
  title: string;
  help: string;
  initial: Pair[];
  fields: { key: string; label: string; placeholder?: string }[];
  endpoint: string;
  notify: Notify;
  blank: Pair;
}) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(false);

  const move = (i: number, d: number) =>
    setItems((p) => {
      const j = i + d;
      if (j < 0 || j >= p.length) return p;
      const n = [...p];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  async function save() {
    setBusy(true);
    try {
      const res = await api<{ items: Pair[] }>(endpoint, "PUT", { items });
      setItems(res.items);
      notify("Saved. Your live site is updated.");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not save", false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ad-stack">
      <div>
        <h2 className="ad-h">{title}</h2>
        <p className="ad-sub">{help}</p>
      </div>
      {items.map((it, i) => (
        <div className="ad-item" key={i}>
          <div className="ad-item-head">
            <b>
              #{i + 1} {it[fields[0].key] || ""}
            </b>
            <button className="ad-btn ad-icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
              ↑
            </button>
            <button className="ad-btn ad-icon" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">
              ↓
            </button>
            <button className="ad-btn ad-danger" onClick={() => setItems((p) => p.filter((_, x) => x !== i))}>
              Remove
            </button>
          </div>
          <div className="ad-grid">
            {fields.map((f) => (
              <label className="ad-field" key={f.key}>
                <span>{f.label}</span>
                <input
                  type="text"
                  value={it[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setItems((p) => p.map((x, n) => (n === i ? { ...x, [f.key]: e.target.value } : x)))}
                />
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className="ad-row">
        <button className="ad-btn" onClick={() => setItems((p) => [...p, { ...blank }])}>
          + Add
        </button>
        <button className="ad-btn ad-primary" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Folders (categories) ---------------- */

function CategoryCard({
  c,
  index,
  total,
  count,
  onSaved,
  onDeleted,
  onMove,
  notify,
}: {
  c: CategoryDTO;
  index: number;
  total: number;
  count: number;
  onSaved: (c: CategoryDTO) => void;
  onDeleted: (id: number) => void;
  onMove: (d: number) => void;
  notify: Notify;
}) {
  const [d, setD] = useState(c);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(d) !== JSON.stringify(c);

  async function save() {
    setBusy(true);
    try {
      const res = await api<{ category: CategoryDTO }>(`/api/admin/categories/${c.id}`, "PUT", d);
      setD(res.category);
      onSaved(res.category);
      notify("Folder saved.");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not save", false);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete the folder "${c.name}" and its ${count} project(s)? This cannot be undone.`)) return;
    try {
      await api(`/api/admin/categories/${c.id}`, "DELETE");
      onDeleted(c.id);
      notify("Folder deleted.");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not delete", false);
    }
  }

  return (
    <div className="ad-item">
      <div className="ad-item-head">
        <i className="ad-swatch" style={{ background: d.color1 }} />
        <b>{c.name}</b>
        <span className="ad-pill">{count} projects</span>
        {!c.published && <span className="ad-pill">hidden</span>}
        <button className="ad-btn ad-icon" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up">
          ↑
        </button>
        <button className="ad-btn ad-icon" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="Move down">
          ↓
        </button>
      </div>
      <div className="ad-grid">
        <label className="ad-field">
          <span>Folder name</span>
          <input type="text" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
        </label>
        <label className="ad-field">
          <span>
            Page address <small>(/{d.slug})</small>
          </span>
          <input type="text" value={d.slug} onChange={(e) => setD({ ...d, slug: e.target.value })} />
        </label>
        <label className="ad-field wide">
          <span>Short description</span>
          <input type="text" value={d.intro} onChange={(e) => setD({ ...d, intro: e.target.value })} />
        </label>
        <label className="ad-field">
          <span>Folder main color</span>
          <div className="ad-color">
            <input type="color" value={d.color1} onChange={(e) => setD({ ...d, color1: e.target.value })} />
            <input type="text" value={d.color1} onChange={(e) => setD({ ...d, color1: e.target.value })} />
          </div>
        </label>
        <label className="ad-field">
          <span>Folder back color (darker shade)</span>
          <div className="ad-color">
            <input type="color" value={d.color2} onChange={(e) => setD({ ...d, color2: e.target.value })} />
            <input type="text" value={d.color2} onChange={(e) => setD({ ...d, color2: e.target.value })} />
          </div>
        </label>
        <label className="ad-check">
          <input type="checkbox" checked={d.published} onChange={(e) => setD({ ...d, published: e.target.checked })} />
          Visible on the site
        </label>
      </div>
      <div className="ad-row" style={{ marginTop: 14 }}>
        <button className="ad-btn ad-primary" onClick={save} disabled={busy || !dirty}>
          {busy ? "Saving…" : dirty ? "Save folder" : "Saved"}
        </button>
        <a className="ad-btn" href={`/${c.slug}`} target="_blank" rel="noreferrer">
          View
        </a>
        <button className="ad-btn ad-danger" onClick={remove}>
          Delete
        </button>
      </div>
    </div>
  );
}

function CategoriesTab({
  categories,
  setCategories,
  projects,
  setProjects,
  notify,
}: {
  categories: CategoryDTO[];
  setCategories: React.Dispatch<React.SetStateAction<CategoryDTO[]>>;
  projects: ProjectDTO[];
  setProjects: React.Dispatch<React.SetStateAction<ProjectDTO[]>>;
  notify: Notify;
}) {
  const [name, setName] = useState("");

  async function add() {
    if (!name.trim()) return;
    try {
      const res = await api<{ category: CategoryDTO }>("/api/admin/categories", "POST", { name });
      setCategories((p) => [...p, res.category]);
      setName("");
      notify("Folder added.");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not add", false);
    }
  }

  async function move(i: number, d: number) {
    const j = i + d;
    if (j < 0 || j >= categories.length) return;
    const next = [...categories];
    [next[i], next[j]] = [next[j], next[i]];
    setCategories(next);
    try {
      await api("/api/admin/reorder", "POST", { type: "category", ids: next.map((c) => c.id) });
    } catch (e) {
      setCategories(categories);
      notify(e instanceof Error ? e.message : "Could not reorder", false);
    }
  }

  return (
    <div className="ad-stack">
      <div>
        <h2 className="ad-h">Folders</h2>
        <p className="ad-sub">Each folder on the homepage opens its own gallery. Rename them, recolor them (the images on a folder come from its first 3 projects with an image), reorder them, hide or delete them.</p>
      </div>
      <div className="ad-card ad-row">
        <input
          style={{ flex: 1, minWidth: 200, border: "1px solid #d9d7d1", borderRadius: 10, padding: "10px 12px", font: "inherit" }}
          type="text"
          placeholder="New folder name, e.g. Illustration"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className="ad-btn ad-primary" onClick={add}>
          + Add folder
        </button>
      </div>
      {categories.map((c, i) => (
        <CategoryCard
          key={c.id}
          c={c}
          index={i}
          total={categories.length}
          count={projects.filter((p) => p.categoryId === c.id).length}
          notify={notify}
          onMove={(d) => move(i, d)}
          onSaved={(u) => setCategories((p) => p.map((x) => (x.id === u.id ? u : x)))}
          onDeleted={(id) => {
            setCategories((p) => p.filter((x) => x.id !== id));
            setProjects((p) => p.filter((x) => x.categoryId !== id));
          }}
        />
      ))}
    </div>
  );
}

/* ---------------- Projects ---------------- */

function ProjectCard({
  p,
  categories,
  index,
  total,
  onSaved,
  onDeleted,
  onMove,
  notify,
}: {
  p: ProjectDTO;
  categories: CategoryDTO[];
  index: number;
  total: number;
  onSaved: (p: ProjectDTO) => void;
  onDeleted: (id: number) => void;
  onMove: (d: number) => void;
  notify: Notify;
}) {
  const [d, setD] = useState(p);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(d) !== JSON.stringify(p);

  async function save() {
    setBusy(true);
    try {
      const res = await api<{ project: ProjectDTO }>(`/api/admin/projects/${p.id}`, "PUT", d);
      setD(res.project);
      onSaved(res.project);
      notify("Project saved.");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not save", false);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try {
      await api(`/api/admin/projects/${p.id}`, "DELETE");
      onDeleted(p.id);
      notify("Project deleted.");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not delete", false);
    }
  }

  return (
    <div className="ad-item">
      <div className="ad-item-head">
        <b>{p.title}</b>
        {!p.published && <span className="ad-pill">hidden</span>}
        <button className="ad-btn ad-icon" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up">
          ↑
        </button>
        <button className="ad-btn ad-icon" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="Move down">
          ↓
        </button>
      </div>
      <div className="ad-grid">
        <label className="ad-field">
          <span>Title</span>
          <input type="text" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
        </label>
        <label className="ad-field">
          <span>
            Small label <small>(year, client, tag…)</small>
          </span>
          <input type="text" value={d.meta} onChange={(e) => setD({ ...d, meta: e.target.value })} />
        </label>
        <div className="wide">
          <MediaField label="Project image or video" value={d.imageUrl} onChange={(v) => setD({ ...d, imageUrl: v })} notify={notify} allowVideo />
        </div>
        <label className="ad-field wide">
          <span>Description</span>
          <textarea value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} />
        </label>
        <label className="ad-field wide">
          <span>
            "Full preview" link <small>(optional: live site, Behance, PDF…)</small>
          </span>
          <input type="text" value={d.linkUrl} onChange={(e) => setD({ ...d, linkUrl: e.target.value })} placeholder="https://" />
        </label>
        <label className="ad-field">
          <span>Folder</span>
          <select value={d.categoryId} onChange={(e) => setD({ ...d, categoryId: Number(e.target.value) })}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="ad-stack" style={{ gap: 8, justifyContent: "center" }}>
          <label className="ad-check">
            <input type="checkbox" checked={d.tall} onChange={(e) => setD({ ...d, tall: e.target.checked })} />
            Tall (portrait) thumbnail
          </label>
          <label className="ad-check">
            <input type="checkbox" checked={d.published} onChange={(e) => setD({ ...d, published: e.target.checked })} />
            Visible on the site
          </label>
        </div>
      </div>
      <div className="ad-row" style={{ marginTop: 14 }}>
        <button className="ad-btn ad-primary" onClick={save} disabled={busy || !dirty}>
          {busy ? "Saving…" : dirty ? "Save project" : "Saved"}
        </button>
        <button className="ad-btn ad-danger" onClick={remove}>
          Delete
        </button>
      </div>
    </div>
  );
}

function ProjectsTab({
  categories,
  projects,
  setProjects,
  notify,
}: {
  categories: CategoryDTO[];
  projects: ProjectDTO[];
  setProjects: React.Dispatch<React.SetStateAction<ProjectDTO[]>>;
  notify: Notify;
}) {
  const [catId, setCatId] = useState<number | null>(categories[0]?.id ?? null);
  const active = catId !== null && categories.some((c) => c.id === catId) ? catId : categories[0]?.id ?? null;
  const list = projects.filter((p) => p.categoryId === active).sort((a, b) => a.order - b.order);

  async function add() {
    if (active === null) return;
    try {
      const res = await api<{ project: ProjectDTO }>("/api/admin/projects", "POST", { categoryId: active, title: "New project" });
      setProjects((p) => [...p, res.project]);
      notify("Project added. Fill in the details below.");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not add", false);
    }
  }

  async function move(i: number, d: number) {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    const orders = new Map(next.map((p, n) => [p.id, n]));
    const before = projects;
    setProjects((p) => p.map((x) => (orders.has(x.id) ? { ...x, order: orders.get(x.id)! } : x)));
    try {
      await api("/api/admin/reorder", "POST", { type: "project", ids: next.map((p) => p.id) });
    } catch (e) {
      setProjects(before);
      notify(e instanceof Error ? e.message : "Could not reorder", false);
    }
  }

  if (categories.length === 0)
    return <p className="ad-sub">Create a folder first (Folders tab), then add projects to it.</p>;

  return (
    <div className="ad-stack">
      <div>
        <h2 className="ad-h">Projects</h2>
        <p className="ad-sub">Pick a folder, then add, edit, reorder or delete the projects inside it.</p>
      </div>
      <div className="ad-card ad-row">
        <label className="ad-field" style={{ flex: 1, minWidth: 200 }}>
          <span>Folder</span>
          <select value={active ?? ""} onChange={(e) => setCatId(Number(e.target.value))}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({projects.filter((p) => p.categoryId === c.id).length})
              </option>
            ))}
          </select>
        </label>
        <button className="ad-btn ad-primary" style={{ alignSelf: "flex-end" }} onClick={add}>
          + Add project
        </button>
      </div>
      {list.length === 0 && <p className="ad-sub">No projects in this folder yet.</p>}
      {list.map((p, i) => (
        <ProjectCard
          key={p.id + ":" + p.categoryId}
          p={p}
          categories={categories}
          index={i}
          total={list.length}
          notify={notify}
          onMove={(d) => move(i, d)}
          onSaved={(u) => setProjects((all) => all.map((x) => (x.id === u.id ? u : x)))}
          onDeleted={(id) => setProjects((all) => all.filter((x) => x.id !== id))}
        />
      ))}
    </div>
  );
}

/* ---------------- Account ---------------- */

function AccountTab({ email, notify }: { email: string; notify: Notify }) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/admin/password", "POST", { currentPassword: cur, newPassword: next });
      setCur("");
      setNext("");
      notify("Password changed.");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not change password", false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="ad-card ad-stack" style={{ maxWidth: 440 }} onSubmit={save}>
      <div>
        <h2 className="ad-h">Account</h2>
        <p className="ad-sub">
          Signed in as <b>{email}</b>
        </p>
      </div>
      <label className="ad-field">
        <span>Current password</span>
        <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" required />
      </label>
      <label className="ad-field">
        <span>
          New password <small>(at least 10 characters)</small>
        </span>
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={10} required />
      </label>
      <div>
        <button className="ad-btn ad-primary" disabled={busy}>
          {busy ? "Saving…" : "Change password"}
        </button>
      </div>
    </form>
  );
}

/* ---------------- Shell ---------------- */

const TABS = ["Site & profile", "Stats", "Social links", "Folders", "Projects", "Account"] as const;

export default function AdminApp({ initial, email }: { initial: Initial; email: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Site & profile");
  const [categories, setCategories] = useState(initial.categories);
  const [projects, setProjects] = useState(initial.projects);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify: Notify = (text, ok = true) => {
    setToast({ text, ok });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3800);
  };

  return (
    <>
      <div className="ad-top">
        <div className="ad-top-in">
          <h1>Portfolio admin</h1>
          <a className="ad-btn" href="/" target="_blank" rel="noreferrer">
            View live site ↗
          </a>
          <button className="ad-btn" onClick={() => signOut({ callbackUrl: "/login" })}>
            Sign out
          </button>
        </div>
      </div>
      <div className="ad-wrap">
        <div className="ad-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className="ad-tab" onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {tab === "Site & profile" && <SettingsTab initial={initial.settings} notify={notify} />}
        {tab === "Stats" && (
          <ListTab
            title="Stats"
            help="The numbers shown along the top of the page. Use real numbers only."
            initial={initial.stats}
            fields={[
              { key: "value", label: "Number", placeholder: "e.g. 60+" },
              { key: "label", label: "Label", placeholder: "e.g. Projects completed" },
            ]}
            endpoint="/api/admin/stats"
            blank={{ value: "", label: "" }}
            notify={notify}
          />
        )}
        {tab === "Social links" && (
          <ListTab
            title="Social links"
            help="Icons at the bottom of the profile panel. The icon is picked automatically from the link (Facebook, X, Instagram, LinkedIn, YouTube, TikTok, WhatsApp, GitHub, Behance, Fiverr, Upwork, Framer…)."
            initial={initial.socials}
            fields={[
              { key: "name", label: "Name", placeholder: "Instagram" },
              { key: "label", label: "Short label (only used if no icon matches)", placeholder: "Ig" },
              { key: "url", label: "Link", placeholder: "https://instagram.com/yourname" },
            ]}
            endpoint="/api/admin/socials"
            blank={{ label: "", name: "", url: "https://" }}
            notify={notify}
          />
        )}
        {tab === "Folders" && (
          <CategoriesTab
            categories={categories}
            setCategories={setCategories}
            projects={projects}
            setProjects={setProjects}
            notify={notify}
          />
        )}
        {tab === "Projects" && (
          <ProjectsTab categories={categories} projects={projects} setProjects={setProjects} notify={notify} />
        )}
        {tab === "Account" && <AccountTab email={email} notify={notify} />}
      </div>
      {toast && (
        <div className={`ad-toast ${toast.ok ? "ok" : "err"}`} role="status">
          {toast.text}
        </div>
      )}
    </>
  );
}
