"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import "../admin/admin.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.ok && !res.error) {
      window.location.href = "/admin";
    } else {
      setError("Wrong email or password.");
      setBusy(false);
    }
  }

  return (
    <div className="ad-login">
      <form className="ad-card ad-login-card" onSubmit={submit}>
        <h1>Admin sign in</h1>
        <p className="ad-muted">Manage everything on your portfolio site.</p>
        <label className="ad-field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </label>
        <label className="ad-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="ad-error" role="alert">{error}</p>}
        <button className="ad-btn ad-primary" disabled={busy} type="submit">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
