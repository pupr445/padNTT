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
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 4px" }}>Struktur tim</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "0 0 1.5rem" }}>
        Tim Terpadu Optimalisasi PAD — SK Gubernur NTT No. 272/KEP/HK/2026
      </p>

      {Object.keys(kelompok).length === 0 && (
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Belum ada data. Impor data lampiran SK ke tabel <code>tim_struktur</code> lewat Supabase.
        </p>
      )}

      {Object.entries(kelompok).map(([nama, list]) => (
        <div key={nama} style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.4 }}>
            {nama}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {list.map((a) => (
              <div key={a.id} className="card" style={{ padding: "10px 14px" }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{a.nama_jabatan}</p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0" }}>{a.kedudukan}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
