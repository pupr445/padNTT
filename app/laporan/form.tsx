"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LaporanForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ judul: "", periode: "", ringkasan: "", pokja: "III", dibuat_oleh: "" });
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.judul.trim() || !form.periode.trim()) {
      setError("Judul dan periode wajib diisi.");
      return;
    }
    setSaving(true);
    setError("");
    const { error: insertError } = await supabase.from("laporan_berkala").insert({
      judul: form.judul.trim(),
      periode: form.periode.trim(),
      ringkasan: form.ringkasan.trim() || null,
      pokja: form.pokja,
      dibuat_oleh: form.dibuat_oleh.trim() || null,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setForm({ judul: "", periode: "", ringkasan: "", pokja: "III", dibuat_oleh: "" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + Buat laporan
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card stack">
      <div className="form-grid-2">
        <div className="field">
          <label>Judul laporan</label>
          <input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} placeholder="Laporan Triwulan III 2026" />
        </div>
        <div className="field">
          <label>Periode</label>
          <input value={form.periode} onChange={(e) => setForm({ ...form, periode: e.target.value })} placeholder="2026-Q3" />
        </div>
      </div>
      <div className="field">
        <label>Ringkasan</label>
        <textarea rows={3} value={form.ringkasan} onChange={(e) => setForm({ ...form, ringkasan: e.target.value })} placeholder="Capaian, kendala, dan rekomendasi kebijakan" />
      </div>
      <div className="form-grid-2">
        <div className="field">
          <label>Pokja</label>
          <select value={form.pokja} onChange={(e) => setForm({ ...form, pokja: e.target.value })}>
            <option value="I">Pokja I</option>
            <option value="II">Pokja II</option>
            <option value="III">Pokja III</option>
          </select>
        </div>
        <div className="field">
          <label>Dibuat oleh</label>
          <input value={form.dibuat_oleh} onChange={(e) => setForm({ ...form, dibuat_oleh: e.target.value })} placeholder="Nama" />
        </div>
      </div>
      {error && <p className="error-text">{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>Batal</button>
      </div>
    </form>
  );
}
