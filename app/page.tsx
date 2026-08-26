import { createServerSupabase } from "@/lib/supabase/server";

export const revalidate = 0;

async function getDashboardData() {
  const db = await createServerSupabase();

  const { data: jenisPad } = await db.from("jenis_pad").select("*");
  const { data: targetRealisasi } = await db.from("target_realisasi").select("*");
  const { data: objekPad } = await db
    .from("objek_pad")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);
  const { data: tindakLanjut } = await db
    .from("tindak_lanjut")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  return { jenisPad: jenisPad ?? [], targetRealisasi: targetRealisasi ?? [], objekPad: objekPad ?? [], tindakLanjut: tindakLanjut ?? [] };
}

function rupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    terdaftar: { bg: "var(--success-bg)", text: "var(--success)", label: "Terdaftar" },
    proses_verifikasi: { bg: "var(--warning-bg)", text: "var(--warning)", label: "Verifikasi" },
    menunggak: { bg: "var(--danger-bg)", text: "var(--danger)", label: "Menunggak" },
    belum_terdaftar: { bg: "var(--surface-0)", text: "var(--text-secondary)", label: "Belum terdaftar" },
  };
  const s = map[status] ?? map.belum_terdaftar;
  return (
    <span className="badge" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

export default async function DashboardPage() {
  const { jenisPad, targetRealisasi, objekPad, tindakLanjut } = await getDashboardData();

  const totalTarget = targetRealisasi.reduce((sum, r) => sum + Number(r.target_rp), 0);
  const totalRealisasi = targetRealisasi.reduce((sum, r) => sum + Number(r.realisasi_rp), 0);
  const persenTotal = totalTarget > 0 ? Math.round((totalRealisasi / totalTarget) * 100) : 0;

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 4px" }}>Dashboard</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "0 0 1.5rem" }}>
        Ringkasan optimalisasi Pendapatan Asli Daerah — Dinas PUPR Provinsi NTT
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
        <div className="card">
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 4px" }}>Total target</p>
          <p style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{rupiah(totalTarget)}</p>
        </div>
        <div className="card">
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 4px" }}>Total realisasi</p>
          <p style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{rupiah(totalRealisasi)}</p>
          <p style={{ fontSize: 12, color: "var(--success)", margin: "6px 0 0" }}>{persenTotal}% dari target</p>
        </div>
        <div className="card">
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 4px" }}>Objek PAD tercatat</p>
          <p style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{objekPad.length}</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>Target vs realisasi per jenis</p>
        {jenisPad.map((jp) => {
          const rows = targetRealisasi.filter((r) => r.jenis_pad_id === jp.id);
          const target = rows.reduce((s, r) => s + Number(r.target_rp), 0);
          const realisasi = rows.reduce((s, r) => s + Number(r.realisasi_rp), 0);
          const persen = target > 0 ? Math.round((realisasi / target) * 100) : 0;
          return (
            <div key={jp.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span>{jp.nama}</span>
                <span style={{ color: "var(--text-secondary)" }}>{persen}%</span>
              </div>
              <div style={{ height: 6, background: "var(--surface-0)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(persen, 100)}%`, background: "var(--accent)" }} />
              </div>
            </div>
          );
        })}
        {jenisPad.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Belum ada data. Jalankan supabase/schema.sql untuk mengisi 3 jenis PAD dasar.
          </p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px" }}>Objek PAD terbaru</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {objekPad.map((o) => (
              <div key={o.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{o.nama_objek}</p>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "2px 0 0" }}>{o.kabupaten_kota ?? "-"}</p>
                </div>
                {statusBadge(o.status_verifikasi)}
              </div>
            ))}
            {objekPad.length === 0 && <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Belum ada objek PAD tercatat.</p>}
          </div>
        </div>

        <div>
          <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px" }}>Tindak lanjut terbaru</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tindakLanjut.map((t) => (
              <div key={t.id} className="card" style={{ padding: "10px 14px" }}>
                <p style={{ fontSize: 13, margin: 0 }}>{t.deskripsi ?? t.jenis_kegiatan}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>
                  Pokja {t.pokja ?? "-"} · {new Date(t.tanggal_kegiatan).toLocaleDateString("id-ID")}
                </p>
              </div>
            ))}
            {tindakLanjut.length === 0 && <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Belum ada aktivitas tindak lanjut.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
