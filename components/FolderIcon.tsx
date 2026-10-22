import type { CSSProperties } from "react";
import { folderVars } from "@/lib/color";

/** macOS-style folder. Up to three project images peek out of the top; placeholders are tinted cards. */
export default function FolderIcon({
  name,
  color1,
  color2,
  images,
}: {
  name: string;
  color1: string;
  color2: string;
  images: string[];
}) {
  return (
    <div className="fd" style={folderVars(color1, color2) as CSSProperties}>
      <svg className="fd-back" viewBox="0 0 225 190" aria-hidden="true">
        <path d="M0 12A12 12 0 0 1 12 0H80C92 0 96 17 108 17H211A14 14 0 0 1 225 31V174A16 16 0 0 1 209 190H16A16 16 0 0 1 0 174Z" />
      </svg>
      <div className="fd-cards" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`fd-card k${i}`}>
            {images[i] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[i]} alt="" loading="lazy" />
            )}
          </div>
        ))}
      </div>
      <div className="fd-front">
        <span className="fd-label">{name}</span>
      </div>
    </div>
  );
}
