import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { rupiah, statusMeta, STATUS_META } from "@/lib/status";

export const revalidate = 0;

async function getDashboardData() {
  const db = await createServerSupabase();

  const { data: jenisPad, error: jenisPadError } = await db.from("jenis_pad").select("*");
  const { data: targetRealisasi } = await db.from("target_realisasi").select("*");
  const { data: objekPadAll } = await db.from("objek_pad").select("id, nama_objek, kabupaten_kota, status_verifikasi, created_at");
  const { data: objekPadRecent } = await db
    .from("objek_pad")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);
  const { data: tindakLanjut } = await db
    .from("tindak_lanjut")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);
  const { data: penetapanAktif } = await db
    .from("penetapan_pad")
    .select("jumlah_ditetapkan, jatuh_tempo, status, pembayaran_pad(jumlah_dibayar)")
    .neq("status", "dibatalkan");

  return {
    jenisPad: jenisPad ?? [],
    targetRealisasi: targetRealisasi ?? [],
    objekPadAll: objekPadAll ?? [],
    objekPadRecent: objekPadRecent ?? [],
    tindakLanjut: tindakLanjut ?? [],
    penetapanAktif: penetapanAktif ?? [],
    error: jenisPadError?.message ?? null,
  };
}

export default async function DashboardPage() {
  const { jenisPad, targetRealisasi, objekPadAll, objekPadRecent, tindakLanjut, penetapanAktif, error } = await getDashboardData();

  const totalTarget = targetRealisasi.reduce((sum, r) => sum + Number(r.target_rp), 0);
  const totalRealisasi = targetRealisasi.reduce((sum, r) => sum + Number(r.realisasi_rp), 0);
  const persenTotal = totalTarget > 0 ? Math.round((totalRealisasi / totalTarget) * 100) : 0;

  // Piutang sesungguhnya: sisa (jumlah ditetapkan - total dibayar) dari
  // penetapan yang belum lunas -- bukan lagi "target - realisasi" (itu cuma
  // proksi kekurangan vs target makro, bukan tagihan riil per objek).
  const totalPiutang = penetapanAktif.reduce((sum: number, p: any) => {
    const dibayar = (p.pembayaran_pad ?? []).reduce((s: number, b: any) => s + Number(b.jumlah_dibayar), 0);
    return sum + Math.max(Number(p.jumlah_ditetapkan) - dibayar, 0);
  }, 0);

  const perKabupaten = objekPadAll.reduce((acc: Record<string, number>, o) => {
    const key = o.kabupaten_kota || "Belum diisi";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const kabupatenSorted = Object.entries(perKabupaten).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxKab = Math.max(1, ...kabupatenSorted.map(([, n]) => n));

  const statusCounts = objekPadAll.reduce((acc: Record<string, number>, o) => {
    acc[o.status_verifikasi] = (acc[o.status_verifikasi] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <p className="page-eyebrow">Ringkasan &middot; Tim Terpadu</p>
      <h1 className="page-title">Dashboard optimalisasi PAD</h1>
      <p className="page-subtitle">
        Potensi, realisasi, dan progres inventarisasi Pendapatan Asli Daerah Provinsi NTT
        secara lintas Pokja, diperbarui langsung dari data lapangan.
      </p>

      {error && (
        <div className="card" style={{ borderColor: "var(--status-red)", background: "var(--status-red-tint)", marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--status-red)", margin: 0 }}>Gagal memuat data jenis_pad</p>
          <p className="mono" style={{ fontSize: 12, color: "var(--status-red)", margin: "6px 0 0" }}>{error}</p>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "8px 0 0" }}>
            Jalankan <code>supabase/schema_04_fix_rls_gaps.sql</code> di SQL Editor Supabase.
          </p>
        </div>
      )}

      <div className="grid-cards" style={{ marginBottom: 22 }}>
        <div className="stat-card">
          <p className="stat-label">Total target</p>
          <p className="stat-value mono">{rupiah(totalTarget)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Realisasi penerimaan</p>
          <p className="stat-value mono">{rupiah(totalRealisasi)}</p>
          <p className="stat-delta" style={{ color: "var(--status-green)" }}>{persenTotal}% dari target</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Piutang / tunggakan</p>
          <p className="stat-value mono">{rupiah(totalPiutang)}</p>
          <p className="stat-delta" style={{ color: "var(--text-muted)" }}>dari penetapan belum lunas</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Objek PAD tercatat</p>
          <p className="stat-value">{objekPadAll.length}</p>
          <Link href="/peta" style={{ fontSize: 12, fontWeight: 600 }}>Lihat peta potensi &rarr;</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="card">
          <p className="section-label">Target vs realisasi per jenis PAD</p>
          <div className="stack">
            {jenisPad.map((jp) => {
              const rows = targetRealisasi.filter((r) => r.jenis_pad_id === jp.id);
              const target = rows.reduce((s, r) => s + Number(r.target_rp), 0);
              const realisasi = rows.reduce((s, r) => s + Number(r.realisasi_rp), 0);
              const persen = target > 0 ? Math.round((realisasi / target) * 100) : 0;
              return (
                <div key={jp.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ fontWeight: 500 }}>{jp.nama}</span>
                    <span className="mono" style={{ color: "var(--text-secondary)" }}>{persen}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${Math.min(persen, 100)}%` }} />
                  </div>
                </div>
              );
            })}
            {jenisPad.length === 0 && (
              <div className="empty-state">Belum ada data jenis PAD. Jalankan migrasi skema Supabase.</div>
            )}
          </div>
        </div>

        <div className="card">
          <p className="section-label">Objek berdasarkan kabupaten/kota</p>
          <div className="stack">
            {kabupatenSorted.map(([nama, n]) => (
              <div key={nama}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span>{nama}</span>
                  <span className="mono" style={{ color: "var(--text-secondary)" }}>{n}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${(n / maxKab) * 100}%`, background: "var(--gold)" }} />
                </div>
              </div>
            ))}
            {kabupatenSorted.length === 0 && <div className="empty-state">Belum ada objek PAD tercatat.</div>}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="section-label">Status validasi objek PAD (legenda peta)</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {(Object.keys(STATUS_META) as (keyof typeof STATUS_META)[]).map((key) => {
            const meta = STATUS_META[key];
            return (
              <span key={key} className="badge" style={{ background: meta.tint, color: meta.color }}>
                <span className="status-dot" style={{ background: meta.color }} />
                {meta.label}
                <span className="mono" style={{ opacity: 0.75 }}>&middot; {statusCounts[key] || 0}</span>
              </span>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <p className="section-label">
            Objek PAD terbaru
            <Link href="/objek-pad" style={{ fontSize: 12, fontWeight: 600 }}>Semua &rarr;</Link>
          </p>
          <div className="stack">
            {objekPadRecent.map((o) => {
              const meta = statusMeta(o.status_verifikasi);
              return (
                <Link key={o.id} href={`/objek-pad/${o.id}`} className="card card-link" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 500, margin: 0 }}>{o.nama_objek}</p>
                    <p style={{ fontSize: 11.5, color: "var(--text-secondary)", margin: "2px 0 0" }}>{o.kabupaten_kota ?? "-"}</p>
                  </div>
                  <span className="badge" style={{ background: meta.tint, color: meta.color }}>
                    <span className="status-dot" style={{ background: meta.color }} />
                    {meta.label}
                  </span>
                </Link>
              );
            })}
            {objekPadRecent.length === 0 && <div className="empty-state">Belum ada objek PAD tercatat.</div>}
          </div>
        </div>

        <div>
          <p className="section-label">
            Tindak lanjut terbaru
            <Link href="/tindak-lanjut" style={{ fontSize: 12, fontWeight: 600 }}>Semua &rarr;</Link>
          </p>
          <div className="stack">
            {tindakLanjut.map((t) => (
              <div key={t.id} className="card" style={{ padding: "12px 16px" }}>
                <p style={{ fontSize: 13.5, margin: 0 }}>{t.deskripsi ?? t.jenis_kegiatan}</p>
                <p className="mono" style={{ fontSize: 11, color: "var(--text-muted)", margin: "6px 0 0" }}>
                  Pokja {t.pokja ?? "-"} &middot; {new Date(t.tanggal_kegiatan).toLocaleDateString("id-ID")}
                </p>
              </div>
            ))}
            {tindakLanjut.length === 0 && <div className="empty-state">Belum ada aktivitas tindak lanjut.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
