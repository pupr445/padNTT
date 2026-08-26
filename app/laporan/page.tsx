import { createServerSupabase } from "@/lib/supabase/server";
import LaporanForm from "./form";

export const revalidate = 0;

async function getData() {
  const db = await createServerSupabase();
  const { data: laporan } = await db.from("laporan_berkala").select("*").order("created_at", { ascending: false });
  const { data: jenisPad } = await db.from("jenis_pad").select("*");
  const { data: targetRealisasi } = await db.from("target_realisasi").select("*");
  return { laporan: laporan ?? [], jenisPad: jenisPad ?? [], targetRealisasi: targetRealisasi ?? [] };
}

function rupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default async function LaporanPage() {
  const { laporan, jenisPad, targetRealisasi } = await getData();

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 4px" }}>Laporan berkala</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "0 0 1.5rem" }}>
        Laporan Pokja III kepada Ketua Tim / Gubernur, mencakup capaian PAD dan rekomendasi kebijakan
      </p>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>Ringkasan capaian saat ini (otomatis)</p>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--text-secondary)" }}>
              <th style={{ padding: "4px 0" }}>Jenis PAD</th>
              <th>Target</th>
              <th>Realisasi</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {jenisPad.map((jp) => {
              const rows = targetRealisasi.filter((r) => r.jenis_pad_id === jp.id);
              const target = rows.reduce((s, r) => s + Number(r.target_rp), 0);
              const realisasi = rows.reduce((s, r) => s + Number(r.realisasi_rp), 0);
              const persen = target > 0 ? Math.round((realisasi / target) * 100) : 0;
              return (
                <tr key={jp.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "6px 0" }}>{jp.nama}</td>
                  <td>{rupiah(target)}</td>
                  <td>{rupiah(realisasi)}</td>
                  <td>{persen}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <LaporanForm />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {laporan.map((l) => (
          <div key={l.id} className="card">
            <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{l.judul}</p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0" }}>{l.ringkasan}</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
              Periode {l.periode} · Pokja {l.pokja ?? "-"} · {new Date(l.created_at).toLocaleDateString("id-ID")}
            </p>
          </div>
        ))}
        {laporan.length === 0 && <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Belum ada laporan tersimpan.</p>}
      </div>
    </div>
  );
}
