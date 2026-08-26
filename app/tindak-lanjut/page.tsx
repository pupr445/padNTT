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
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 4px" }}>Tindak lanjut</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "0 0 1.5rem" }}>
        Riwayat kegiatan Pokja II: penertiban, sosialisasi, penagihan, pendampingan hukum
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((t: any) => (
          <div key={t.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{jenisLabel[t.jenis_kegiatan] ?? t.jenis_kegiatan}</p>
                <p style={{ fontSize: 13, margin: "4px 0 0" }}>{t.deskripsi}</p>
                {t.objek_pad && (
                  <Link href={`/objek-pad/${t.objek_pad_id}`} style={{ fontSize: 12 }}>
                    {t.objek_pad.nama_objek}
                  </Link>
                )}
              </div>
              <span className="badge" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
                Pokja {t.pokja ?? "-"}
              </span>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "8px 0 0" }}>
              {t.pic ?? "-"} · {new Date(t.tanggal_kegiatan).toLocaleDateString("id-ID")}
            </p>
          </div>
        ))}
        {items.length === 0 && <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Belum ada catatan tindak lanjut.</p>}
      </div>
    </div>
  );
}
