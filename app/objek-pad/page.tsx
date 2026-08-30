import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { canCreateObjekPad } from "@/lib/permissions";
import ObjekPadForm from "./form";
import ObjekPadFilters from "./filters";
import { statusMeta } from "@/lib/status";

export const revalidate = 0;

async function getData(filters: { jenis?: string; status?: string; kab?: string }) {
  const db = await createServerSupabase();
  const { data: jenisPad, error: jenisPadError } = await db.from("jenis_pad").select("*");

  let query = db.from("objek_pad").select("*, jenis_pad(nama)").order("created_at", { ascending: false });
  if (filters.jenis) query = query.eq("jenis_pad_id", filters.jenis);
  if (filters.status) query = query.eq("status_verifikasi", filters.status);
  if (filters.kab) query = query.eq("kabupaten_kota", filters.kab);
  const { data: objekPad, error: objekPadError } = await query;

  // Daftar kabupaten unik utk dropdown filter -- diambil dari semua objek
  // (bukan hasil yg sudah difilter), supaya pilihan filter tidak menyusut
  // sendiri begitu satu filter lain diterapkan.
  const { data: kabRaw } = await db.from("objek_pad").select("kabupaten_kota").not("kabupaten_kota", "is", null);
  const kabupatenList = Array.from(new Set((kabRaw ?? []).map((r: any) => r.kabupaten_kota as string))).sort();

  return {
    jenisPad: jenisPad ?? [],
    objekPad: objekPad ?? [],
    kabupatenList,
    error: jenisPadError?.message || objekPadError?.message || null,
  };
}

export default async function ObjekPadPage({
  searchParams,
}: {
  searchParams: Promise<{ jenis?: string; status?: string; kab?: string }>;
}) {
  const filters = await searchParams;
  const [{ jenisPad, objekPad, kabupatenList, error }, profile] = await Promise.all([getData(filters), getCurrentProfile()]);
  const canCreate = canCreateObjekPad(profile?.role);

  return (
    <div>
      <p className="page-eyebrow">Pokja I &middot; Inventarisasi</p>
      <h1 className="page-title">Objek PAD</h1>
      <p className="page-subtitle">
        Inventarisasi, identifikasi, dan validasi objek retribusi utilitas jalan, alat berat,
        dan pajak air permukaan.
      </p>

      {error && (
        <div className="card" style={{ borderColor: "var(--status-red)", background: "var(--status-red-tint)", marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--status-red)", margin: 0 }}>Gagal memuat data</p>
          <p className="mono" style={{ fontSize: 12, color: "var(--status-red)", margin: "6px 0 0" }}>{error}</p>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "8px 0 0" }}>
            Kemungkinan tabel <code>jenis_pad</code> belum punya RLS policy / grant untuk role &ldquo;authenticated&rdquo;.
            Jalankan <code>supabase/schema_04_fix_rls_gaps.sql</code> di SQL Editor Supabase.
          </p>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        {canCreate ? (
          <ObjekPadForm jenisPad={jenisPad} />
        ) : (
          <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
            Peran Anda ({profile?.role ?? "-"}) hanya bisa melihat daftar objek PAD. Penambahan/pengubahan
            data dilakukan oleh Pokja I atau pimpinan tim.
          </p>
        )}
      </div>

      <ObjekPadFilters jenisPad={jenisPad} kabupatenList={kabupatenList} />

      <div className="stack">
        {objekPad.map((o: any) => {
          const meta = statusMeta(o.status_verifikasi);
          return (
            <Link key={o.id} href={`/objek-pad/${o.id}`} className="card card-link" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="status-dot" style={{ background: meta.color, width: 10, height: 10 }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{o.nama_objek}</p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0" }}>
                    {o.jenis_pad?.nama} &middot; {o.kabupaten_kota ?? "-"}
                    {o.koordinat_lat && o.koordinat_lng ? (
                      <span className="mono"> &middot; {Number(o.koordinat_lat).toFixed(4)}, {Number(o.koordinat_lng).toFixed(4)}</span>
                    ) : null}
                  </p>
                </div>
              </div>
              <span className="badge" style={{ background: meta.tint, color: meta.color }}>{meta.label}</span>
            </Link>
          );
        })}
        {objekPad.length === 0 && (
          <div className="empty-state">
            {filters.jenis || filters.status || filters.kab
              ? "Tidak ada objek PAD yang cocok dengan filter ini."
              : "Belum ada objek PAD. Tambahkan lewat form di atas."}
          </div>
        )}
      </div>
    </div>
  );
}
