"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { rupiah } from "@/lib/status";
import type { PadTariff } from "@/lib/types";

// ---------------------------------------------------------
// 1. Catat potensi -- Pokja I mengisi parameter (misal panjang meter/volume)
//    dari tarif yang berlaku, estimasi dihitung otomatis di sini (client)
//    lalu dikirim sebagai angka final -- bukan dihitung ulang di server,
//    supaya histori potensi tidak berubah kalau tarifnya diedit belakangan.
// ---------------------------------------------------------
export function PotensiForm({
  objekPadId,
  tarifList,
  canManage,
}: {
  objekPadId: string;
  tarifList: PadTariff[];
  canManage: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const now = new Date();
  const [form, setForm] = useState({
    tarif_id: tarifList[0]?.id ?? "",
    periode_tahun: String(now.getFullYear()),
    parameter_jumlah: "",
    catatan: "",
  });

  if (!canManage) return null;

  const tarifTerpilih = tarifList.find((t) => t.id === form.tarif_id);
  const estimasi = tarifTerpilih && form.parameter_jumlah ? Number(form.parameter_jumlah) * tarifTerpilih.tarif_rp : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!tarifTerpilih) {
      setError("Pilih tarif yang berlaku dulu (belum ada tarif untuk jenis PAD ini -- tambahkan lewat pengelolaan tarif).");
      return;
    }
    if (!form.parameter_jumlah || Number(form.parameter_jumlah) < 0) {
      setError(`Isi parameter (${tarifTerpilih.satuan}) dengan angka yang valid.`);
      return;
    }
    setSaving(true);
    const { error: insertError } = await supabase.from("potensi_pad").insert({
      objek_pad_id: objekPadId,
      tarif_id: tarifTerpilih.id,
      periode_tahun: Number(form.periode_tahun),
      parameter_jumlah: Number(form.parameter_jumlah),
      tarif_rp_saat_itu: tarifTerpilih.tarif_rp,
      estimasi_potensi: estimasi,
      catatan: form.catatan.trim() || null,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setForm({ tarif_id: tarifList[0]?.id ?? "", periode_tahun: String(now.getFullYear()), parameter_jumlah: "", catatan: "" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)} disabled={tarifList.length === 0}>
        + Catat potensi
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="stack card" style={{ marginTop: 10 }}>
      {tarifList.length === 0 ? (
        <p className="error-text">Belum ada tarif aktif untuk jenis PAD objek ini.</p>
      ) : (
        <>
          <div className="form-grid-2">
            <div className="field">
              <label>Tarif berlaku</label>
              <select value={form.tarif_id} onChange={(e) => setForm({ ...form, tarif_id: e.target.value })}>
                {tarifList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama_tarif} ({rupiah(t.tarif_rp)}/{t.satuan})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Tahun periode</label>
              <input
                className="mono"
                value={form.periode_tahun}
                onChange={(e) => setForm({ ...form, periode_tahun: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label>Parameter ({tarifTerpilih?.satuan ?? "-"}) &middot; {tarifTerpilih?.dasar_pengenaan}</label>
            <input
              className="mono"
              value={form.parameter_jumlah}
              onChange={(e) => setForm({ ...form, parameter_jumlah: e.target.value })}
              placeholder="Contoh: 120"
            />
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: 0 }}>
            Estimasi potensi: <strong className="mono">{rupiah(estimasi)}</strong>
          </p>
          <div className="field">
            <label>Catatan (opsional)</label>
            <input value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} />
          </div>
        </>
      )}
      {error && <p className="error-text">{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="btn btn-primary" disabled={saving || tarifList.length === 0}>
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>Batal</button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------
// 2. Tetapkan tagihan (penetapan_pad) -- fungsi Bapenda, bisa dari
//    potensi yang sudah dicatat atau langsung isi manual.
// ---------------------------------------------------------
export function PenetapanForm({
  objekPadId,
  potensiOptions,
  canManage,
}: {
  objekPadId: string;
  potensiOptions: { id: string; label: string; estimasi: number }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const now = new Date();
  const defaultJatuhTempo = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString().slice(0, 10);
  const [form, setForm] = useState({
    potensi_pad_id: "",
    nomor_penetapan: "",
    periode_tahun: String(now.getFullYear()),
    jumlah_ditetapkan: "",
    jatuh_tempo: defaultJatuhTempo,
  });

  if (!canManage) return null;

  function pilihPotensi(id: string) {
    const p = potensiOptions.find((o) => o.id === id);
    setForm((f) => ({ ...f, potensi_pad_id: id, jumlah_ditetapkan: p ? String(p.estimasi) : f.jumlah_ditetapkan }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.jumlah_ditetapkan || Number(form.jumlah_ditetapkan) <= 0) {
      setError("Jumlah yang ditetapkan wajib diisi dan lebih dari 0.");
      return;
    }
    if (!form.jatuh_tempo) {
      setError("Tanggal jatuh tempo wajib diisi.");
      return;
    }
    setSaving(true);
    const { error: insertError } = await supabase.from("penetapan_pad").insert({
      objek_pad_id: objekPadId,
      potensi_pad_id: form.potensi_pad_id || null,
      nomor_penetapan: form.nomor_penetapan.trim() || null,
      periode_tahun: Number(form.periode_tahun),
      jumlah_ditetapkan: Number(form.jumlah_ditetapkan),
      jatuh_tempo: form.jatuh_tempo,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setForm({ potensi_pad_id: "", nomor_penetapan: "", periode_tahun: String(now.getFullYear()), jumlah_ditetapkan: "", jatuh_tempo: defaultJatuhTempo });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + Tetapkan tagihan
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="stack card" style={{ marginTop: 10 }}>
      {potensiOptions.length > 0 && (
        <div className="field">
          <label>Berdasarkan potensi (opsional)</label>
          <select value={form.potensi_pad_id} onChange={(e) => pilihPotensi(e.target.value)}>
            <option value="">-- Isi manual --</option>
            {potensiOptions.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      )}
      <div className="form-grid-2">
        <div className="field">
          <label>Nomor penetapan (opsional)</label>
          <input value={form.nomor_penetapan} onChange={(e) => setForm({ ...form, nomor_penetapan: e.target.value })} placeholder="Contoh: SKRD/001/2026" />
        </div>
        <div className="field">
          <label>Tahun periode</label>
          <input className="mono" value={form.periode_tahun} onChange={(e) => setForm({ ...form, periode_tahun: e.target.value })} />
        </div>
      </div>
      <div className="form-grid-2">
        <div className="field">
          <label>Jumlah ditetapkan (Rp)</label>
          <input className="mono" value={form.jumlah_ditetapkan} onChange={(e) => setForm({ ...form, jumlah_ditetapkan: e.target.value })} placeholder="0" />
        </div>
        <div className="field">
          <label>Jatuh tempo</label>
          <input type="date" value={form.jatuh_tempo} onChange={(e) => setForm({ ...form, jatuh_tempo: e.target.value })} />
        </div>
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

// ---------------------------------------------------------
// 3. Catat pembayaran -- terhadap satu penetapan spesifik. Status
//    penetapan (belum_lunas/sebagian/lunas) dihitung ULANG OTOMATIS
//    di database lewat trigger (lihat schema_08), bukan dihitung di sini,
//    supaya konsisten kalau ada input dari tempat lain juga.
// ---------------------------------------------------------
export function PembayaranForm({ penetapanId, canManage }: { penetapanId: string; canManage: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ jumlah_dibayar: "", tanggal_bayar: new Date().toISOString().slice(0, 10), metode: "transfer" });

  if (!canManage) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.jumlah_dibayar || Number(form.jumlah_dibayar) <= 0) {
      setError("Jumlah dibayar wajib diisi dan lebih dari 0.");
      return;
    }
    setSaving(true);
    const { error: insertError } = await supabase.from("pembayaran_pad").insert({
      penetapan_id: penetapanId,
      jumlah_dibayar: Number(form.jumlah_dibayar),
      tanggal_bayar: form.tanggal_bayar,
      metode: form.metode,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setForm({ jumlah_dibayar: "", tanggal_bayar: new Date().toISOString().slice(0, 10), metode: "transfer" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)} style={{ padding: "3px 8px", fontSize: 11.5 }}>
        + Catat pembayaran
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="stack" style={{ marginTop: 8, padding: 10, background: "var(--marine-tint)", borderRadius: 8 }}>
      <div className="form-grid-2">
        <div className="field">
          <label style={{ fontSize: 11 }}>Jumlah dibayar (Rp)</label>
          <input className="mono" value={form.jumlah_dibayar} onChange={(e) => setForm({ ...form, jumlah_dibayar: e.target.value })} placeholder="0" />
        </div>
        <div className="field">
          <label style={{ fontSize: 11 }}>Tanggal bayar</label>
          <input type="date" value={form.tanggal_bayar} onChange={(e) => setForm({ ...form, tanggal_bayar: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label style={{ fontSize: 11 }}>Metode</label>
        <select value={form.metode} onChange={(e) => setForm({ ...form, metode: e.target.value })}>
          <option value="transfer">Transfer</option>
          <option value="tunai">Tunai</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </div>
      {error && <p className="error-text" style={{ fontSize: 11.5 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: "4px 10px", fontSize: 12 }}>
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
        <button type="button" className="btn" onClick={() => setOpen(false)} style={{ padding: "4px 10px", fontSize: 12 }}>Batal</button>
      </div>
    </form>
  );
}
