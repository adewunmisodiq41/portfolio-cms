import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center", padding: 24 }}>
      <div>
        <h1 style={{ fontSize: 48, letterSpacing: "-.03em" }}>404</h1>
        <p style={{ color: "#6f6e6a", margin: "8px 0 24px" }}>That page doesn’t exist.</p>
        <Link href="/" className="btn">
          Back home
        </Link>
      </div>
    </div>
  );
}
