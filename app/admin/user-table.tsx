"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABEL, type Profile, type Role } from "@/lib/types";

const roleOptions = Object.keys(ROLE_LABEL) as Role[];

export default function UserTable({ profiles, currentUserId }: { profiles: Profile[]; currentUserId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<{ id: string; message: string } | null>(null);

  async function saveField(id: string, patch: Partial<Pick<Profile, "role" | "pokja" | "aktif" | "instansi">>) {
    setSavingId(id);
    setErrorId(null);
    const { error } = await supabase.from("profiles").update(patch).eq("id", id);
    setSavingId(null);
    if (error) {
      setErrorId({ id, message: error.message });
      return;
    }
    router.refresh();
  }

  if (profiles.length === 0) {
    return <div className="empty-state">Belum ada akun.</div>;
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "auto" }}>
      <table>
        <thead>
          <tr>
            <th style={{ padding: "12px 10px 12px 16px" }}>Nama</th>
            <th>Email</th>
            <th>Role</th>
            <th>Pokja</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.id}>
              <td style={{ padding: "10px 10px 10px 16px" }}>
                <span style={{ fontWeight: 500 }}>{p.nama_lengkap}</span>
                {p.id === currentUserId && (
                  <span className="badge" style={{ marginLeft: 8, background: "var(--marine-tint)", color: "var(--marine-dark)" }}>
                    Anda
                  </span>
                )}
                {p.instansi && <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "2px 0 0" }}>{p.instansi}</p>}
                {errorId?.id === p.id && <p className="error-text" style={{ marginTop: 4 }}>{errorId.message}</p>}
              </td>
              <td className="mono" style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{p.email ?? "-"}</td>
              <td>
                <select
                  value={p.role}
                  disabled={savingId === p.id}
                  onChange={(e) => saveField(p.id, { role: e.target.value as Role })}
                  style={{ minWidth: 170 }}
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  value={p.pokja ?? ""}
                  disabled={savingId === p.id}
                  onChange={(e) => saveField(p.id, { pokja: (e.target.value || null) as "I" | "II" | "III" | null })}
                  style={{ minWidth: 110 }}
                >
                  <option value="">-</option>
                  <option value="I">Pokja I</option>
                  <option value="II">Pokja II</option>
                  <option value="III">Pokja III</option>
                </select>
              </td>
              <td>
                <button
                  className="badge"
                  style={{
                    border: "none",
                    cursor: p.id === currentUserId ? "not-allowed" : "pointer",
                    background: p.aktif ? "var(--status-green-tint)" : "var(--status-black-tint)",
                    color: p.aktif ? "var(--status-green)" : "var(--status-black)",
                  }}
                  disabled={savingId === p.id || p.id === currentUserId}
                  title={p.id === currentUserId ? "Tidak bisa menonaktifkan akun sendiri" : "Klik untuk ubah status"}
                  onClick={() => saveField(p.id, { aktif: !p.aktif })}
                >
                  <span className="status-dot" style={{ background: p.aktif ? "var(--status-green)" : "var(--status-black)" }} />
                  {p.aktif ? "Aktif" : "Nonaktif"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
