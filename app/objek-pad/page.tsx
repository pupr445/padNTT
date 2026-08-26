import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import ObjekPadForm from "./form";

export const revalidate = 0;

async function getData() {
  const db = await createServerSupabase();
  const { data: jenisPad } = await db.from("jenis_pad").select("*");
  const { data: objekPad } = await db
    .from("objek_pad")
    .select("*, jenis_pad(nama)")
    .order("created_at", { ascending: false });
  return { jenisPad: jenisPad ?? [], objekPad: objekPad ?? [] };
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

export default async function ObjekPadPage() {
  const { jenisPad, objekPad } = await getData();

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 4px" }}>Objek PAD</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "0 0 1.5rem" }}>
        Inventarisasi, identifikasi, dan validasi objek retribusi/pajak — tugas Pokja I
      </p>

      <div style={{ marginBottom: "1.5rem" }}>
        <ObjekPadForm jenisPad={jenisPad} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {objekPad.map((o: any) => (
          <Link
            key={o.id}
            href={`/objek-pad/${o.id}`}
            className="card"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{o.nama_objek}</p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0" }}>
                {o.jenis_pad?.nama} · {o.kabupaten_kota ?? "-"}
              </p>
            </div>
            {statusBadge(o.status_verifikasi)}
          </Link>
        ))}
        {objekPad.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Belum ada objek PAD. Tambahkan lewat form di atas.</p>
        )}
      </div>
    </div>
  );
}
