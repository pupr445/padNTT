"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { queueMutation, isLikelyNetworkError } from "@/lib/offline-queue";
import type { JenisPad } from "@/lib/types";
import { IconMapPin } from "@/lib/icons";

export default function ObjekPadForm({ jenisPad }: { jenisPad: JenisPad[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [queuedMsg, setQueuedMsg] = useState("");
  const [form, setForm] = useState({
    jenis_pad_id: "",
    nama_objek: "",
    kabupaten_kota: "",
    lokasi: "",
    koordinat_lat: "",
    koordinat_lng: "",
  });
  const supabase = createClient();

  function ambilLokasi() {
    if (!navigator.geolocation) {
      setError("Perangkat ini tidak mendukung GPS.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          koordinat_lat: pos.coords.latitude.toFixed(6),
          koordinat_lng: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      () => {
        setError("Gagal mengambil lokasi GPS. Pastikan izin lokasi diaktifkan.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.jenis_pad_id || !form.nama_objek.trim()) {
      setError("Jenis PAD dan nama objek wajib diisi.");
      return;
    }

    setSaving(true);
    const payload = {
      jenis_pad_id: form.jenis_pad_id,
      nama_objek: form.nama_objek.trim(),
      kabupaten_kota: form.kabupaten_kota.trim() || null,
      lokasi: form.lokasi.trim() || null,
      koordinat_lat: form.koordinat_lat ? Number(form.koordinat_lat) : null,
      koordinat_lng: form.koordinat_lng ? Number(form.koordinat_lng) : null,
      status_verifikasi: "proses_verifikasi",
    };

    let queued = false;
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        // Jangan buang waktu nunggu timeout kalau memang sudah jelas offline.
        await queueMutation("objek_pad", payload, form.nama_objek.trim());
        queued = true;
        setQueuedMsg("Tersimpan di perangkat ini (sedang offline) -- akan terkirim otomatis begitu koneksi kembali.");
      } else {
        const { error: insertError } = await supabase.from("objek_pad").insert(payload);
        if (insertError) throw insertError;
      }
    } catch (err: any) {
      if (isLikelyNetworkError(err)) {
        await queueMutation("objek_pad", payload, form.nama_objek.trim());
        queued = true;
        setQueuedMsg("Koneksi terputus -- data tersimpan di perangkat ini, akan terkirim otomatis begitu online.");
      } else {
        setError(err.message ?? "Gagal menyimpan.");
        setSaving(false);
        return;
      }
    }
    setSaving(false);

    setForm({ jenis_pad_id: "", nama_objek: "", kabupaten_kota: "", lokasi: "", koordinat_lat: "", koordinat_lng: "" });

    if (queued) {
      // Beri jeda sebentar biar pesan "tersimpan offline" kebaca dulu.
      setTimeout(() => {
        setOpen(false);
        setQueuedMsg("");
        router.refresh();
      }, 1400);
    } else {
      setOpen(false);
      router.refresh();
    }
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + Tambah objek PAD
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card stack">
      <div className="field">
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

      <div className="field">
        <label>Nama objek / wajib retribusi</label>
        <input
          value={form.nama_objek}
          onChange={(e) => setForm({ ...form, nama_objek: e.target.value })}
          placeholder="Contoh: CV Sinar Timur"
        />
      </div>

      <div className="form-grid-2">
        <div className="field">
          <label>Kabupaten/kota</label>
          <input
            value={form.kabupaten_kota}
            onChange={(e) => setForm({ ...form, kabupaten_kota: e.target.value })}
            placeholder="Kupang"
          />
        </div>
        <div className="field">
          <label>Lokasi</label>
          <input
            value={form.lokasi}
            onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
            placeholder="Ruas jalan / titik lokasi"
          />
        </div>
      </div>

      <div className="field">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ margin: 0 }}>Koordinat GPS (untuk peta potensi)</label>
          <button type="button" className="btn btn-ghost" onClick={ambilLokasi} disabled={locating} style={{ padding: "4px 8px", fontSize: 12 }}>
            <IconMapPin size={13} />
            {locating ? "Mengambil..." : "Ambil lokasi saat ini"}
          </button>
        </div>
        <div className="form-grid-2">
          <input
            className="mono"
            value={form.koordinat_lat}
            onChange={(e) => setForm({ ...form, koordinat_lat: e.target.value })}
            placeholder="Lintang, contoh -10.1772"
          />
          <input
            className="mono"
            value={form.koordinat_lng}
            onChange={(e) => setForm({ ...form, koordinat_lng: e.target.value })}
            placeholder="Bujur, contoh 123.6070"
          />
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}
      {queuedMsg && <p style={{ fontSize: 12.5, color: "var(--status-yellow)" }}>{queuedMsg}</p>}

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
