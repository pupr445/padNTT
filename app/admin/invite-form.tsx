"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteUser } from "@/lib/actions/admin";
import { ROLE_LABEL, type Role } from "@/lib/types";

const roleOptions = Object.keys(ROLE_LABEL) as Role[];

export default function InviteForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    email: "",
    nama_lengkap: "",
    role: "viewer" as Role,
    pokja: "",
    instansi: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    const result = await inviteUser({
      email: form.email,
      nama_lengkap: form.nama_lengkap,
      role: form.role,
      pokja: (form.pokja || null) as "I" | "II" | "III" | null,
      instansi: form.instansi || null,
    });

    setSaving(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setSuccess(`Undangan terkirim ke ${form.email}. Minta mereka cek inbox (dan folder spam) untuk link set password.`);
    setForm({ email: "", nama_lengkap: "", role: "viewer", pokja: "", instansi: "" });
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + Undang anggota baru
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card stack">
      <div className="form-grid-2">
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="nama@ntt.go.id"
          />
        </div>
        <div className="field">
          <label>Nama lengkap</label>
          <input
            required
            value={form.nama_lengkap}
            onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
            placeholder="Sesuai lampiran SK"
          />
        </div>
      </div>

      <div className="form-grid-2">
        <div className="field">
          <label>Role</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            {roleOptions.map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Pokja (kalau relevan)</label>
          <select value={form.pokja} onChange={(e) => setForm({ ...form, pokja: e.target.value })}>
            <option value="">-- Tidak ada --</option>
            <option value="I">Pokja I</option>
            <option value="II">Pokja II</option>
            <option value="III">Pokja III</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label>Instansi (opsional)</label>
        <input
          value={form.instansi}
          onChange={(e) => setForm({ ...form, instansi: e.target.value })}
          placeholder="Contoh: Bapenda Provinsi NTT"
        />
      </div>

      {error && <p className="error-text">{error}</p>}
      {success && <p style={{ fontSize: 12.5, color: "var(--status-green)", margin: 0 }}>{success}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Mengirim undangan..." : "Kirim undangan"}
        </button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>
          Batal
        </button>
      </div>
    </form>
  );
}
