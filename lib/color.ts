const HEX = /^#[0-9a-fA-F]{6}$/;

function rgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mix colour a towards colour b by t (0..1). */
export function mix(a: string, b: string, t: number): string {
  const A = rgb(a);
  const B = rgb(b);
  return (
    "#" +
    A.map((v, i) =>
      Math.round(v + (B[i] - v) * t)
        .toString(16)
        .padStart(2, "0"),
    ).join("")
  );
}

export function luminance(h: string): number {
  const [r, g, b] = rgb(h).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** CSS variables that drive the folder illustration from the two colours stored in the admin. */
export function folderVars(color1: string, color2: string): Record<string, string> {
  const c1 = HEX.test(color1) ? color1 : "#86cdf6";
  const c2 = HEX.test(color2) ? color2 : "#4f9fe3";
  const dark = luminance(c1) < 0.12;
  return {
    "--c1": c1,
    "--c2": c2,
    "--top": mix(c1, "#ffffff", 0.2),
    "--label": dark ? mix(c1, "#ffffff", 0.72) : mix(c1, "#000000", 0.55),
    "--glow": `${c1}66`,
    "--ca": mix(c1, "#000000", 0.5),
    "--cb": mix(c1, "#ffffff", 0.82),
    "--cc": mix(c2, "#ffffff", 0.3),
  };
}
