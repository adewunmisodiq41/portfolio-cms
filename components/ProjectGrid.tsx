"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ProjectDTO } from "@/lib/types";
import { isVideoUrl } from "@/lib/utils";

function Media({
  project,
  c1,
  c2,
  tall,
  full,
}: {
  project: ProjectDTO;
  c1: string;
  c2: string;
  tall?: boolean;
  /** true in the preview window: videos get controls and play */
  full?: boolean;
}) {
  const gid = "g" + useId().replace(/[^a-zA-Z0-9]/g, "");
  if (project.imageUrl && isVideoUrl(project.imageUrl)) {
    if (full) {
      return (
        <video
          key={project.imageUrl}
          src={project.imageUrl}
          controls
          autoPlay
          playsInline
          preload="auto"
          aria-label={project.title}
        />
      );
    }
    // In the gallery: show the video's first frame with a play badge; it plays in the preview window.
    return (
      <>
        <video src={`${project.imageUrl}#t=0.1`} muted playsInline preload="metadata" tabIndex={-1} aria-hidden="true" />
        <span className="play" aria-hidden="true" />
      </>
    );
  }
  if (project.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={project.imageUrl} alt={project.title} loading="lazy" />;
  }
  const w = tall ? 600 : 800;
  const h = tall ? 800 : 600;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#${gid})`} />
      <circle cx={w * 0.75} cy={h * 0.28} r={w * 0.18} fill="#fff" opacity=".22" />
      <rect x={w * 0.12} y={h * 0.58} width={w * 0.5} height={h * 0.08} rx={h * 0.04} fill="#fff" opacity=".35" />
      <rect x={w * 0.12} y={h * 0.7} width={w * 0.34} height={h * 0.05} rx={h * 0.025} fill="#fff" opacity=".22" />
    </svg>
  );
}

export default function ProjectGrid({
  projects,
  c1,
  c2,
}: {
  projects: ProjectDTO[];
  c1: string;
  c2: string;
}) {
  const [open, setOpen] = useState<ProjectDTO | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      trigger.current?.focus();
    };
  }, [open]);

  if (projects.length === 0) return <p className="empty">No projects in this folder yet.</p>;

  return (
    <>
      <div className="grid">
        {projects.map((p) => (
          <button
            key={p.id}
            className={`card${p.tall ? " tall" : ""}`}
            onClick={(e) => {
              trigger.current = e.currentTarget;
              setOpen(p);
            }}
            aria-label={`Preview ${p.title}`}
          >
            <div className="thumb">
              <Media project={p} c1={c1} c2={c2} tall={p.tall} />
            </div>
            <div className="meta">
              <b>{p.title}</b>
              <em>{p.meta}</em>
            </div>
          </button>
        ))}
      </div>

      {open && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-label={`${open.title} preview`}
          onClick={(e) => e.target === e.currentTarget && setOpen(null)}
        >
          <div className="sheetwrap">
            <button ref={closeRef} className="close" onClick={() => setOpen(null)} aria-label="Close preview">
              ✕
            </button>
            <div className="sheet">
              <div className="img">
                <Media project={open} c1={c1} c2={c2} full />
              </div>
              <div className="row">
                <div>
                  <h2>{open.title}</h2>
                  {open.description && <p>{open.description}</p>}
                </div>
                {open.linkUrl && (
                  <a
                    className="btn"
                    href={open.linkUrl}
                    {...(/^https?:/i.test(open.linkUrl) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    Full preview
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
