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
    <div className="login-shell">
      <div className="login-side">
        <div className="login-brand">
          <img src="/brand/logo.png" alt="Logo OPTIMA PAD NTT" className="brand-mark" style={{ width: 40, height: 40, borderRadius: 10 }} />
          <div>
            <div className="brand-name" style={{ fontSize: 19 }}>OPTIMA PAD NTT</div>
            <div className="brand-tag">SK Gubernur 272/KEP/HK/2026</div>
          </div>
        </div>
        <p className="login-slogan">"Dari data lapangan menjadi pendapatan daerah."</p>
        <ul className="login-points">
          <li>Inventarisasi & validasi objek PAD lintas kabupaten/kota</li>
          <li>Peta potensi real-time untuk Pokja I, II, dan III</li>
          <li>Audit trail penuh atas setiap perubahan data</li>
        </ul>
      </div>

      <div className="login-form-wrap">
        <form onSubmit={handleSubmit} className="card login-card">
          <div style={{ marginBottom: 4 }}>
            <p style={{ fontWeight: 700, fontSize: 17, margin: 0, fontFamily: "var(--font-display)" }}>Masuk ke akun Anda</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0" }}>
              Tim Terpadu Optimalisasi PAD, Dinas PUPR Provinsi NTT
            </p>
          </div>

          <div className="field">
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

          <div className="field">
            <label>Kata sandi</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: "center", padding: "10px 14px" }}>
            {loading ? "Memeriksa..." : "Masuk"}
          </button>

          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
            Akun dibuat oleh Super Admin. Hubungi Sekretariat Tim jika belum punya akses.
          </p>
        </form>
      </div>

      <style>{`
        .login-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
        }
        .login-side {
          background: var(--ink);
          color: white;
          padding: 56px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 22px;
        }
        .login-brand { display: flex; align-items: center; gap: 14px; }
        .login-slogan {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 600;
          line-height: 1.3;
          max-width: 420px;
          color: #fff;
          margin: 0;
        }
        .login-points { color: var(--text-on-ink-muted); font-size: 13.5px; line-height: 2; padding-left: 18px; margin: 0; }
        .login-form-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--paper);
          padding: 24px;
        }
        .login-card { width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 16px; }
        @media (max-width: 860px) {
          .login-shell { grid-template-columns: 1fr; }
          .login-side { display: none; }
        }
      `}</style>
    </div>
  );
}
