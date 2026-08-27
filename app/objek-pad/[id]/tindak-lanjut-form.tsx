"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const jenisOptions = [
  { value: "sosialisasi", label: "Sosialisasi" },
  { value: "pemeriksaan_lapangan", label: "Pemeriksaan lapangan" },
  { value: "penertiban", label: "Penertiban" },
  { value: "tindakan_administratif", label: "Tindakan administratif" },
  { value: "pendampingan_hukum", label: "Pendampingan hukum" },
  { value: "penagihan", label: "Penagihan" },
  { value: "lainnya", label: "Lainnya" },
];

export default function TambahTindakLanjut({ objekPadId }: { objekPadId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ jenis_kegiatan: "sosialisasi", deskripsi: "", pokja: "I", pic: "" });
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.deskripsi.trim()) {
      setError("Deskripsi kegiatan wajib diisi.");
      return;
    }
    setSaving(true);
    setError("");
    const { error: insertError } = await supabase.from("tindak_lanjut").insert({
      objek_pad_id: objekPadId,
      jenis_kegiatan: form.jenis_kegiatan,
      deskripsi: form.deskripsi.trim(),
      pokja: form.pokja,
      pic: form.pic.trim() || null,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setForm({ jenis_kegiatan: "sosialisasi", deskripsi: "", pokja: "I", pic: "" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        + Catat tindak lanjut
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="stack">
      <div className="form-grid-2">
        <div className="field">
          <label>Jenis kegiatan</label>
          <select value={form.jenis_kegiatan} onChange={(e) => setForm({ ...form, jenis_kegiatan: e.target.value })}>
            {jenisOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Pokja</label>
          <select value={form.pokja} onChange={(e) => setForm({ ...form, pokja: e.target.value })}>
            <option value="I">Pokja I</option>
            <option value="II">Pokja II</option>
            <option value="III">Pokja III</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label>Deskripsi</label>
        <textarea
          rows={2}
          value={form.deskripsi}
          onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
          placeholder="Contoh: Survei lapangan dan verifikasi objek utilitas jalan"
        />
      </div>
      <div className="field">
        <label>Penanggung jawab (PIC)</label>
        <input value={form.pic} onChange={(e) => setForm({ ...form, pic: e.target.value })} placeholder="Nama petugas" />
      </div>
      {error && <p className="error-text">{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>Batal</button>
      </div>
    </form>
  );
}
