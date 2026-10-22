"use client";

import { useEffect, useState } from "react";

/**
 * Intro paragraph in two tones: the first part is dark, the rest is grey,
 * and the grey words darken as the visitor scrolls (like the reference).
 */
export default function RevealText({ text }: { text: string }) {
  const [progress, setProgress] = useState(0.58);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }
    const update = () => setProgress(0.58 + 0.42 * Math.min(1, window.scrollY / 320));
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const tokens = text.split(/(\s+)/);
  const total = tokens.filter((t) => t.trim()).length;
  let seen = 0;

  return (
    <p className="intro">
      {tokens.map((t, i) => {
        if (!t.trim()) return t;
        const on = seen < Math.round(progress * total);
        seen += 1;
        return (
          <span key={i} className={on ? "on" : undefined}>
            {t}
          </span>
        );
      })}
    </p>
  );
}
