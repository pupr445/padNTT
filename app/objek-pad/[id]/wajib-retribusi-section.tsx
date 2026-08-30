"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { WajibRetribusi } from "@/lib/types";

export default function WajibRetribusiSection({
  objekPadId,
  wajibRetribusi,
  canManage,
}: {
  objekPadId: string;
  wajibRetribusi: WajibRetribusi | null;
  canManage: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nama: wajibRetribusi?.nama ?? "",
    jenis_wajib: wajibRetribusi?.jenis_wajib ?? "perorangan",
    nik_npwp: wajibRetribusi?.nik_npwp ?? "",
    alamat: wajibRetribusi?.alamat ?? "",
    kontak: wajibRetribusi?.kontak ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.nama.trim()) {
      setError("Nama wajib retribusi wajib diisi.");
      return;
    }
    setSaving(true);

    if (wajibRetribusi) {
      // Sudah tertaut -- update baris wajib_retribusi yang ada.
      const { error: updateError } = await supabase
        .from("wajib_retribusi")
        .update({
          nama: form.nama.trim(),
          jenis_wajib: form.jenis_wajib,
          nik_npwp: form.nik_npwp.trim() || null,
          alamat: form.alamat.trim() || null,
          kontak: form.kontak.trim() || null,
        })
        .eq("id", wajibRetribusi.id);
      setSaving(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      // Belum tertaut -- buat baris baru, lalu tautkan ke objek_pad ini.
      const { data: created, error: insertError } = await supabase
        .from("wajib_retribusi")
        .insert({
          nama: form.nama.trim(),
          jenis_wajib: form.jenis_wajib,
          nik_npwp: form.nik_npwp.trim() || null,
          alamat: form.alamat.trim() || null,
          kontak: form.kontak.trim() || null,
        })
        .select("id")
        .single();
      if (insertError || !created) {
        setSaving(false);
        setError(insertError?.message ?? "Gagal membuat data wajib retribusi.");
        return;
      }
      const { error: linkError } = await supabase
        .from("objek_pad")
        .update({ wajib_retribusi_id: created.id })
        .eq("id", objekPadId);
      setSaving(false);
      if (linkError) {
        setError(linkError.message);
        return;
      }
    }

    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="card" style={{ marginBottom: 20 }}>
        <p className="section-label">Wajib retribusi</p>
        {wajibRetribusi ? (
          <div style={{ fontSize: 13, lineHeight: 1.7 }}>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {wajibRetribusi.nama} <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>({wajibRetribusi.jenis_wajib ?? "-"})</span>
            </p>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>NIK/NPWP: {wajibRetribusi.nik_npwp ?? "-"}</p>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>{wajibRetribusi.alamat ?? "-"}</p>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>Kontak: {wajibRetribusi.kontak ?? "-"}</p>
          </div>
        ) : (
          <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
            Belum ditautkan. Dokumen resmi (SKRD/kwitansi) butuh data ini supaya tidak kosong nama wajib pajaknya.
          </p>
        )}
        {canManage && (
          <button type="button" className="btn" style={{ marginTop: 10 }} onClick={() => setEditing(true)}>
            {wajibRetribusi ? "Ubah data" : "+ Tautkan wajib retribusi"}
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card stack" style={{ marginBottom: 20 }}>
      <p className="section-label">Wajib retribusi</p>
      <div className="form-grid-2">
        <div className="field">
          <label>Nama</label>
          <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama perorangan / badan usaha" />
        </div>
        <div className="field">
          <label>Jenis</label>
          <select value={form.jenis_wajib} onChange={(e) => setForm({ ...form, jenis_wajib: e.target.value })}>
            <option value="perorangan">Perorangan</option>
            <option value="badan_usaha">Badan usaha</option>
          </select>
        </div>
      </div>
      <div className="form-grid-2">
        <div className="field">
          <label>NIK / NPWP</label>
          <input className="mono" value={form.nik_npwp} onChange={(e) => setForm({ ...form, nik_npwp: e.target.value })} />
        </div>
        <div className="field">
          <label>Kontak</label>
          <input value={form.kontak} onChange={(e) => setForm({ ...form, kontak: e.target.value })} placeholder="No. HP / email" />
        </div>
      </div>
      <div className="field">
        <label>Alamat</label>
        <input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} />
      </div>
      {error && <p className="error-text">{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
        <button type="button" className="btn" onClick={() => setEditing(false)}>Batal</button>
      </div>
    </form>
  );
}
