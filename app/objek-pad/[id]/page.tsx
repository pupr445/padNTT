import { createServerSupabase } from "@/lib/supabase/server";
import { getDownloadUrl } from "@/lib/storage";
import UploadLampiran from "./upload";
import TambahTindakLanjut from "./tindak-lanjut-form";

export const revalidate = 0;

async function getData(id: string) {
  const db = await createServerSupabase();
  const { data: objek } = await db.from("objek_pad").select("*, jenis_pad(nama)").eq("id", id).single();
  const { data: tindakLanjut } = await db
    .from("tindak_lanjut")
    .select("*")
    .eq("objek_pad_id", id)
    .order("tanggal_kegiatan", { ascending: false });
  const { data: lampiranRaw } = await db
    .from("lampiran")
    .select("*")
    .eq("objek_pad_id", id)
    .order("created_at", { ascending: false });

  // Bucket B2 privat -> generate presigned download URL (berlaku 1 jam) per file,
  // bukan link publik permanen.
  const lampiran = await Promise.all(
    (lampiranRaw ?? []).map(async (l) => ({
      ...l,
      downloadUrl: await getDownloadUrl(l.r2_key),
    }))
  );

  return { objek, tindakLanjut: tindakLanjut ?? [], lampiran };
}

export default async function ObjekDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { objek, tindakLanjut, lampiran } = await getData(id);

  if (!objek) {
    return <p>Objek tidak ditemukan.</p>;
  }

  return (
    <div>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 4px" }}>
        {objek.jenis_pad?.nama}
      </p>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 4px" }}>{objek.nama_objek}</h1>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 1.5rem" }}>
        {objek.kabupaten_kota ?? "-"} {objek.lokasi ? `· ${objek.lokasi}` : ""}
      </p>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>Lampiran (foto / video / dokumen)</p>
        <UploadLampiran objekPadId={objek.id} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10, marginTop: 12 }}>
          {lampiran.map((l) => (
            <a key={l.id} href={l.downloadUrl} target="_blank" rel="noreferrer" className="card" style={{ padding: 8, textAlign: "center" }}>
              <p style={{ fontSize: 11, margin: 0, wordBreak: "break-word" }}>{l.nama_file}</p>
            </a>
          ))}
          {lampiran.length === 0 && <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Belum ada lampiran.</p>}
        </div>
      </div>

      <div className="card">
        <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>Tindak lanjut</p>
        <TambahTindakLanjut objekPadId={objek.id} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {tindakLanjut.map((t) => (
            <div key={t.id} style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
              <p style={{ fontSize: 13, margin: 0 }}>{t.deskripsi ?? t.jenis_kegiatan}</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>
                {t.jenis_kegiatan} · Pokja {t.pokja ?? "-"} · {new Date(t.tanggal_kegiatan).toLocaleDateString("id-ID")}
              </p>
            </div>
          ))}
          {tindakLanjut.length === 0 && <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Belum ada tindak lanjut.</p>}
        </div>
      </div>
    </div>
  );
}
