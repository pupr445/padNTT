"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { queueMutation, isLikelyNetworkError } from "@/lib/offline-queue";
import { jenisKegiatanOptions, suggestDeadline, type JenisKegiatan } from "@/lib/workflow-pokja";

export default function TambahTindakLanjut({
  objekPadId,
  canCreate,
  pokjaOptions,
  roleLabel,
}: {
  objekPadId: string;
  canCreate: boolean;
  pokjaOptions: Array<"I" | "II" | "III">;
  roleLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [queuedMsg, setQueuedMsg] = useState("");
  const [deadlineTouched, setDeadlineTouched] = useState(false);

  const pokjaAwal = pokjaOptions[0] ?? "I";
  const jenisAwal = jenisKegiatanOptions(pokjaAwal)[0]?.value ?? "lainnya";
  const [form, setForm] = useState({
    jenis_kegiatan: jenisAwal,
    deskripsi: "",
    pokja: pokjaAwal,
    pic: "",
    deadline: suggestDeadline(jenisAwal),
  });
  const supabase = createClient();

  if (!canCreate) {
    return (
      <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
        Peran Anda ({roleLabel}) hanya bisa melihat riwayat tindak lanjut objek ini.
      </p>
    );
  }

  const opsiKegiatan = jenisKegiatanOptions(form.pokja);

  function handlePokjaChange(pokja: "I" | "II" | "III") {
    const jenisBaru = jenisKegiatanOptions(pokja)[0]?.value ?? "lainnya";
    setForm((f) => ({
      ...f,
      pokja,
      jenis_kegiatan: jenisBaru,
      deadline: deadlineTouched ? f.deadline : suggestDeadline(jenisBaru),
    }));
  }

  function handleJenisChange(jenis: JenisKegiatan) {
    setForm((f) => ({ ...f, jenis_kegiatan: jenis, deadline: deadlineTouched ? f.deadline : suggestDeadline(jenis) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.deskripsi.trim()) {
      setError("Deskripsi kegiatan wajib diisi.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      objek_pad_id: objekPadId,
      jenis_kegiatan: form.jenis_kegiatan,
      deskripsi: form.deskripsi.trim(),
      pokja: form.pokja,
      pic: form.pic.trim() || null,
      deadline: form.deadline || null,
    };

    let queued = false;
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await queueMutation("tindak_lanjut", payload, form.deskripsi.trim());
        queued = true;
        setQueuedMsg("Tersimpan di perangkat ini (sedang offline) -- akan terkirim otomatis begitu koneksi kembali.");
      } else {
        const { error: insertError } = await supabase.from("tindak_lanjut").insert(payload);
        if (insertError) throw insertError;
      }
    } catch (err: any) {
      if (isLikelyNetworkError(err)) {
        await queueMutation("tindak_lanjut", payload, form.deskripsi.trim());
        queued = true;
        setQueuedMsg("Koneksi terputus -- data tersimpan di perangkat ini, akan terkirim otomatis begitu online.");
      } else {
        setError(err.message ?? "Gagal menyimpan.");
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    setDeadlineTouched(false);
    setForm({
      jenis_kegiatan: jenisAwal,
      deskripsi: "",
      pokja: pokjaAwal,
      pic: "",
      deadline: suggestDeadline(jenisAwal),
    });

    if (queued) {
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
      <button className="btn" onClick={() => setOpen(true)}>
        + Catat tindak lanjut
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="stack">
      <div className="form-grid-2">
        <div className="field">
          <label>Pokja</label>
          <select
            value={form.pokja}
            disabled={pokjaOptions.length === 1}
            onChange={(e) => handlePokjaChange(e.target.value as "I" | "II" | "III")}
          >
            {pokjaOptions.map((p) => (
              <option key={p} value={p}>Pokja {p}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Jenis kegiatan</label>
          <select value={form.jenis_kegiatan} onChange={(e) => handleJenisChange(e.target.value as JenisKegiatan)}>
            {opsiKegiatan.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
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
      <div className="form-grid-2">
        <div className="field">
          <label>Penanggung jawab (PIC)</label>
          <input value={form.pic} onChange={(e) => setForm({ ...form, pic: e.target.value })} placeholder="Nama petugas" />
        </div>
        <div className="field">
          <label>Deadline (SLA)</label>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => {
              setDeadlineTouched(true);
              setForm({ ...form, deadline: e.target.value });
            }}
          />
        </div>
      </div>
      {error && <p className="error-text">{error}</p>}
      {queuedMsg && <p style={{ fontSize: 12.5, color: "var(--status-yellow)" }}>{queuedMsg}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>Batal</button>
      </div>
    </form>
  );
}
