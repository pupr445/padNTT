import { createServerSupabase } from "@/lib/supabase/server";

export const revalidate = 0;

async function getData() {
  const db = await createServerSupabase();
  const { data } = await db.from("tim_struktur").select("*").order("nomor", { ascending: true });
  return data ?? [];
}

export default async function TimPage() {
  const anggota = await getData();

  const kelompok = anggota.reduce((acc: Record<string, any[]>, a) => {
    const key = a.pokja ? `Pokja ${a.pokja}` : a.kedudukan;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  return (
    <div>
      <p className="page-eyebrow">SK Gubernur NTT No. 272/KEP/HK/2026</p>
      <h1 className="page-title">Struktur tim terpadu</h1>
      <p className="page-subtitle">
        Susunan Tim Terpadu Optimalisasi Pendapatan Asli Daerah pada Dinas PUPR Provinsi NTT.
      </p>

      {Object.keys(kelompok).length === 0 && (
        <div className="empty-state">
          Belum ada data. Impor data lampiran SK ke tabel <code>tim_struktur</code> lewat Supabase.
        </div>
      )}

      <div className="grid-cards" style={{ alignItems: "start" }}>
        {Object.entries(kelompok).map(([nama, list]) => (
          <div key={nama} className="card">
            <p className="nav-group-label" style={{ color: "var(--marine-dark)", padding: "0 0 10px" }}>{nama}</p>
            <div className="stack" style={{ gap: 8 }}>
              {list.map((a) => (
                <div key={a.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{a.nama_jabatan}</p>
                  <p style={{ fontSize: 11.5, color: "var(--text-secondary)", margin: "2px 0 0" }}>{a.kedudukan}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
