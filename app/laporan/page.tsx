import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { canCreateLaporan } from "@/lib/permissions";
import { ROLE_LABEL } from "@/lib/types";
import LaporanForm from "./form";
import { rupiah } from "@/lib/status";

export const revalidate = 0;

async function getData() {
  const db = await createServerSupabase();
  const { data: laporan } = await db.from("laporan_berkala").select("*").order("created_at", { ascending: false });
  const { data: jenisPad } = await db.from("jenis_pad").select("*");
  const { data: targetRealisasi } = await db.from("target_realisasi").select("*");
  return { laporan: laporan ?? [], jenisPad: jenisPad ?? [], targetRealisasi: targetRealisasi ?? [] };
}

export default async function LaporanPage() {
  const [{ laporan, jenisPad, targetRealisasi }, profile] = await Promise.all([getData(), getCurrentProfile()]);

  const canCreate = canCreateLaporan(profile?.role);
  const pokjaOptions: Array<"I" | "II" | "III"> =
    profile?.role === "pokja1_ketua" ? ["I"] : profile?.role === "pokja2_ketua" ? ["II"] : ["I", "II", "III"];
  const roleLabel = profile ? ROLE_LABEL[profile.role] : "-";

  return (
    <div>
      <p className="page-eyebrow">Pokja III &middot; Monitoring & evaluasi</p>
      <h1 className="page-title">Laporan berkala</h1>
      <p className="page-subtitle">
        Laporan kepada Ketua Tim / Gubernur, mencakup capaian PAD, kendala, dan rekomendasi kebijakan.
      </p>

      <div className="card" style={{ marginBottom: 22 }}>
        <p className="section-label">Ringkasan capaian saat ini (otomatis)</p>
        <table>
          <thead>
            <tr>
              <th>Jenis PAD</th>
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
                <tr key={jp.id}>
                  <td>{jp.nama}</td>
                  <td className="mono">{rupiah(target)}</td>
                  <td className="mono">{rupiah(realisasi)}</td>
                  <td className="mono">{persen}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {jenisPad.length === 0 && <div className="empty-state">Belum ada data jenis PAD.</div>}
      </div>

      <div style={{ marginBottom: 22 }}>
        <LaporanForm
          canCreate={canCreate}
          pokjaOptions={pokjaOptions}
          roleLabel={roleLabel}
          namaDefault={profile?.nama_lengkap ?? ""}
        />
      </div>

      <div className="stack">
        {laporan.map((l) => (
          <div key={l.id} className="card">
            <p style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>{l.judul}</p>
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "6px 0" }}>{l.ringkasan}</p>
            <p className="mono" style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
              Periode {l.periode} &middot; Pokja {l.pokja ?? "-"} &middot; {new Date(l.created_at).toLocaleDateString("id-ID")}
            </p>
          </div>
        ))}
        {laporan.length === 0 && <div className="empty-state">Belum ada laporan tersimpan.</div>}
      </div>
    </div>
  );
}
