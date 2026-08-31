import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { JENIS_KEGIATAN_LABEL, POKJA_LABEL } from "@/lib/workflow-pokja";

export const revalidate = 0;

async function getData(pokja?: string) {
  const db = await createServerSupabase();
  let query = db.from("tindak_lanjut").select("*, objek_pad(nama_objek)").order("tanggal_kegiatan", { ascending: false });
  if (pokja) query = query.eq("pokja", pokja);
  const { data } = await query;
  return data ?? [];
}

const STATUS_META: Record<string, { label: string; color: string; tint: string }> = {
  berjalan: { label: "Berjalan", color: "var(--status-blue)", tint: "var(--status-blue-tint)" },
  selesai: { label: "Selesai", color: "var(--status-green)", tint: "var(--status-green-tint)" },
  tertunda: { label: "Tertunda", color: "var(--status-yellow)", tint: "var(--status-yellow-tint)" },
};

export default async function TindakLanjutPage({
  searchParams,
}: {
  searchParams: Promise<{ pokja?: string }>;
}) {
  const { pokja } = await searchParams;
  const items = await getData(pokja);

  return (
    <div>
      <p className="page-eyebrow">Pokja I, II & III</p>
      <h1 className="page-title">Tindak lanjut</h1>
      <p className="page-subtitle">
        Riwayat kegiatan lintas Pokja: sosialisasi & pemeriksaan lapangan (Pokja I), penertiban & penagihan
        (Pokja II), monitoring & evaluasi (Pokja III).
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <Link href="/tindak-lanjut" className="badge" style={{ background: !pokja ? "var(--marine-tint)" : "var(--surface-muted, #f1f1ef)", color: !pokja ? "var(--marine-dark)" : "var(--text-muted)" }}>
          Semua
        </Link>
        {(["I", "II", "III"] as const).map((p) => (
          <Link
            key={p}
            href={`/tindak-lanjut?pokja=${p}`}
            className="badge"
            title={POKJA_LABEL[p]}
            style={{ background: pokja === p ? "var(--marine-tint)" : "var(--surface-muted, #f1f1ef)", color: pokja === p ? "var(--marine-dark)" : "var(--text-muted)" }}
          >
            Pokja {p}
          </Link>
        ))}
      </div>

      <div className="timeline">
        {items.map((t: any) => {
          const meta = STATUS_META[t.status] ?? STATUS_META.berjalan;
          const lewatSla = t.deadline && t.status !== "selesai" && new Date(t.deadline) < new Date();
          return (
            <div key={t.id} className="timeline-row">
              <div className="timeline-dot" />
              <div className="card" style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>{JENIS_KEGIATAN_LABEL[t.jenis_kegiatan] ?? t.jenis_kegiatan}</p>
                    <p style={{ fontSize: 13.5, margin: "6px 0 0" }}>{t.deskripsi}</p>
                    {t.objek_pad && (
                      <Link href={`/objek-pad/${t.objek_pad_id}`} style={{ fontSize: 12, fontWeight: 500 }}>
                        {t.objek_pad.nama_objek}
                      </Link>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <span className="badge" style={{ background: "var(--marine-tint)", color: "var(--marine-dark)" }}>
                      Pokja {t.pokja ?? "-"}
                    </span>
                    <span className="badge" style={{ background: meta.tint, color: meta.color }}>{meta.label}</span>
                  </div>
                </div>
                <p className="mono" style={{ fontSize: 11, color: "var(--text-muted)", margin: "10px 0 0" }}>
                  {t.pic ?? "-"} &middot; {new Date(t.tanggal_kegiatan).toLocaleDateString("id-ID")}
                  {t.deadline && (
                    <>
                      {" "}&middot; tenggat {new Date(t.deadline).toLocaleDateString("id-ID")}
                      {lewatSla && <span style={{ color: "var(--status-red)" }}> (lewat SLA)</span>}
                    </>
                  )}
                </p>
              </div>
            </div>
          );
        })}
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
