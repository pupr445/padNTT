"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { JenisPad } from "@/lib/types";

export default function ObjekPadForm({ jenisPad }: { jenisPad: JenisPad[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    jenis_pad_id: "",
    nama_objek: "",
    kabupaten_kota: "",
    lokasi: "",
  });
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.jenis_pad_id || !form.nama_objek.trim()) {
      setError("Jenis PAD dan nama objek wajib diisi.");
      return;
    }

    setSaving(true);
    const { error: insertError } = await supabase.from("objek_pad").insert({
      jenis_pad_id: form.jenis_pad_id,
      nama_objek: form.nama_objek.trim(),
      kabupaten_kota: form.kabupaten_kota.trim() || null,
      lokasi: form.lokasi.trim() || null,
      status_verifikasi: "proses_verifikasi",
    });
    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setForm({ jenis_pad_id: "", nama_objek: "", kabupaten_kota: "", lokasi: "" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + Tambah objek PAD
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label>Jenis PAD</label>
        <select
          value={form.jenis_pad_id}
          onChange={(e) => setForm({ ...form, jenis_pad_id: e.target.value })}
        >
          <option value="">Pilih jenis</option>
          {jenisPad.map((jp) => (
            <option key={jp.id} value={jp.id}>
              {jp.nama}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Nama objek / wajib retribusi</label>
        <input
          value={form.nama_objek}
          onChange={(e) => setForm({ ...form, nama_objek: e.target.value })}
          placeholder="Contoh: CV Sinar Timur"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label>Kabupaten/kota</label>
          <input
            value={form.kabupaten_kota}
            onChange={(e) => setForm({ ...form, kabupaten_kota: e.target.value })}
            placeholder="Kupang"
          />
        </div>
        <div>
          <label>Lokasi</label>
          <input
            value={form.lokasi}
            onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
            placeholder="Ruas jalan / titik lokasi"
          />
        </div>
      </div>

      {error && <p style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>{error}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>
          Batal
        </button>
      </div>
    </form>
  );
}
