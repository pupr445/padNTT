"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "Email atau kata sandi salah."
          : signInError.message
      );
      return;
    }

    router.replace(searchParams.get("redirectTo") || "/");
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--surface-0)",
      }}
    >
      <form onSubmit={handleSubmit} className="card" style={{ width: 360, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ marginBottom: 4 }}>
          <p style={{ fontWeight: 600, fontSize: 17, margin: 0 }}>Optimalisasi PAD</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 0" }}>
            Tim Terpadu — Dinas PUPR Provinsi NTT
          </p>
        </div>

        <div>
          <label>Email</label>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@ntt.go.id"
          />
        </div>

        <div>
          <label>Kata sandi</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <p style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? "Masuk..." : "Masuk"}
        </button>

        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
          Akun dibuat oleh Super Admin. Hubungi Sekretariat Tim jika belum punya akses.
        </p>
      </form>
    </div>
  );
}
