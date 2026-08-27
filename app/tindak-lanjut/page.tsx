import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

export const revalidate = 0;

async function getData() {
  const db = await createServerSupabase();
  const { data } = await db
    .from("tindak_lanjut")
    .select("*, objek_pad(nama_objek)")
    .order("tanggal_kegiatan", { ascending: false });
  return data ?? [];
}

const jenisLabel: Record<string, string> = {
  sosialisasi: "Sosialisasi",
  pemeriksaan_lapangan: "Pemeriksaan lapangan",
  penertiban: "Penertiban",
  tindakan_administratif: "Tindakan administratif",
  pendampingan_hukum: "Pendampingan hukum",
  penagihan: "Penagihan",
  lainnya: "Lainnya",
};

export default async function TindakLanjutPage() {
  const items = await getData();

  return (
    <div>
      <p className="page-eyebrow">Pokja II &middot; Intervensi</p>
      <h1 className="page-title">Tindak lanjut</h1>
      <p className="page-subtitle">
        Riwayat kegiatan penertiban, sosialisasi, penagihan, dan pendampingan hukum lintas instansi.
      </p>

      <div className="timeline">
        {items.map((t: any) => (
          <div key={t.id} className="timeline-row">
            <div className="timeline-dot" />
            <div className="card" style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>{jenisLabel[t.jenis_kegiatan] ?? t.jenis_kegiatan}</p>
                  <p style={{ fontSize: 13.5, margin: "6px 0 0" }}>{t.deskripsi}</p>
                  {t.objek_pad && (
                    <Link href={`/objek-pad/${t.objek_pad_id}`} style={{ fontSize: 12, fontWeight: 500 }}>
                      {t.objek_pad.nama_objek}
                    </Link>
                  )}
                </div>
                <span className="badge" style={{ background: "var(--marine-tint)", color: "var(--marine-dark)" }}>
                  Pokja {t.pokja ?? "-"}
                </span>
              </div>
              <p className="mono" style={{ fontSize: 11, color: "var(--text-muted)", margin: "10px 0 0" }}>
                {t.pic ?? "-"} &middot; {new Date(t.tanggal_kegiatan).toLocaleDateString("id-ID")}
              </p>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="empty-state">Belum ada catatan tindak lanjut.</div>}
      </div>

      <style>{`
        .timeline { position: relative; display: flex; flex-direction: column; gap: 16px; }
        .timeline-row { display: flex; gap: 14px; align-items: flex-start; }
        .timeline-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--marine); margin-top: 20px; flex-shrink: 0; }
      `}</style>
    </div>
  );
}
